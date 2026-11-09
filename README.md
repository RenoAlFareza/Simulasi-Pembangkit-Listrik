# Laboratorium Virtual Energi Terbarukan

Tiga simulasi pembangkit listrik interaktif untuk pembelajaran fisika energi:
**PLTA** (tenaga air), **PLTB** (tenaga bayu/angin), dan **PLTS** (tenaga surya).

## Cara menjalankan

Buka **`index.html`** dengan klik dua kali. Tidak perlu server, tidak perlu
instalasi apa pun — semua skrip dimuat sebagai skrip klasik dan seluruh
perhitungan berjalan di browser.

Situs ini juga siap dipasang di Vercel tanpa konfigurasi: repositori hanya
berisi berkas statis di akar, sehingga cukup impor repository lalu tekan
Deploy. Tidak ada build step, framework preset boleh dibiarkan *Other*.

> Bila browser memblokir sesuatu, jalankan server statis sederhana dari folder
> ini lalu buka `http://localhost:8000`. Contoh: `python -m http.server 8000`.

## Struktur berkas

```
index.html            Halaman utama: pilih salah satu dari tiga simulasi
app.js                Dialog panduan halaman utama
styles.css            Gaya halaman utama

pltb/                 Pembangkit Listrik Tenaga Bayu
  index.html          Halaman simulasi + LKPD digital
  style.css
  model.js            Fisika turbin angin (Cp, TSR, cut-in/cut-out)
  process.js          Sembilan tahap aliran energi
  app.js              Animasi, kontrol, grafik, perekaman LKPD

plts/                 Pembangkit Listrik Tenaga Surya
  index.html
  style.css
  model.js            Fisika panel surya (POA, suhu sel, inverter)
  process.js
  worksheet-content.js  Catatan model untuk dialog rumus
  app.js

plta/                 Pembangkit Listrik Tenaga Air
  index.html
  styles.css
  physics.js          Fisika turbin air
  process.js          Tujuh tahap aliran energi (label pada gambar)
  app.js              Animasi dan simulasi
  collection.js       Validasi & pengiriman LKPD
  pdf-export.js       Pembuat PDF LKPD
  pdf-assets.js       Font tertanam untuk PDF
  vendor/             pdf-lib & fontkit

assets/               Berkas bersama PLTB & PLTS
  lkpd-worksheet.js   Tabel pengamatan, penyimpanan, ekspor .txt
  lkpd-pdf.js         Pembuat PDF LKPD
  lkpd-collection.js  Validasi & pengumpulan
  pdf-lib.min.js
  fontkit.umd.min.js
  pdf-font.js         Font tertanam
  energy-landscape.webp
```

Berkas mentah sebelum rekonstruksi (HTML asli hasil simpan halaman, PLTA versi
sebelumnya, dokumen perencanaan, dan gambar kerja) tidak disertakan di
repositori. Semuanya disimpan lokal di folder `_arsip/` yang diabaikan git.

## Perhitungan fisika

### PLTB — Tenaga Bayu

```
P angin     = ½ × ρ × A × v³
P generator = P angin × Cp × η
P beban     = P generator × η penyaluran
```

| Besaran | Nilai |
|---|---|
| Massa jenis udara ρ | 1,225 kg/m³ |
| Jari-jari rotor r | 20 m → A = πr² ≈ 1.256,6 m² |
| Cp puncak (2 / 3 / 4 bilah) | 0,45 / 0,46 / 0,44 |
| TSR optimal (2 / 3 / 4 bilah) | 8,5 / 7 / 5 |
| Efisiensi generator η | 90 % |
| Kapasitas | 500 kW |
| Cut-in / cut-out | 3 m/s / 25 m/s |
| Efisiensi penyaluran | 97 % × 98 % × 98 % ≈ 93,2 % |

Jumlah bilah **tidak** mengubah luas sapuan rotor — inilah inti Percobaan 2.
Karena itu daya pada 6 m/s hanya bergerak antara 0,066–0,069 MW meski jumlah
bilah berbeda.

### PLTS — Tenaga Surya

```
P DC   = G panel × A × η panel
P AC   = min(kapasitas inverter, P DC × η kabel × η inverter)
P beban = P AC × η penyaluran
```

| Besaran | Nilai |
|---|---|
| Luas aktif panel | 5.000 m² |
| Efisiensi panel acuan | 20 % pada 25 °C |
| Koefisien suhu | −0,4 %/°C |
| Kapasitas inverter | 1 MW AC |
| Radiasi langsung/baur/pantulan | model POA tiga komponen (albedo 0,20) |
| Elevasi matahari | mengikuti jam: 0° saat 06.00/18.00, puncak 60° saat 12.00 |
| Efisiensi penyaluran | 98 % × 98 % = 96,04 % |

Cahaya langsung tegak lurus panel saat sudut panel 30° (karena 90° − 60° = 30°).
Sudut 0° dan 75° memberi POA lebih rendah — inilah inti Percobaan 2.

**Waktu berjalan selama percobaan.** Satu percobaan bukan cuplikan diam:
matahari menyusuri busurnya, sehingga daya ikut naik atau turun.

- `model.js` punya `elevationAt(jam)` = `60° × sin(π × (jam − 6) / 12)` dan
  `daylightFactor(elevasi)` = `sin(elevasi) / sin(60°)`. Faktor ini **tepat 1**
  pada elevasi 60°, sehingga angka acuan LKPD tidak berubah.
- Panel **Jam mulai percobaan** (06.00–15.00) dan **Lama hari** (3, 6, 12, atau
  15 jam) ada di bagian *Eksplorasi waktu, cuaca & suhu*. Batas akhir busur
  adalah 21.00, jadi dengan lama hari 15 jam percobaan menempuh satu hari penuh.
- Mode **LKPD mengunci jam dan lama hari** pada busur baku **06.00 → 12.00**
  (720×). Matahari tetap terbit lalu naik selama percobaan sehingga animasinya
  hidup, tetapi percobaan selalu berakhir tepat di tengah hari. Karena itu
  angka yang dicatat selalu diambil pada elevasi 60°, dan angka acuan LKPD
  (0,425 MW pada 400 W/m²) tetap berlaku. Mengunci jam juga mencegah satu baris
  tercatat pada 0 MW hanya karena percobaan kebetulan berakhir setelah terbenam.
- **Skala waktu ditampilkan di kotak timer**, tepat di bawah angka hitung
  mundur: *"30 detik = 6 jam nyata · 06:00 → 12:00"* (elemen `#timer-scale`).
  Nilainya ikut berubah saat lama hari atau jam mulai diganti, mis.
  *"30 detik = 15 jam nyata · 06:00 → 21:00"* setelah menekan tombol satu hari
  penuh.
- Tombol **↻ Putar satu hari penuh: 06.00 → 21.00** memindahkan percobaan ke
  mode Cerah dengan lama hari 15 jam, supaya fase sore dan malam mudah dilihat
  tanpa mengubah angka LKPD.
- Daya awal sudah ditampilkan sebelum tombol Mulai ditekan, supaya memilih jam
  langsung terlihat efeknya. Energi tetap dijumlahkan tiap langkah waktu, jadi
  percobaan yang mulai pagi mengumpulkan lebih banyak kWh daripada yang mulai sore.
- Baris **Terendah: X MW · Y W/m²** di bawah angka daya mencatat nilai terendah
  selama percobaan. Nilai ini hanya dihitung setelah panel menerima cahaya
  minimal **300 W/m²**, supaya beberapa detik pertama saat matahari masih rendah
  tidak membuat barisnya selalu terbaca 0 MW. Baris ini ada untuk menunjukkan
  bahwa awan yang lewat sempat menurunkan daya, bukan hanya nilai akhirnya.

**Langit ikut berubah.** Panggung PLTS tidak lagi hanya memudarkan matahari:
gradien langit, cahaya kaki langit, awan, warna matahari, bintang, dan bulan
semuanya dianimasikan.

- **Fase hari berjalan** selama percobaan — fajar → pagi → siang → sore →
  senja → malam — dengan matahari menyusuri busur lebar dari kiri bawah,
  memuncak di tengah, lalu turun ke kanan.
- **Nama fase diturunkan dari intensitas sumber**, bukan dari jam dinding.
  Intensitas adalah variabel kontrol LKPD: menaikkan slider ke 1.000 W/m²
  langsung memberi label **"Siang terik"**, sedangkan 200 W/m² memberi
  **"Fajar"**. Jam hanya menentukan arah — pagi sebelum tengah hari, sore
  sesudahnya — dan elevasi ≥ 50° selalu terbaca "Siang" agar pukul 12.00 tidak
  salah menjadi "Sore". Warna langit memakai `hueProgress` yang ditarik ke
  tengah hari saat cahaya kuat, jadi 1.000 W/m² tetap biru cerah kapan pun jam
  mulainya.
- **Jendela fajar & senja** selebar ±0,9 jam di sekitar pukul 06.00 dan 18.00
  (lihat TWILIGHT di plts/app.js). Tanpa jendela ini, detik sesudah 18.00
  langsung menjadi malam berbintang sehingga fase senja tidak pernah terlihat.
- **Kecerahan mengikuti intensitas** yang dipilih: 200 W/m² memberi langit
  pagi yang hangat dan matahari rendah; 1200 W/m² memberi siang terang penuh.
  Posisi matahari tetap mengikuti jam, kecerahan mengikuti slider — dua hal
  yang sengaja dipisahkan supaya intensitas bisa diuji sebagai variabel.
- **Malam muncul sendiri dari jam**, bukan dari pilihan cuaca. Setelah pukul
  18.00 langit menjadi gelap, 46 bintang dan bulan tampil, dan daratan serta
  peralatan diredupkan lewat lapisan `#skyNightGround` (label tahap tetap
  terbaca di atasnya). Tidak ada pembangkitan saat malam.

**Cuaca: cerah, mendung, hujan.** Pilihan cuaca ada di *Eksplorasi waktu, cuaca
& suhu* dan hanya berlaku di luar LKPD (LKPD selalu cerah agar antarbaris bisa
dibandingkan).

| Cuaca | Faktor POA | Suhu sel | Tampilan |
|---|---|---|---|
| Cerah | 1,00 | dihitung dari POA | langit biru, awan lewat sesekali |
| Mendung | 0,45 | lebih dingin karena cahaya berkurang | langit kelabu, awan pekat |
| Hujan | 0,25 | ambient 20 °C, sel lebih dingin lagi | langit gelap, garis hujan tipis |

- **Cuaca mengalikan cahaya yang sampai ke panel (POA), bukan intensitas
  sumbernya.** Matahari di gambar tetap terang dan nilai "Intensitas sumber"
  tidak diubah cuaca; yang berubah adalah `P DC = POA × A × η`. Ini penting
  agar intensitas tetap bersih sebagai variabel kontrol.
- **Awan lewat** hanya muncul di cuaca Cerah saat eksplorasi: kira-kira tiap
  11 detik ada awan menutup panel selama ±4 detik dan menurunkan POA sampai
  sekitar 40 %, lalu pulih mulus (`PASSING` di plts/model.js). Nilai terendah
  selama peristiwa itu terlihat di baris **Terendah**. Di mode LKPD awan lewat
  tidak pernah aktif sehingga angka LKPD tetap bersih.
- **Hujan mendinginkan sel** (ambient 20 °C), jadi efisiensi panel sedikit naik
  walau dayanya turun karena POA jauh lebih kecil. Ini contoh yang berguna:
  "lebih dingin" tidak berarti "lebih banyak listrik".

Penanda fase di kanan atas panggung (`#skyPhaseBadge`) menunjukkan fase aktif.
Pratinjau delapan kondisi (`1-fajar`, `2-pagi`, `3-siang`, `4-sore`, `5-senja`,
`6-malam`, `7-mendung`, `8-hujan`) tidak disertakan di repositori; gambarnya ada
di `_arsip/preview-langit/` pada salinan lokal.

## Label tahap pada gambar

Ketiga simulasi memakai pola yang sama: label berwarna krem pada panggung dapat
ditekan (atau difokuskan dengan Tab lalu Enter/Spasi) untuk membuka penjelasan
tahap itu.

| Simulasi | Jumlah tahap | Berkas isi | Modul |
|---|---|---|---|
| PLTA | 7 | `plta/process.js` | `window.PLTAProcess` |
| PLTB | 9 | `pltb/process.js` | `window.PLTBProcess` |
| PLTS | 9 | `plts/process.js` | `window.PLTSProcess` |

Dialog tahap punya tombol **← Sebelumnya / Selanjutnya →**, dan tombol
*Kenali komponen* menampilkan seluruh alur dari modul yang sama — jadi teks
ringkasan dan teks per label tidak pernah berbeda. Teks PLTA menyebut angka
nyata dari `physics.js` (luas tampungan 1 km², tinggi maksimum 100 m, batas
operasi 15 m, kapasitas 50 MW, kerugian pipa 3 m pada 100 m³/s) dan menyatakan
terus terang bahwa rugi trafo serta saluran transmisi tidak dimodelkan.

## Alur LKPD

1. **Identitas** — kelas, kelompok, tanggal, anggota, pilihan percobaan
2. **Persiapan** — tujuan, petunjuk, variabel, alat & bahan, langkah kerja
3. **Hipotesis**
4. **Pengamatan** — tabel percobaan 1 & 2, minimal 3 baris, maksimal 20
5. **Analisis & kesimpulan**

Jawaban tersimpan otomatis di `localStorage` browser. Tombol **Unduh PDF**
menghasilkan LKPD lengkap; **Unduh jawaban (.txt)** menghasilkan salinan teks.

Pengiriman otomatis ke email guru hanya aktif pada versi web yang dijalankan
dengan Google Apps Script. Pada berkas lokal, tombol kirim menampilkan pesan
bahwa pengiriman belum aktif — PDF tetap dapat diunduh.

## Catatan model

Simulasi ini **model pembelajaran**, bukan kalibrasi turbin atau panel nyata.
Angka Cp, TSR, dan kurva efisiensi adalah profil sintetis yang dipilih agar
hubungan antar-variabel terlihat jelas dan dapat dipelajari. Kesimpulan siswa
berlaku untuk kondisi model yang diamati, bukan untuk semua pembangkit nyata.

## Asal-usul

Halaman PLTB dan PLTS dibangun ulang dari berkas HTML+CSS yang tersimpan,
karena berkas JavaScript aslinya hilang. Data perhitungan, teks LKPD, markup,
dan perilaku antarmuka diambil dari HTML yang tersisa; modul fisika
(`model.js`), alur proses (`process.js`), serta pembuat PDF ditulis ulang agar
konsisten dengan rumus dan angka yang tertera pada halaman aslinya.

Berkas asli disimpan di `_arsip/` pada salinan lokal dan tidak dipublikasikan.
