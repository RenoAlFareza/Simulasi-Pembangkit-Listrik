# CONTEXT — Project Pembangkit Lolita

Glosarium istilah untuk simulasi virtual Pembangkit Listrik Tenaga Air (PLTA) yang menjadi
bagian dari skripsi "Pembelajaran Fisika dengan Model Inquiry Terbimbing Berbantuan E-LKM
Interaktif Terintegrasi Simulasi Virtual" (Lolita Yusnia Machfiroh, Pendidikan Fisika UNESA).

Berkas ini hanya memuat kesepakatan istilah. Bukan dokumen desain, bukan spesifikasi teknis.

Legenda status:
- **PAKEM (dari proposal)** — istilah dan makanannya sudah ditetapkan dokumen proposal; tidak
  boleh diubah tanpa merevisi proposal.
- **SEPAKAT** — sudah diputuskan bersama penulis skripsi.
- **KABUR** — masih ambigu; menunggu keputusan. Nomor pertanyaan merujuk ke Ronde 1 grill.

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
ketiganya** (lihat Ronde 1, Q1).
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

Catat: proposal memakai "**murid**" (bukan "peserta didik"), sehingga lembar kerjanya adalah
**E-LKM / LKM**, bukan LKPD. Istilah "LKPD" yang dipakai sehari-hari mengacu pada benda yang sama;
untuk dokumen resmi pakai E-LKM. *(Ronde 1 tidak menanyakan ini; pakai E-LKM.)*

**Batasan terverifikasi (2026):** LiveWorksheets **tidak** menyediakan API/webhook/postMessage untuk
menerima data dari aplikasi luar, dan **tidak** bisa menyematkan (iframe) aplikasi luar ke dalam
lembar kerja. Penanaman hanya berlaku satu arah (lembar kerja LiveWorksheets ditempel ke situs
lain). Elemen media yang bisa masuk hanya YouTube dan PowerPoint (OneDrive). Satu-satunya jalur
keluar dari simulasi adalah elemen **Link** (membuka tab baru) + transkripsi manual ke elemen
**Textfield**. Konsekuensi: setiap fitur "kirim data otomatis ke E-LKM" tidak mungkin di platform
ini. Bahan: [balasan resmi tim LiveWorksheets soal integrasi](https://www.liveworksheets.com/community/q/topic/8360471/sso-or-lti),
[daftar elemen](https://www.liveworksheets.com/help/get-started/how-do-i-make-interactive-worksheets).

**Risiko retensi data:** halaman *About* menyatakan jawaban mailbox dihapus setelah 30 hari,
sementara tim LiveWorksheets menyebut 15 hari (Maret 2026). Jangan jadikan mailbox sebagai arsip —
ekspor segera. Bahan: [utas retensi](https://www.liveworksheets.com/community/q/topic/8381850/mrs-teacher).

---

## Besaran fisis

### Debit (Q) — PAKEM (dari proposal)
Volume air yang mengalir setiap satuan waktu. Satuan m³/s. Salah satu dari dua variabel utama PLTA
yang dimanipulasi murid.
*Sumber: proposal P0576, Tabel 8.*

### Head (H) — PAKEM (dari proposal); ada sisa ambiguitas
Tinggi jatuh air: perbedaan ketinggian yang tersedia pada sistem. Satuan m. Variabel utama kedua
yang dimanipulasi murid.
*Ambiguitas terbuka:* apakah H yang diatur murid adalah head kotor (beda tinggi muka air waduk ke
turbin) atau sudah termasuk kehilangan tinggi (gesekan pipa pesat)? Proposal Tabel 8 menyebut
"gesekan" sebagai faktor kehilangan, tetapi rumus 2.14/2.15 memasukkan seluruh kehilangan ke dalam
η. Keputusan ditunda.

### Daya air / daya tersedia (P_air) — PAKEM (dari proposal)
`P_air = ρ·g·Q·H` (persamaan 2.14 proposal). Daya teoretis yang tersedia pada aliran air.
*Sumber: proposal P0577–P0582.*

### Daya keluaran (P_out) — PAKEM (dari proposal)
`P_out = η·ρ·g·Q·H` (persamaan 2.15 proposal). Daya yang benar-benar dihasilkan setelah efisiensi
sistem diperhitungkan. Inilah "Daya" yang tampil sebagai keluaran pengukuran.
*Sumber: proposal P0583–P0585.*

Catat beda istilah: **P_air** = daya tersedia (tanpa η), **P_out** = daya keluaran (dengan η).
Jangan menyebut keduanya "daya" tanpa pembeda — ini persis bahan analisis untuk indikator
*analysis*.

### Efisiensi sistem (η) — PAKEM (dari proposal)
Faktor efisiensi pada persamaan 2.15 yang mempresentasikan gabungan kehilangan: gesekan,
turbulensi, turbin, dan generator. Proposal tidak menetapkan nilainya.
*Sumber: proposal P0583, Tabel 8.*

### Energi (E) — KABUR (Ronde 1, Q3)
Keluaran pengukuran dalam kWh. Tidak ada di proposal; ini tambahan permintaan penulis. Definisi
yang dipakai harus `E = P_out × t` dengan `t` = durasi percobaan.
*Ambiguitas terbuka:* satuan waktu t (detik vs jam) dan apakah 1 detik simulasi = 1 detik nyata.

### RPM (putaran) — KABUR (Ronde 1, Q2)
Keluaran pengukuran tambahan permintaan penulis. Tidak muncul sama sekali di proposal (proposal
hanya menyebut "putaran turbin" secara naratif di P0571, tanpa besaran).
*Ambiguitas terbuka dan kritis:* apakah RPM naik ketika debit naik. Pada PLTA besar yang
tersambung grid, putaran generator terkunci pada putaran sinkron sehingga **tidak** berubah
terhadap debit. Model fisis pembangkit harus diputuskan lebih dulu.

### Kondisi waduk — KABUR (Ronde 1, Q2, Q6)
Keluaran pengukuran tambahan permintaan penulis (kondisi/status waduk: penuh, normal, rendah, dsb).
*Ambiguitas terbuka:* apakah ini besaran fisis (muka air yang menentukan H, dan bisa turun selama
percobaan) atau label kualitatif turunan dari H yang ditetapkan murid.

---

## Kontrol dan tampilan

### Timer / stopwatch eksperimen — KABUR (Ronde 1, Q3)
Permintaan penulis: agar semua kelompok punya durasi percobaan yang sama, karena energi (kWh) ikut
diamati. Tidak ada di proposal.
*Ambiguitas terbuka:* apakah timer mengukur jam simulasi yang sama dengan yang dipakai menghitung
energi, dan apakah durasi ditetapkan otomatis atau ditekan manual oleh murid.

### Data tercatat (hasil "Catat data") — KABUR (Ronde 1, Q5)
Satu baris data = satu kondisi percobaan yang disimpan murid (Q, H, P_out, E, RPM, preset), bukan
pembacaan sesaat. Perlu dibedakan tegas dari **pembacaan langsung** (angka yang berubah di layar).
Istilah "pembacaan langsung" dan "data tercatat" tidak boleh dipertukarkan.

### Grafik / panel data — KABUR (Ronde 1, Q5)
Permintaan penulis: grafik dipindah ke bagian "info" dan bagian itu diganti namanya. Hubungan yang
diminta: Debit–Daya, Head–Daya, Debit–Energi, Head–Energi, RPM–waktu.
*Ambiguitas terbuka:* apakah grafiknya deret waktu (real-time) atau sebaran titik hasil percobaan
yang bertambah setiap kali murid mencatat data.

### Preset — KABUR (Ronde 1, Q6)
Permintaan penulis: banyak pilihan preset, dan tampilan visual mengikuti (mendung → tampilan
mendung, hujan → tampilan hujan, dsb.).
*Ambiguitas terbuka:* apakah preset hanya mengubah tampilan (kosmetik) atau juga mengubah besaran
fisis (ketersediaan air, muka air waduk). Kata "preset" pada bentuk sekarang mencampur dua makna:
**skenario lingkungan** (cuaca/hidrologi) dan **tema tampilan**.

### Start / Pause / Reset — KABUR (Ronde 1, Q4)
Permintaan penulis: tombol jelas di bawah visualisasi.
*Ambiguitas terbuka:* apakah Pause menghentikan jam simulasi, dan apakah Reset menghapus data yang
sudah dicatat murid.

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
hiasan.
