/* Alur energi PLTA: tujuh tahap dari waduk sampai rumah warga.
   Skrip klasik — dipakai lewat window.PLTAProcess.
   Angka yang disebut di sini mengikuti physics.js: P = 0,0083385 × H × Q (MW)
   pada mode dasar, yaitu ρ × g × Q × H × η dengan η = 85%. Kapasitas 50 MW,
   tinggi maksimum 100 m, batas operasi 15 m, luas tampungan 1 km². */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PLTAProcess = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var PROCESS_STAGES = [
    {
      id: 'waduk',
      title: '01 Waduk',
      text: 'Waduk menyimpan air dan menentukan tinggi jatuh (head). Pada model ini luas tampungan tetap 1 km², tinggi maksimum 100 m, dan batas operasi 15 m. Air masuk dari sungai menambah tampungan; pelepasan turbin, kanal lain, dan pelimpah menguranginya. Bila tinggi menyentuh batas operasi, turbin berhenti sampai air naik lagi. Bendungan beton pada ilustrasi adalah sketsa: kestabilan strukturnya tidak dihitung.'
    },
    {
      id: 'pipa',
      title: '02 Pipa pesat',
      text: 'Pipa pesat mengalirkan air bertekanan dari waduk ke turbin. Pada mode operasi, gesekan pipa mengurangi head: kerugian dihitung 3 m pada debit acuan 100 m³/s dan naik mengikuti kuadrat debit. Karena itu head bersih selalu lebih kecil daripada selisih tinggi air dan tailwater. Efisiensi turbin juga menurun saat debit jauh dari titik rancangannya.'
    },
    {
      id: 'turbin',
      title: '03 Turbin',
      text: 'Air yang jatuh memutar turbin dan menyerahkan energi potensialnya. Daya yang dihasilkan mengikuti P = ρ × g × Q × H × η. Pada mode dasar, H dan Q tetap sesuai pengaturan sehingga P = 0,0083385 × H × Q dan tidak berubah selama percobaan. Contoh: Q = 40 m³/s dan H = 60 m menghasilkan 20,01 MW. Air yang sudah memutar turbin tetap kembali ke sungai, bukan hilang.'
    },
    {
      id: 'generator',
      title: '04 Generator',
      text: 'Poros menghubungkan turbin dan generator. Generator mengubah putaran menjadi listrik, dengan efisiensi gabungan yang dipakai model sekitar 85% pada mode dasar. Pada mode operasi, efisiensi mengikuti kurva 65–90% tergantung debit. Keluaran dibatasi kapasitas 50 MW, jadi menambah debit atau tinggi air tidak selalu menambah daya. Kecepatan putar pada ilustrasi bersifat hiasan dan tidak dipakai menghitung daya.'
    },
    {
      id: 'gardu',
      title: '05 Gardu',
      text: 'Trafo penaik tegangan di gardu menaikkan tegangan sebelum daya dikirim, sehingga arus lebih kecil dan rugi saluran berkurang. Model ini tidak menghitung rugi trafo secara terpisah: tahap ini menunjukkan alur energi, bukan menambah faktor efisiensi baru. Angka daya yang terbaca di simulasi adalah daya di ujung generator.'
    },
    {
      id: 'transmisi',
      title: '06 Transmisi',
      text: 'Saluran transmisi membawa daya dari gardu menuju pusat beban. Sama seperti trafo, rugi transmisi tidak dimodelkan sebagai pengali tersendiri; yang memengaruhi daya hanyalah tinggi air, debit, kerugian pipa, dan efisiensi turbin-generator. Ilustrasi menara dan kabel menunjukkan perpindahan energi, bukan panjang saluran sebenarnya.'
    },
    {
      id: 'rumah',
      title: '07 Rumah',
      text: 'Sebelum masuk rumah, trafo distribusi menurunkan tegangan ke tingkat yang aman dipakai. Rumah mewakili sekumpulan pelanggan dengan beban contoh 5, 20, atau 40 MW. Lampu rumah menyala bila daya tersedia mencukupi beban itu. Lampu padam pada ilustrasi berarti pasokan contoh belum cukup, bukan berarti rumah pada jaringan nyata langsung kehilangan listrik.'
    }
  ];

  var PROCESS_SCOPE = 'Alur ini menunjukkan urutan pengubahan energi pada model PLTA, bukan diagram instalasi nyata. Model menghitung tinggi air, debit, kerugian pipa, dan efisiensi turbin-generator; rugi trafo dan saluran transmisi tidak ditambahkan agar hubungan antarbesaran mudah dipelajari.';

  function processOverview() {
    var items = PROCESS_STAGES.map(function (stage, index) {
      return '<li><strong>' + stage.title + '</strong><span>' + stage.text.split('. ')[0] + '.</span></li>';
    }).join('');
    return '<h2>Aliran energi PLTA</h2>' +
      '<p class="hint">Tekan label tahap pada gambar untuk membaca rinciannya.</p>' +
      '<ol class="stage-overview">' + items + '</ol>' +
      '<p>' + PROCESS_SCOPE + '</p>';
  }

  return Object.freeze({
    PROCESS_STAGES: PROCESS_STAGES,
    PROCESS_SCOPE: PROCESS_SCOPE,
    processOverview: processOverview
  });
});
