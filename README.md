# Identifikasi Tepi Sungai Jambo Aye Sebelum dan Setelah Banjir Galodo Menggunakan Integrasi citra Sentinel-1 dan Sentinel-2 Multitemporal
> Studi kasus: Sungai Jambo Aye, Kabupaten Aceh Utara dan Aceh Timur, Provinsi Aceh  
> Penulis : Ummi Kun Barorotur Rofiah  
> Dosen Pembimbing : Annisa Farida Hayuningsih, S.T., M.Eng., Ph.D  
> Instansi : Universitas Gadjah Mada

Banjir Galodo merupakan banjir bandang yang terjadi di Provinsi Aceh pada November 2025. Banjir tersebut terjadi akibat cuaca ekstrem selama beberapa hari berturu-turut. Temuan akan kayo gelondong di area Sungai memberikan asumsi adanya perubahan tepi sungai akibat proses erosi, transportasi, dan sedimentasi. Penelitian ini menggunakan sifat komplementer dari Sentinel-1 dan Sentinel-2 untuk memperkaya informasi. Pada directory ini, terdapat beberapa _script_ yang ditujukan untuk melakukan mendeteksi badan sungai sebelum diekstraksi menjadi garis tepi sungai. 

## Prosedur
Tahapan kerja yang dilakukan dalam identifikasi tepi Sungai Jambo Aye sebagai berikut.
1. Membuat batas area pengolahan yang kemudian disimpan dengan nama ROI (Region of Interest)
2. Mengunduh data Sentinel-1 dan Sentinel-1 menggunakan _script_ pengunduhan_data.js
3. Melakukan klasifikasi badan air menggunakan algoritma Random Forest menggunakan file klasifikasi_prabanjir.js untuk periode sebelum banjir dan klasifikasi_pascabanjir.js untuk periode setelah banjir.
4. Melakukan ekstraksi badan sungai menggunakan fungsi CumulativeCoset() pada  file klasifikasi_prabanjir.js untuk periode sebelum banjir dan klasifikasi_pascabanjir.js untuk periode setelah banjir.
5. Melakukan pengeditan _post-processing _di perangkat lunak GIS, seperti QGIS.

## Disclaimer
Script yang digunakan pada penelitian ini diambil dan dimodifikasi dari beberapa penelitian untuk disesuaikan dengan karakteristik wilayah studi. 

## Referensi
Mullissa, A., dkk (2021). Sentinel-1 SAR Backscatter Analysis Ready Data Preparation in Google Earth Engine. Remote Sensing, 13(10), 1954. https://doi.org/10.3390/rs13101954

Eramudadi, D., & Rokhmana, C. A. (2024). Ekstraksi Permukiman dari Kombinasi Citra Sentinel-2 dan Sentinel-1 dengan Pendekatan Object-Based Image Analysis [Postgraduate Thesis, Universitas Gadjah Mada]. https://doi.org/10.22146/jgise.91380

