# Spesifikasi Perbaikan UI/UX — Modul PLTA (rancangan lama, 0.2.x)

> ## ⚠️ Dokumen ini menyangkut rancangan yang SUDAH DIGANTI
>
> Seluruh isi dokumen ini — R-GRAFIK-01, R-DATA-01/02, R-PRESET-01, R-JEDA-01, D-01/D-02/D-03,
> dan semua kebutuhan turunannya — mengacu pada **rancangan 0.2.x**: yang punya preset cuaca,
> timer, energi kWh, tabel data, empat grafik sebar, tombol Catat Data, kapasitas turbin, dan
> limpasan.
>
> Pada **Ronde 5** penulis memutuskan **redesign total** dengan LKPD praktikum sebagai kontrak
> tunggal. Seluruh komponen di atas dihapus, sehingga sebagian besar kebutuhan di dokumen ini
> menjadi **tidak berlaku** — bukan karena sudah dikerjakan, tetapi karena barangnya sudah tidak ada.
>
> **Kontrak yang berlaku sekarang:**
> [spesifikasi-simulasi.md](spesifikasi-simulasi.md) (rancangan 0.3.0).
>
> Dokumen ini **dipertahankan** karena dua alasan: (a) ia mencatat perbaikan yang tetap berlaku
> pada lapisan yang tidak berubah (token warna, target sentuh, aksesibilitas, `prefers-reduced-motion`,
> tipografi, irama jarak) dan (b) ia merekam metode audit runtime yang dipakai untuk menemukan
> cacat nyata — metode itulah yang kemudian menemukan lampu indikator dan tebal jet yang salah.
>
> Setiap bagian yang tidak lagi berlaku ditandai **[TIDAK BERLAKU — 0.3.0]** pada judulnya.

Status asli: **usulan, menunggu persetujuan**. Dokumen ini adalah kontrak pengerjaan perbaikan
yang diturunkan dari audit runtime, bukan daftar keinginan.

Kaitan: [spesifikasi-simulasi.md](spesifikasi-simulasi.md) (kontrak fitur) ·
[CONTEXT.md](../CONTEXT.md) (glosarium istilah).

---

## 1. Dasar dan cara membaca dokumen

Perbaikan ini berasal dari audit terhadap aplikasi yang **sedang berjalan**, bukan dari tafsir
kode. Setiap butir di bawah sudah punya bukti terukur (angka rasio kontras, ukuran piksel,
potongan berkas dan nomor baris, atau tangkapan layar). Audit penuh disimpan di luar repositori
publik karena memuat bahan mentah proposal; yang disalin ke sini hanya yang dibutuhkan untuk
mengerjakan perbaikan.

Setiap kebutuhan diberi **ID stabil** (`R-A11Y-01`, `R-GRAFIK-01`, …) supaya bisa dipakai sebagai
acuan tiket, cabang, dan pesan commit. Kolom **ID audit** menunjukkan asal temuan.

Tingkat prioritas:

| Prioritas | Arti | Batas waktu |
|---|---|---|
| **P1** | Mengubah angka/klaim yang masuk laporan skripsi, atau menyesatkan murid saat memakai simulasi | Sebelum validasi perangkat |
| **P2** | Menghambat pemakaian di kelas (aksesibilitas, tata letak, keterbacaan) | Sebelum uji coba kelas |
| **P3** | Penyempurnaan mutu tampilan dan pemeliharaan | Setelah uji coba kelas |

Setiap kebutuhan wajib memenuhi tiga hal agar bisa dinyatakan selesai: **perilaku** yang berubah,
**kriteria penerimaan** yang bisa diukur, dan **bukti** berupa hasil pengukuran ulang setelah
perbaikan.

### 1.1 Status tiap kebutuhan di rancangan 0.3.0

Tabel ini menjawab satu pertanyaan saja: *apakah kebutuhan ini masih punya barang yang bisa
diperbaiki?* "Tidak berlaku" berarti objeknya sudah dihapus pada Ronde 5 — bukan berarti cacatnya
kambuh.

| ID | Status di 0.3.0 | Sebab |
|---|---|---|
| R-GRAFIK-01 | **Tidak berlaku** | Grafik RPM dihapus bersama panel Data & Analisis |
| R-DATA-01 | **Tidak berlaku** | Tombol "Hapus Semua Data" dan tabel dihapus |
| R-ISTILAH-01 | **Berlaku, diperketat** | Satu besaran satu nama tetap wajib; kini mengikuti bahasa LKPD ("Ketinggian sumber air — H") |
| R-MODEL-01 | **Tidak berlaku** | Garis model dihapus bersama grafik sebar |
| R-DATA-02 | **Digantikan** | Tidak ada pencatatan; padanannya "aliran stabil" + angka dipaku pada nilai model eksak |
| R-PRESET-01 | **Tidak berlaku** | Preset cuaca dihapus |
| R-JEDA-01 | **Tidak berlaku** | Tombol Jeda dihapus; simulasi selalu hidup |
| R-A11Y-01 | **Tidak berlaku** | Dialog Kartu Data dihapus |
| R-A11Y-02 | **Digantikan** | Kanvas dan tabel dihapus; padanannya nama aksesibel untuk SVG dan panel hasil |
| R-KONTRAS-01 | **Berlaku** | Token warna tetap dipakai; seluruh pasangan wajib ≥ 4,5:1 |
| R-KONTRAS-02 | **Berlaku, jadi inti** | Penguncian slider variabel kontrol adalah mekanisme utama 0.3.0, jadi kontrol terkunci wajib tetap terbaca |
| R-A11Y-03 | **Berlaku** | Status mode percobaan tetap harus tersedia secara terprogram |
| R-A11Y-04 | **Berlaku** | `prefers-reduced-motion` tetap wajib |
| R-A11Y-05 | **Berlaku** | Label diagram SVG tetap wajib terbaca di atas latar bergambar |
| R-LAYOUT-01 | **Tidak berlaku** | Tabel dan grafik dihapus |
| R-LAYOUT-02 | **Berlaku** | Tata letak dua kolom desktop tetap dipakai |
| R-LAYOUT-03 | **Berlaku, jadi pekerjaan utama** | Komposisi diagram dibangun ulang total pada Ronde 5 |
| R-VISUAL-01 | **Berlaku** | Skala tipografi tetap dikunci |
| R-VISUAL-02 | **Berlaku** | Irama jarak 4/8 dan satuan warna lewat token tetap dipakai |
| D-01 · D-02 · D-03 | **Tidak berlaku** | Status waduk, CSV, dan legenda RPM semuanya dihapus |

Perbaikan yang **tetap berlaku** itulah yang diwarisi: token warna, target sentuh ≥ 44 px, kontras
AA, `prefers-reduced-motion`, penguncian kontrol yang tetap terbaca, dan komposisi diagram yang
rapi. Selebihnya adalah barang yang sudah tidak ada.

---

## 2. Ruang lingkup

**Termasuk:** `simulasi/index.html`, `simulasi/aset/gaya.css`, `simulasi/aset/inti.js`,
`simulasi/aset/modul-plta.js`, `simulasi/aset/konfigurasi.js`,
`simulasi/aset/fisika.js`, dan `docs/spesifikasi-simulasi.md` bila perbaikan mengubah kontrak
fitur.

**Tidak termasuk:** modul PLTS dan PLTB (belum dikerjakan); integrasi otomatis ke E-LKM
(LiveWorksheets tidak menyediakan API, keputusan Q10 sudah final); pemindahan ke kerangka
build tool; perubahan model fisis kecuali dinyatakan eksplisit di §6.

**Batasan teknis yang tetap berlaku** (dari `spesifikasi-simulasi.md` §12): satu halaman statis,
tanpa build tool, tanpa server, tanpa CDN, skrip klasik bukan modul ES, tanpa `fetch`, harus
berjalan dari `file://` maupun GitHub Pages.

---

## 3. Prinsip yang mengikat

Bagian ini bukan formalitas. Melanggar salah satunya berarti perbaikan ditolak meskipun
temuannya tertutup.

**3.1 Jangan merusak yang sudah benar.** Hal-hal berikut sudah diukur dan **lulus**; sentuhan
yang tidak perlu berisiko menurunkan mutu:

| Aspek | Hasil terukur |
|---|---|
| Model fisis | Penguji model 34 lulus / 0 gagal; daya puncak 73,58 kW = ηρg·0,40·25 tepat |
| Kontras teks aktif pada keadaan diam | 92 elemen diukur, semua lulus WCAG AA, terendah 4,74:1 |
| Penanda fokus papan tik | 18 dari 18 elemen punya outline, `:focus-visible` berperilaku benar, kontras 17,9:1 |
| Luber horizontal | 0 pelaku pada 10 lebar uji (280–1440 px) |
| Tabel 7 kolom di 360 px | muat tanpa geser (312 px di dalam 312 px) |
| Skala kanvas pada DPR 2 | bitmap 2,0× CSS, tidak blur |
| Performa CPU normal | 60 fps, 0 dari 299 frame melebihi 20 ms |
| Memori | heap 1,73 MiB dari batas 4,09 GiB (0,04 %), tanpa kebocoran |
| Galat JavaScript | tidak ada di seluruh skenario uji |
| Diameter pipa pesat | tetap, sesuai prinsip fisis di `spesifikasi-simulasi.md` §8 |

Konsekuensi praktis: **jangan** menambah `:focus-visible` buatan, jangan mengubah
`min-width: 0` pada `.panggung/.samping/.panel`, jangan mengubah
`grid-template-columns: minmax(0, 1fr)`, dan jangan menyentuh `siapkanKanvas()` tanpa mengukur
ulang DPR.

**3.2 Satu percobaan = satu kondisi.** Perbaikan apa pun tidak boleh membuat satu baris data
mewakili lebih dari satu kondisi percobaan. Ini yang menjaga grafik Debit–Energi dan Head–Energi
tetap bermakna.

**3.3 Jaminan durasi seragam tidak boleh bocor.** Semua kelompok harus memperoleh durasi
pengamatan yang sama; energi (kWh) hanya bisa dibandingkan bila durasinya identik.

**3.4 Setiap fitur harus terlacak.** Mengikuti aturan di `CONTEXT.md`, setiap fitur harus bisa
dilacak ke (a) tahapan inquiry, (b) indikator berpikir kritis, atau (c) aspek yang dinilai
instrumen validasi. Fitur yang tidak bisa dilacak ke ketiganya tidak ditambahkan.

**3.5 Istilah mengikuti glosarium.** "murid", bukan "peserta didik"; "E-LKM", bukan "LKPD".
Satu besaran memakai satu nama di seluruh antarmuka.

---

## 4. Kebutuhan P1 — sebelum validasi perangkat

### R-GRAFIK-01 · Grafik RPM vs waktu harus menampilkan fase pemulihan

**Masalah.** Titik grafik hanya didorong saat fase `jalan`, dan waktunya dibandingkan dengan
satuan yang salah, sehingga titik tercatat setiap ≈2,1 detik (bukan 0,08) dan kurva baru mulai
pada detik ke-2. Fase pemulihan 2 detik yang dijanjikan `spesifikasi-simulasi.md` §3.4 tidak
pernah terlihat di grafik.

**Perilaku yang diminta.** Kurva RPM harus mulai dari 0 rpm pada saat Mulai ditekan, naik selama
fase pemulihan, lalu datar pada putaran mantap. Jarak antar titik harus konsisten sepanjang
percobaan.

**Kriteria penerimaan.**

1. Piksel kurva pertama terdeteksi pada `x ≤ 0,2` detik (sekarang 2,0 detik).
2. Tidak ada celah antar titik lebih dari 0,15 detik di sepanjang kurva.
3. Selama fase pemulihan, kurva terlihat menanjak, bukan langsung datar.
4. Jumlah titik per percobaan 120 detik tetap di bawah batas 1.200 yang sudah ada.

**Bukti yang harus disertakan.** Tangkapan layar grafik pada detik ke-1, ke-3, dan ke-20 dari
satu percobaan yang sama, plus jumlah titik terukur.

**Berkas.** `simulasi/aset/inti.js` (gelung utama, `gambarRpm`).

---

### R-DATA-01 · "Hapus Semua Data" harus membersihkan seluruh tampilan

**Masalah.** Penghapusan mengosongkan model data dan menonaktifkan tombol panel, tetapi tabel
dan kedua grafik masih menampilkan baris lama. Pesan status menyatakan "Semua data dihapus."
Saat ini murid melihat dua kenyataan yang bertentangan di satu layar.

**Perilaku yang diminta.** Setelah konfirmasi diterima, tabel, grafik sebar, grafik RPM, penghitung
baris, dan seluruh tombol terkait harus konsisten menampilkan keadaan kosong.

**Kriteria penerimaan.**

1. `#jumlahData` menunjukkan `0`.
2. Tabel menampilkan baris kosong bergaya `.tabel-kosong`, tanpa satu pun `<tr>` data.
3. Kedua kanvas tidak lagi memuat titik/jejak lama.
4. Tombol Kartu Data, Salin Tabel, Unduh CSV, dan Hapus Semua Data kembali nonaktif.
5. Bila penghapusan dilakukan saat percobaan berjalan, percobaan itu ikut dihentikan dan
   dinyatakan di pesan status.

**Bukti.** Tangkapan layar tabel dan kedua grafik segera setelah penghapusan, plus isi
`localStorage` yang sudah kosong.

**Berkas.** `simulasi/aset/inti.js` (`tekanHapus`).

---

### R-ISTILAH-01 · Satu besaran, satu nama

**Masalah.** Besaran yang sama muncul dengan tiga nama: "Ketinggian jatuh (H)" pada pengatur,
"Head (m)" pada kepala tabel dan sumbu grafik, "head" pada teks bantuan. Ini menyulitkan murid
menghubungkan pengatur, tabel, grafik, dan E-LKM.

**Perilaku yang diminta.** Satu istilah dipakai di seluruh antarmuka, dengan istilah Inggris
disertakan sekali dalam tanda kurung agar tetap tersambung ke proposal.

**Kriteria penerimaan.**

1. Istilah baku: **"Tinggi jatuh air (head, H)"** pada label pengatur, kepala tabel, label sumbu,
   teks bantuan, Kartu Data, dan berkas CSV.
2. Nama besaran lain juga diseragamkan: **"Putaran turbin (rpm)"** menggantikan campuran
   "Putaran"/"RPM", sehingga kepala kolom tidak lagi tertulis "RPM (rpm)".
3. Pencarian string `Head` dan `head` yang berdiri sendiri sebagai label mengembalikan nol hasil
   di `index.html`, `konfigurasi.js`, dan `inti.js`.

**Berkas.** `simulasi/index.html`, `simulasi/aset/konfigurasi.js`, `simulasi/aset/inti.js`.

---

### R-MODEL-01 · Garis model tidak boleh tampil sebelum ada data

**Masalah.** Garis putus-putus pembanding model sudah tergambar pada tabel yang masih kosong.
Ini memperlihatkan bentuk hubungan yang justru ingin ditemukan murid pada tahap merumuskan
hipotesis, dan melemahkan `spesifikasi-simulasi.md` §6d.

**Perilaku yang diminta.** Garis model hanya muncul setelah ada sekurangnya satu titik data,
dan hanya bila kotaknya dicentang.

**Kriteria penerimaan.**

1. Pada keadaan kosong, pemindaian piksel kanvas tidak menemukan satu pun piksel warna garis
   model.
2. Setelah satu baris data tercatat, garis model muncul dengan sendirinya pada kondisi bawaan.
3. Kotak centang "Garis model" tetap berfungsi mematikan dan menyalakannya.
4. Keterangan grafik tidak lagi menyebut "perhitungan model" saat belum ada data.

**Berkas.** `simulasi/aset/konfigurasi.js` (`garisModelBawaan`), `simulasi/aset/inti.js`
(`gambarSebar`).

---

### R-DATA-02 · Pencatatan hanya pada kondisi percobaan yang utuh

**Masalah.** "Catat Data" dapat ditekan sejak detik pertama, sehingga satu percobaan dapat
menghasilkan beberapa baris dengan durasi berbeda. Energi antar-baris menjadi tidak sebanding
dan satu kondisi percobaan terpecah menjadi beberapa titik data.

**Perilaku yang diminta.** Satu percobaan menghasilkan tepat satu baris data, dicatat setelah
percobaan selesai.

**Kriteria penerimaan.**

1. Tombol Catat Data nonaktif selama fase belum, berjalan, dan jeda; aktif hanya pada fase selesai.
2. Menekan Catat Data dua kali berturut-turut tidak menambah baris kedua.
3. Setiap baris pada tabel memiliki durasi yang sama dengan durasi target percobaan.

**Berkas.** `simulasi/aset/inti.js` (`perbaruiKunci`, `tekanCatat`).

---

### R-PRESET-01 · Grafik harus konsisten setelah preset diganti

**Masalah.** Preset menentukan batas atas debit dan tinggi jatuh. Setelah data dicatat pada preset
berjangkauan besar lalu preset diganti ke yang lebih sempit, sumbu grafik sebar menyusut tetapi
grafik tidak digambar ulang: titik yang sudah di luar domain tampak masih berada di dalam bidang.
Bila gambar ulang dipaksa, titik-titik itu terpotong dan hilang dari grafik tanpa penjelasan,
padahal tetap dihitung di tabel.

**Perilaku yang diminta.** Grafik, sumbu, dan keterangan selalu mencerminkan keadaan terbaru, dan
titik yang berada di luar domain ditangani secara eksplisit — bukan dipotong diam-diam.

**Kriteria penerimaan.** Salah satu dari dua jalan berikut, dipilih sadar:

- **Jalan A (disarankan):** ganti preset dinonaktifkan selama masih ada data untuk skenario itu;
  pengguna diminta menghapus data lebih dulu, dengan pesan yang menjelaskan alasannya.
- **Jalan B:** grafik selalu digambar ulang setelah ganti preset, dan titik di luar domain
  ditandai terlihat (misalnya panah di tepi bidang) dengan keterangan tertulis berapa titik yang
  berada di luar jangkauan.

Pada kedua jalan: label sumbu dan keterangan tidak boleh menyebut preset atau tinggi jatuh yang
sudah tidak berlaku.

**Bukti.** Tangkapan layar grafik segera setelah ganti preset, plus jumlah titik yang dilaporkan
keterangan.

**Berkas.** `simulasi/aset/inti.js` (`pilihPreset`, `gambarSebar`).

---

### R-JEDA-01 · Jeda harus menghentikan waktu, animasi, dan tidak memotong fase pemulihan

**Masalah.** Dua cacat terpisah pada satu tombol:

1. Menekan Jeda saat fase pemulihan membuat sisa fase 2 detik hilang, sehingga durasi total
   percobaan tidak lagi seragam antar kelompok (terukur 31,67 detik vs 32,08 detik).
2. Selama jeda, animasi roda turbin dan partikel air tetap berjalan, bertentangan dengan
   `spesifikasi-simulasi.md` §9.

**Perilaku yang diminta.** Jeda membekukan waktu, animasi, dan akumulasi energi secara utuh,
termasuk saat fase pemulihan; melanjutkan percobaan meneruskan sisa fase tanpa kehilangan waktu.

**Kriteria penerimaan.**

1. Durasi total percobaan 30 detik dengan satu kali Jeda di fase pemulihan tetap 32 detik
   (toleransi 0,5 detik terhadap percobaan tanpa Jeda).
2. Selama jeda, posisi partikel pipa, sudut roda turbin, dan posisi tetes hujan tidak berubah
   antar dua sampel berjarak 600 ms.
3. Timer tidak bergerak selama jeda.

**Berkas.** `simulasi/aset/inti.js` (`tekanJeda`, gelung utama).

---

### R-A11Y-01 · Dialog Kartu Data harus dapat dipakai dengan papan tik dan pembaca layar

**Masalah.** Fokus tidak pernah dipindahkan ke dalam dialog; delapan dari delapan tekanan Tab
mendarat pada kontrol di belakang lapisan gelap; setelah dialog ditutup fokus hilang ke `body`.

**Perilaku yang diminta.** Dialog berperilaku sebagai modal sesungguhnya.

**Kriteria penerimaan.**

1. Saat dibuka, `document.activeElement` berada di dalam `.kartu-besar`.
2. Tab dan Shift+Tab berputar hanya di antara kontrol di dalam dialog.
3. `main` dan `header` tidak dapat difokus selama dialog terbuka.
4. Halaman di belakang tidak dapat digulir.
5. Escape dan tombol Tutup sama-sama menutup dialog, lalu mengembalikan fokus ke tombol pembuka.

**Berkas.** `simulasi/index.html`, `simulasi/aset/inti.js`.

---

### R-A11Y-02 · Grafik dan tabel harus punya nama aksesibel

**Masalah.** Kedua kanvas dan tabel data diumumkan tanpa nama oleh pembaca layar, sehingga
seluruh isi grafik tidak terjangkau.

**Perilaku yang diminta.** Setiap kanvas dan tabel punya nama dan keterangan yang tertaut.

**Kriteria penerimaan.**

1. Kedua kanvas memiliki `role="img"`, `aria-label` yang menyebut isinya, dan
   `aria-describedby` menunjuk ke kalimat keterangan yang sudah ada.
2. Tabel memiliki `<caption>` yang tersedia bagi pembaca layar namun tidak mengubah tata letak.
3. Seluruh `<th>` memiliki `scope="col"`.
4. Pohon aksesibilitas peramban menampilkan nama untuk kedua kanvas dan tabel.

**Berkas.** `simulasi/index.html`, `simulasi/aset/inti.js`, `simulasi/aset/gaya.css`.

---

## 5. Kebutuhan P2 — sebelum uji coba kelas

### R-KONTRAS-01 · Perbaiki token warna yang gagal kontras

**Masalah.** Tiga kegagalan berasal dari satu hex yang salah. Karena hex itu juga muncul setelah
percobaan berjalan, penyisiran pada keadaan diam melewatkannya.

| Pemakaian | Rasio sekarang | Ambang |
|---|---|---|
| Tombol Catat Data saat aktif (putih di `#1f9d55`) | 3,49:1 | 4,5:1 |
| Teks status selesai (`#1f9d55` di putih) | 3,49:1 | 4,5:1 |
| Dot waduk "Rendah" (`#d98a1f` di `#eef3f8`) | 2,47:1 | 3:1 |

**Perilaku yang diminta.** Semua teks dan indikator memenuhi ambang WCAG 2.1 yang berlaku.

**Kriteria penerimaan.** Dengan perhitungan rumus kontras WCAG:

1. Tombol aksi utama ≥ 4,5:1 terhadap teksnya.
2. Teks status ≥ 4,5:1 pada ketiga keadaannya (biasa, sorot, selesai).
3. Keempat dot kondisi waduk ≥ 3:1 terhadap latar panel.
4. Label putih di dalam titik grafik ≥ 4,5:1 terhadap semua warna seri.

**Nilai usulan (sudah dihitung, bukan perkiraan).** `--hijau: #1f9d55 → #157a43` (5,39:1) ·
`--jingga: #d98a1f → #8a5f10` (5,64:1) · dot "Normal" `#2b7fd4 → #1c62a8` (5,60:1) · dot
"Rendah" ikut `--jingga` baru. Palet seri grafik yang semuanya ≥ 5,6:1:
`#0d47a1` `#a01d12` `#146c3b` `#8a5f10` `#5b2a80` `#00636d` `#8c0d45` `#3b241f`.

**Berkas.** `simulasi/aset/gaya.css`, `simulasi/aset/konfigurasi.js`, `simulasi/aset/inti.js`.

---

### R-KONTRAS-02 · Kontrol terkunci harus tetap terbaca

**Masalah.** Selama percobaan berjalan, kontrol dinonaktifkan dengan `opacity`, sehingga teks
turun ke 1,34–1,51:1 dan pilihan preset yang aktif tidak lagi bisa dibedakan dari yang tidak
aktif (beda latar 1,16:1). Selama 30–120 detik — justru saat murid perlu mengingat kondisi yang
diuji — label kondisi tidak terbaca.

**Catatan kepatuhan.** WCAG mengecualikan komponen nonaktif, sehingga ini **bukan** pelanggaran
level AA. Kebutuhan ini tetap dipertahankan karena dampak praktisnya pada proyektor kelas.

**Kriteria penerimaan.**

1. Tidak ada elemen berteks yang memakai `opacity` untuk menyatakan keadaan nonaktif.
2. Teks kontrol nonaktif ≥ 4,5:1; tombol aksi nonaktif ≥ 4,5:1 terhadap latarnya.
3. Pilihan yang sedang aktif tetap dapat dibedakan saat nonaktif, baik lewat warna **maupun**
   penanda non-warna.

**Berkas.** `simulasi/aset/gaya.css`.

---

### R-A11Y-03 · Status pilihan harus tersedia secara terprogram

**Masalah.** Status terpilih pada tab modul, preset, durasi, dan pemilih grafik hanya dinyatakan
lewat warna, tanpa atribut apa pun. Pembaca layar tidak dapat mengetahui pilihan mana yang aktif;
pengguna dengan buta warna sulit melihatnya.

**Kriteria penerimaan.**

1. Setiap kontrol pilihan menyatakan keadaannya (`aria-pressed` atau `aria-selected`).
2. Setiap pilihan menyertakan penanda non-warna selain latar, sehingga tetap terbaca pada
   tangkapan layar skala abu-abu.
3. Pola yang sudah dipakai tombol "Tampilkan rumus" (`aria-expanded`) dijadikan acuan.

**Berkas.** `simulasi/index.html`, `simulasi/aset/inti.js`, `simulasi/aset/gaya.css`.

---

### R-A11Y-04 · Hormati `prefers-reduced-motion`

**Masalah.** Preferensi pengurangan gerak hanya mematikan animasi tabel, sementara kelima animasi
utama (roda turbin, partikel pipa, jet, gelombang, hujan) tetap berjalan.

**Kriteria penerimaan.** Di bawah emulasi `prefers-reduced-motion: reduce`, tidak ada perubahan
posisi pada roda turbin, partikel pipa, partikel jet, tetes hujan, maupun gelombang muka air
antar dua sampel berjarak 600 ms. Angka pada panel dan jalannya timer tidak terpengaruh.

**Berkas.** `simulasi/aset/inti.js`.

---

### R-A11Y-05 · Keterbacaan teks di dalam kanvas dan label diagram

**Masalah.** Angka sumbu, teks keadaan kosong, label fase, dan garis model berada di bawah ambang
kontras. Label komponen pada diagram menyusut drastis di layar sempit dan tidak terbaca.

**Kriteria penerimaan.**

1. Semua teks kanvas ≥ 4,5:1 terhadap latar kanvas; garis model ≥ 3:1 sebagai elemen non-teks.
2. Ukuran teks kanvas naik dari 11 px ke 12 px atau lebih.
3. Kedua label diagram yang gagal kontras diberi piring latar sehingga ≥ 4,5:1.
4. Pada lebar ≤ 560 px, penamaan komponen tetap tersedia bagi murid — melalui legenda HTML
   sebagai pengganti label yang terlalu kecil, bukan dengan menghapus informasinya.

**Berkas.** `simulasi/aset/inti.js`, `simulasi/aset/modul-plta.js`, `simulasi/index.html`,
`simulasi/aset/gaya.css`.

---

### R-LAYOUT-01 · Tabel dan grafik harus terjangkau di laptop sekolah

**Masalah.** Pada 1366×768 halaman setinggi 1383 px; tabel, kedua grafik, dan panel rumus seluruhnya
di bawah lipatan. Tombol "Catat Data" berada 36 px di bawah tepi bawah layar. Pada 1024×768 —
resolusi umum laptop sekolah lama — halaman mencapai 2365 px karena tata letak masih satu kolom.

**Perilaku yang diminta.** Pada laptop 1366×768 dan 1024×768, murid dapat mengamati diagram dan
menekan "Catat Data" tanpa menggulir bolak-balik setiap percobaan.

**Kriteria penerimaan.**

1. Pada 1366×768 dan 1024×768, tombol "Catat Data" terlihat penuh tanpa menggulir.
2. Pada 1024×768, tata letak memakai dua kolom (bukan satu), sehingga tinggi halaman turun
   di bawah 1500 px.
3. Diagram tetap terbaca setelah pemendekan tinggi; tidak ada label yang terpotong
   (lihat R-LAYOUT-03).

**Pendekatan yang disarankan,** berurutan dari yang termurah: turunkan ambang breakpoint dari
1040 px ke 1000 px; batasi tinggi diagram pada layar pendek; pindahkan tombol "Catat Data" ke
bilah kendali bersama Mulai/Jeda.

**Berkas.** `simulasi/aset/gaya.css`, `simulasi/index.html`.

---

### R-LAYOUT-02 · Kolom samping tidak boleh terpotong saat menempel

**Masalah.** Kolom samping lebih tinggi daripada viewport, sehingga bagian bawahnya terpotong
selama rentang gulir tertentu.

**Kriteria penerimaan.** Pada tinggi viewport ≤ 820 px, tidak ada bagian kolom samping yang
terpotong permanen; seluruh isi dapat dicapai, baik dengan gulir internal maupun dengan melepas
perilaku menempel.

**Berkas.** `simulasi/aset/gaya.css`.

---

### R-LAYOUT-03 · Rapikan komposisi diagram

**Masalah.** Diagram memberi 64 % tingginya untuk langit, sementara seluruh mesin hanya 36 % dan
menempel rata di tepi bawah. Turbin — objek yang putarannya justru menjadi salah satu keluaran
pengukuran — hanya berdiameter 17 % tinggi kanvas. Empat elemen juga terpotong tepi `viewBox`,
termasuk label "Turbin".

**Kriteria penerimaan.**

1. Tidak ada elemen diagram yang terpotong tepi `viewBox` (diverifikasi lewat `getBBox()`
   terhadap seluruh elemen).
2. Bagian mesin menempati sekurangnya 50 % tinggi kanvas.
3. Diameter turbin membesar secara berarti tanpa mengubah susunan wadah → intake → pipa pesat →
   nosel → turbin → generator → saluran keluar.

**Berkas.** `simulasi/aset/modul-plta.js`.

---

### R-VISUAL-01 · Kunci skala tipografi

**Masalah.** Antarmuka memakai 17 ukuran huruf berbeda, sepuluh di antaranya berjejak dalam
rentang 11–14 px dengan selisih 0,3–0,4 px. Selisih sebesar itu tidak terbaca sebagai hierarki,
sehingga tampilan terasa tidak sengaja alih-alih bertingkat.

**Kriteria penerimaan.**

1. Jumlah ukuran huruf yang dipakai **enam** atau kurang, dengan rasio antar langkah ≥ 1,15.
2. Tidak ada dua ukuran berbeda yang selisihnya kurang dari 1 px.
3. Hierarki terbaca: keterangan < label < isi < judul kartu < angka keluaran < timer.

**Berkas.** `simulasi/aset/gaya.css`.

---

### R-VISUAL-02 · Kunci irama jarak dan satukan warna ke token

**Masalah jarak.** Terdapat 16 nilai jarak berbeda, sepuluh di antaranya bukan kelipatan 4 px.

**Masalah warna.** Warna tersebar di luar sistem token: 17 hex literal di CSS di luar `:root`
dan 79 hex literal di JavaScript. Akibatnya tema tidak dapat diubah dari satu tempat, dan salah
satu hex yang tidak melalui token menjadi penyebab langsung kegagalan kontras di R-KONTRAS-01.

**Kriteria penerimaan.**

1. Seluruh padding, gap, dan margin memakai tangga 4/8/12/16/24/32 px.
2. Nol hex literal di `gaya.css` di luar blok definisi token.
3. Warna kanvas dan SVG dibaca dari satu objek konfigurasi warna, bukan ditulis ulang di
   `inti.js` dan `modul-plta.js`.
4. Mengubah satu token warna mengubah seluruh kemunculannya tanpa menyunting berkas lain.

**Berkas.** `simulasi/aset/gaya.css`, `simulasi/aset/konfigurasi.js`,
`simulasi/aset/inti.js`, `simulasi/aset/modul-plta.js`.

---

## 6. Kebutuhan yang menunggu keputusan penulis

Butir berikut **bukan pekerjaan teknis**. Masing-masing mengubah makna fisis atau pedagogis, dan
harus diputuskan pemilik skripsi sebelum dikerjakan.

> **Status: ketiganya sudah diputuskan dan dikerjakan (Ronde 1, 2 & 3, lihat
> [spesifikasi-simulasi.md](spesifikasi-simulasi.md) §15.9–§15.10).** D-01 → opsi **D-01a
> diperluas**: kosakata "waduk" dihapus sama sekali. Baris tinggi jatuh air sempat ditaruh di panel
> Hasil Pengukuran, lalu **dipindah ke label slider head** pada Ronde 3 (Q3 = B), karena panel itu
> khusus hasil ukur sedangkan head adalah besaran yang diatur. D-02 → CSV dipertahankan sebagai
> dokumentasi guru, dengan metadata skenario, tanggal, kelompok, durasi target, dan nama berkas yang
> tidak menyesatkan. D-03 → legenda jejak RPM digambar di HTML di bawah kanvas. Uraian di bawah
> dibiarkan sebagai catatan alasan.

### D-01 · Status "Kondisi waduk" — SELESAI (Ronde 2, Q2 = A)

**Keadaan sekarang.** Label Penuh / Normal / Rendah / Kritis dihitung dari perbandingan tinggi
jatuh yang **diatur murid** terhadap batas maksimum preset. Karena itu tinggi jatuh 12 m bisa
berlabel "Normal" pada satu preset dan "Rendah" pada preset lain lintas.

**Mengapa ini perlu keputusan.** Label itu tidak menambah informasi di luar Daya dan RPM, dan
berisiko menumbuhkan miskonsepsi bahwa waduk adalah besaran yang diamati. Dua jalan:

- **D-01a (murah):** ubah menjadi label relatif yang jujur, misalnya
  "Tinggi jatuh relatif: 75 % · Normal", disertai satu kalimat penjelas.
- **D-01b (mengubah model):** jadikan muka air waduk variabel keadaan yang turun selama
  percobaan. Ini mengubah model fisis dan harus dikonsultasikan kepada pembimbing karena
  menyentuh asumsi "muka air dianggap tetap" pada `spesifikasi-simulasi.md` §3.5.

### D-02 · Bentuk CSV untuk dokumentasi — SELESAI

**Keadaan sekarang.** Berkas CSV hanya memuat tujuh kolom data. Tidak ada skenario, tanggal,
nama kelompok, maupun durasi target. Nama berkas mengikuti preset yang aktif saat pengunduhan,
sehingga berkas bernama `data-plta-hujan.csv` dapat berisi baris dari preset Kemarau.

**Perlu keputusan.** Apakah CSV dipertahankan sebagai dokumentasi guru (maka perlu metadata:
skenario, tanggal, kelompok, durasi target pada baris komentar, dan nama berkas yang tidak
menyesatkan), atau cukup sebagai cadangan pribadi sehingga bentuknya dibiarkan.

### D-03 · Legenda jejak RPM — SELESAI

**Keadaan sekarang.** Setiap percobaan menyimpan label kondisi (debit dan tinggi jatuh), tetapi
label itu tidak pernah digambar, sehingga murid tidak dapat mengetahui kurva pudar mana milik
kondisi mana — padahal itulah alasan fitur ini ada.

**Perlu keputusan.** Apakah legenda ditampilkan langsung di atas kanvas, atau dipindah ke tabel
kecil di bawah grafik agar tidak menutupi area plot pada layar sempit.

---

## 7. Metode verifikasi

Perbaikan dinyatakan selesai hanya bila **lapis pengujian berikut** dijalankan ulang dan
hasilnya disertakan. Sembilan lapis dipakai; nomor 1–3 sudah ada sejak awal, nomor 4–6 menyusul
setelah keputusan hasil grill Ronde 1–3, dan nomor 7–9 setelah Ronde 4.

**1. Penguji model** — memastikan tidak ada perubahan fisis yang tidak disengaja.
Menjalankan penguji model yang sudah ada; hasil wajib tetap **34 lulus / 0 gagal** (jumlahnya naik
dari 26 setelah keputusan kapasitas turbin Ronde 2 Q1 menambah delapan pemeriksaan baru).

**2. Penguji antarmuka** — memastikan alur murid utuh.
Menjalankan penguji antarmuka yang sudah ada: tiga percobaan berurutan, lalu memeriksa durasi
nyata, timer, energi terhadap hitungan tangan, isi tabel, jumlah kurva, dan ketiadaan galat.

**3. Pemeriksaan khusus per kebutuhan.** Setiap kriteria penerimaan di §4–§5 harus dibuktikan
dengan pengukuran, bukan dengan membaca kode. Untuk kebutuhan yang menyangkut tampilan atau
aksesibilitas, bukti berupa nilai terukur (rasio kontras, `getBoundingClientRect`,
`document.activeElement`, `getBBox`, jumlah pilihan di pohon aksesibilitas) ditambah tangkapan
layar pada lebar 360 px, 768 px, 1024 px, dan 1366 px.

**4–9. Lapis rancangan 0.2.x — [TIDAK BERLAKU di 0.3.0].** Nomor 4 sampai 9 di bawah ini menguji
barang yang sudah dihapus: penguji keputusan (27/0), penguji limpasan (8/0), penguji garis model,
penguji tebal jet (8/0), penguji lampu indikator (2/0), dan pemeriksaan visual kondisi ekstrem.
Ketujuh berkasnya **dipindahkan** ke `_analysis/usang/` beserta `_analysis/usang/BACA.md` yang
menerangkan tiap berkas — kegagalannya bukan regresi, melainkan elemen DOM yang sudah tidak ada.
Uraiannya tetap disimpan di bawah karena **metode**-nya masih berlaku: membandingkan angka dan
gambar pada kondisi ekstrem, bukan pada kondisi yang representatif.

> **Lapis 0.3.0 sekarang hanya dua:** penguji model (**43 lulus / 0 gagal**) dan penguji redesign
> (**42 lulus / 0 gagal**). Penguji redesign memeriksa dua respon saja, empat teks terlarang,
> penguncian slider variabel kontrol, kemonotonan daya terhadap H dan Q, tingkat terang, konversi
> kW→MW, kelengkapan unsur gambar, ketiadaan luber di 375 px, dan ketiadaan galat JS.

**4. Penguji perilaku keputusan** (`_analysis/uji-keputusan.js`) — memastikan setiap keputusan
hasil grill benar-benar berjalan di halaman, bukan hanya tertulis di dokumen. Kini **27 lulus /
0 gagal**, mencakup "—" selama pemulihan, kartu preset tanpa "H maks", penanda kapasitas yang
tampil dan disembunyikan sesuai jangkauan preset, keterangan Ulangi vs Hapus, catatan melimpas,
metadata CSV, dan siluet turbin crossflow.

**5. Penguji limpasan** (`_analysis/uji-limpasan.js`) — memastikan limpasan **tergambar**, bukan
sekadar tertulis. Ia menghitung partikel jet dan partikel saluran limpasan yang benar-benar
terlihat (opacity > 0,05) pada tiga debit, dan membuktikan bahwa 0,40 dan 0,60 m³/s tidak lagi
identik secara visual meski dayanya sama. **8 lulus / 0 gagal.**

**6. Penguji garis model** (`_analysis/uji-garis-model.js`) — pasangan berlawanan dari penguji
antarmuka. Penguji antarmuka memakai tiga head berbeda sehingga garis model harus TIDAK digambar;
penguji ini memakai head seragam 15,0 m dengan tiga debit sehingga garis model harus MUNCUL, dan
keterangannya harus menyebut 15,0 m tanpa kata "data terakhir". Keempat grafik diperiksa satu per
satu. Regresi di sini berarti aturan keseragaman patah di salah satu arah.

**7. Penguji tebal jet** (`_analysis/uji-jet.js`) — memastikan jet **menipis** ketika debit turun,
karena pada head tetap kecepatan jet tetap dan debitnya diatur bukaan nosel. Mengukur tebal pita
`#plta-pita-jet` dari atribut `d`, sebaran melintang butir, dan bukaan guide vane pada tujuh debit
(Q 0,05 → 0,60 m³/s). **8 lulus / 0 gagal**; tebal pita 10,4 → 34,0 unit, tetap penuh di atas
kapasitas.

**8. Penguji lampu indikator** (`_analysis/uji-lampu.js`) — memastikan jumlah lampu **hanya**
bergantung pada daya. Membandingkan keempat preset pada Q 0,20 m³/s dan H 25 m: dayanya harus
identik (36,79 kW) **dan** jumlah lampunya harus identik. Sebelum Ronde 4 lapis ini gagal
(3 lampu di Kemarau vs 2 di preset lain); sekarang **2 lulus / 0 gagal**.

**9. Pemeriksaan visual** — tangkapan layar pada kondisi yang ekstrem, bukan yang representatif:
Q terendah, Q tepat kapasitas, Q di atas kapasitas, dan head maksimum di tiap preset. Yang dicari
bukan "apakah tampak bagus", melainkan **apakah gambar menyangkal angka**: apakah air yang
melimpas terlihat, apakah jet menipis, apakah jumlah lampu masuk akal. Dua bug di Ronde 4 hanya
tertangkap karena lapis 7 dan 8 memaksa angka dibandingkan, sementara tiga ronde sebelumnya lolos
pemeriksaan mata.

> Catatan metode: penguji membaca atribut `opacity`, bukan `style.opacity`, karena
> `modul-plta.js` menyetelnya lewat `setAttribute`. Penguji juga wajib menekan "Ulangi Percobaan"
> di antara percobaan — selama fase berjalan, `pilihPreset()` dan penangan slider sama-sama
> menolak bertindak, sehingga nilai baru akan diabaikan tanpa pesan apa pun.

**Ambang regresi.** Perbaikan ditolak bila menurunkan salah satu angka pada §3.1 — khususnya fps,
kontras teks aktif, ketiadaan luber horizontal, atau jumlah model yang lulus.

---

## 8. Matriks keterlacakan

Kolom **Status 0.3.0** memakai singkatan: **B** = masih berlaku, **T** = tidak berlaku (barangnya
dihapus pada Ronde 5), **G** = digantikan padanan baru.

| Requirement | Prioritas | Status 0.3.0 | ID audit asal | Berkas utama |
|---|---|---|---|---|
| R-GRAFIK-01 | P1 | T | Grafik RPM: sampling dan fase pemulihan | `inti.js` |
| R-DATA-01 | P1 | T | Hapus Semua Data tidak membersihkan tampilan | `inti.js` |
| R-ISTILAH-01 | P1 | B | Satu besaran tiga nama | `index.html`, `konfigurasi.js`, `inti.js` |
| R-MODEL-01 | P1 | T | Garis model tampil sebelum ada data | `konfigurasi.js`, `inti.js` |
| R-DATA-02 | P1 | G | Catat Data dapat ditekan di tengah percobaan | `inti.js` |
| R-PRESET-01 | P1 | T | Grafik basi dan titik terpotong setelah ganti preset | `inti.js` |
| R-JEDA-01 | P1 | T | Jeda memotong fase pemulihan dan tidak menghentikan animasi | `inti.js` |
| R-A11Y-01 | P1 | T | Dialog tanpa pemindahan dan jebakan fokus | `index.html`, `inti.js` |
| R-A11Y-02 | P1 | G | Kanvas dan tabel tanpa nama aksesibel | `index.html`, `inti.js`, `gaya.css` |
| R-KONTRAS-01 | P2 | B | Token hijau/jingga gagal kontras saat aktif | `gaya.css`, `konfigurasi.js`, `inti.js` |
| R-KONTRAS-02 | P2 | B | Kontrol terkunci nyaris tak terbaca | `gaya.css` |
| R-A11Y-03 | P2 | B | Status pilihan hanya lewat warna | `index.html`, `inti.js`, `gaya.css` |
| R-A11Y-04 | P2 | B | `prefers-reduced-motion` tidak dihormati | `inti.js` |
| R-A11Y-05 | P2 | B | Kontras kanvas dan label diagram | `inti.js`, `modul-plta.js`, `index.html`, `gaya.css` |
| R-LAYOUT-01 | P2 | T | Tabel dan grafik di bawah lipatan | `gaya.css`, `index.html` |
| R-LAYOUT-02 | P2 | B | Kolom samping terpotong saat menempel | `gaya.css` |
| R-LAYOUT-03 | P2 | B | Komposisi diagram dan elemen terpotong | `modul-plta.js` |
| R-VISUAL-01 | P2 | B | Skala tipografi 17 langkah | `gaya.css` |
| R-VISUAL-02 | P2 | B | Irama jarak dan warna di luar token | `gaya.css`, `konfigurasi.js`, `inti.js`, `modul-plta.js` |
| D-01 | Keputusan | T | Status Kondisi waduk — dihapus bersama panel hasil lama | — |
| D-02 | Keputusan | T | Bentuk CSV dokumentasi — CSV dihapus | — |
| D-03 | Keputusan | T | Legenda jejak RPM — grafik RPM dihapus | `inti.js`, `gaya.css` |

---

## 9. Urutan pengerjaan yang disarankan — [RIWAYAT, sudah dijalankan]

Lima tahap di bawah ini **selesai dikerjakan** pada rancangan 0.2.x, lalu seluruh bangunan yang
mereka rapikan diganti pada Ronde 5. Bagian ini disimpan sebagai riwayat: ia menunjukkan bahwa
sebelum mengganti sesuatu, cacatnya lebih dulu dibuktikan ada.

Perbaikan disusun agar setiap tahap dapat diverifikasi sendiri dan tidak menumpuk risiko.

**Tahap 1 — cacat perilaku murni (tanpa keputusan desain).**
R-GRAFIK-01, R-DATA-01, R-DATA-02, R-MODEL-01, R-JEDA-01, R-ISTILAH-01.
Semuanya berukuran kecil dan menutup dua cacat kritis. Setelah tahap ini, jalankan penguji
antarmuka untuk memastikan alur murid tetap utuh.

**Tahap 2 — aksesibilitas dasar.**
R-A11Y-01, R-A11Y-02, R-KONTRAS-01, R-A11Y-04.
Tidak mengubah tata letak, sehingga aman dikerjakan sebelum penyesuaian visual.

**Tahap 3 — tata letak dan komposisi.**
R-LAYOUT-01, R-LAYOUT-02, R-LAYOUT-03, R-VISUAL-01, R-VISUAL-02.
Dikerjakan bersama karena sama-sama menyentuh `gaya.css` dan saling memengaruhi.

**Tahap 4 — sisa aksesibilitas dan perilaku.**
R-PRESET-01, R-KONTRAS-02, R-A11Y-03, R-A11Y-05.

**Tahap 5 — menunggu keputusan penulis.**
D-01, D-02, D-03 — **sudah diputuskan dan dikerjakan** (lihat catatan status di awal §6). Tahap ini
tuntas.

---

## 10. Di luar lingkup

- Perbaikan modul PLTS dan PLTB (belum dibangun).
- Integrasi otomatis ke E-LKM — LiveWorksheets tidak menyediakan API, webhook, maupun
  `postMessage`, dan tidak dapat menyematkan aplikasi luar. Keputusan ini sudah final.
- Penggantian kanvas grafik dengan pustaka pihak ketiga (melanggar batasan tanpa CDN).
- Perubahan nilai efisiensi sistem dan putaran acuan — keduanya menunggu konfirmasi pembimbing.
- Penambahan fitur baru yang tidak berasal dari temuan audit.
