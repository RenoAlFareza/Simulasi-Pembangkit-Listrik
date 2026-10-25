# CONTEXT — Project Pembangkit Lolita

Glosarium istilah untuk simulasi virtual Pembangkit Listrik Tenaga Air (PLTA) yang menjadi
bagian dari skripsi "Pembelajaran Fisika dengan Model Inquiry Terbimbing Berbantuan E-LKM
Interaktif Terintegrasi Simulasi Virtual" (Lolita Yusnia Machfiroh, Pendidikan Fisika UNESA).

Berkas ini hanya memuat kesepakatan istilah. Bukan dokumen desain, bukan spesifikasi teknis.

Legenda status:
- **PAKEM (dari proposal)** — istilah dan makanannya sudah ditetapkan dokumen proposal; tidak
  boleh diubah tanpa merevisi proposal.
- **SEPAKAT** — sudah diputuskan bersama penulis skripsi.
- **KABUR** — masih ambigu; menunggu keputusan. Nomor pertanyaan merujuk ke ronde grill.

---

## Kriteria penilaian realisme — SEPAKAT (Ronde 1, Q1)

"Realistis" dalam proyek ini berarti **dua hal sekaligus**, dan keduanya wajib:

1. **Realistis mekanisme** — arah dan bentuk hubungan sebab-akibat benar: P naik dengan Q dan dengan H;
   tidak ada besaran yang melompat tanpa sebab; tidak ada hubungan yang terbalik; tidak ada pengaruh
   yang dikarang (mis. cuaca mengubah head).
2. **Realistis visual** — gambar memuat konfigurasi pembangkit yang benar: bentuk turbin cocok dengan
   rentang head, nosel + jet hanya pada turbin impuls. Gambar **tidak wajib berskala**, tetapi
   proporsi antarbagian tidak boleh menyangkal jenis turbinnya.

Yang **tidak** dituntut: kecocokan kuantitatif ±10 % terhadap pembangkit lapangan. Angka boleh
ilustratif selama **kesimpulan yang bisa ditarik murid** tidak salah.

*Konsekuensi yang mengikat:* η = 0,75 konstan **boleh** dipertahankan (lihat η), tetapi arah pengaruh
cuaca, garis "model" pada grafik, dan siluet turbin **wajib** benar.

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

### Head (H) — SEPAKAT sebagai sifat situs (Ronde 1 Q2); bruto/kotor: SEPAKAT dengan bukti
Tinggi jatuh air: beda ketinggian muka air waduk dengan inlet turbin. Satuan m. Variabel utama
kedua yang dimanipulasi murid.
**Diputuskan (Ronde 1 Q2 = A):** H adalah sifat **situs** (tinggi bendung dan topografi), bukan sifat
musim. Rentang **4–25 m berlaku di semua skenario cuaca**; cuaca hanya mengubah debit.
**Diputuskan dengan bukti (bukan selera):** H yang diatur murid adalah **head bruto (kotor)** —
seluruh kehilangan tinggi sudah masuk ke dalam η, sesuai rumus 2.14/2.15, jadi tidak ada besaran
"head bersih" yang berdiri sendiri. Bukti: dengan `A = 0,28 m²` (D = 0,597 m), f = 0,02, L = 100 m,
kerugian gesek hanya **0,005 m (Q=0,05) / 0,087 m (Q=0,20) / 0,784 m (Q=0,60)** — maksimum **3,1 %**
dari H = 25 m. Terlalu kecil untuk dibedakan murid, dan terlalu kecil untuk menciptakan debit
optimum. Menambahkannya hanya menambah suku tanpa mengubah kesimpulan.
*Ambiguitas lama tertutup: proposal Tabel 8 menyebut "gesekan" sebagai faktor kehilangan, tetapi
rumus 2.14/2.15 memasukkan seluruh kehilangan ke dalam η — jadi η-lah rumah kehilangan itu, bukan H.*

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

### Efisiensi sistem (η) — PAKEM (dari proposal); nilai = SEPAKAT satu titik beban
Faktor efisiensi pada persamaan 2.15 yang mempresentasikan gabungan kehilangan: gesekan,
turbulensi, turbin, dan generator. Proposal tidak menetapkan nilainya.
*Sumber: proposal P0583, Tabel 8.*

**Diputuskan (Ronde 2, Q1 = C): η tetap 0,75 dan konstan**, tetapi **bukan** karena η nyata
konstan — η turbin nyata berupa kurva terhadap beban. η = 0,75 adalah **satu titik beban saja**.
Karena itu ia **tidak boleh** disebut "efisiensi turbin"; sebut **"efisiensi sistem pada titik
beban acuan"**. Konsekuensi yang harus dipenuhi: agar daya tidak naik tanpa batas, **turbin dibatasi
kapasitasnya** (lihat Kapasitas turbin), bukan η-nya yang dibuat melengkung.

### Kapasitas turbin (Q_kapasitas) — SEPAKAT (Ronde 2, Q1 = C)
Batas debit yang bisa dilewatkan turbin: **`qKapasitas = 0,40 m³/s`**. Air di atas batas itu
**melimpas** (spill), tidak menghasilkan daya.

- Daya memakai **debit efektif** `Q_eff = min(Q, 0,40)` → pada H = 25 m daya **mendatar** di
  **73,58 kW** untuk Q = 0,40 / 0,50 / 0,60.
- Putaran juga memakai **debit efektif**, jadi rpm ikut mendatar di **1.342 rpm** (bukan 1.643).
- **Kecepatan aliran di pipa tetap memakai debit sungguhan** (`v = Q/A`), karena pipa pesat
  mengalirkan seluruh debit termasuk yang nanti melimpas.
- Yang **boleh** ditampilkan sebagai debit di tabel adalah debit sungguhan yang diatur murid;
  yang dibatasi hanya konversinya menjadi daya dan putaran.
- Alasan memilih clamp dan bukan kurva η parabola: satu `Math.min` melunasi janji "P naik tetapi
  tidak melebihi kapasitas"; grafik Debit–Daya mendapat **siku** yang bisa dibaca murid sebagai
  bukti adanya batas; kurva η menambah tiga konstanta dan membuat hubungan tidak monoton — beban
  kognitif tanpa pemahaman tambahan.

### Energi (E) — SEPAKAT (Ronde 1, Q3; Ronde 2, Q4 & Q5)
Keluaran pengukuran dalam kWh. Tidak ada di proposal; ini tambahan permintaan penulis. Definisi
yang dipakai `E = P_out × t` dengan `t` = durasi percobaan dalam **detik**; 1 detik simulasi =
1 detik nyata.
**Diputuskan (Ronde 2, Q5 = A):** durasi **terkunci setelah baris pertama tercatat**, dan terbuka
lagi hanya bila seluruh data dihapus. Satu tabel data = satu aktivitas. Energi antarbaris dengan
durasi berbeda bukan pembanding yang sah — itu variabel pengganggu, bukan temuan.
**Diputuskan (Ronde 2, Q4 = B):** grafik Debit–Energi dan Head–Energi **dipertahankan**, tetapi
wajib diberi keterangan bahwa `E = P × t` dengan t sama untuk semua baris, sehingga bentuk kurvanya
**pasti sama** dengan grafik daya. Kesamaan itu bukan cacat — itu alat uji pemahaman.

### RPM (putaran) — SEPAKAT (Ronde 1, Q2; Ronde 2, Q1)
Keluaran pengukuran tambahan permintaan penulis. Tidak muncul sama sekali di proposal (proposal
hanya menyebut "putaran turbin" secara naratif di P0571, tanpa besaran).
**Diputuskan:** RPM **naik** ketika debit/head naik — `n = n₀·√((Q_eff·H)/(Q₀·H₀))` dengan
`n₀ = 900 rpm`, `Q₀ = 0,30 m³/s`, `H₀ = 15 m`. Dibenarkan karena pembangkit ini **PLTMH mandiri
dengan generator magnet permanen berbeban tetap** (V ∝ n, P ∝ V²), **bukan** PLTA grid-connected
yang putarannya terkunci sinkron. Ambang ini tidak boleh dibawa ke modul PLTA berskala besar.
**Konsekuensi Ronde 2:** rpm memakai `Q_eff`, jadi ikut mendatar di 1.342 rpm saat Q > 0,40.

### Kondisi waduk — DIBATALKAN sebagai istilah (Ronde 2, Q2 = A)
Semula: label kualitatif Penuh / Normal / Rendah / Kritis dari rasio H terhadap H_maks preset.
**Diputuskan: konsep ini dihapus dari simulasi.** Setelah head menjadi sifat situs (Ronde 1 Q2=A),
waduk tidak lagi punya ketinggian sendiri yang bisa dibandingkan dengan "maksimum skenario".
Empat ambang (`ambangWaduk` di `konfigurasi.js`) dan fungsi `kondisiWaduk()` di `fisika.js` dibuang.

**Penggantinya:** satu baris kuantitatif apa adanya — **"Head: 15,0 m — 60 % dari maksimum
situs"** — memakai `h/hMaks` terhadap batas global 25 m. Tidak ada nama kondisi, tidak ada warna
status. Kata "waduk" tidak lagi dipakai untuk menyatakan apa pun tentang tinggi.

**Yang harus ikut dibereskan:** empat kalimat `keterangan` preset menyebut "muka waduk surut" dan
"waduk penuh". Itu **salah** setelah Q2=A, karena muka air di gambar hanya digerakkan slider head.
Kalimatnya ditulis ulang agar hanya menyebut **debit** dan **langit**.

---

## Kontrol dan tampilan

### Timer / stopwatch eksperimen — SEPAKAT (Ronde 1, Q3; Ronde 2, Q5)
Permintaan penulis: agar semua kelompok punya durasi percobaan yang sama, karena energi (kWh) ikut
diamati. Tidak ada di proposal.
**Diputuskan:** jam percobaan berjalan **1:1 dengan waktu nyata** dan **hanya** jam inilah yang
dipakai menghitung energi (fase pemulihan putaran 2 detik tidak dihitung). Durasi dipilih murid
dari 30/60/90/120 s, lalu **terkunci setelah baris pertama tercatat** dan terbuka lagi hanya bila
seluruh data dihapus.

### Data tercatat (hasil "Catat data") — SEPAKAT (Ronde 1, Q5)
Satu baris data = satu kondisi percobaan yang disimpan murid (Q, H, P_out, E, RPM, preset), bukan
pembacaan sesaat. Perlu dibedakan tegas dari **pembacaan langsung** (angka yang berubah di layar).
Istilah "pembacaan langsung" dan "data tercatat" tidak boleh dipertukarkan.
**Diputuskan (Ronde 1, Q5 = A):** selama fase pemulihan putaran (2 detik pertama) daya dan energi
ditampilkan **"—"**, bukan angka penuh. Alasannya: daya yang masih nol tidak boleh tampak seolah
sudah tercapai, dan murid harus bisa membedakan "belum mengukur" dari "hasilnya nol". RPM tetap
tampil karena justru itulah besaran yang sedang menanjak.

### Grafik / panel data — SEPAKAT (Ronde 1, Q5; Ronde 2, Q4)
Permintaan penulis: grafik dipindah ke bagian "info" dan bagian itu diganti namanya. Hubungan yang
diminta: Debit–Daya, Head–Daya, Debit–Energi, Head–Energi, RPM–waktu.
**Diputuskan:** grafik data adalah **sebaran titik hasil percobaan** (bertambah setiap kali murid
mencatat data), bukan deret waktu — kecuali **strip-chart RPM**, yang memang deret waktu selama
satu percobaan karena putaran adalah satu-satunya besaran yang berubah di dalam percobaan.
**Diputuskan (Ronde 2, Q4 = B):** keempat grafik sebar dipertahankan. Debit–Energi dan Head–Energi
identik bentuknya dengan Debit–Daya dan Head–Daya; keterangannya wajib menyebut `E = P × durasi`
dengan durasi yang sama untuk semua baris, sehingga bentuk serupa itu **memang seharusnya**.
**Garis model pada grafik sebar** (keputusan Ronde 1 Q3 = A): garis putus-putus hanya digambar bila
**semua titik memakai tinggi jatuh air (atau debit) yang sama** — kondisi acuannya diambil dari
kelompok data, bukan dari baris terakhir. Bila data mencampur kondisi, garis **disembunyikan** dan
keterangan menyebutkan sebabnya. Ini melatih arti kontrol variabel, bukan menutupinya.

### Preset — SEPAKAT: skenario lingkungan, bukan tema (Ronde 1, Q6 → Q2)
Permintaan penulis: banyak pilihan preset, dan tampilan visual mengikuti (mendung → tampilan
mendung, hujan → tampilan hujan, dsb.).
**Diputuskan (Ronde 1 Q2 = A):** preset **hanya mengubah ketersediaan debit (q_maks) dan tampilan
visual** (langit, awan, hujan, gelombang). Preset **tidak lagi** membatasi head; slider head 4–25 m
terbuka penuh di semua preset. Preset tetap mengunci diri selama satu percobaan.
*Konsekuensi setelah kapasitas turbin dipasang (Ronde 2 Q1 = C):* daya maksimum per preset menjadi
`0,75·ρ·g·min(q_maks, 0,40)·25` — **Kemarau 36,79 kW** (q_maks 0,20), **Cerah 73,58 kW** (q_maks
0,40, tepat di kapasitas), **Mendung 73,58 kW** dan **Hujan 73,58 kW** (keduanya sudah melewati
kapasitas, sisa debit melimpas).
*Catat efek samping yang diterima:* Mendung (0,50) dan Hujan (0,60) menjadi **identik** dalam daya
dan putaran, berbeda hanya pada debit yang boleh disetel murid dan tampilan cuaca. Itu bukan bug —
itu pelajaran bahwa air di atas kapasitas turbin tidak menambah daya.
*Jangan campur dua makna:* "preset" = skenario lingkungan + tema tampilan yang selalu bergerak
bersama. Tidak ada preset kosmetik-murni.

### Jenis turbin yang digambar — SEPAKAT: crossflow (Banki) (Ronde 1 Q4, Ronde 2 Q3)
Label dan gambar memakai **turbin crossflow (Banki)**: impuls, memakai nosel + jet, dan beroperasi
di rentang head 5–100 m sehingga **cocok** dengan H 4–25 m. Bukan Pelton (head terlalu rendah),
bukan Francis/Kaplan (reaksi, tanpa jet).
**Diputuskan (Ronde 2 Q3 = B):** gambar **ikut diubah**, bukan hanya label — drum dengan banyak
sudu melintang selebar drum + *guide vane* di mulut nosel, jet dipertahankan. Alasan: mengganti
label saja membuat teks dan gambar saling menyangkal, dan itu cacat yang sama dengan temuan no. 3.
Keputusan ini juga konsekuensi dari Q1 Ronde 1 = "realistis visual", bukan tambahan hiasan.

### Start / Pause / Reset — KABUR (belum pernah ditanyakan)
Permintaan penulis: tombol jelas di bawah visualisasi.
**Diputuskan sebagian (sudah berjalan di kode):** tombol "Mulai" mengunci pengatur dan memulai fase
pemulihan; "Jeda" menghentikan jam simulasi (waktu tidak berjalan saat jeda); "Ulangi Percobaan"
mengembalikan percobaan ke nol **tanpa menghapus data yang sudah dicatat** (ada pesan
"Tabel data tetap tersimpan"); penghapusan data punya tombol sendiri ("Hapus Semua Data") yang
meminta konfirmasi.
*Ambiguitas terbuka:* naskah di atas adalah perilaku yang kebetulan sudah ada, bukan hasil keputusan
sadar. Yang belum diputuskan: (a) apakah "Reset" seharusnya berarti "kembalikan percobaan" atau
"hapus semua data" — dua arti yang mudah tertukar dan berbahaya bagi data murid; (b) apakah Pause
boleh dipakai murid untuk "mengakali" durasi, karena energi dihitung dari jam simulasi sehingga jeda
tidak menambah energi.

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
