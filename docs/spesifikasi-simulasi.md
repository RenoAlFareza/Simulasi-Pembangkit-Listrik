# Spesifikasi Simulasi Virtual — Modul PLTA

Status: **berlaku, rancangan 0.3.0**. Dokumen ini adalah kontrak pengerjaan sekaligus bahan
deskripsi media untuk keperluan validasi perangkat.

Kaitan: [CONTEXT.md](../CONTEXT.md) (glosarium istilah) ·
[spesifikasi-perbaikan-uiux.md](spesifikasi-perbaikan-uiux.md) (riwayat audit UI/UX rancangan lama) ·
[analisis-proposal](analisis-proposal-untuk-simulasi.md).

> **Perubahan besar.** Versi 0.2.x dispesifikasikan untuk satu alat ukur lengkap — preset cuaca,
> timer, energi kWh, tabel data, empat grafik sebar, tombol Catat Data, kapasitas turbin, limpasan.
> Versi **0.3.0** adalah redesign total (Ronde 5) yang menjadikan **LKPD praktikum sebagai kontrak
> tunggal**: yang diubah siswa hanya dua besaran, yang diamati hanya dua respon. Seluruh fitur yang
> tidak diminta LKPD dihapus, bukan disembunyikan. Riwayat lengkap ada di §13.

---

## 1. Ruang lingkup

Satu aplikasi web dengan **tiga modul** — PLTA, PLTS, PLTB — yang berbagi satu kerangka UI.
**PLTA dikerjakan lebih dulu** dan menjadi pola bagi dua modul berikutnya.

Dasar: proposal mengikat simulasi untuk ketiga sistem (P0049, P0105, P0657); memisahkan PLTA
menjadi aplikasi tersendiri berarti kerangka yang sama harus ditulis ulang dua kali.

Sasaran pemakaian: **telepon genggam lebih dulu**, lalu laptop. LKPD dibuka di perangkat lain
(mayoritas siswa memakai HP untuk membuka LiveWorksheets), sehingga simulasi harus muat dalam
satu-dua layar tanpa perlu menggulir untuk melihat gambar dan angka secara bersamaan.

## 2. Model fisis

Modul PLTA memodelkan **PLTMH mandiri** (bukan PLTA besar tersambung grid). Alasan: dengan
generator magnet permanen berbeban tetap, putaran turbin ikut berubah ketika debit atau head
berubah. Pada PLTA besar yang tersambung grid, putaran generator justru terkunci pada putaran
sinkron.

| Besaran | Rumus / nilai | Catatan |
|---|---|---|
| Massa jenis air | ρ = 1000 kg/m³ | tetap |
| Percepatan gravitasi | g = 9,81 m/s² | tetap |
| Efisiensi sistem | η = 0,75 | **satu titik beban acuan**, bukan efisiensi turbin; lihat catatan di bawah |
| Daya tersedia | `P_air = ρ·g·Q·H` | persamaan 2.14 proposal |
| Daya keluaran | `P_out = η·ρ·g·Q·H` | persamaan 2.15 proposal; inilah "Daya listrik" yang tampil |
| Daya keluaran (kW) | `P_kW = P_out / 1000` | satuan yang ditampilkan |
| Daya keluaran (MW) | `P_MW = P_kW / 1000` | **hasil hitung siswa**, ditampilkan kecil sebagai pembanding |
| Putaran turbin | `n = n₀·√((Q·H)/(Q₀·H₀))` | n₀ = 900 rpm pada Q₀ = 0,30 m³/s, H₀ = 15 m; **hanya untuk animasi, tidak dicetak** |
| Kecepatan aliran dalam pipa | `v = Q / A` | A = 0,28 m²; untuk kecepatan partikel gambar |
| Tingkat terang lampu | 4 tingkat dari `P_kW` | ambang 40 / 12 / 2 kW; lihat §5 |

**Kenapa η konstan.** η turbin nyata berupa kurva terhadap beban, jadi satu angka tetap hanya sah
di sekitar satu titik beban. Untuk percobaan yang diminta LKPD — dua variabel, tiga harga masing-
masing, rentang satu dekade — kurva efisiensi tidak menambah pemahaman apa pun tetapi menambah
tiga konstanta yang harus dijelaskan. Yang dipakai adalah **efisiensi sistem pada titik beban
acuan**, dan itu yang tertulis di panel Rumus apa adanya.

**Dasar rumus putaran.** Generator magnet permanen pada beban listrik tetap: tegangan sebanding
putaran (V ∝ n) dan daya listrik sebanding V², sehingga pada kesetimbangan `n ∝ √P`. Karena
`P ∝ Q·H`, maka `n ∝ √(Q·H)`. Putaran **naik** ketika debit atau head naik — perilaku yang
diinginkan untuk animasi, sekaligus sahih secara fisis untuk sistem mandiri.

### 2.1 Rentang nilai

| Variabel | Rentang | Catatan |
|---|---|---|
| Debit Q | 0,05 – 0,60 m³/s (langkah 0,01) | pengatur: slider |
| Ketinggian sumber air H | 4 – 25 m (langkah 0,5) | pengatur: slider |
| Daya keluaran P_out | 5,52 – 66,22 kW | tampil 2 desimal |
| Daya keluaran dalam MW | 0,0055 – 0,0662 MW | 4 desimal, di bawah angka kW |
| Tingkat terang | Mati / Redup / Sedang / Terang | 4 tingkat (§5) |
| Putaran n | 367 – 1.273 rpm | tidak ditampilkan; hanya menggerakkan roda |

## 3. LKPD sebagai kontrak

`worksheet_8555452.pdf` (5 halaman) mengikat apa yang harus ada di simulasi. Yang **diminta**:

| Bagian LKPD | Tuntutan | Padanan di simulasi |
|---|---|---|
| D. Variabel Percobaan | P1 manipulasi ketinggian (kontrol: debit), P2 manipulasi debit (kontrol: ketinggian) | dua tombol percobaan yang **mengunci** variabel kontrol |
| F. Langkah Kerja | "atur **TIGA** ketinggian sumber air sambil menjaga debit tetap" | slider H bebas 4–25 m saat P1, slider Q terkunci 0,30 m³/s |
| F. Langkah Kerja | "Amati daya dan nyala LED **setelah aliran stabil**" | indikator status "Aliran menyesuaikan…" → "Aliran stabil" |
| I. Hasil Pengamatan | kolom respon: **Daya Listrik** dan **Tingkat Terang Nyala LED** | dua kotak hasil, tepat dua |
| A. Tujuan | amati pengaruh manipulasi terhadap keluaran | angka berubah seketika saat pengatur digeser |
| B. Petunjuk | indikator respon: "Daya listrik dalam **(MW)**" | kW ditampilkan besar, MW kecil di bawahnya |

**Kontradiksi internal LKPD** yang harus diketahui: petunjuk B menyebut "gunakan DUA kondisi
variabel manipulasi", sedangkan langkah kerja F menyebut "TIGA", dan tabel hasil pengamatan
menyediakan tiga baris. Yang dipakai **tiga**, mengikuti langkah kerja dan tabelnya.

**Yang TIDAK disebut LKPD** dan karena itu dihapus dari antarmuka: energi (kWh), putaran turbin
sebagai angka, timer/durasi, preset cuaca, grafik dan tabel data, tombol "Catat Data", kapasitas
turbin, limpasan, kartu data, unduh CSV. Daftar beserta alasan per butir ada di §14.

## 4. Dua percobaan dan penguncian variabel

Satu percobaan = satu variabel manipulasi + satu variabel kontrol yang dikunci.

| Percobaan | Variabel diubah | Variabel dikunci | Catatan di layar |
|---|---|---|---|
| **1 · Ubah ketinggian** | H, 4–25 m | Q = 0,30 m³/s | "Debit air dijaga tetap 0,30 m³/s." |
| **2 · Ubah debit air** | Q, 0,05–0,60 m³/s | H = 15,0 m | "Ketinggian sumber air dijaga tetap 15,0 m." |

Penguncian dilakukan dengan `disabled` pada slider variabel kontrol, **dan dinyatakan tertulis**
di bawah pengatur yang terkunci — bukan dikunci diam-diam:

> *"Dikunci — debit air adalah variabel kontrol pada percobaan ini."*

Alasan memilih tombol mode, bukan sekadar membiarkan siswa menggeser keduanya: LKPD menuntut
"ubah hanya variabel tersebut dan jaga variabel kontrol tetap sama". Kalau penguncian diserahkan
pada disiplin siswa, setiap grafik yang mereka gambar berisiko bercampur dua variabel, dan
kesimpulan yang mereka tarik menjadi tidak sah — bukan karena fisika salah, tetapi karena
prosedurnya tidak terjaga. Penguncian oleh alat membuat syarat itu **tidak mungkin dilanggar**,
sekaligus menjadi pengingat visual tentang apa itu variabel kontrol.

Saat mode diganti, nilai variabel kontrol dikembalikan ke harga acuannya, dan nilai variabel
manipulasi dibiarkan apa adanya supaya siswa dapat melanjutkan dari posisi terakhirnya.

## 5. Keluaran pengamatan (dua respon)

| Kotak | Isi | Format |
|---|---|---|
| **Daya listrik** | `P_out` | `66,22 kW` (2 desimal, koma) + `= 0,0662 MW` di bawahnya |
| **Tingkat terang lampu** | label 4 tingkat + tiga titik penanda | `Terang` + 3/2/1/0 titik menyala |

**Tingkat terang didefinisikan dari daya, bukan dari putaran atau debit.** Lampu adalah beban
listrik: yang menentukan nyala terangnya adalah daya yang sampai ke sana. Empat tingkat dengan
ambang daya absolut:

| Daya listrik | Level | Label | Tanda |
|---|---|---|---|
| ≥ 40 kW | 3 | Terang | 3 titik |
| 12 – 40 kW | 2 | Sedang | 2 titik |
| 2 – 12 kW | 1 | Redup | 1 titik |
| < 2 kW | 0 | Mati | 0 titik |

Ambang absolut dipilih, bukan persentase terhadap daya maksimum, karena lampu di lab nyata juga
mempunyai daya nominal tetap: ia tidak "tahu" berapa daya maksimum alat yang memberiinya. Dengan
ambang absolut, dua kondisi berbeda yang menghasilkan daya sama selalu menampilkan terang yang
sama — alat ukur tidak boleh berubah bacaannya karena hal yang tidak diukur.

Selain tingkat diskret, animasi cahaya memakai **fraksi kontinu** `(P − 1,5)/(45 − 1,5)` yang
dijepit 0–1, sehingga rumah makin terang secara halus di antara ambang. Fraksi hanya untuk
kehalusan gambar; angka yang dibaca siswa tetap tingkat diskret.

**Konversi kW → MW adalah pekerjaan siswa.** LKPD meminta satuan MW, simulasi menampilkan kW.
Ini disengaja: konversi satuan adalah bagian dari kompetensi, dan menampilkan MW langsung akan
menghilangkan latihan itu. Angka MW kecil di bawah daya berfungsi sebagai **pembanding** supaya
siswa dapat memeriksa hasil hitungnya sendiri, disertai catatan:

> *"LKPD meminta daya dalam **MW**. Simulasi menampilkan **kW** — bagilah dengan 1000 untuk
> mengisi kolom MW."*

## 6. Visualisasi

Dasar gambar: **potongan melintang PLTA** (acuan gambar 1 dari penulis) yang diperkaya sisi
keluarnya (acuan gambar 2). Urutan aliran dan aliran listrik:

```
Waduk → Bendungan → Intake → Pipa pesat → Turbin → Generator → Transformator
  → Jalur transmisi → Rumah        (listrik)
Turbin → Pipa hisap → Sungai bawah tanah   (air)
```

Unsur yang harus ada, semuanya berlabel: **Waduk, Bendungan, Pipa pesat, Turbin, Rumah
pembangkit, Generator, Transformator, Jalur transmisi, Rumah, Jalur keluar, Sungai bawah tanah.**

**Turbin reaksi, bukan crossflow/Pelton.** Siluetnya **kasing tertutup berbentuk rumah keong**
dengan air masuk dari pipa pesat dan keluar lewat pipa hisap ke sungai — tanpa nosel, tanpa jet
bebas. Ini mengikuti gambar acuan penulis dan sesuai rentang head 4–25 m. Label cukup **"Turbin"**,
tanpa nama jenis, persis seperti pada gambar acuan.

**Air keluar ke sungai bawah tanah, listrik ke rumah di atasnya.** Permintaan penulis: jalur keluar
jangan langsung menjadi sungai di permukaan. Karena itu air turbin turun lewat pipa hisap ke
**rongga sungai di bawah tanah**, dan di atas rongga itu berdiri **rumah** yang disuplai listrik
lewat **jalur transmisi** — sehingga urutannya benar: transformator → kabel → tiang → atap rumah.
Rumah inilah yang menjadi respon visual "tingkat terang nyala LED".

**Proporsi yang dijaga.** Gambar tidak berskala, tetapi konsistensi berikut wajib:

- **Diameter pipa pesat tetap.** Pada pipa berpenampang tetap, debit yang naik berarti kecepatan
  aliran naik, bukan diameter bertambah. Menampilkan pipa yang membesar ketika debit naik adalah
  kesalahan fisika yang akan terlihat oleh validator.
- **Panjang garis ukur head sebanding dengan H.** `mukaAir(h) = 300 − h·7,6` (unit SVG), jadi
  H = 25 m benar-benar lima kali lebih panjang dari H = 5 m pada gambar.
- Ukuran rumah, bendungan, dan turbin tidak berubah terhadap Q atau H.

Yang **bergerak mengikuti besaran**:

| Elemen | Digerakkan oleh |
|---|---|
| Kecepatan partikel air di dalam pipa pesat | `v = Q/A` |
| Kecepatan putar roda turbin | putaran `n ∝ √(Q·H)` |
| Kecepatan partikel air di sungai bawah tanah | debit `Q` |
| Jumlah jendela rumah yang menyala + kehalusan cahaya | daya listrik `P_out` |
| Panjang garis ukur head dan teks `H = … m` | ketinggian `H` |

## 7. Kontrol antarmuka

| Kontrol | Perilaku |
|---|---|
| **Dua tombol percobaan** (P1 / P2) | memilih variabel manipulasi; mengunci slider variabel kontrol |
| **Slider debit Q** | menggeser debit; dinonaktifkan pada P1 |
| **Slider ketinggian H** | menggeser head; dinonaktifkan pada P2 |
| **Tombol "Lihat rumus"** | membuka/menutup panel rumus; bawaan **tertutup** |

Tidak ada tombol **Mulai**, **Jeda**, **Reset**, atau **Catat Data**. Simulasi selalu hidup:
begitu pengatur digeser, air mengalir dan angka berubah dalam waktu kurang dari satu detik.

**Kenapa "setelah aliran stabil" tetap ada padahal tidak ada tombol Mulai.** LKPD meminta
pengamatan dilakukan setelah aliran stabil, dan itu tetap bermakna: ketika siswa menggeser slider,
nilai yang ditampilkan diredam menuju nilai baru selama ±0,35 detik, sehingga tidak ada angka
yang melompat. Selama masa itu status berbunyi **"Aliran menyesuaikan…"** dan angka respon
ditampilkan **"—"**; setelah redaman selesai status berubah menjadi **"Aliran stabil — catat daya
dan tingkat terangnya di LKPD."** dan angka yang tampil adalah **nilai model yang eksak**, bukan
sisa redaman. Jadi "stabil" di sini bermakna *nilai sudah mencapai keadaan mantapnya*, bukan
*alat sedang dihidupkan*.

## 8. Panel rumus

Tertutup secara bawaan, dibuka lewat tombol "Lihat rumus". Isinya:

```
P_air      = ρ · g · Q · H
P_listrik  = η · ρ · g · Q · H
n          = n₀ · √( (Q · H) / (Q₀ · H₀) )
P_MW       = P_kW ÷ 1000

ρ = 1000 kg/m³ · g = 9,81 m/s²
η = 0,75 — efisiensi sistem pada titik beban acuan
n₀ = 900 rpm pada Q₀ = 0,30 m³/s dan H₀ = 15 m

Daya listrik berbanding lurus dengan Q dan H — dua besaran yang kamu ubah.
```

**Kenapa rumus tetap ada meskipun tidak diminta LKPD.** Penulis memutuskan rumus dipertahankan
(m02029 butir 3). Alasannya masuk akal: rumus adalah jembatan antara "saya melihat angkanya naik"
dan "saya tahu mengapa naik", dan itu tepat pada tahap *menguji hipotesis* serta *merumuskan
kesimpulan*. Rumus **tidak** ditempel terbuka di depan supaya tahap merumuskan hipotesis tidak
kehilangan makna — siswa menebak dulu, baru membuka rumus untuk memeriksa.

## 9. Peta ke tahapan pembelajaran

| Tahapan Inquiry Terbimbing | Bagian simulasi yang melayaninya | Indikator Facione |
|---|---|---|
| Orientasi | gambar potongan melintang + tombol percobaan | interpretation |
| Merumuskan masalah | pertanyaan di LKPD; simulasi sebagai konteks | interpretation, analysis |
| Merumuskan hipotesis | simulasi **belum** dipakai; rumus masih tertutup | inference |
| Mengumpulkan data | dua slider + kunci variabel kontrol + status stabil | analysis |
| Menguji hipotesis | angka respon vs rumus yang dibuka | evaluation |
| Merumuskan kesimpulan | tiga harga variabel per percobaan sebagai bukti | inference, explanation |
| Pemeriksaan ulang | mengganti mode percobaan, mengulang pengamatan | self-regulation |

Setiap fitur di antarmuka dapat dilacak ke salah satu dari tiga hal: (a) tahapan inquiry yang
dilayani, (b) indikator Facione yang dilatih, atau (c) aspek yang dinilai pada instrumen validasi.
Fitur yang tidak dapat dilacak ke ketiganya tidak dipasang.

## 10. Batasan teknis

- **Satu berkas statis** tanpa build tool, tanpa server, tanpa CDN. Jalan dari **GitHub Pages**
  maupun langsung dari berkas lokal saat internet sekolah mati.
- **Skrip klasik, bukan ES module**, dan **tanpa `fetch`** — keduanya gagal saat dibuka dengan
  `file://` karena origin-nya `null`. Konfigurasi ditaruh sebagai objek di dalam berkas `.js`.
- **Tanpa perutean halaman.** Seluruh keadaan aplikasi disimpan di satu halaman.
- **Responsif**, dari HP 360 px sampai laptop 1366×768 dan proyektor.
- **Tanpa akun, tanpa jaringan saat dipakai, tanpa `localStorage`** — tidak ada keadaan yang perlu
  diingat antar-kunjungan, karena tidak ada data yang dikumpulkan di sisi alat.

Struktur berkas:

```
simulasi/
  index.html          kerangka: kepala, pemilih percobaan, gambar, hasil, pengatur, rumus
  aset/gaya.css       mobile-first; sasaran sentuh >= 44 px
  aset/konfigurasi.js konstanta fisika, rentang slider, dua percobaan, ambang terang
  aset/fisika.js      model fisis murni: daya, putaran, kecepatan pipa, tingkat terang
  aset/modul-plta.js  gambar SVG potongan melintang + animasinya
  aset/inti.js        perekat: pemilih percobaan, penguncian, redaman, panel rumus
```

## 11. Yang masih menunggu

- **Nilai η (0,75)** dan **putaran acuan (900 rpm)** perlu dikonfirmasi ke pembimbing bila beliau
  ingin angka lain. Nilai η memengaruhi angka daya yang ditulis siswa di LKPD.
- **Ambang tingkat terang (40 / 12 / 2 kW)** adalah pilihan desain, bukan angka baku. Bila
  pembimbing menginginkan pembagian yang lain, cukup ubah `KONFIG.terang`.
- **Modul PLTS dan PLTB** menyusul setelah modul PLTA disetujui.
- **Penyebutan "kincir" di LKPD.** LKPD (warisan eksperimen kincir air) memakai kata "kincir" dan
  "posisi jatuh air pada kincir", sedangkan simulasi memakai turbin reaksi tertutup yang tidak
  punya posisi jatuh air. Perlu keputusan pembimbing apakah LKPD yang disesuaikan atau simulasi
  yang menambahkan padanan.
- **Dua vs tiga kondisi** di LKPD (§3) — sudah diputuskan memakai tiga, tetapi redaksi LKPD
  sebaiknya diperbaiki agar tidak membingungkan guru lain.

## 12. Hasil verifikasi modul PLTA

Dua penguji dipakai, keduanya disimpan di `_analysis/` supaya bisa dijalankan ulang kapan saja.
Penguji rancangan lama diarsipkan di `_analysis/usang/` beserta alasannya.

**Penguji model** (`_analysis/uji-model.js`) menjalankan `konfigurasi.js` dan `fisika.js` di dalam
konteks Node tanpa peramban: **43 lulus, 0 gagal**. Yang diperiksa:

- kecocokan `P_air = ρgQH` dan `P_out = ηρgQH` dengan hitungan tangan, serta `P_out = η·P_air`
- putaran tepat 900 rpm pada kondisi acuan dan sebanding `√(Q·H)`
- enam uji arah: putaran/daya naik terhadap Q dan H, kecepatan pipa naik terhadap Q, kecepatan pipa
  **tidak** bergantung H
- linieritas `P/Q` pada H tetap dan `P/H` pada Q tetap untuk seluruh jangkauan
- tingkat terang: monoton, 4 tingkat, ambang tepat, `fraksi` selalu 0–1, setiap level berlabel
- konversi kW→MW dan format koma desimal
- definisi percobaan: tepat satu variabel diubah, satu dikunci, nilai kunci di dalam rentang
- jangkauan menyeluruh kedua percobaan: tidak ada `NaN`, daya & putaran positif, keduanya bisa
  mencapai lampu "Terang"

| Percobaan | Variabel diubah | Variabel dikunci | Daya | Terang tertinggi |
|---|---|---|---|---|
| P1 Ubah ketinggian | Q = 0,30 m³/s | H 4–25 m | 8,83 – 55,18 kW | level 3 |
| P2 Ubah debit air | Q 0,05–0,60 m³/s | H = 15,0 m | 5,52 – 66,22 kW | level 3 |

Daya keluaran 5,52–66,22 kW (0,0055–0,0662 MW) · putaran 367–1.273 rpm (hanya animasi) · kecepatan
pipa 0,18–2,14 m/s.

**Penguji peramban** (`_analysis/uji-redesign.js`) mengendalikan halaman sungguhan lewat Chrome
DevTools Protocol: klik nyata, bacaan DOM nyata, tangkapan layar nyata. **42 lulus, 0 gagal.**

| Kelompok pemeriksaan | Hasil |
|---|---|
| Tepat dua respon, dan hanya yang diminta LKPD | `["Daya listrik", "Tingkat terang lampu"]` |
| Tidak ada elemen/teks terlarang (timer, kWh, preset, Catat Data, grafik, RPM) | kosong |
| P1 aktif saat halaman dibuka; Q terkunci, H terbuka | ya, `sliderQ` disabled |
| P2 mengunci H dan membuka Q | ya |
| Alasan penguncian tertulis di layar | "Debit air dijaga tetap 0,30 m³/s." |
| Daya naik monoton terhadap H (Q tetap 0,30) | 8,83 → 22,07 → 33,11 → 44,15 → 55,18 kW |
| Daya naik monoton terhadap Q (H tetap 15) | 5,52 → 16,55 → 33,11 → 49,66 → 66,22 kW |
| Tingkat terang naik level seiring daya | Redup → Terang |
| Konversi kW→MW benar di semua titik | 5,52 kW = 0,0055 MW … 66,22 kW = 0,0662 MW |
| Gambar memuat rumah, 3 jendela, transformator, transmisi, sungai bawah tanah | ya |
| Turbin reaksi (tanpa nosel/jet), roda bersudu | 12 sudu |
| Partikel air di pipa dan di sungai | 16 pipa, 9 sungai |
| Garis ukur H terisi nilai | "H = 15,0 m" |
| Layar HP 375 px tidak meluber; tinggi halaman ≤ 2 layar | 375 vs 375 px; 1044 px |
| Panel rumus memuat `P_air`, `P_listrik`, konversi MW, ρ/g/η/n₀ | ya |
| Galat JavaScript | tidak ada |

Perintah menjalankan ulang (dari akar repo, server statis di port 8791):

```
node _analysis/uji-model.js
node _analysis/uji-redesign.js http://127.0.0.1:8791/simulasi/index.html _analysis/uiux/uji-jalan
```

## 13. Riwayat keputusan (Ronde 1–5)

Lima ronde wawancara dengan penulis dipakai untuk memutuskan desain. Tabel ini mencatat
keputusan yang **masih berlaku**; yang sudah dibatalkan ditandai.

| Ronde | Keputusan | Status di 0.3.0 |
|---|---|---|
| R1 Q1 | Realisme diukur pada **mekanisme dan visual**, bukan sekadar angka | **berlaku** — dasar semua keputusan |
| R1 Q2 | Cuaca hanya mengubah debit; head 4–25 m bebas | dibatalkan oleh R5 (cuaca dihapus) |
| R1 Q3 | Energi sah dibandingkan hanya bila durasi sama | dibatalkan (energi dihapus) |
| R1 Q4 | Label turbin → crossflow | **dibatalkan R5 Q2** → turbin reaksi, label "Turbin" |
| R1 Q5 | Daya/energi "—" selama pemulihan | **berlaku, digeneralisasi** — "—" selama redaman |
| R2 Q1 | Kapasitas turbin 0,40 m³/s, air di atasnya melimpas | dibatalkan (kapasitas dihapus) |
| R2 Q2 | Kosakata waduk dihapus; keluaran keempat jadi "Tinggi jatuh air" | dibatalkan (panel hasil jadi dua respon) |
| R2 Q3 | Siluet turbin digambar ulang (drum + guide vane) | dibatalkan R5 Q2 (reaksi) |
| R2 Q4 | Empat grafik dipertahankan + keterangan bentuk kurva | dibatalkan (grafik dihapus) |
| R2 Q5 | Durasi terkunci setelah baris pertama | dibatalkan (durasi dihapus) |
| R2 Q6 | Satuan **kW** dikonfirmasi | **berlaku**, ditambah konversi MW untuk siswa (R5 Q1) |
| R3 Q1 | Limpasan harus tergambar | dibatalkan (kapasitas/limpasan dihapus) |
| R3 Q2 | Penanda kapasitas pada slider | dibatalkan |
| R3 Q3 | Panel hasil hanya berisi hasil ukur | **berlaku** — prinsipnya dipakai lagi di R5: panel jadi dua respon |
| R3 Q4 | Dua tombol reset dipertahankan | dibatalkan (tombol reset dihapus) |
| R4 Q1 | Acuan lampu tetap, bukan per preset | **berlaku, diperkuat** — ambang daya absolut, bukan persentase |
| R4 Q2 | Jet sebagai pita lebar + guide vane dinamis | dibatalkan (jet dihapus, turbin reaksi) |
| R5 Q1 | Tampilkan kW, siswa mengonversi sendiri ke MW | **berlaku** |
| R5 Q2 | Visual turbin reaksi ala gambar 1; sisi kanan ala gambar 2: air ke sungai bawah tanah, rumah di atasnya via powerline | **berlaku** |
| R5 Q3 | Hapus semua yang tidak ada di LKPD; **rumus dipertahankan** | **berlaku** |
| R5 Q4 | Tingkat terang divisualkan sebagai rumah dengan jendela menyala | **berlaku** |
| R5 Q5 | Tombol mode Percobaan 1/2 mengunci variabel kontrol; teks seminimal mungkin | **berlaku** |
| R5 Q6 | Label cukup "Turbin", tanpa nama jenis | **berlaku** |

## 14. Yang sengaja dihapus, dan alasannya

Semua butir di bawah pernah ada di 0.2.x dan dihapus pada 0.3.0.

| Fitur lama | Alasan dihapus |
|---|---|
| **Preset cuaca** (Kemarau/Cerah/Mendung/Hujan) | Tidak disebut LKPD. Cuaca hanya mengubah batas debit, sehingga menambah satu variabel yang harus dijelaskan tanpa melayani satu pun butir LKPD. |
| **Timer + durasi 30/60/90/120 s** | Tidak disebut LKPD. Timer masuk akal hanya bila ada energi yang diakumulasi. |
| **Energi (kWh)** | Tidak disebut LKPD; respon yang diminta hanya daya dan terang. Energi juga menuntut durasi, yang menuntut timer. |
| **Putaran turbin sebagai angka** | Tidak disebut LKPD. Putaran tetap dipakai untuk menggerakkan roda pada gambar — di sana ia berguna sebagai isyarat visual, bukan sebagai angka yang harus dicatat. |
| **Tabel data + "Catat Data" + CSV + Kartu Data** | Tidak disebut LKPD, dan pada layar HP panelnya mendorong gambar keluar dari layar (keluhan penulis). Data siswa tinggal di LKPD, bukan di alat. |
| **Empat grafik sebar + strip-chart RPM** | Sama seperti di atas. Grafik yang diminta LKPD adalah grafik buatan siswa sendiri di lembar kerja. |
| **Kapasitas turbin 0,40 m³/s + limpasan** | Batas ini adalah komponen model yang dipilih pada R2 untuk menahan daya agar tetap di wilayah PLTMH. Dengan LKPD sebagai kontrak, `P = ηρgQH` pada rentang slider yang ada sudah memberi 5,5–66 kW — wilayah PLTMH, tanpa perlu komponen tambahan yang tidak diajarkan. |
| **Penanda kapasitas pada slider** | Ikut hilang bersama kapasitas. |
| **Baris "tinggi jatuh relatif"** | Head adalah besaran yang **diatur**, bukan diukur; ia sudah terbaca di slider dan di garis ukur pada gambar. |
| **Tombol Mulai / Jeda / Lanjut / Ulangi / Hapus** | Tidak ada lagi percobaan bertimer. Simulasi selalu hidup. |
| **`localStorage`** | Tidak ada lagi keadaan yang perlu diingat antar-kunjungan. |
| **Panel Rumus tertutup bawaan** | **Tidak dihapus** — ini satu-satunya yang dipertahankan meski tidak ada di LKPD (R5 Q3). |

**Satu hal yang tidak dihapus tetapi juga tidak ada di LKPD:** panel rumus. Penulis memutuskan
rumus dipertahankan. Pembenarannya ada di §8.

## 15. Cacat yang ditemukan pengujian dan diperbaiki

Dipertahankan sebagai catatan metode: seluruh cacat di bawah ditemukan oleh **penguji otomatis**,
bukan oleh pemeriksaan mata. Beberapa di antaranya lolos dari tiga ronde pemeriksaan visual.

| No | Cacat | Bagaimana ketahuan | Perbaikan |
|---|---|---|---|
| 1 | Blok animasi jet tertulis dua kali, versi lama menimpa versi baru sehingga limpasan tidak pernah terlihat | Penguji limpasan menghitung partikel beropacity | blok duplikat dihapus |
| 2 | Partikel dalam drum menumpang di grup partikel jet; "berapa butir terlihat" jadi ambigu | penguji menghitung 16 butir untuk 9 jet | grup SVG `#plta-partikel-dalam` dipisah |
| 3 | Lampu indikator bergantung preset, bukan daya: 36,79 kW menyala 3 lampu di Kemarau dan 2 di preset lain | penguji lampu membandingkan empat preset | acuan dijadikan tetap |
| 4 | Ketebalan jet tidak mengikuti debit: Q 0,05 dan 0,40 tampak sama | penguji jet mengukur lebar pita | jet jadi pita yang lebarnya mengikuti bukaan nosel |
| 5 | Angka daya sempat tidak persis model (8,89 vs 8,83 kW) karena redaman belum selesai saat dinyatakan stabil | penguji redesign membandingkan dengan rumus | `tandaiStabil()` memaku nilai tampil pada nilai pengatur |
| 6 | Favicon hilang → 404 muncul sebagai galat konsol | penguji redesign memeriksa galat halaman | favicon data-URI ditanam di `index.html` |
| 7 | Label "Rumah pembangkit" menabrak atap, "Sungai bawah tanah" tertimpa air, "Jalur keluar" terpotong tepi bawah | pemeriksaan tangkapan layar 750 px | posisi label, geometri, dan jendela teks disusun ulang |
| 8 | Sungai bawah tanah digambar sebagai tambalan menempel di garis tanah sehingga rumah di atasnya tidak terbaca "berdiri di atas sungai" | pemeriksaan tangkapan layar | digambar sebagai **rongga** dengan sudut membulat |

Cacat no. 1–4 berasal dari rancangan lama dan **tidak lagi berlaku** (komponennya sudah dihapus),
tetapi dicatat karena dua di antaranya menemukan pola yang sama berulang: *gambar menyangkal
angka*. Pola itu yang sekarang dijaga oleh penguji redesign (mis. daya naik monoton, terang ikut
naik) dan oleh §6.
