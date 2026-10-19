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
| Efisiensi sistem | η = 0,75 | konstanta gabungan: gesekan, turbulensi, turbin, generator; ditampilkan sebagai "efisiensi sistem 75%" |
| Daya tersedia | `P_air = ρ·g·Q·H` | persamaan 2.14 proposal |
| Daya keluaran | `P_out = η·ρ·g·Q·H` | persamaan 2.15 proposal; inilah "Daya" yang tampil |
| Putaran turbin | `n = n₀ · √( (Q·H) / (Q₀·H₀) )` | n₀ = 900 rpm pada Q₀ = 0,30 m³/s dan H₀ = 15 m |
| Energi | `E = P_out · t` | t dalam **jam**; satuan kWh |
| Kecepatan aliran dalam pipa | `v = Q / A` | A tetap (diameter pipa tetap) |
| Kecepatan jet di nosel | `v_jet = √(2·g·H)` | fisika Torricelli |

**Dasar rumus putaran.** Generator magnet permanen pada beban listrik tetap: tegangan sebanding
putaran (V ∝ n) dan daya listrik sebanding V², sehingga pada kesetimbangan `n ∝ √P`. Karena
`P ∝ Q·H`, maka `n ∝ √(Q·H)`. Konsekuensinya putaran naik ketika **debit naik atau head naik** —
perilaku yang diinginkan, sekaligus sahih secara fisis untuk sistem mandiri.

### 2.1 Rentang nilai

| Variabel | Rentang | Catatan |
|---|---|---|
| Debit Q | 0,05 – 0,60 m³/s (batas atas ditentukan preset) | pengatur: slider |
| Head H | 4 – 25 m (batas atas ditentukan preset) | pengatur: slider |
| Daya keluaran P_out | ≈ 1,5 – 110 kW | tampil dalam **kW**, 2 desimal |
| Putaran n | ≈ 190 – 1640 rpm | tampil sebagai bilangan bulat |
| Energi E | ≈ 0,02 – 1,8 kWh untuk durasi 60 detik | tampil dalam **kWh**, 3 desimal |
| Durasi percobaan | 30 / 60 / 90 / 120 detik (default 60) | dipilih sebelum mulai, ikut tercatat |

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

## 5. Keluaran pengukuran (dipertahankan persis empat)

| Keluaran | Satuan | Sumber |
|---|---|---|
| Daya | kW (2 desimal) | `P_out = η·ρ·g·Q·H` |
| Energi | kWh (3 desimal) | `E = P_out × t` |
| RPM | rpm (bulat) | `n = n₀·√((Q·H)/(Q₀·H₀))` |
| Kondisi waduk | label: **Penuh / Normal / Rendah / Kritis** | diturunkan dari `H / H_maks` preset |

"Kondisi waduk" bukan hiasan: ia adalah label turunan dari muka air, dan muka air itulah yang
menentukan batas atas head. Ambang: Penuh ≥ 90%, Normal 50–89%, Rendah 25–49%, Kritis < 25%.

## 6. Panel Data & Analisis

Panel "Info" pada rancangan lama **diganti nama menjadi "Data & Analisis"** dan dipindah ke sini
seluruh isi grafiknya.

**a. Tabel data** (provisional; skema final mengikuti E-LKM yang masih menunggu acc — disimpan di
satu tempat pada konfigurasi agar mudah disamakan):

| No | Q (m³/s) | H (m) | t (s) | Daya (kW) | Energi (kWh) | RPM |
|---|---|---|---|---|---|---|

Preset tidak menjadi kolom karena tetap untuk satu aktivitas (ditampilkan sekali di atas tabel).
Kondisi waduk juga tidak menjadi kolom karena merupakan turunan dari H.

**b. Grafik sebar** dengan pemilih hubungan: **Debit–Daya, Head–Daya, Debit–Energi, Head–Energi**.
Titik bertambah setiap kali murid menekan **Catat Data**. Sebagai pembanding prediksi, ada garis
model tipis yang bisa dimatikan (default menyala).

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

| Preset | Tampilan | Q_maks | H_maks | Padanan |
|---|---|---|---|---|
| **Kemarau** | langit cerah terik, waduk surut, gelombang tenang | 0,20 m³/s | 12 m | musim kering |
| **Cerah** | langit biru berawan tipis, gelombang normal | 0,40 m³/s | 20 m | kondisi biasa |
| **Mendung** | langit kelabu, gelombang lebih besar | 0,50 m³/s | 22 m | menuju musim basah |
| **Hujan** | langit gelap, partikel hujan, gelombang paling besar | 0,60 m³/s | 25 m | musim basah |

Preset tidak boleh dikira kosmetik murni (di modul PLTA ia menentukan batas debit dan head, yang
langsung membatasi daya) dan tidak boleh dibiarkan bisa diganti di tengah percobaan (kalau bisa,
hubungan Debit–Daya yang ingin ditemukan murid justru terkontaminasi). Ini juga menyambung ke
Tabel 8 proposal: faktor "bergantung kondisi aliran dan ketinggian".

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

## 9. Kontrol

Di bawah visualisasi, berurutan:

| Tombol | Perilaku |
|---|---|
| **Start** | fase mulai 2 detik → timer berjalan, energi terakumulasi |
| **Pause** | timer dan akumulasi energi berhenti; animasi berhenti |

Di panel Data & Analisis (jauh dari area klik yang ramai, supaya tidak tertekan tanpa sengaja):

| Tombol | Perilaku |
|---|---|
| **Catat Data** | menyimpan satu baris dari kondisi saat ini |
| **Ulangi Percobaan** | timer dan energi ke nol, kondisi alat kembali awal, **tabel data tetap utuh** |
| **Hapus Semua Data** | mengosongkan tabel; meminta konfirmasi lebih dulu |

Pemisahan dua tombol reset ini disengaja: di kelas, hampir pasti ada kelompok yang menekan reset
setelah mencatat data. Kalau satu tombol menghapus tabel sekaligus, pekerjaan satu pertemuan bisa
hilang.

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
  aset/inti.js        model fisis, timer, pencatatan, grafik, kontrol
  aset/modul-plta.js  parameter, visualisasi, dan preset modul PLTA
  aset/konfigurasi.js konstanta, rentang, preset, skema kolom tabel
```

## 13. Yang masih menunggu

- **Skema kolom tabel** disamakan dengan tabel pengamatan E-LKM begitu LKM disetujui. Sementara
  dipakai tujuh kolom pada bagian 6a, disimpan di `konfigurasi.js`.
- **Nilai η** (kini 0,75) dan **putaran acuan** (kini 900 rpm) perlu dikonfirmasi ke pembimbing bila
  beliau ingin angka lain.
- Modul **PLTS** dan **PLTB** menyusul setelah modul PLTA disetujui.

## 14. Hasil verifikasi modul PLTA

Modul PLTA sudah berjalan dan diuji, bukan baru dirancang. Dua penguji dipakai, keduanya disimpan
di `_analysis/` supaya bisa dijalankan ulang kapan saja.

**Penguji model** (`_analysis/uji-model.js`) menjalankan `konfigurasi.js` dan `fisika.js` di dalam
konteks Node tanpa peramban: **26 lulus, 0 gagal**. Yang diperiksa antara lain kecocokan
`P = ηρgQH` dengan hitungan tangan, batas atas/bawah Q dan H, clamps preset, dan rumus energi.

**Penguji antarmuka** (`_analysis/uji-peramban.js`) mengendalikan halaman sungguhan lewat Chrome
DevTools Protocol: klik nyata, waktu nyata, bacaan DOM nyata, tangkapan layar nyata. Tiga percobaan
30 detik dijalankan berurutan (Mendung 0,50/22 · Hujan 0,60/25 · Hujan 0,35/25):

| Yang diuji | Hasil |
|---|---|
| Durasi nyata tiap percobaan | 32,05 · 32,04 · 32,14 detik — 2 detik pemulihan + 30 detik berjalan, galat < 0,5 % |
| Timer di layar saat berhenti | `00:30` untuk ketiga percobaan |
| Energi terhadap `E = P × t` | 0,674 · 0,920 · 0,536 kWh; hitungan tangan 0,6744 · 0,9197 · 0,5365 |
| Isi tabel | 3 baris, tujuh kolom, urutan sesuai E-LKM |
| Jejak RPM | 3 kurva, jumlah pada keterangan cocok dengan jumlah percobaan |
| Tabel pada layar 390 px | 342 px di dalam 342 px — tidak ada kolom terpotong, halaman tidak meluber |
| Galat halaman | tidak ada |

Tiga cacat ditemukan pengujian ini dan sudah diperbaiki:

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

Catatan penyimpangan dari rancangan awal, semuanya disengaja:

- **Satuan kW, bukan MW.** Catatan permintaan menyebut "Daya (MW)", tetapi PLTMH pada rentang
  Q 0,05–0,60 m³/s dan H 4–25 m menghasilkan 1,5–110 kW. Menulis MW akan menghasilkan angka
  0,0015–0,110 yang menyulitkan murid membaca grafik. Perlu dikonfirmasi ulang ke pengguna.
- **`P_air` tidak ditampilkan di antarmuka terbuka**, hanya di dalam panel Rumus yang tertutup.
  Ini keputusan Q8: murid mengukur `P_keluaran`, lalu membuka rumus saat menguji hipotesis.
- **Jejak RPM dibatasi 6 kurva** agar grafik tidak menjadi tidak terbaca setelah satu pertemuan.
- **Pita "pemulihan" 2 detik** digambar pada grafik RPM supaya jeda antara Mulai dan timer
  berjalan tidak tampak seperti kesalahan alat.
