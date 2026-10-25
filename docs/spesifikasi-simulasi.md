# Spesifikasi Simulasi Virtual — Modul PLTA

Status: **draf untuk dikonfirmasi**. Dokumen ini adalah kontrak pengerjaan sekaligus bahan
deskripsi media untuk keperluan validasi perangkat.

Kaitan: [CONTEXT.md](../CONTEXT.md) (glosarium), [analisis-proposal](analisis-proposal-untuk-simulasi.md).

---

## 1. Ruang lingkup

Satu aplikasi web dengan **tiga modul** — PLTA, PLTS, PLTB — yang berbagi satu kerangka UI
(header, pemilih modul, panel pengaturan, panel keluaran, panel Data & Analisis). **PLTA
dikerjakan lebih dulu** dan menjadi pola bagi dua modul berikutnya.

Dasar: proposal mengikat simulasi untuk ketiga sistem (P0049, P0105, P0657); memisahkan PLTA
menjadi aplikasi tersendiri berarti kerangka yang sama harus ditulis ulang dua kali.

## 2. Model fisis

Modul PLTA memodelkan **PLTA skala kecil / PLTMH mandiri** (bukan PLTA besar tersambung grid).
Alasan: dengan generator magnet permanen berbeban tetap, putaran turbin ikut berubah ketika debit
atau head berubah — sehingga RPM, daya, energi, dan visualisasi bisa konsisten sekaligus. Pada
PLTA besar yang tersambung grid, putaran generator justru terkunci pada putaran sinkron.

| Besaran | Rumus / nilai | Catatan |
|---|---|---|
| Massa jenis air | ρ = 1000 kg/m³ | tetap |
| Percepatan gravitasi | g = 9,81 m/s² | tetap |
| Efisiensi sistem | η = 0,75 | **satu titik beban acuan**, bukan efisiensi turbin; lihat catatan di bawah |
| Kapasitas turbin | `Q_kapasitas = 0,40 m³/s` | debit di atasnya **melimpas** dan tidak menambah daya |
| Debit efektif | `Q_eff = min(Q, 0,40)` | dipakai untuk daya **dan** putaran |
| Daya tersedia | `P_air = ρ·g·Q_eff·H` | persamaan 2.14 proposal |
| Daya keluaran | `P_out = η·ρ·g·Q_eff·H` | persamaan 2.15 proposal; inilah "Daya" yang tampil |
| Putaran turbin | `n = n₀ · √( (Q_eff·H) / (Q₀·H₀) )` | n₀ = 900 rpm pada Q₀ = 0,30 m³/s dan H₀ = 15 m |
| Energi | `E = P_out · t` | t dalam **detik**, dibagi 3600 untuk kWh |
| Kecepatan aliran dalam pipa | `v = Q / A` | memakai debit **sungguhan**, karena air limpasan tetap mengalir di pipa |
| Kecepatan jet di nosel | `v_jet = √(2·g·H)` | fisika Torricelli |
| Tinggi jatuh relatif | `H / 25 m` | perbandingan terhadap maksimum situs, **bukan** pengukuran waduk |

**Dasar rumus putaran.** Generator magnet permanen pada beban listrik tetap: tegangan sebanding
putaran (V ∝ n) dan daya listrik sebanding V², sehingga pada kesetimbangan `n ∝ √P`. Karena
`P ∝ Q_eff·H`, maka `n ∝ √(Q_eff·H)`. Konsekuensinya putaran naik ketika **debit naik atau head
naik** — perilaku yang diinginkan, sekaligus sahih secara fisis untuk sistem mandiri.

**Kenapa η konstan tetapi turbin dibatasi.** η turbin nyata berupa kurva terhadap beban, jadi satu
angka tetap hanya sah di sekitar satu titik beban. Supaya daya tidak naik tanpa batas (yang akan
membuat angka di luar wilayah PLTMH), yang dibatasi adalah **kapasitas turbin**, bukan η-nya yang
dibuat melengkung. Satu pembatas `min()` lebih mudah dibaca murid daripada kurva efisiensi, dan
grafik Debit–Daya mendapat siku yang jelas sebagai bukti adanya batas.

### 2.1 Rentang nilai

| Variabel | Rentang | Catatan |
|---|---|---|
| Debit Q | 0,05 – 0,60 m³/s (batas atas ditentukan preset) | pengatur: slider; di atas 0,40 m³/s daya mendatar |
| Head H | 4 – 25 m (**sama di semua preset**) | pengatur: slider; head adalah sifat situs, cuaca tidak mengubahnya |
| Daya keluaran P_out | ≈ 1,5 – 73,6 kW | tampil dalam **kW**, 2 desimal |
| Putaran n | ≈ 190 – 1.342 rpm | tampil sebagai bilangan bulat; mendatar setelah kapasitas |
| Energi E | ≈ 0,02 – 1,2 kWh untuk durasi 60 detik | tampil dalam **kWh**, 3 desimal |
| Durasi percobaan | 30 / 60 / 90 / 120 detik (default 60) | dipilih sebelum mulai, terkunci setelah data pertama |

## 3. Basis waktu, timer, dan energi

1. **Waktu simulasi 1:1 dengan waktu nyata.** Tidak ada percepatan. Jam yang dipakai timer adalah
   jam yang sama yang dipakai menghitung energi, sehingga `E = P_out × t` sahih.
2. Timer menampilkan waktu berjalan **dan** padanannya dalam jam (contoh: `60 s = 0,0167 jam`),
   supaya konversi satuan yang paling sering salah (kW × detik disebut kWh) terlihat murid.
3. **Percobaan berhenti otomatis** ketika durasi target tercapai. Ini yang menjamin semua kelompok
   punya durasi sama — lebih kuat daripada stopwatch yang ditekan manual, karena variasi manusia
   justru hilang.
4. **Fase mulai 2 detik.** Setelah Start, turbin berputar naik dari diam ke putaran mantap. Selama
   fase ini timer belum berjalan dan energi belum dihitung. Tujuannya dua: `E = P_out × t` tetap
   eksak, dan grafik RPM vs waktu punya tanjakan nyata yang bisa diamati.
5. Muka air waduk dianggap **tetap** selama percobaan. Alasannya bukan penyederhanaan asal: pada
   durasi 60 detik dengan debit maksimum 0,60 m³/s, air yang terpakai hanya 36 m³ — tidak berarti
   dibanding kapasitas waduk. Karena muka air tetap, head juga tetap.
6. **Selama fase pemulihan (2 detik pertama), daya dan energi ditampilkan "—"**, bukan angka
   penuh. Daya yang masih nol tidak boleh tampak seolah sudah tercapai; "—" membedakan "belum
   mengukur" dari "hasilnya nol". RPM tetap tampil karena justru itulah yang sedang menanjak.

## 4. Kondisi percobaan dan penguncian

- **Satu percobaan = satu kondisi.** Selama percobaan berjalan, slider debit, slider head, preset,
  dan durasi **terkunci**. Ini yang membuat satu baris data mewakili satu kondisi bersih, dan
  membuat grafik Debit–Energi serta Head–Energi bermakna (energi berbeda hanya karena daya
  berbeda, bukan karena durasi atau kondisi bercampur).
- Saat simulasi **berhenti**, menggeser slider membuat visualisasi merespons **seketika**: aliran
  di pipa makin cepat, jet makin panjang, turbin berputar lebih cepat, angka daya dan RPM
  diperbarui sebagai pratinjau. Jadi umpan balik visual tetap instan — yang dikunci hanyalah
  kondisi saat pengukuran berlangsung.
- Mengunci variabel selama pengukuran sekaligus melatih **pengendalian variabel**, yang merupakan
  bagian dari penalaran penyelidikan.

## 5. Keluaran pengukuran (tiga keluaran, semuanya hasil ukur)

| Keluaran | Satuan | Sumber |
|---|---|---|
| Daya | kW (2 desimal) | `P_out = η·ρ·g·Q_eff·H` |
| Energi | kWh (3 desimal) | `E = P_out × t` |
| RPM | rpm (bulat) | `n = n₀·√((Q_eff·H)/(Q₀·H₀))` |

Keluaran keempat **dihapus dari panel ini** (keputusan Ronde 3, Q3 = B). Riwayatnya: dulu "Kondisi
waduk" (Penuh/Normal/Rendah/Kritis), lalu sejak Ronde 2 menjadi baris "Tinggi jatuh air: 15,0 m ·
60 % dari maksimum situs". Keduanya sama-sama salah tempat, karena panel ini memuat hasil **ukur**
percobaan sedangkan head adalah besaran yang **diatur** murid lewat slider — bukan sesuatu yang
diukur simulasi. Sekarang panel hanya memuat tiga keluaran, dan ketiganya benar-benar hasil ukur.

Persentase terhadap maksimum situs tidak hilang; ia **pindah ke label slider head**:
*"25,0 m — 100 % dari maksimum situs (25 m). Bukan hasil pengukuran, melainkan perbandingan dengan
situs ini."* Di sana ia melekat pada pengatur yang memang mengubahnya, dan pengakuan "bukan hasil
pengukuran" muncul bersamaan dengan angkanya.

Bila debit melebihi kapasitas turbin, panel ini menambah catatan eksplisit: *"Debit 0,60 m³/s
melebihi kapasitas turbin 0,40 m³/s: 0,20 m³/s melimpas dan tidak menambah daya."*

**Penanda kapasitas pada slider debit** (keputusan Ronde 3, Q2 = A): satu garis tipis warna merah di
trek slider pada posisi 0,40 m³/s, dengan keterangan di bawahnya *"Garis pada 0,40 m³/s = kapasitas
turbin. Debit di atasnya melimpas dan tidak menambah daya."* Sebelum ini, batas hanya disebut di
panel Rumus (yang tertutup secara bawaan) dan di catatan yang baru muncul **setelah** debit
dilewati — murid menemukan batasnya dengan menabraknya. Penanda **disembunyikan** saat kapasitas
berada di luar jangkauan slider (preset Kemarau berhenti di 0,20 m³/s), karena garis yang menempel
di ujung trek akan berbohong tentang posisinya.

## 6. Panel Data & Analisis

Panel "Info" pada rancangan lama **diganti nama menjadi "Data & Analisis"** dan dipindah ke sini
seluruh isi grafiknya.

**a. Tabel data** (provisional; skema final mengikuti E-LKM yang masih menunggu acc — disimpan di
satu tempat pada konfigurasi agar mudah disamakan):

| No | Q (m³/s) | H (m) | t (s) | Daya (kW) | Energi (kWh) | RPM |
|---|---|---|---|---|---|---|

Preset tidak menjadi kolom karena tetap untuk satu aktivitas (ditampilkan sekali di atas tabel).
Tinggi jatuh air sudah menjadi kolom sendiri (H), jadi perbandingan terhadap maksimum situs tidak
perlu kolom tambahan.

**b. Grafik sebar** dengan pemilih hubungan: **Debit–Daya, Head–Daya, Debit–Energi, Head–Energi**.
Titik bertambah setiap kali murid menekan **Catat Data**. Sebagai pembanding prediksi, ada garis
model tipis yang bisa dimatikan (default menyala).

**Garis model hanya digambar bila kondisi lainnya seragam.** Garis itu adalah grafik P(Q) pada H
tetap (atau P(H) pada Q tetap), jadi ia hanya sah bila seluruh titik memakai nilai besaran lainnya
yang sama. Bila data mencampur kondisi, garis **disembunyikan** dan keterangan menyebutkan
sebabnya serta apa yang harus dilakukan. Versi lama mengambil nilai acuan dari **baris data
terakhir** dan menggambar garis untuk semua titik — kurva yang benar secara hitungan tetapi tidak
mewakili satu pun titik di sebelah kirinya. Menarik garis yang tidak berlaku lebih buruk daripada
tidak menggambar apa pun.

**Kenapa Debit–Energi dan Head–Energi tetap ada.** Karena `E = P × t` dengan durasi yang sama untuk
semua baris, bentuk kedua grafik itu **pasti** menyerupai grafik dayanya; hanya skala sumbu tegaknya
berbeda. Kesamaan itu dinyatakan terang-terangan di keterangan grafik, sehingga murid yang
menyadarinya sedang menguji pemahamannya sendiri, bukan menemukan cacat alat.

**c. Grafik RPM vs waktu** — strip chart yang bergerak selama satu percobaan, dan **jejak
percobaan-percobaan sebelumnya ditumpuk sebagai garis pudar** berlabel nilai Q dan H-nya. Dengan
begitu murid melihat bahwa setiap kondisi menghasilkan dataran putaran yang berbeda.

**Kenapa tidak semuanya "real-time".** Debit dan head ditetapkan murid lalu dijaga tetap selama
satu percobaan, sehingga hubungan Debit–Daya bukan deret waktu: satu percobaan hanya menghasilkan
**satu titik**. Grafik sebar yang bertambah tiap pencatatan adalah bentuk yang benar untuk
hubungan antarvariabel, sedangkan RPM vs waktu adalah satu-satunya yang memang deret waktu.

**d. Panel Rumus** — `P_out = η·ρ·g·Q·H` **tersembunyi saat mengumpulkan data**, dapat dibuka
lewat tombol "Tampilkan rumus" (default tertutup). Nilai η tetap tampil sebagai konstanta alat.
Alasannya: kalau rumus terpampang sejak awal, murid tinggal membacanya dan tahapan merumuskan
hipotesis serta menganalisis data kehilangan makna.

## 7. Preset

Preset = **skenario lingkungan** yang mengubah tampilan **dan** menetapkan ketersediaan air.
Satu preset dipakai untuk satu aktivitas E-LKM dan terkunci selama percobaan berjalan.

| Preset | Tampilan | Q_maks | Padanan |
|---|---|---|---|
| **Kemarau** | langit cerah terik, waduk surut, gelombang tenang | 0,20 m³/s | musim kering |
| **Cerah** | langit biru berawan tipis, gelombang normal | 0,40 m³/s | kondisi biasa |
| **Mendung** | langit kelabu, gelombang lebih besar | 0,50 m³/s | menuju musim basah |
| **Hujan** | langit gelap, partikel hujan, gelombang paling besar | 0,60 m³/s | musim basah |

**Preset tidak lagi membatasi head.** Head 4–25 m terbuka penuh di semua preset, karena head adalah
sifat situs (ketinggian jatuh yang tersedia di lokasi), bukan sesuatu yang ditentukan cuaca.
Sebelumnya Kemarau dibatasi 12 m dan Hujan 25 m, sehingga murid dapat menyimpulkan "hujan menaikkan
head dua kali lipat" — miskonsepsi yang lahir dari desain alat, bukan dari fisika. Cuaca hanya
mengubah **ketersediaan debit** dan **tampilan**.

Konsekuensi yang diterima: Kemarau berdaya maksimum 36,79 kW, sedangkan Cerah, Mendung, dan Hujan
semuanya **73,58 kW** karena q_maks-nya sudah mencapai atau melewati kapasitas turbin. Mendung dan
Hujan menjadi identik dalam daya dan putaran, berbeda pada debit yang boleh disetel dan cuaca yang
tampak. Itu bukan bug — itu pelajaran bahwa air di atas kapasitas turbin tidak menambah daya.

Preset tidak boleh dikira kosmetik murni (ia menentukan batas debit, yang langsung membatasi daya)
dan tidak boleh dibiarkan bisa diganti di tengah percobaan (kalau bisa, hubungan Debit–Daya yang
ingin ditemukan murid justru terkontaminasi).

Untuk modul PLTS dan PLTB nanti, preset yang sama mengubah besaran yang relevan di sana
(intensitas radiasi, kecepatan angin) — itulah alasan preset dibuat sebagai konsep bersama, bukan
milik satu modul.

## 8. Visualisasi

Potongan melintang, mengikuti bagan pada Gambar 2.16 proposal (adaptasi U.S. DOE): waduk/bendung →
intake → pipa pesat → nosel → turbin → generator → saluran keluar.

Yang **bergerak mengikuti besaran**:

| Elemen | Digerakkan oleh |
|---|---|
| Kecepatan partikel air di dalam pipa | `v = Q/A` — makin besar debit makin cepat |
| Panjang dan kecepatan jet di nosel | `v_jet = √(2gH)` — head yang mengubahnya |
| Putaran roda turbin | RPM |
| Jumlah lampu/indikator yang menyala di rumah pembangkit | daya keluaran |
| Amplitudo dan kecepatan gelombang muka air | preset |
| Langit, awan, partikel hujan | preset |

Yang **tetap**: **diameter pipa pesat.** Pada pipa berpenampang tetap, debit yang naik berarti
kecepatan aliran naik, bukan diameter bertambah. Menampilkan pipa yang membesar ketika debit naik
adalah kesalahan fisika yang akan terlihat oleh validator.

**Jenis turbin: crossflow (Banki), bukan Pelton.** Turbinnya digambar sebagai **drum berlubang
dengan 24 sudu melintang selebar drum** plus *guide vane* di mulut nosel, dan aliran jet dibiarkan
menembus drum. Ini bukan pilihan kosmetik: rentang head 4–25 m adalah wilayah kerja turbin reaksi
dan crossflow, sedangkan Pelton bekerja pada head puluhan sampai ratusan meter dan digerakkan satu
jet yang menabrak mangkuk. Menggambar siluet impuls ala Pelton sambil menulis rumus Torricelli
membuat gambar dan teks saling menyangkal. Crossflow memakai nosel **dan** jet (sehingga rumus
`v_jet` tetap sahih) tetapi sudu-sudunya memotong aliran dua kali — itulah yang membuatnya masuk
akal pada head rendah.

Turbin juga memakai **kapasitas** 0,40 m³/s. Pada debit di atasnya, drum sudah penuh: daya dan
putaran mendatar, dan sisa air **terlihat melimpas**. Inilah satu-satunya "batas alat" yang
ditampilkan, dan ia sengaja supaya sumbu Debit–Daya punya siku yang bisa dibaca sebagai bukti
kapasitas.

**Limpasan harus terlihat, bukan hanya tertulis** (keputusan Ronde 3, Q1 = A). Sebelum ini, pada
head tetap debit 0,40 dan 0,60 menghasilkan jet, isi drum, dan lampu indikator yang **identik** —
hanya partikel di dalam pipa yang berbeda. Gambar menyangkal angka: daya sudah mendatar tetapi
semua air tampak tetap masuk turbin, sehingga murid wajar menyimpulkan kapasitas itu tidak ada.
Sekarang:

- **Sebagian partikel jet disembunyikan** mengikuti `Q_limpasan/Q_total`. Pada 0,60 m³/s porsi
  turbin 2/3, jadi jet tampak 2/3 penuh — menipis bertahap, tidak tiba-tiba hilang.
- **Saluran bypass** digambar mulai dari katup di titik cabang pipa pesat, menurun keluar tepi
  bawah gambar, dan **terisi partikel air sebanding porsi limpasan**. Pada Q ≤ kapasitas saluran
  ini kosong.
- Saluran itu digambar sebagai **pipa terkubur**, bukan pita air di permukaan lereng: pipa pesat di
  gambar memang terbenam di bawah tanah (pada x = 499 tanah di y ≈ 349 sedangkan pipa di y ≈ 396),
  jadi air yang tampak "jatuh di atas rumput" akan salah secara visual.
- Air di dalam drum diberi grup SVG sendiri (`#plta-partikel-dalam`), terpisah dari
  `#plta-partikel-jet`, supaya "berapa butir yang terlihat" selalu bermakna satu hal.

## 9. Kontrol

Di bawah visualisasi, berurutan:

| Tombol | Perilaku |
|---|---|
| **Mulai** | fase mulai 2 detik → timer berjalan, energi terakumulasi. Selama fase ini pengatur terkunci |
| **Jeda** | jam simulasi berhenti (waktu tidak berjalan, jadi energi tidak bertambah), animasi membeku; label berubah menjadi **Lanjut** |
| **Ulangi Percobaan** | timer dan energi ke nol, kondisi alat kembali awal, **tabel data tetap utuh** |

Di panel Data & Analisis (jauh dari area klik yang ramai, supaya tidak tertekan tanpa sengaja):

| Tombol | Perilaku |
|---|---|
| **Catat Data** | menyimpan satu baris dari kondisi saat ini |
| **Ulangi Percobaan** | timer dan energi ke nol, kondisi alat kembali awal, **tabel data tetap utuh** |
| **Hapus Semua Data** | mengosongkan tabel; meminta konfirmasi lebih dulu |

Pemisahan dua tombol reset ini disengaja: di kelas, hampir pasti ada kelompok yang menekan reset
setelah mencatat data. Kalau satu tombol menghapus tabel sekaligus, pekerjaan satu pertemuan bisa
hilang. **Ditegaskan pada Ronde 3 (Q4 = A)** bahwa keduanya tetap dua tombol: keduanya bekerja pada
barang yang berbeda — satu pada percobaan yang sedang berjalan, satu pada arsip. Menggabungkannya
menjadi satu tombol dengan dialog pilihan memaksa murid membaca dialog setiap kali hanya ingin
mengulang, dan satu salah klik menghapus pekerjaan satu kelompok.

Bedanya sekarang **tertulis di halaman**, bukan hanya bisa ditemukan lewat dialog konfirmasi:
*"Ulangi Percobaan mengembalikan percobaan ke nol dan data tetap tersimpan. Hapus Semua Data (di
panel Data & Analisis) membuang seluruh baris tabel."* Tombol Ulangi juga diberi `title` dan
`aria-describedby` yang menunjuk keterangan itu.

**Durasi ikut terkunci.** Setelah baris pertama tersimpan, tombol durasi nonaktif sampai seluruh
data dihapus. Sebabnya: satu tabel data = satu aktivitas, dan energi antarbaris dengan durasi
berbeda bukan pembanding yang sah. Ini cermin dari cara preset dikunci, dan alasannya sama —
mengendalikan variabel. Keterangan di bawah tombol menyebutkan mengapa terkunci dan apa yang harus
dilakukan untuk membukanya.

*Catatan:* istilah **"Reset" tidak dipakai di antarmuka sama sekali** — ketiga tombol disebut dengan
namanya masing-masing ("Mulai", "Jeda"/"Lanjut", "Ulangi Percobaan"). Dengan begitu tidak ada istilah
ambigu yang perlu ditafsirkan murid, dan tidak ada tombol yang artinya bergantung pada kebiasaan.

## 10. Peta ke tahapan pembelajaran

| Tahapan Inquiry Terbimbing | Bagian simulasi yang melayaninya | Indikator Facione |
|---|---|---|
| Orientasi | preset dan tampilan awal | interpretation |
| Merumuskan masalah | pertanyaan di E-LKM; simulasi sebagai konteks | interpretation, analysis |
| Merumuskan hipotesis | simulasi **belum** dipakai; rumus masih tertutup | inference |
| Mengumpulkan data | slider, Start/Pause, timer, Catat Data | analysis |
| Menguji hipotesis | grafik sebar vs garis model; panel rumus dibuka | evaluation |
| Merumuskan kesimpulan | tabel data dan grafik sebagai bukti | inference, explanation |
| Pemeriksaan ulang | Ulangi Percobaan, penumpukan jejak RPM | self-regulation |

## 11. Jembatan ke E-LKM

LiveWorksheets **tidak** menyediakan API untuk menerima data dari aplikasi luar, dan **tidak**
bisa menyematkan aplikasi luar ke dalam lembar kerja. Karena itu jembatannya manual, dan yang
dirancang di sini adalah mengurangi friksinya:

1. **Kartu Data** — tampilan huruf besar berisi baris terakhir yang dicatat, dengan **urutan kolom
   identik** dengan urutan kotak isian di tabel pengamatan E-LKM, supaya murid mengetik dari kiri
   ke kanan tanpa menoleh-noleh.
2. **Unduh CSV** — bukan untuk murid, melainkan untuk guru/peneliti: mengumpulkan data seluruh
   kelas sebagai cadangan dan dokumentasi.
3. Simulasi dipakai di tab terpisah; E-LKM memuat elemen **Link** dan kode QR menuju alamat
   GitHub Pages.

Catatan penting: jawaban murid di mailbox LiveWorksheets terhapus otomatis (30 hari menurut
halaman About, 15 hari menurut tim LiveWorksheets). Unduh segera setelah setiap pertemuan.

## 12. Batasan teknis

- **Satu berkas statis** tanpa build tool, tanpa server, tanpa CDN. Jalan dari **GitHub Pages**
  maupun langsung dari berkas lokal saat internet sekolah mati.
- **Skrip klasik, bukan ES module**, dan **tanpa `fetch`** — keduanya gagal saat dibuka dengan
  `file://` karena origin-nya `null`. Konfigurasi dan data ditaruh sebagai objek di dalam berkas
  `.js`, bukan dimuat saat berjalan.
- **Tanpa perutean halaman.** GitHub Pages tidak punya fallback rute; seluruh keadaan aplikasi
  disimpan di satu halaman.
- **Responsif**, dari HP ±360 px sampai laptop 1366×768 dan proyektor. Sasaran utama
  laptop/tablet, karena murid perlu membuka simulasi dan E-LKM berdampingan.
- Tanpa akun dan tanpa jaringan saat dipakai; preferensi terakhir disimpan di `localStorage`.

Struktur berkas:

```
simulasi/
  index.html          kerangka: header, pemilih modul, panel
  aset/gaya.css
  aset/konfigurasi.js konstanta, rentang, preset, skema kolom tabel
  aset/fisika.js      model fisis murni: daya, putaran, energi, kapasitas, batas
  aset/modul-plta.js  parameter, visualisasi, dan preset modul PLTA
  aset/inti.js        fase percobaan, timer, pencatatan, grafik, kontrol
```

## 13. Yang masih menunggu

- **Skema kolom tabel** disamakan dengan tabel pengamatan E-LKM begitu LKM disetujui. Sementara
  dipakai tujuh kolom pada bagian 6a, disimpan di `konfigurasi.js`.
- **Nilai η** (kini 0,75) dan **putaran acuan** (kini 900 rpm) perlu dikonfirmasi ke pembimbing bila
  beliau ingin angka lain.
- **Nilai `qKapasitas`** (kini 0,40 m³/s) juga perlu dikonfirmasi ke pembimbing: itu batas turbin
  yang dipilih supaya daya puncak masuk wilayah PLTMH, bukan angka dari proposal.
- Modul **PLTS** dan **PLTB** menyusul setelah modul PLTA disetujui.
- **Status kata "Reset"** (§9): istilah itu kini tidak dipakai di antarmuka sama sekali — tiga tombol
  disebut dengan namanya masing-masing. Dua tombol reset (Ulangi Percobaan vs Hapus Semua Data)
  **sudah diputuskan tetap dua** (Ronde 3, Q4 = A); yang belum adalah apakah pembimbing ingin istilah
  "Reset" muncul secara eksplisit di panduan guru/LKM meski tidak ada di tombol.

## 14. Hasil verifikasi modul PLTA

Modul PLTA sudah berjalan dan diuji, bukan baru dirancang. Lima penguji dipakai, semuanya disimpan
di `_analysis/` supaya bisa dijalankan ulang kapan saja.

**Penguji model** (`_analysis/uji-model.js`) menjalankan `konfigurasi.js` dan `fisika.js` di dalam
konteks Node tanpa peramban: **34 lulus, 0 gagal**. Yang diperiksa antara lain kecocokan
`P = ηρgQH` dengan hitungan tangan, batas atas/bawah Q dan H, pemangkasan Q oleh preset (head kini
tidak dipangkas), **perilaku kapasitas turbin** (air limpasan, daya mendatar, putaran mendatar,
kecepatan pipa tetap naik), dan rumus energi.

Jangkauan seluruh preset setelah keputusan Ronde 1 & 2:

| Preset | Q (m³/s) | H (m) | Puncak daya | Putaran | Melimpas |
|---|---|---|---|---|---|
| Kemarau | 0,05–0,20 | 4–25 | 36,79 kW | 949 rpm | tidak |
| Cerah | 0,05–0,40 | 4–25 | 73,58 kW | 1342 rpm | tidak |
| Mendung | 0,05–0,50 | 4–25 | 73,58 kW | 1342 rpm | ya |
| Hujan | 0,05–0,60 | 4–25 | 73,58 kW | 1342 rpm | ya |

Daya keluaran 1,47–73,58 kW · putaran 190–1.342 rpm · energi @60 s 0,025–1,226 kWh · kecepatan pipa
0,18–2,14 m/s · kecepatan jet 8,86–22,15 m/s.

**Penguji antarmuka** (`_analysis/uji-peramban.js`) mengendalikan halaman sungguhan lewat Chrome
DevTools Protocol: klik nyata, waktu nyata, bacaan DOM nyata, tangkapan layar nyata. Tiga percobaan
30 detik dijalankan berurutan (Mendung 0,50/22 · Hujan 0,60/25 · Hujan 0,35/25):
| Yang diuji | Hasil |
|---|---|
| Durasi nyata tiap percobaan | 32,05 · 32,04 · 32,08 detik — 2 detik pemulihan + 30 detik berjalan, galat < 0,3 % |
| Timer di layar saat berhenti | `00:30` untuk ketiga percobaan |
| Energi terhadap `E = P × t` | 0,540 · 0,613 · 0,536 kWh; P_out 64,75 · 73,58 · 64,38 kW |
| Efek kapasitas | Hujan 0,60 m³/s dan 0,40 m³/s sama-sama 73,58 kW — melimpas tidak menambah daya |
| Isi tabel | 3 baris, tujuh kolom, urutan sesuai E-LKM |
| Jejak RPM | 3 kurva, jumlah pada keterangan cocok dengan jumlah percobaan |
| Garis model | **tidak digambar** karena titik berasal dari 3 nilai head berbeda; keterangan menyebut sebabnya |
| Tabel pada layar 390 px | 342 px di dalam 342 px — tidak ada kolom terpotong, halaman tidak meluber |
| Galat halaman | tidak ada |

**Penguji limpasan** (`_analysis/uji-limpasan.js`) memeriksa apakah limpasan benar-benar
**tergambar**, bukan sekadar tertulis: ia menghitung partikel jet dan partikel saluran limpasan yang
opacity-nya > 0,05 (dibaca dari atribut `opacity`, karena `modul-plta.js` menyetelnya lewat
`setAttribute`). **Lulus 7, gagal 0**:

| Kondisi | Partikel jet terlihat | Partikel limpasan terlihat |
|---|---|---|
| Q 0,30 m³/s (di bawah kapasitas) | 9 / 9 | 0 / 6 |
| Q 0,40 m³/s (tepat kapasitas) | 9 / 9 | 0 / 6 |
| Q 0,60 m³/s (porsi turbin 2/3) | 6 / 9 | 2 / 6 |

Baris terakhir itulah intinya: **gambar 0,40 dan 0,60 sekarang berbeda**, padahal dayanya sama-sama
73,58 kW. Sebelumnya ketiganya tampil identik.

**Penguji garis model** (`_analysis/uji-garis-model.js`) memeriksa kebalikan dari penguji antarmuka:
tiga percobaan dengan **head sama** (15,0 m) dan debit berbeda (0,10 · 0,20 · 0,30 m³/s). Di sini
garis model **harus muncul** dan keterangannya harus menyebut head 15,0 m tanpa kata "data terakhir".
Ketiga grafik diperiksa satu per satu:

| Grafik | Keterangan yang diharapkan |
|---|---|
| Debit–Daya | garis digambar; "perhitungan model pada tinggi jatuh air = 15,0 m, yaitu kondisi yang sama untuk semua titik ini" |
| Tinggi jatuh–Daya | garis TIDAK digambar; "berasal dari 3 nilai debit berbeda" |
| Debit–Energi | garis digambar; menyebut head 15,0 m **dan** t = 30 s |
| Tinggi jatuh–Energi | garis TIDAK digambar; menyebut debit dan durasi harus seragam |

Kedua penguji antarmuka (seragam vs tidak seragam) memang dirancang berlawanan supaya aturan
keseragaman terbukti dari dua sisi, bukan dari satu kebetulan.

Lima cacat ditemukan pengujian ini dan sudah diperbaiki:

1. **Jejak RPM tersimpan dua kali.** "Catat Data" menyimpan kurva percobaan, lalu "Ulangi
   Percobaan" menyimpannya lagi karena kurva itu belum ditandai tersimpan. Akibatnya 3 percobaan
   menghasilkan 6 kurva dan jatah 6 kurva habis dua kali lebih cepat. Diperbaiki dengan penanda
   `jejakDisimpan` yang direset tiap percobaan baru.
2. **Angka energi di pesan status berbeda dari di tabel.** Pesan penutup dihitung sebelum energi
   dikunci pada `t` yang tepat, sehingga tertulis 0,919 kWh sementara tabel menulis 0,920 kWh.
   Urutan perhitungan dibalik.
3. **Sumbu grafik melompat terlalu jauh.** Untuk data 110 kW sumbu naik ke 200 kW sehingga separuh
   bidang kosong. Tangga pembulatan diganti menjadi 1 · 1,2 · 1,5 · 2 · 2,5 · 3 · 4 · 5 · 6 · 8 · 10,
   kini sumbu berhenti di 120 kW.
4. **(Ronde 3) Blok animasi jet tertulis dua kali.** Saat pertama kali limpasan ditambahkan, satu
   blok jet lama tertinggal di bawah blok baru, sehingga nilai opacity yang sudah memperhitungkan
   limpasan **ditimpa** oleh versi lama yang selalu menampilkan semua partikel. Akibatnya limpasan
   tidak pernah terlihat walau kodenya benar. Ditemukan oleh penguji limpasan, bukan oleh mata.
5. **(Ronde 3) Partikel dalam drum menumpang di grup jet.** `#plta-partikel-jet` berisi partikel jet
   **dan** partikel drum, membuat "berapa butir yang terlihat" ambigu dan penguji menghitung
   campuran keduanya. Dipisah ke grup `#plta-partikel-dalam` sendiri.

Catatan penyimpangan dari rancangan awal, semuanya disengaja:

- **Satuan kW, bukan MW.** Catatan permintaan menyebut "Daya (MW)", tetapi PLTMH pada rentang
  Q 0,05–0,60 m³/s dan H 4–25 m menghasilkan 1,5–73,6 kW. Menulis MW akan menghasilkan angka
  0,0015–0,074 yang menyulitkan murid membaca grafik. **Sudah dikonfirmasi ke penulis
  (Ronde 2, Q6).**
- **`P_air` tidak ditampilkan di antarmuka terbuka**, hanya di dalam panel Rumus yang tertutup.
  Ini keputusan Q8: murid mengukur `P_keluaran`, lalu membuka rumus saat menguji hipotesis.
- **Jejak RPM dibatasi 6 kurva** agar grafik tidak menjadi tidak terbaca setelah satu pertemuan.
- **Pita "pemulihan" 2 detik** digambar pada grafik RPM supaya jeda antara Mulai dan timer
  berjalan tidak tampak seperti kesalahan alat.

---

## 15. Revisi hasil audit UI/UX

Perbaikan pada bagian ini berasal dari audit runtime (Chrome headless via CDP) dan dikerjakan
melalui tiket GitHub #1–#8. Dokumen kontrak perbaikannya ada di
[spesifikasi-perbaikan-uiux.md](spesifikasi-perbaikan-uiux.md).

### 15.1 Istilah baku

Satu besaran memakai satu nama di seluruh antarmuka:

| Sebelum | Sesudah |
|---|---|
| "Ketinggian jatuh (H)" / "Head (m)" / "head" | **"Tinggi jatuh air (head, H)"** pada label pengatur; **"Tinggi jatuh air"** pada kepala tabel dan label sumbu grafik |
| "Putaran" / "RPM" / "RPM (rpm)" | **"Putaran turbin (rpm)"** pada panel keluaran dan label sumbu; **"Putaran"** pada kepala tabel |

Istilah Inggris tetap disertakan sekali dalam tanda kurung agar tersambung ke proposal, tetapi
tidak dipakai sebagai nama utama. Urutan kolom tabel tidak berubah, sehingga kesetaraan dengan
tabel pengamatan E-LKM tetap terjaga.

### 15.2 Satu percobaan = satu baris data

- **"Catat Data" hanya aktif setelah percobaan selesai** (`fase === 'selesai'`). Sebelumnya tombol
  aktif sejak detik pertama, sehingga satu percobaan bisa menghasilkan beberapa baris dengan
  durasi berbeda (terukur 0,049 kWh pada detik ke-2 vs 0,920 kWh pada detik ke-30 dari kondisi
  yang sama). Penanda `sudahDicatat` mencegah satu baris tercatat dua kali.
- **"Hapus Semua Data" membersihkan tabel dan kedua grafik**, bukan hanya model data. Sebelumnya
  status menyatakan "Semua data dihapus" sementara tabel masih menampilkan baris lama.
- Tombol "Catat Data" tersedia di dua tempat (bilah kendali dan panel Data & Analisis) dan selalu
  berada dalam keadaan yang sama.

### 15.3 Penggantian skenario tidak menghapus data

Preset menentukan batas atas debit dan tinggi jatuh. Bila skenario diganti setelah ada data,
titik lama bisa berada di luar jangkauan sumbu. Perilaku yang dipilih: **data dipertahankan**,
grafik digambar ulang, dan titik yang di luar jangkauan **ditandai panah di tepi bidang** dengan
keterangan berapa titik yang berada di luar. Data murid tidak dihapus dan tidak ada dialog
pemblokir.

### 15.4 Jeda membekukan percobaan secara utuh

- Jeda saat fase pemulihan **tidak lagi memotong** sisa fase 2 detik. Penanda `jedaDari` menyimpan
  fase asal sehingga melanjutkan percobaan meneruskan fase yang sama.
- Animasi (roda turbin, partikel pipa, jet, gelombang, hujan) **berhenti selama jeda** karena
  gelung mengirim `dt = 0`. Sebelumnya timer berhenti tetapi roda tetap berputar 83° dalam 600 ms.
- Fase `siap` sengaja **tidak** dibekukan: saat berhenti, menggeser slider harus langsung
  memperlihatkan perubahan kecepatan aliran sebagai pratinjau (§4).

### 15.5 Grafik putaran turbin

- **Kurva mulai dari nol** pada saat Mulai ditekan dan menanjak selama fase pemulihan. Sebelumnya
  titik hanya didorong pada fase `jalan` dan membandingkan satuan waktu yang berbeda, sehingga
  titik tercatat tiap ≈2,1 detik dan kurva baru muncul di detik ke-2 — fase pemulihan yang
  dijanjikan §3.4 tidak pernah terlihat.
- **Jarak antar titik konsisten** (≤ 0,08 detik sepanjang fase pemulihan dan fase berjalan).
- **Angka putaran di panel mengikuti putaran roda** selama percobaan, bukan langsung nilai mantap.
- **Legenda jejak digambar** di HTML di bawah kanvas, berisi kondisi (debit dan tinggi jatuh) tiap
  percobaan. Warna kurva disamakan dengan warna baris tabel untuk percobaan yang sama.
- **Garis model tidak tampil sebelum ada data.** Sebelumnya garis putus-putus sudah tergambar pada
  tabel kosong, memperlihatkan bentuk hubungan yang justru ingin ditemukan murid (§6d).

### 15.6 Kontras dan keterbacaan

- Token `--hijau` `#1f9d55 → #157a43` (putih di atasnya 3,49:1 → 5,39:1) dan `--jingga`
  `#d98a1f → #8a5f10` (2,76:1 → 5,64:1). Satu perubahan ini memperbaiki tombol "Catat Data" saat
  aktif dan teks status selesai.
- *Setelah keputusan Ronde 2 Q2, penanda kondisi waduk beserta empat warnanya dihapus seluruhnya.*
  Palet seri data digelapkan agar label putih di dalam titik ≥ 4,5:1.
- **Kontrol nonaktif tidak lagi memakai `opacity`** melainkan warna eksplisit, sehingga teks tetap
  terbaca (sebelumnya turun ke 1,34–1,51:1) dan pilihan yang aktif tetap dapat dibedakan.
- Warna kanvas grafik digelapkan: angka sumbu dan teks keadaan kosong ≥ 4,5:1, garis model ≥ 3:1.
- Label diagram yang gagal kontras diberi piring latar.

### 15.7 Aksesibilitas

- **Dialog Kartu Data berperilaku sebagai modal**: fokus masuk saat dibuka, Tab/Shift+Tab berputar
  di dalam dialog, latar (`main`, `header`) diberi `inert`, halaman tidak dapat digulir, Escape dan
  tombol Tutup mengembalikan fokus ke tombol pembuka.
- **Kedua kanvas grafik** memiliki `role="img"`, `aria-label`, dan `aria-describedby` yang menunjuk
  ke kalimat keterangan yang sudah ada.
- **Tabel data** memiliki `<caption>` tersedia bagi pembaca layar dan seluruh `<th>` memiliki
  `scope="col"`.
- **Status pilihan** (tab, preset, durasi, pemilih grafik) dinyatakan dengan `aria-pressed`, dan
  pilihan aktif diberi penanda non-warna (garis tepi tebal serta tanda centang pada preset).
- **`prefers-reduced-motion` dihormati**: kelima animasi utama berhenti, sedangkan angka panel dan
  timer tetap berjalan.
- Slider debit dan tinggi jatuh memiliki `aria-valuetext` sehingga satuannya ikut diumumkan.

### 15.8 Tata letak dan komposisi

- Ambang tata letak dua kolom **1040 px → 1000 px**, sehingga laptop sekolah 1024×768 mendapat dua
  kolom (tinggi halaman 2365 px → ±1301 px).
- Pada layar pendek (tinggi ≤ 800 px), tinggi diagram dibatasi 300 px dan panel data naik ke
  lipatan pertama. Tombol "Catat Data" kini berada di bilah kendali dan terlihat tanpa menggulir
  pada 1366×768 maupun 1024×768.
- Kolom samping tidak terpotong: pada layar pendek perilaku menempel dilepas.
- **Skala tipografi dikunci 6 langkah** (`0,7 · 0,8 · 0,9 · 1 · 1,3 · 1,7` rem) dari sebelumnya
  17 ukuran berbeda.
- **Irama jarak** diseragamkan ke tangga 4/8/12/16/24/32 px.
- **Komposisi diagram**: `viewBox` dirapatkan menjadi `0 50 1000 420` sehingga bagian mesin
  menempati ±52 % tinggi kanvas (sebelumnya 36 %), diameter turbin diperbesar, dan seluruh elemen
  berada di dalam bidang gambar (sebelumnya empat elemen terpotong, termasuk label "Turbin").
- **Kartu Data** memakai susunan 3×2 sehingga tidak ada kotak yang menggantung sendirian
  (sebelumnya 5+1).

### 15.9 Keputusan Ronde 1 & 2 (grill dengan penulis)

Dua ronde wawancara dijalankan untuk menutup lubang antara kode dan fisika. Semua keputusan
diterima penulis, dan seluruhnya sudah diterapkan ke kode serta diuji ulang.

| No | Keputusan | Kode yang berubah |
|---|---|---|
| R1 Q1 | Realisme diukur pada **mekanisme dan visual**, bukan sekadar angka | dasar semua keputusan di bawah |
| R1 Q2 | **Cuaca hanya mengubah debit**; head 4–25 m bebas di semua preset | `konfigurasi.js` (buang `hMaks` per preset), `fisika.js` (`batas()`), `inti.js` (kartu preset) |
| R1 Q3 | Energi sah dibandingkan **hanya bila durasi sama** | lihat R2 Q5 |
| R1 Q4 | Label turbin → **crossflow** | `modul-plta.js`, `index.html` |
| R1 Q5 | Daya & energi **"—" selama pemulihan** | `inti.js` (`perbaruiKeluaran`) |
| R2 Q1 | **Kapasitas turbin** 0,40 m³/s, debit di atasnya melimpas | `konfigurasi.js`, `fisika.js`, `inti.js`, `index.html` |
| R2 Q2 | **Kosakata waduk dihapus**; keluaran keempat jadi "Tinggi jatuh air" | `konfigurasi.js`, `fisika.js`, `inti.js`, `index.html`, `gaya.css` |
| R2 Q3 | **Siluet turbin digambar ulang** (drum + 24 sudu + guide vane) | `modul-plta.js` |
| R2 Q4 | **4 grafik dipertahankan** + keterangan bahwa kurva energi pasti sama bentuknya | `inti.js` |
| R2 Q5 | **Durasi terkunci** setelah baris pertama | `inti.js` |
| R2 Q6 | Satuan **kW** dikonfirmasi | — |

Tiga cacat yang diperbaiki berkat wawancara ini, dan akibatnya bila dibiarkan:

1. **Preset mencampur cuaca dengan head** (Kemarau 12 m, Hujan 25 m). Murid akan menyimpulkan hujan
   menaikkan head dua kali lipat — miskonsepsi yang lahir dari alat, bukan dari fisika.
2. **Garis model diambil dari baris data terakhir.** Kurva yang benar secara hitungan tetapi tidak
   mewakili titik mana pun di sebelah kirinya; keterangannya hanya berbunyi "(data terakhir)".
3. **Daya tampil penuh sambil putaran masih menanjak**, sehingga angka yang belum tercapai tampak
   seolah sudah tercapai.

Dua hal yang **belum** diputuskan dan sengaja dibiarkan terbuka: arti tombol reset (§9) dan
penamaan akhir kolom tabel setelah E-LKM disetujui (§13).

### 15.10 Keputusan Ronde 3 (grill lanjutan dengan penulis)

| No | Pertanyaan | Keputusan | Akibat |
|---|---|---|---|
| R3 Q1 | Limpasan tidak terlihat sama sekali | **A — gambar limpasan** | partikel jet menipis mengikuti porsi turbin; saluran bypass terisi sebanding porsi limpasan |
| R3 Q2 | Batas 0,40 m³/s tidak terlihat di slider | **A — penanda kapasitas** | satu garis di trek slider + keterangan; disembunyikan bila di luar jangkauan preset |
| R3 Q3 | Baris "tinggi jatuh air" ada di panel hasil | **B — hapus dari panel, pindah ke label slider** | panel hanya memuat 3 keluaran yang semuanya hasil ukur |
| R3 Q4 | Dua tombol reset membingungkan | **A — pertahankan dua tombol, perjelas label** | keterangan tertulis di halaman + `title`/`aria-describedby` pada tombol Ulangi |

Empat cacat yang diperbaiki berkat Ronde 3, dan akibatnya bila dibiarkan:

1. **Limpasan tidak tergambar.** Pada head tetap, Q 0,40 dan 0,60 tampak identik — hanya partikel
   pipa yang berbeda. Gambar menyangkal angka; murid menyimpulkan semua air masuk turbin padahal
   dayanya sudah mendatar.
2. **Batas kapasitas hanya di panel tertutup.** Murid menemukan batas 0,40 m³/s dengan menabraknya,
   bukan dengan melihatnya.
3. **Besaran yang diatur ditaruh di panel hasil ukur.** Mencampur "yang saya atur" dan "yang saya
   ukur" di satu kotak adalah sumber miskonsepsi tentang apa yang sebenarnya diukur percobaan ini.
4. **Dua tombol reset tanpa keterangan.** Kesalahan paling mahal di kelas: menekan tombol yang salah
   lalu menyetujui dialog tanpa membacanya.

Dua hal yang **belum** diputuskan dan sengaja dibiarkan terbuka: penamaan akhir kolom tabel setelah
E-LKM disetujui (§13), dan status kata "Reset" yang kini tidak dipakai di antarmuka (§9).

### 15.11 Hasil verifikasi setelah revisi

| Pengujian | Hasil |
|---|---|
| Penguji model | LULUS 34, GAGAL 0 |
| Kriteria penerimaan tiket #1–#8 | 50 dari 50 lulus |
| Penguji perilaku keputusan Ronde 1, 2 & 3 | LULUS 27, GAGAL 0 |
| Penguji limpasan yang terlihat | LULUS 7, GAGAL 0 |
| Penguji garis model (head seragam) | LULUS; garis digambar pada Debit–Daya & Debit–Energi, tidak digambar pada kedua grafik head |
| Regresi tiga percobaan 30 detik | LULUS; durasi nyata 32,05 · 32,04 · 32,08 detik (galat maks 0,25 %); 3 baris data; legenda 4 entri; galat halaman 0 |
| Kontras | 0 kegagalan pada teks aktif (sebelumnya 9, semuanya komponen nonaktif) |
| Dialog Kartu Data | fokus di dalam dialog, 0 Tab keluar, fokus kembali ke tombol pembuka |
| `prefers-reduced-motion` | roda, partikel, jet, gelombang, dan hujan beku; timer tetap berjalan |
| Luber horizontal | aman pada 360, 390, 560, 768, 820, 1024, 1366, 1440 px |
| Galat JavaScript | tidak ada |

