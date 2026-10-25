/* ============================================================================
   konfigurasi.js — seluruh angka yang boleh berubah ada di sini.
   ----------------------------------------------------------------------------
   Tidak menyentuh DOM. Dimuat sebagai skrip klasik (bukan modul ES) supaya
   simulasi tetap jalan ketika berkasnya dibuka langsung dari folder (file://),
   tempat modul ES dan fetch() gagal karena origin-nya null.
   ========================================================================= */
var KONFIG = {

  versi: '0.2.0',
  modulAktif: 'plta',

  /* --- model fisis ------------------------------------------------------ */
  fisika: {
    rho: 1000,        // kg/m3   massa jenis air
    g: 9.81,          // m/s2    percepatan gravitasi
    eta: 0.75,        // -       efisiensi sistem PADA TITIK BEBAN ACUAN, bukan
                      //         efisiensi turbin pada semua beban. Konstannya
                      //         dibayar dengan membatasi kapasitas turbin di
                      //         bawah, bukan dengan membuat η melengkung.
    rpmAcuan: 900,    // rpm     putaran pada kondisi acuan
    qAcuan: 0.30,     // m3/s    debit acuan
    hAcuan: 15,       // m       head acuan
    detikMulai: 2,    // s       fase turbin berputar naik sebelum timer jalan
    luasPipa: 0.28,   // m2      luas penampang pipa pesat (diameter tetap)
    qKapasitas: 0.40  // m3/s    debit maksimum yang bisa dilewatkan turbin.
                      //         Air di atas batas ini melimpas (spill): tidak
                      //         menambah daya listrik dan tidak menambah putaran.
  },

  /* --- rentang pengatur ------------------------------------------------
     Head adalah sifat SITUS (tinggi bendung dan topografi), bukan sifat musim:
     rentang 4–25 m terbuka penuh di semua skenario cuaca. Cuaca hanya mengubah
     ketersediaan debit.                                                      */
  rentang: {
    qMin: 0.05, qMaks: 0.60, qLangkah: 0.01,   // m3/s
    hMin: 4,    hMaks: 25,   hLangkah: 0.5     // m
  },

  /* --- durasi percobaan ------------------------------------------------ */
  durasi: {
    pilihan: [30, 60, 90, 120],   // detik
    bawaan: 60
  },

  /* --- saklar perilaku (bisa dibalik tanpa menyentuh logika) ----------- */
  kunciSaatBerjalan: true,     // true: slider & preset terkunci selama percobaan
  kecepatanAnimasi: 1,         // pengali kecepatan animasi (1 = normal)
  garisModelBawaan: true,      // tampilkan garis model pada grafik sebar
  rumusTerbukaBawaan: false,   // panel rumus mulai dalam keadaan tertutup

  /* --- preset skenario lingkungan --------------------------------------
     Preset HANYA mengubah dua hal: ketersediaan debit (qMaks) dan tampilan
     visual (langit, matahari, awan, hujan, gelombang). Preset TIDAK membatasi
     tinggi jatuh air — head sifat situs, 4–25 m terbuka di semua preset.
     Satu preset dipakai untuk satu aktivitas, sehingga tidak menjadi variabel
     pengganggu. Kalimat keterangan hanya boleh menyebut debit dan langit;
     menyebut "muka waduk surut" akan salah setelah head lepas dari cuaca.   */
  preset: [
    {
      id: 'kemarau',
      nama: 'Kemarau',
      qMaks: 0.20,
      langitAtas: '#a8d8f0', langitBawah: '#f7ecc8',
      matahari: true, awan: 0.10, hujan: false,
      gelombangAmp: 1.6, gelombangPeriode: 5.0,
      keterangan: 'Musim kering. Persediaan air paling sedikit; langit cerah.'
    },
    {
      id: 'cerah',
      nama: 'Cerah',
      qMaks: 0.40,
      langitAtas: '#7cc2ea', langitBawah: '#dff2fb',
      matahari: true, awan: 0.35, hujan: false,
      gelombangAmp: 2.4, gelombangPeriode: 3.6,
      keterangan: 'Cuaca cerah berawan. Persediaan air sedang.'
    },
    {
      id: 'mendung',
      nama: 'Mendung',
      qMaks: 0.50,
      langitAtas: '#8e9aa6', langitBawah: '#c8ced4',
      matahari: false, awan: 0.85, hujan: false,
      gelombangAmp: 3.2, gelombangPeriode: 2.8,
      keterangan: 'Langit mendung. Persediaan air mulai bertambah.'
    },
    {
      id: 'hujan',
      nama: 'Hujan',
      qMaks: 0.60,
      langitAtas: '#5d6b78', langitBawah: '#9aa6b0',
      matahari: false, awan: 1.00, hujan: true,
      gelombangAmp: 4.2, gelombangPeriode: 2.2,
      keterangan: 'Langit gelap dan hujan. Persediaan air paling banyak.'
    }
  ],

  /* --- skema kolom tabel data ------------------------------------------
     PROVISIONAL. Begitu E-LKM disetujui, urutan dan label di sini disamakan
     dengan tabel pengamatan E-LKM; tidak ada bagian lain yang perlu diubah.
     Istilah baku: "Tinggi jatuh air (head, H)" dan "Putaran turbin (rpm)".
     Kolom h memakai "Tinggi jatuh air" agar kepala tabel tidak terlalu lebar. */
  kolom: [
    { kunci: 'q', label: 'Debit',  satuan: 'm³/s', desimal: 2 },
    { kunci: 'h', label: 'Tinggi jatuh air', satuan: 'm', desimal: 1 },
    { kunci: 't', label: 'Durasi', satuan: 's',    desimal: 0 },
    { kunci: 'p', label: 'Daya',   satuan: 'kW',   desimal: 2 },
    { kunci: 'e', label: 'Energi', satuan: 'kWh',  desimal: 3 },
    { kunci: 'n', label: 'Putaran', satuan: 'rpm', desimal: 0 }
  ],

  /* --- pilihan grafik sebar -------------------------------------------- */
  grafik: [
    { id: 'q-p', x: 'q', y: 'p', judul: 'Debit vs Daya',  xLabel: 'Debit (m³/s)', yLabel: 'Daya (kW)'  },
    { id: 'h-p', x: 'h', y: 'p', judul: 'Tinggi jatuh air vs Daya',   xLabel: 'Tinggi jatuh air (m)',     yLabel: 'Daya (kW)'  },
    { id: 'q-e', x: 'q', y: 'e', judul: 'Debit vs Energi', xLabel: 'Debit (m³/s)', yLabel: 'Energi (kWh)' },
    { id: 'h-e', x: 'h', y: 'e', judul: 'Tinggi jatuh air vs Energi',  xLabel: 'Tinggi jatuh air (m)',     yLabel: 'Energi (kWh)' }
  ]
};
