# Identifikasi Tepi Sungai Jambo Aye Sebelum dan Setelah Banjir Galodo Menggunakan Integrasi citra Sentinel-1 dan Sentinel-2 Multitemporal
> Penulis : Ummi Kun Barorotur Rofiah  
> Dosen Pembimbing : Annisa Farida Hayuningsih, S.T., M.Eng., Ph.D  
> Instansi : Universitas Gadjah Mada

Banjir Galodo yang melanda Provinsi Aceh pada November 2025 memicu perubahan morfologi pada Sungai Jambo Aye akibat dinamika erosi, transportasi, dan sedimentasi. Asumsi tersebut didukung dengan temuan kayu gelondongan di sepanjang aliran sungai. Penelitian ini memanfaatkan pendekatan multitemporal dengan mengintegrasikan keunggulan citra Sentinel-1 (SAR) dan Sentinel-2 (Optis) untuk mendeteksi serta mengidentifikasi perubahan garis tepi sungai.

Repositori ini memuat kumpulan *_script_* Google Earth Engine (GEE) yang digunakan dalam pemrosesan data, mulai dari klasifikasi badan air hingga ekstraksi badan sungai sebelum dan sesudah kejadian banjir.

## Prosedur
Tahapan kerja yang dilakukan dalam identifikasi tepi Sungai Jambo Aye sebagai berikut.
1. Membuat batas area pengolahan yang kemudian disimpan dengan nama ROI (Region of Interest)
2. Mengunduh data Sentinel-1 dan Sentinel-1 menggunakan _script_ pengunduhan_data.js
3. Membuat sampel non-air dan air dengan kelas masing-masing 0 dan 1.
4. Melakukan klasifikasi badan air menggunakan algoritma Random Forest menggunakan file klasifikasi_SebelumBanjir.js untuk periode sebelum banjir dan klasifikasi_SetelahBanjir.js untuk periode setelah banjir.
5. Melakukan ekstraksi badan sungai menggunakan fungsi CumulativeCost() pada  file klasifikasi_SebelumBanjir.js untuk periode sebelum banjir dan klasifikasi_SetelahBanjir.js untuk periode setelah banjir.
6. Melakukan pengeditan _post-processing _ di perangkat lunak GIS, seperti QGIS.

## Disclaimer
Script yang digunakan pada penelitian ini diambil dan dimodifikasi dari beberapa penelitian untuk menyesuaikan karakteristik geografis serta ketersediaan data di wilayah studi. 

## Referensi
Cardille, J. A., Crowley, M. A., Saah, D., & Clinton, N. E. (Ed.). (2024). Cloud-Based Remote Sensing with Google Earth Engine: Fundamentals and Applications. Springer International Publishing. https://doi.org/10.1007/978-3-031-26588-4

Eramudadi, D., & Rokhmana, C. A. (2024). Ekstraksi Permukiman dari Kombinasi Citra Sentinel-2 dan Sentinel-1 dengan Pendekatan Object-Based Image Analysis [Postgraduate Thesis, Universitas Gadjah Mada]. https://etd.repository.ugm.ac.id/penelitian/detail/235502

Mullissa, A., dkk (2021). Sentinel-1 SAR Backscatter Analysis Ready Data Preparation in Google Earth Engine. Remote Sensing, 13(10), 1954. https://doi.org/10.3390/rs13101954

Yang, X., Langhorst, T., & Pavelsky, T. M. (2024). River Morphology. Dalam J. A. Cardille, M. A. Crowley, D. Saah, & N. E. Clinton (Ed.), Cloud-Based Remote Sensing with Google Earth Engine (hlm. 925–952). Springer International Publishing. https://doi.org/10.1007/978-3-031-26588-4_43
