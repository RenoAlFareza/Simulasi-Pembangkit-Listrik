/* ============================================================================
   konfigurasi.js — seluruh angka yang boleh berubah ada di sini.
   ----------------------------------------------------------------------------
   Tidak menyentuh DOM. Dimuat sebagai skrip klasik (bukan modul ES) supaya
   simulasi tetap jalan ketika berkasnya dibuka langsung dari folder (file://),
   tempat modul ES dan fetch() gagal karena origin-nya null.

   Rancangan 0.3.0 (redesign Ronde 5) mengikuti LKPD praktikum:
   yang diubah siswa hanya dua besaran (ketinggian sumber air dan debit air),
   yang diamati hanya dua respon (daya listrik dan tingkat terang lampu).
   Energi, putaran turbin, durasi, tabel data, dan grafik DIHAPUS dari
   antarmuka karena tidak diminta LKPD.
   ========================================================================= */
var KONFIG = {

  versi: '0.3.0',
  modulAktif: 'plta',

  /* --- model fisis ------------------------------------------------------ */
  fisika: {
    rho: 1000,      // kg/m3   massa jenis air
    g: 9.81,        // m/s2    percepatan gravitasi
    eta: 0.75,      // -       efisiensi sistem pada titik beban acuan
    rpmAcuan: 900,  // rpm     putaran pada kondisi acuan (hanya untuk animasi)
    qAcuan: 0.30,   // m3/s    debit acuan
    hAcuan: 15,     // m       head acuan
    luasPipa: 0.28  // m2      luas penampang pipa pesat (diameter tetap)
  },

  /* --- rentang kedua pengatur ------------------------------------------ */
  rentang: {
    qMin: 0.05, qMaks: 0.60, qLangkah: 0.01,   // m3/s
    hMin: 4,    hMaks: 25,   hLangkah: 0.5     // m
  },

  /* --- pilihan percobaan ------------------------------------------------
     LKPD meminta siswa memilih satu percobaan, mengubah HANYA variabel
     manipulasi, dan menjaga variabel kontrol tetap. Pilihan ini yang
     menjaganya: besaran kontrol dikunci pada satu nilai.                    */
  percobaan: [
    {
      id: 'tinggi',
      nomor: 1,
      judul: 'Ubah ketinggian',
      manipulasi: 'ketinggian sumber air',
      ubah: 'h',
      kunci: { q: 0.30 },
      catatan: 'Debit air dijaga tetap 0,30 m³/s.'
    },
    {
      id: 'debit',
      nomor: 2,
      judul: 'Ubah debit air',
      manipulasi: 'debit air',
      ubah: 'q',
      kunci: { h: 15 },
      catatan: 'Ketinggian sumber air dijaga tetap 15,0 m.'
    }
  ],

  bawaan: { percobaan: 'tinggi', q: 0.30, h: 15 },

  /* --- tingkat terang lampu --------------------------------------------
     Ambang memakai daya listrik (kW) apa adanya, bukan persentase terhadap
     sesuatu. Lampu dianggap perangkat dengan daya nominal tetap: di bawah
     2 kW tidak menyala, di atas 40 kW menyala penuh.                        */
  terang: {
    ambang: [
      { min: 40, level: 3, label: 'Terang',  kelas: 'terang' },
      { min: 12, level: 2, label: 'Sedang',  kelas: 'sedang' },
      { min: 2,  level: 1, label: 'Redup',   kelas: 'redup'  },
      { min: 0,  level: 0, label: 'Mati',    kelas: 'mati'   }
    ],
    matiKW: 1.5,     // di bawah ini cahaya benar-benar padam
    penuhKW: 45      // di atas ini cahaya paling terang (untuk kehalusan animasi)
  },

  /* --- saklar perilaku -------------------------------------------------- */
  animasi: {
    kecepatan: 1,       // pengali kecepatan animasi (1 = normal)
    detikRedam: 0.35    // lama animasi menyusul perubahan pengatur (detik)
  },
  rumusTerbukaBawaan: false
};
