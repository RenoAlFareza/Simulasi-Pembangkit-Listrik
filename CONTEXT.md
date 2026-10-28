# CONTEXT — Project Pembangkit Lolita

Glosarium istilah untuk simulasi virtual Pembangkit Listrik Tenaga Air (PLTA) yang menjadi
bagian dari skripsi "Pembelajaran Fisika dengan Model Inquiry Terbimbing Berbantuan E-LKM
Interaktif Terintegrasi Simulasi Virtual" (Lolita Yusnia Machfiroh, Pendidikan Fisika UNESA).

Berkas ini hanya memuat kesepakatan istilah. Bukan dokumen desain, bukan spesifikasi teknis.

Legenda status:
- **PAKEM (dari proposal)** — istilah dan maknanya sudah ditetapkan dokumen proposal; tidak
  boleh diubah tanpa merevisi proposal.
- **SEPAKAT** — sudah diputuskan bersama penulis skripsi.
- **KABUR** — masih ambigu; menunggu keputusan. Nomor pertanyaan merujuk ke ronde grill.

> **Keadaan per rancangan 0.3.0 (Ronde 5).** Simulasi dibangun ulang total dengan **LKPD
> praktikum sebagai kontrak tunggal**: dua variabel diubah, dua respon diamati. Istilah di
> bawah ini sudah disesuaikan; entri yang menyatakan sesuatu yang **sudah dihapus** diberi
> label DIBATALKAN, bukan dibuang, supaya keputusan lama tidak diulang tanpa alasan.

---

## Kriteria penilaian realisme — SEPAKAT (Ronde 1, Q1)

"Realistis" dalam proyek ini berarti **dua hal sekaligus**, dan keduanya wajib:

1. **Realistis mekanisme** — arah dan bentuk hubungan sebab-akibat benar: P naik dengan Q dan dengan H;
   tidak ada besaran yang melompat tanpa sebab; tidak ada hubungan yang terbalik; tidak ada pengaruh
   yang dikarang.
2. **Realistis visual** — gambar memuat konfigurasi pembangkit yang benar: bentuk turbin cocok dengan
   rentang head. Gambar **tidak wajib berskala**, tetapi proporsi antarbagian tidak boleh menyangkal
   jenis turbinnya.

Yang **tidak** dituntut: kecocokan kuantitatif ±10 % terhadap pembangkit lapangan. Angka boleh
ilustratif selama **kesimpulan yang bisa ditarik murid** tidak salah.

*Konsekuensi yang mengikat:* η = 0,75 konstan **boleh** dipertahankan (lihat η), tetapi arah
pengaruh variabel dan siluet turbin **wajib** benar.

---

## Entitas sistem

### PLTA (Pembangkit Listrik Tenaga Air) — PAKEM (dari proposal)
Sistem pembangkit yang mengubah energi potensial gravitasi air menjadi energi listrik melalui
turbin dan generator. Proposal menetapkan alur konversi: energi potensial → energi kinetik aliran
→ energi mekanik turbin → generator → energi listrik. Materi ini adalah salah satu dari **tiga**
sistem yang dijanjikan proposal (PLTS, PLTA, PLTB).
*Sumber: proposal P0570–P0574, Tabel 8, P0105.*

### PLTS / PLTB — PAKEM (dari proposal)
Dua modul simulasi lain yang dijanjikan proposal. PLTS: variabel utama intensitas radiasi dan luas
panel, hubungan P ∝ I·A. PLTB: variabel utama kecepatan angin dan luas rotor, hubungan P ∝ A·v³.
Keduanya bukan bagian dari pekerjaan saat ini, tetapi **shell/kerangka UI harus direncanakan untuk
ketiganya**.
*Sumber: proposal Tabel 8, P0567, P0105.*

### Simulasi virtual — PAKEM (dari proposal)
Media eksperimen berbasis web yang dikembangkan melalui pemrograman dan diakses secara daring
melalui **GitHub Pages**. Digunakan murid untuk memanipulasi variabel, mengamati perubahan, dan
memperoleh data. Simulasi ini dinilai sebagai bagian dari "perangkat pembelajaran" pada instrumen
validasi (kategori minimal *Valid*).
*Sumber: proposal P0049, P0105, P0761, P0860.*

### E-LKM interaktif — PAKEM (dari proposal)
Lembar Kerja Murid elektronik yang dibangun di platform **LiveWorksheets**, disusun mengikuti enam
tahapan Inquiry Terbimbing. Memuat petunjuk eksperimen, tabel pengamatan, pertanyaan analisis,
ruang hipotesis, dan ruang kesimpulan. E-LKM dan simulasi adalah **dua sistem terpisah**.
*Sumber: proposal P0049, P0102, P0658.*

### LKPD praktikum — kontrak rancangan 0.3.0
Berkas `worksheet_8555452.pdf` (5 halaman) yang menjadi **acuan tunggal** isi antarmuka sejak
Ronde 5. Yang diminta LKPD dan menjadi isi simulasi:

| LKPD | Isi |
|---|---|
| D. Variabel Percobaan | P1 manipulasi **ketinggian sumber air** (kontrol: debit); P2 manipulasi **debit air** (kontrol: ketinggian) |
| F. Langkah Kerja | "atur **tiga** harga … sambil menjaga variabel kontrol tetap sama" |
| F. Langkah Kerja | "amati daya dan nyala LED **setelah aliran stabil**" |
| I. Hasil Pengamatan | kolom respon: **Daya Listrik** dan **Tingkat Terang Nyala LED** |
| B. Petunjuk | indikator respon: "Daya listrik dalam **(MW)** dan tingkat terang nyala LED" |

Aturan yang berlaku sejak Ronde 5: **fitur yang tidak dapat dilacak ke LKPD tidak dipasang**,
kecuali panel rumus yang sengaja dipertahankan penulis.

**Kontradiksi internal LKPD:** bagian B menyebut "DUA kondisi", bagian F menyebut "TIGA", tabel
hasil menyediakan tiga baris. Yang dipakai **tiga**; redaksi LKPD sebaiknya diperbaiki.

Catat: proposal memakai "**murid**" (bukan "peserta didik"), sehingga lembar kerjanya adalah
**E-LKM / LKM**, bukan LKPD. Istilah "LKPD" yang dipakai sehari-hari mengacu pada benda yang sama;
untuk dokumen resmi pakai E-LKM.

**Batasan terverifikasi (2026):** LiveWorksheets **tidak** menyediakan API/webhook/postMessage untuk
menerima data dari aplikasi luar, dan **tidak** bisa menyematkan (iframe) aplikasi luar ke dalam
lembar kerja. Satu-satunya jalur keluar dari simulasi adalah elemen **Link** (membuka tab baru) +
transkripsi manual ke elemen **Textfield**. Konsekuensi: setiap fitur "kirim data otomatis ke E-LKM"
tidak mungkin di platform ini. Bahan: [balasan resmi tim LiveWorksheets soal integrasi](https://www.liveworksheets.com/community/q/topic/8360471/sso-or-lti),
[daftar elemen](https://www.liveworksheets.com/help/get-started/how-do-i-make-interactive-worksheets).

**Risiko retensi data:** halaman *About* menyatakan jawaban mailbox dihapus setelah 30 hari,
sementara tim LiveWorksheets menyebut 15 hari (Maret 2026). Jangan jadikan mailbox sebagai arsip —
ekspor segera.

---

## Besaran fisis

### Debit (Q) — PAKEM (dari proposal)
Volume air yang mengalir setiap satuan waktu. Satuan m³/s. Salah satu dari dua variabel utama PLTA
yang dimanipulasi murid. Rentang slider **0,05–0,60 m³/s** (langkah 0,01).
*Sumber: proposal P0576, Tabel 8.*

### Ketinggian sumber air / head (H) — PAKEM (dari proposal); peran: SEPAKAT (Ronde 1 Q2)
Tinggi jatuh air: beda ketinggian muka air waduk dengan inlet turbin. Satuan m. Variabel utama
kedua yang dimanipulasi murid. Rentang slider **4–25 m** (langkah 0,5).
**Diputuskan (Ronde 1 Q2 = A):** H adalah sifat **situs** (tinggi bendung dan topografi), bukan
sifat musim.
**Diputuskan dengan bukti (bukan selera):** H yang diatur murid adalah **head bruto (kotor)** —
seluruh kehilangan tinggi sudah masuk ke dalam η, sesuai rumus 2.14/2.15, jadi tidak ada besaran
"head bersih" yang berdiri sendiri. Bukti: dengan `A = 0,28 m²` (D = 0,597 m), f = 0,02, L = 100 m,
kerugian gesek hanya **0,005 m (Q=0,05) / 0,087 m (Q=0,20) / 0,784 m (Q=0,60)** — maksimum **3,1 %**
dari H = 25 m. Terlalu kecil untuk dibedakan murid, dan terlalu kecil untuk menciptakan debit
optimum.
*Ambiguitas lama tertutup: proposal Tabel 8 menyebut "gesekan" sebagai faktor kehilangan, tetapi
rumus 2.14/2.15 memasukkan seluruh kehilangan ke dalam η — jadi η-lah rumah kehilangan itu, bukan H.*

**Catatan istilah:** label di layar memakai **"Ketinggian sumber air — H"**, mengikuti bahasa LKPD
("Ketinggian Sumber Air"), bukan "head". Istilah "head" hanya dipakai di dokumen teknis.

### Daya air / daya tersedia (P_air) — PAKEM (dari proposal)
`P_air = ρ·g·Q·H` (persamaan 2.14 proposal). Daya teoretis yang tersedia pada aliran air.
*Sumber: proposal P0577–P0582.*

### Daya keluaran (P_out) — PAKEM (dari proposal)
`P_out = η·ρ·g·Q·H` (persamaan 2.15 proposal). Daya yang benar-benar dihasilkan setelah efisiensi
sistem diperhitungkan. Inilah "**Daya listrik**" yang tampil sebagai respon pertama, dalam **kW**.

Catat beda istilah: **P_air** = daya tersedia (tanpa η), **P_out** = daya keluaran (dengan η).
Jangan menyebut keduanya "daya" tanpa pembeda — ini persis bahan analisis untuk indikator
*analysis*.
*Sumber: proposal P0583–P0585.*

### Satuan daya: kW di layar, MW di LKPD — SEPAKAT (Ronde 2 Q6; Ronde 5 Q1)
LKPD meminta daya dalam **MW**; simulasi menampilkan **kW**. Ini **bukan** ketidakcocokan yang
harus dibereskan, melainkan latihan yang disengaja: konversi `MW = kW ÷ 1000` adalah bagian dari
kompetensi.
**Diputuskan (Ronde 5 Q1):** tampilkan kW sebagai angka utama, dan tampilkan `= 0,0662 MW` kecil
di bawahnya sebagai **pembanding** untuk memeriksa hasil hitung siswa. Kalimat penjelas di bawah
kotak hasil: *"LKPD meminta daya dalam MW. Simulasi menampilkan kW — bagilah dengan 1000 untuk
mengisi kolom MW."*

### Efisiensi sistem (η) — PAKEM (dari proposal); nilai = SEPAKAT satu titik beban
Faktor efisiensi pada persamaan 2.15 yang mempresentasikan gabungan kehilangan: gesekan,
turbulensi, turbin, dan generator. Proposal tidak menetapkan nilainya.
*Sumber: proposal P0583, Tabel 8.*

**Diputuskan:** η tetap **0,75** dan konstan, tetapi **bukan** karena η nyata konstan — η turbin
nyata berupa kurva terhadap beban. η = 0,75 adalah **satu titik beban saja**. Karena itu ia
**tidak boleh** disebut "efisiensi turbin"; sebut **"efisiensi sistem pada titik beban acuan"** —
persis begitu yang tertulis di panel Rumus.

### Putaran turbin (n) — SEPAKAT: alat bantu gambar, bukan keluaran (Ronde 5)
`n = n₀·√((Q·H)/(Q₀·H₀))` dengan `n₀ = 900 rpm`, `Q₀ = 0,30 m³/s`, `H₀ = 15 m`. Dibenarkan karena
pembangkit ini **PLTMH mandiri dengan generator magnet permanen berbeban tetap** (V ∝ n, P ∝ V²),
**bukan** PLTA grid-connected yang putarannya terkunci sinkron.
**Diputuskan (Ronde 5 Q3):** putaran **tidak ditampilkan sebagai angka** — LKPD tidak memintanya.
Nilainya tetap dipakai untuk **menggerakkan roda turbin pada gambar**, di mana ia berguna sebagai
isyarat visual bahwa aliran berubah. Di panel Rumus rumusnya tetap dicantumkan.

### Tingkat terang lampu — SEPAKAT (Ronde 5, Q4)
Respon kedua yang diminta LKPD ("tingkat terang nyala LED"). Diwujudkan sebagai **rumah dengan tiga
jendela** yang menyala bertingkat — bukan tiga lampu indikator di gedung, karena rumah adalah beban
listrik yang nyata dan menyala terangnya mudah dibaca dari jauh.

**Diputuskan:** tingkat terang adalah **fungsi daya listrik saja**, dengan ambang daya **absolut**
(bukan persentase):

| Daya | Level | Label |
|---|---|---|
| ≥ 40 kW | 3 | Terang |
| 12 – 40 kW | 2 | Sedang |
| 2 – 12 kW | 1 | Redup |
| < 2 kW | 0 | Mati |

Alasan ambang absolut: lampu di lab nyata punya daya nominal tetap dan tidak "tahu" berapa daya
maksimum alat yang memberinya makan. Ambang persentase membuat pembacaan alat berubah karena hal
yang tidak diukur — persis cacat yang sudah dibereskan pada Ronde 4.

Selain tingkat diskret, animasi cahaya memakai **fraksi kontinu** `(P − 1,5)/(45 − 1,5)` yang
dijepit 0–1 untuk kehalusan. Fraksi hanya untuk gambar; angka yang dibaca siswa tetap tingkat.

### Kekuatan aliran di dalam pipa (v) — SEPAKAT sebagai penggerak animasi
`v = Q / A` dengan `A = 0,28 m²` (diameter tetap). Dipakai **hanya** untuk kecepatan partikel air di
gambar pipa; tidak ditampilkan sebagai angka.
**Diameter pipa digambar tetap.** Pada pipa berpenampang tetap, debit yang naik berarti kecepatan
aliran naik, bukan diameter bertambah. Menampilkan pipa yang membesar ketika debit naik adalah
kesalahan fisika.

### Energi (E) — DIBATALKAN (Ronde 5, Q3)
Dulu keluaran pengukuran dalam kWh, `E = P_out × t`. **Dihapus dari antarmuka** karena tidak ada di
LKPD dan menuntut timer serta durasi, yang juga tidak ada di LKPD. Respon yang diminta LKPD hanya
daya dan tingkat terang.
*Catatan: daya dipakai untuk menghitung terang, jadi daya tetap ada; yang hilang adalah
akumulasinya terhadap waktu.*

### Kapasitas turbin (Q_kapasitas) — DIBATALKAN (Ronde 5, Q3)
Dulu batas debit 0,40 m³/s dengan limpasan di atasnya, ditambahkan pada Ronde 2 untuk menahan daya
agar tetap di wilayah PLTMH. **Dihapus** pada Ronde 5: pada rentang slider yang ada
(Q 0,05–0,60 m³/s, H 4–25 m), `P = ηρgQH` sudah memberi 5,52–66,22 kW — wilayah PLTMH — tanpa perlu
komponen tambahan yang tidak diajarkan di LKPD.
Fungsi `debitTurbin()`, `airLimpas()`, `qKapasitas`, ambang dan penanda kapasitas, serta
**limpasan** yang tergambar, semuanya ikut dihapus.

### Head relatif / kondisi waduk — DIBATALKAN (Ronde 2 Q2; Ronde 5 Q3)
Dulu baris "Head: 15,0 m — 60 % dari maksimum situs" di panel hasil. **Dihapus** bersama panel
hasil rancangan lama: head adalah besaran yang **diatur** murid, bukan diukur simulasi, dan nilainya
sudah terbaca di slider serta di garis ukur pada gambar.

---

## Kontrol dan tampilan

### Dua percobaan (P1/P2) — SEPAKAT (Ronde 5, Q5)
LKPD meminta siswa memilih satu percobaan dan menjaga variabel kontrol tetap. **Diputuskan:** dua
tombol mode menetapkan variabel mana yang diubah, dan **mengunci slider variabel kontrolnya**
(`disabled`), disertai keterangan tertulis mengapa terkunci.

| Mode | Diubah | Dikunci |
|---|---|---|
| P1 · Ubah ketinggian | H 4–25 m | Q = 0,30 m³/s |
| P2 · Ubah debit air | Q 0,05–0,60 m³/s | H = 15,0 m |

Alasan tidak diserahkan pada disiplin siswa: kalau penguncian tidak dilakukan alat, tiap
kesimpulan yang ditarik siswa berisiko tidak sah karena prosedurnya tidak terjaga — bukan karena
fisikanya salah. Penguncian membuat syarat LKPD **tidak mungkin dilanggar**.

### "Aliran stabil" — SEPAKAT (Ronde 5)
LKPD meminta pengamatan dilakukan "setelah aliran stabil". **Diputuskan:** angka dan gambar diredam
menuju nilai pengatur selama ±0,35 detik; selama itu status berbunyi **"Aliran menyesuaikan…"** dan
angka respon ditampilkan **"—"**. Setelah redaman selesai status menjadi **"Aliran stabil — catat
daya dan tingkat terangnya di LKPD."** dan angka yang tampil adalah **nilai model yang eksak**,
bukan sisa redaman.
"Stabil" di sini bermakna *nilai sudah mencapai keadaan mantapnya*, bukan *alat baru dihidupkan*.
Alasan angka dipaku pada nilai eksak saat dinyatakan stabil: kalau sisa redaman masih terbaca
(mis. 8,89 kW padahal model 8,83 kW), angka yang ditulis siswa ke LKPD berbeda dari hasil hitung
rumusnya sendiri — dan itu membuat siswa mencari kesalahan pada rumus yang benar.

### Timer / durasi / tombol Mulai-Jeda-Reset / "Catat Data" — DIBATALKAN (Ronde 5, Q3)
Semua dihapus: tidak ada di LKPD, dan simulasi kini **selalu hidup**. Begitu pengatur digeser, air
mengalir dan angka berubah. Tidak ada keadaan yang harus dimulai, dijeda, atau direset, sehingga
istilah "Reset" yang dulu sempat KABUR **lenyap dengan sendirinya** — bukan diselesaikan.

### Tabel data / grafik / panel "Data & Analisis" / CSV / Kartu Data — DIBATALKAN (Ronde 5, Q3)
Dihapus karena tidak ada di LKPD, dan pada layar HP panelnya mendorong gambar keluar dari layar
(keluhan langsung penulis). Grafik yang diminta LKPD adalah grafik buatan siswa sendiri di lembar
kerja. Data siswa tinggal di LKPD, bukan di alat.
*Ikut hilang:* `localStorage`, jejak RPM, garis model, legenda, tombol Salin Tabel dan Unduh CSV.

### Preset cuaca — DIBATALKAN (Ronde 5, Q3)
Dulu Kemarau/Cerah/Mendung/Hujan yang mengubah batas debit dan tampilan langit. **Dihapus:** tidak
ada di LKPD, dan ia menambah satu variabel yang harus dijelaskan tanpa melayani satu pun butir LKPD.
Akibatnya jawaban lama "cuaca hanya mengubah debit" (Ronde 1 Q2) tidak lagi dipakai — pertanyaannya
sudah tidak ada.

### Panel rumus — SEPAKAT dipertahankan (Ronde 5, Q3)
**Satu-satunya** yang dipertahankan meski tidak ada di LKPD; keputusan penulis.
Isinya `P_air = ρgQH`, `P_listrik = ηρgQH`, `n = n₀√((Q·H)/(Q₀·H₀))`, `P_MW = P_kW ÷ 1000`, plus
nilai ρ, g, η, n₀.
**Tertutup secara bawaan**, dibuka lewat tombol "Lihat rumus". Alasannya: kalau rumus terpampang
sejak awal, tahap merumuskan hipotesis kehilangan makna — siswa menebak dulu, baru membuka rumus
untuk memeriksa.

### Jenis turbin yang digambar — SEPAKAT: reaksi (Ronde 5, Q2)
**Diputuskan:** turbin **reaksi** — kasing tertutup berbentuk rumah keong, air masuk dari pipa pesat,
keluar lewat pipa hisap. **Tanpa nosel, tanpa jet bebas.** Label cukup **"Turbin"**, tanpa nama
jenis, persis seperti gambar acuan.
Menggantikan keputusan Ronde 1 Q4 / Ronde 2 Q3 (crossflow + nosel + jet) yang **dibatalkan**:
gambar acuan penulis menunjukkan turbin reaksi, dan rentang head 4–25 m memang wilayah turbin
reaksi. Mewajibkan crossflow akan membuat gambar menyangkal acuan.

### Alur air dan alur listrik pada gambar — SEPAKAT (Ronde 5, Q2)
Dua jalur terpisah yang keduanya harus terlihat:

```
air   : Waduk → Bendungan → Intake → Pipa pesat → Turbin → Pipa hisap → Sungai bawah tanah
listrik: Generator → Transformator → Jalur transmisi (tiang) → Rumah
```

**Diputuskan:** air keluar **tidak** langsung menjadi sungai di permukaan, melainkan turun ke
**sungai bawah tanah** (digambar sebagai rongga), dan di atas rongga itu berdiri **rumah** yang
disuplai lewat jalur transmisi. Urutan listrik **transformator → kabel → tiang → rumah** harus benar,
karena rumah adalah beban yang menyala sebagai respon visual.

### Bahasa dan jumlah teks — SEPAKAT (Ronde 5, Q5)
"Pastikan tidak terlalu banyak deskripsi." Teks yang tersisa hanya: catatan variabel kontrol per
mode, status aliran, catatan konversi MW, keterangan penguncian, dan isi panel rumus (tertutup).
Label gambar memakai satu-dua kata.

---

## Istilah proses penelitian (jangan dicampur)

### Enam tahapan Inquiry Terbimbing — PAKEM (dari proposal)
orientasi → merumuskan masalah → merumuskan hipotesis → mengumpulkan data → menguji hipotesis →
merumuskan kesimpulan.
*Sumber: proposal P0099, P0653.*

### Enam indikator keterampilan berpikir kritis (Facione) — PAKEM (dari proposal)
interpretation, analysis, inference, evaluation, explanation, self-regulation. Inilah **variabel
terikat** penelitian, diukur dengan pre-test dan post-test — bukan oleh simulasi.
*Sumber: proposal P0108, P0688.*

Catat: karena simulasi tidak mengukur apa pun, setiap fitur simulasi harus bisa dilacak ke salah
satu dari tiga hal: (a) tahapan inquiry yang dilayani, (b) indikator Facione yang dilatih, atau
(c) aspek yang dinilai pada instrumen validasi. Fitur yang tidak bisa dilacak ke ketiganya adalah
hiasan. **Sejak Ronde 5, ini diperketat menjadi: fitur yang tidak ada di LKPD juga tidak dipasang.**
