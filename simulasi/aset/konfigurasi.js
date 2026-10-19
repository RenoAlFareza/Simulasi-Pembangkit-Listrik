/* ============================================================================
   konfigurasi.js — seluruh angka yang boleh berubah ada di sini.
   ----------------------------------------------------------------------------
   Tidak menyentuh DOM. Dimuat sebagai skrip klasik (bukan modul ES) supaya
   simulasi tetap jalan ketika berkasnya dibuka langsung dari folder (file://),
   tempat modul ES dan fetch() gagal karena origin-nya null.
   ========================================================================= */
var KONFIG = {

  versi: '0.1.0',
  modulAktif: 'plta',

  /* --- model fisis ------------------------------------------------------ */
  fisika: {
    rho: 1000,        // kg/m3   massa jenis air
    g: 9.81,          // m/s2    percepatan gravitasi
    eta: 0.75,        // -       efisiensi sistem gabungan
    rpmAcuan: 900,    // rpm     putaran pada kondisi acuan
    qAcuan: 0.30,     // m3/s    debit acuan
    hAcuan: 15,       // m       head acuan
    detikMulai: 2,    // s       fase turbin berputar naik sebelum timer jalan
    luasPipa: 0.28    // m2      luas penampang pipa pesat (diameter tetap)
  },

  /* --- rentang pengatur ------------------------------------------------ */
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

  /* --- ambang kondisi waduk (bagian dari H_maks preset) ---------------- */
  ambangWaduk: [
    { min: 0.90, label: 'Penuh',  warna: '#1f9d55' },
    { min: 0.50, label: 'Normal', warna: '#2b7fd4' },
    { min: 0.25, label: 'Rendah', warna: '#d98a1f' },
    { min: 0.00, label: 'Kritis', warna: '#c0392b' }
  ],

  /* --- preset skenario lingkungan -------------------------------------- */
  /* Mengubah tampilan DAN menetapkan ketersediaan air. Satu preset dipakai
     untuk satu aktivitas, sehingga tidak menjadi variabel pengganggu.      */
  preset: [
    {
      id: 'kemarau',
      nama: 'Kemarau',
      qMaks: 0.20, hMaks: 12,
      langitAtas: '#a8d8f0', langitBawah: '#f7ecc8',
      matahari: true, awan: 0.10, hujan: false,
      gelombangAmp: 1.6, gelombangPeriode: 5.0,
      keterangan: 'Musim kering. Air sedikit, muka waduk surut.'
    },
    {
      id: 'cerah',
      nama: 'Cerah',
      qMaks: 0.40, hMaks: 20,
      langitAtas: '#7cc2ea', langitBawah: '#dff2fb',
      matahari: true, awan: 0.35, hujan: false,
      gelombangAmp: 2.4, gelombangPeriode: 3.6,
      keterangan: 'Kondisi biasa. Debit dan head sedang.'
    },
    {
      id: 'mendung',
      nama: 'Mendung',
      qMaks: 0.50, hMaks: 22,
      langitAtas: '#8e9aa6', langitBawah: '#c8ced4',
      matahari: false, awan: 0.85, hujan: false,
      gelombangAmp: 3.2, gelombangPeriode: 2.8,
      keterangan: 'Menuju musim basah. Air mulai bertambah.'
    },
    {
      id: 'hujan',
      nama: 'Hujan',
      qMaks: 0.60, hMaks: 25,
      langitAtas: '#5d6b78', langitBawah: '#9aa6b0',
      matahari: false, awan: 1.00, hujan: true,
      gelombangAmp: 4.2, gelombangPeriode: 2.2,
      keterangan: 'Musim basah. Air berlimpah, waduk penuh.'
    }
  ],

  /* --- skema kolom tabel data ------------------------------------------
     PROVISIONAL. Begitu E-LKM disetujui, urutan dan label di sini disamakan
     dengan tabel pengamatan E-LKM; tidak ada bagian lain yang perlu diubah. */
  kolom: [
    { kunci: 'q', label: 'Debit',  satuan: 'm³/s', desimal: 2 },
    { kunci: 'h', label: 'Head',   satuan: 'm',    desimal: 1 },
    { kunci: 't', label: 'Durasi', satuan: 's',    desimal: 0 },
    { kunci: 'p', label: 'Daya',   satuan: 'kW',   desimal: 2 },
    { kunci: 'e', label: 'Energi', satuan: 'kWh',  desimal: 3 },
    { kunci: 'n', label: 'RPM',    satuan: 'rpm',  desimal: 0 }
  ],

  /* --- pilihan grafik sebar -------------------------------------------- */
  grafik: [
    { id: 'q-p', x: 'q', y: 'p', judul: 'Debit vs Daya',  xLabel: 'Debit (m³/s)', yLabel: 'Daya (kW)'  },
    { id: 'h-p', x: 'h', y: 'p', judul: 'Head vs Daya',   xLabel: 'Head (m)',     yLabel: 'Daya (kW)'  },
    { id: 'q-e', x: 'q', y: 'e', judul: 'Debit vs Energi', xLabel: 'Debit (m³/s)', yLabel: 'Energi (kWh)' },
    { id: 'h-e', x: 'h', y: 'e', judul: 'Head vs Energi',  xLabel: 'Head (m)',     yLabel: 'Energi (kWh)' }
  ]
};
