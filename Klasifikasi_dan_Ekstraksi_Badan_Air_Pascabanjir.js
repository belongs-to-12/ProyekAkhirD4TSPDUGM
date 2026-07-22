Imports (5 entries)
var nonAir : FeatureCollection (316 elements)
var air : FeatureCollection (230 elements)
var ROI : Table projects/tugas-akhir-485407/assets/AOI/JamboAye_Buffered
var dataset2 : Image projects/tugas-akhir-485407/assets/dataset2_Citra_pascabanjir (10 bands)
var centerlineRBI : Table project/tugas-akhir-485407/CenterlineJamboAye

var nonAir = lainnya.merge(sedimen);
/* =================================================================
                           MEMBUAT SAMPEL 
   ===============================================================*/
// mengatur display agar zoom in ke area proyek akhir
Map.centerObject(ROI, 10);

// menampilkan dataset2
Map.addLayer(dataset2, 
  {band: ['VH', 'VH', 'VHVV_ratio'], min: -240.1, max: 19.343},
  'Komposite VV VH', false);
Map.addLayer(dataset2, 
  {band: ['B2', 'B3', 'B4'], min: 1087, max: 3216}, 
  'RGB', false);

// Nilai spektral untuk membantu proses pembuatan sampel 
Map.addLayer(dataset2, 
  {bands: ['NDWI'], min: -1, max: 1, palette: ['red', 'blue']}, 
  'NDWI - dataset 2', false); 
Map.addLayer(dataset2,  
  {bands: ['NDVI'], min: -1, max: 1, palette: ['red', 'blue']}, 
  'NDVI - dataset 2', false);

// Ekspor feature sampel
Export.table.toAsset({
collection: air,
description: 'Sampel_Fitur_air',
});

  Export.table.toAsset({
collection: nonAir,
description: 'Sampel_Fitur_nonAir',
});

/* =================================================================
       PEMBAGIAN DATA SAMPEL MENJADI DATA TRAINING DAN TESTING
   ===============================================================*/
function splitSamples(feature, classValue, splitRatio) {
  // menambahkan label class dan nilai kelas
  var collection = feature
    .map(function(f) {
      return f.set('class', classValue);
    });

  // Menambahkan kolom random untuk sorting acak
  var withRandom = collection.randomColumn('random', 1); 
  
  // Mengurutkan berdasarkan nilai random
  var sorted = withRandom.sort('random');
  
  // Menghitung jumlah total
  var total = sorted.size();
  var trainSize = ee.Number(total).multiply(splitRatio).int();
  
  // Membuat list index
  var indexedList = sorted.toList(total);
  
  // Memisahkan dan mengambil 70 data pertama sebagai data training
  // dan sisanya sebagai data train
  var trainList = indexedList.slice(0, trainSize);
  var testList  = indexedList.slice(trainSize);
  
  return {
    train: ee.FeatureCollection(trainList),
    test:  ee.FeatureCollection(testList)
  };
}

// Membagi data sampel dengan proporsi 70:30
var nonAirSplit = splitSamples(nonAir, 0, 0.7);
var airSplit = splitSamples(air, 1, 0.7);

// Menyatukan training dari kelas-kelas yang ada
var training = (nonAirSplit.train.merge(airSplit.train));  
var testing = (nonAirSplit.test.merge(airSplit.test));     
 
// Mengambil nilai pixel dari sampel training dengan membatasi jumlah 
// pixel
var maxPixels = 100;
var trainingSamples = training.map(function(feat) {
  return dataset2.sampleRegions({
    collection: ee.FeatureCollection([feat]),
    properties: ['class'],
    scale: 10,
    tileScale: 4
  }).limit(maxPixels);
}).flatten();

// Mengambil nilai pixel dari sampel testing dengan membatasi jumlah 
// pixel
var testingSamples = testing.map(function(feat) {
  return dataset2.sampleRegions({
    collection: ee.FeatureCollection([feat]),
    properties: ['class'],
    scale: 10,
    tileScale: 4
  }).limit(maxPixels);
}).flatten();

// menampilkan informasi jumlah sampel
print('Training feature:', training.size());
print('Testing feature:', testing.size());
print('Training pixel:', trainingSamples.size());
print('Testing pixel:', testingSamples.size());

Map.addLayer(dataset2, {}, 'Layer gabungan', false);

/* =================================================================
                    KLASIFIKASI RANDOM FOREST
   ===============================================================*/
// Melatih classifier
var classifier = ee.Classifier.smileRandomForest({
  numberOfTrees: 200
  }).train({
    features: trainingSamples,
    classProperty: 'class',
    inputProperties: dataset2.bandNames()
});

// Menerapkan classifier ke dataset
var classified = dataset2.classify(classifier);

Map.addLayer(classified,
  {min:0, max:1, palette:['yellow','blue']},
  'Hasil Klasifikasi Air-nonAir pascabanjir');

/* =================================================================
                        UJI PERFORMA MODEL
   ===============================================================*/
// Melatih classifier
var testClassification = testingSamples
  .classify(classifier);
  
// Mmembuat matriks konfusi
var confusionMatrix = testClassification.errorMatrix('class','classification');

// Menampilkan informasi hasil matriks konfusi dan nilai akurasi
print('Confusion Matrix:', confusionMatrix);
print('Overall Accuracy Kelas NonAir:', confusionMatrix.accuracy());
print('Kappa:', confusionMatrix.kappa());
print('Producer Accuracy (Array):', confusionMatrix.producersAccuracy());
print('User Accuracy (Array):', confusionMatrix.consumersAccuracy());
print('Producer Accuracy Kelas nonAir:', confusionMatrix.producersAccuracy().get([0,0]));
print('User Accuracy Kelas nonAir:', confusionMatrix.consumersAccuracy().get([0,0]));
print('Producer Accuracy Kelas Air:', confusionMatrix.producersAccuracy().get([1,0]));
print('User Accuracy Kelas Air:', confusionMatrix.consumersAccuracy().get([0,1]));

/* =================================================================
         PEMISAHAN BADAN SUNGAI DENGAN BADAN AIR TERDETEKSI
  ================================================================*/
/* Kode ini diperoleh dari penelitian:
Yang, X., dkk. (2024), Cloud-Based Remote Sensing with Google Earth Engine (hlm. 925–952). Springer International Publishing. 
https://doi.org/10.1007/978-3-031-26588-4_43 */

// Membuat channel mask
// 1. Menghapus noise
var cleanWater = classified
  .focal_max(1)
  .focal_min(1);

// 2. Mengisi small islands
var MIN_SIZE = 2000;        // ukuran minimal small islands
var islandPolys = cleanWater
  .not()
  .selfMask()
  .reduceToVectors({
    geometry: ROI,
    scale: 10,
    eightConnected: true,
    maxPixels: 1e13
  })
  .filter(
    ee.Filter.lte('count', MIN_SIZE)
  );

// Filled water mask
// membuat polygon pulau menjadi bernilai air
var filled = cleanWater.paint(islandPolys, 1);      

/*
Pengisian ini dilakukan agar:
1. centerline extraction lebih stabil
2. cumulativeCost lebih bersih
3. konektivitas sungai lebih baik
*/

// 3. Menampilkan centerline dari RBI
Map.addLayer(centerlineRBI, {color: 'red'}, 'River Centerline', false);

// 4. Memisahkan badan air dengan culmulativeCost
/* Metode cumulativeCost(): “berapa biaya untuk mencapai centerline?”
    Jika pixel air terhubung ke sungai, cost = 0, karena bisa mencapai centerline tanpa melewati daratan
    
    Air yang terhubung ke centerline:
    cost = 0

    Air yang tidak terhubung:
    cost > 0
    
*/
var costmap = filled.not().cumulativeCost({
  source: filled.and(
    ee.Image()
      .toByte()
      .paint(centerlineRBI, 1)
  ),
  maxDistance: 3000,
  geodeticDistance: false
});

// River mask                 
// menyaring pixel yang benar-benar terhubung, yaitu yang bernilai 0 
var rivermask = costmap
  .eq(0)
  .rename('riverMask');

// Channel mask               
// menampalkan pixel di rivermask dengan hasil klasifikasi Random Forest
// untuk mendapatkan bentuk sungai asli
var channelmask = rivermask   
  .and(classified)
  .rename('channelMask');
  
// River mask
Map.addLayer(rivermask.selfMask(),{palette: ['00FFFF']},'River Mask', false);

// Channel mask
Map.addLayer(channelmask.selfMask(), {palette: ['0000FF']}, 'Channel Mask', false);

// Menampilkan informasi jumlah piksel air
var totalWater = classified.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: ROI,
  scale: 10,
  maxPixels: 1e13
});
print('Total Semua Air:', totalWater);

// Menampilkan informasi jumlah piksel badan sungai 
var totalRiver = rivermask.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: ROI,
  scale: 10,
  maxPixels: 1e13
});

print('Total Badan Sungai:', totalRiver);

channelmask.reproject({
  crs: 'EPSG:4326',
  scale: 10
});
/* =================================================================
                         EKSPOR BADAN SUNGAI
  ================================================================*/
// Menyimpan hasil klasifikasi ke Google Drive 
Export.image.toDrive({
  image: classified,
  description: 'Hasil_Klasifikasi_Pascabanjir',
  folder: 'Bahan_Proyek_Akhir',
  fileNamePrefix: 'Hasil_Klasifikasi_Pascabanjir',
  crs: 'EPSG:4326',
  region: ROI,
  scale: 10,
  maxPixels: 1e13
});

// Menyimpan hasil ekstraksi badan sungai ke Google Drive
Export.image.toDrive({
  image: channelmask,
  description: 'Badan_Sungai_Pascabanjir',
  folder: 'Bahan_Proyek_Akhir',
  fileNamePrefix: 'Badan_Sungai_Pascabanjir',
  crs: 'EPSG:4326',
  region: ROI,
  scale: 10,
  maxPixels: 1e13
});

