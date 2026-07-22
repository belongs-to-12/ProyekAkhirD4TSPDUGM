Imports (1 entry)
var ROI : Table projects/tugas-akhir-485407/assets/AOI/JamboAye_Buffered

/*==================================================================
Kode ini merupakan hasil modifikasi dari penelitian:
Eramudadi, D. (2023). Ekstraksi Permukiman Dari Kombinasi Citra 
Sentinel-1 Dan Sentinel-2 Menggunakan Object Based Image Analysis  
==================================================================*/
var unduhData = function(desc, start_date, end_date, dataTakeID){  
  /* ===============================================================
           		MENGAKSES CITRA SENTINEL DAN MEMBUAT DATASET
  ================================================================*/
  //////////////////////////////////////////////////////////////////
                        SENTINEL-1 (SAR)                               
  //////////////////////////////////////////////////////////////////
  var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
          .filterBounds(ROI)
          .filterDate(start_date, end_date)
          .filter(ee.Filter.eq('instrumentMode','IW'))
          .filter(ee.Filter.eq('orbitProperties_pass','DESCENDING'))
          .filter(ee.Filter.listContains('transmitterReceiverPolarisation','VV'))
          .filter(ee.Filter.listContains('transmitterReceiverPolarisation','VH'))
          .filter(ee.Filter.eq('missionDataTakeID', dataTakeID))
          .filter(ee.Filter.eq('resolution_meters', 10))
          .mosaic()
          .clip(ROI);

  // Speckle filtering : Lee Filter
  /* Kode speckle filtering diperoleh dari penelitian:
  Mullissa, A., dkk (2021). Sentinel-1 SAR Backscatter Analysis Ready   
  Data Preparation in Google Earth Engine. Remote Sensing, 13(10), 
  1954. https://doi.org/10.3390/rs13101954 */

  /* Lee Filter yang diterapkan untuk citra tunggal. Hal ini 
  diimplementasikan sesuai yang  dijelaskan pada penelitian: 
  J. S. Lee, “Digital image enhancement and noise filtering by use of 
  local statistics,” IEEE Pattern Anal. Machine Intell., vol. PAMI-2, 
  pp. 165–168, Mar. 1980.*/
   
  var leefilter = function(image, KERNEL_SIZE) {
    	var bandNames = image.bandNames().remove('angle');
      //S1-GRD images are multilooked 5 times in range
      var enl = 5;
      // Compute the speckle standard deviation
      var eta = 1.0/Math.sqrt(enl); 
      eta = ee.Image.constant(eta);
  
      // MMSE estimator
      // Neighbourhood mean and variance
      var oneImg = ee.Image.constant(1);
  
      var reducers = ee.Reducer.mean().combine({
                     reducer2: ee.Reducer.variance(),
                     sharedInputs: true});
      var stats = image.select(bandNames)
                .reduceNeighborhood({reducer: reducers,kernel: ee.Kernel.square(KERNEL_SIZE/2,'pixels'), optimization: 'window'});
      var meanBand = bandNames.map(function(bandName){return 
          ee.String(bandName).cat('_mean')});
      var varBand = bandNames.map(function(bandName){return 
          ee.String(bandName).cat('_variance')});
          
      var z_bar = stats.select(meanBand);
      var varz = stats.select(varBand);
  
      // Estimate weight 
      var varx = (varz.subtract(z_bar.pow(2).multiply(eta.pow(2))))
          .divide(oneImg.add(eta.pow(2)));
      var b = varx.divide(varz);
    
      //if b is negative set it to zero
      var new_b = b.where(b.lt(0), 0);
      var output = oneImg.subtract(new_b).multiply(z_bar.abs())
          .add(new_b.multiply(image.select(bandNames)));
      output = output.rename(bandNames);
      return image.addBands(output, null, true);
    };
  
  // melakukan speckle filtering: Lee filter   
  var s1_filtered = leefilter(s1, 5);  // kernel 5x5
  
  // memanggil polarisasi VV dan VH
  var vv_filtered = (s1_filtered.select('VV'));  
  var vh_filtered = (s1_filtered.select('VH'));  
  
  // Ratio polarisasi VVVH dan VHVV
  var ratioVVVH = vv_filtered
    .divide(vh_filtered)
    .rename('VVVH_ratio');
  
  var ratioVHVV = vh_filtered
    .divide(vv_filtered)
    .rename('VHVV_ratio');
  
  // menggabungkan band polarisasi tersaring dan rasio ke citra  
  // Sentinel-1
  var dataS1 = ee.Image([vv_filtered, vh_filtered, ratioVHVV, ratioVVVH]);

  // Menampilkan citra
  Map.addLayer(dataS1, {
    bands: ['VV', 'VH', 'VVVH_ratio'],
    min: -25,
    max: 0
  }, 'Citra Sentinel-1 ' + desc, false);
 



  //////////////////////////////////////////////////////////////////
                         SENTINEL-2 (OPTIK)                  
  //////////////////////////////////////////////////////////////////
  var s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
    .filterBounds(ROI)
    .filterDate(start_date, end_date)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 60))
    .median()
    .clip(ROI);

  // Menghitung indeks spektral
  // 1. NDWI
  var ndwi = s2.normalizedDifference(['B3','B8']).rename('NDWI');
  var visParamsNDWI = {
    bands: ['NDWI'], 
    min: -1,  
    max: 1,
    palette: ['yellow', 'blue']
  };
  // 2. NDVI
  var ndvi = s2.normalizedDifference(['B4', 'B8']).rename(['NDVI']);

  // Menggabungkan nilai indeks spektral dengan band spektral  
  var dataS2 = s2.select(['B2', 'B3', 'B4', 'B8'])
              .addBands(ndwi)
              .addBands(ndvi);

  // Menampikan salah satu indeks spektral
  Map.addLayer(dataS2.select('NDWI'), 
visParamsNDWI, 'NDWI' + desc, false); 
  
  // Menampilkan RGB Sentinel-2
  Map.addLayer(dataS2, 
{bands: ['B4', 'B3', 'B2'], min: 1080, max: 4530}, 
'Sentinel-2' + desc, false);
 
  // Menyamakan proyeksi
  dataS1 = dataS1.reproject({
              crs: dataS2.projection(),
              scale: 10
            });
  // print( 'Informasi Sentinel-1 ' + desc, dataS1);
  
  /* ===============================================================
                        	INTEGRASI CITRA
     =============================================================*/
  // gabungan sentinel 1 dan 2
  var dataset1 = dataS2.addBands(dataS1).toFloat();
  print('Informasi dataset' + desc, dataset1);
  
  // menampilan citra setelah stacking 
  Map.addLayer(dataset1, 
{bands: ['B4', 'B3', 'B2'], min: 1080, max: 4530}, 
'RGB stacked', false);
  Map.addLayer(dataset1, 
{bands: ['VV', 'VH', 'VVVH_ratio']}, 
'komposit stacked', false);
  
  /* ===============================================================
                              EXPOR DATA
  =================================================================*/
  // data diekspor ke EE Asset agar mudah digunakan kembali pada tahap   
  // selanjutnya
  Export.image.toAsset({
  image: dataset1,
  description: 'dataset' + desc,
  assetId: 'projects/tugas-akhir-485407/assets/dataset' + desc,
  region: ROI,
  crs: 'EPSG:4326',
  scale: 10,
  maxPixels: 1e13
  });

  return;
};

// menerapkan fungsi pada periode pada dan pasca 
var praBanjir = unduhData('Citra_Prabanjir', '2025-08-05', '2025-08-07', 29196);
var pascaBanjir = unduhData('Citra_Pasca_Banjir', '2026-02-19', '2026-02-23', 521032);
 
