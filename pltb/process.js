/* Alur energi PLTB: sembilan tahap dari rotor sampai rumah warga.
   Skrip klasik — dipakai lewat window.PLTBProcess. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PLTBProcess = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var PROCESS_STAGES = [
    {
      id: 'rotor',
      title: '01 Rotor',
      text: 'Tiga bilah menangkap energi kinetik angin dan memutar poros lambat. Luas sapuan rotor A = πr² dengan r = 20 m, jadi sekitar 1.256 m². Daya yang tersedia di udara mengikuti ½ × ρ × A × v³; karena v dipangkatkan tiga, kecepatan angin berpengaruh paling besar.'
    },
    {
      id: 'gearbox',
      title: '02 Gearbox',
      text: 'Poros lambat berputar sekitar 20–40 rpm. Gearbox menaikkan putaran menjadi sekitar 1.500 rpm agar cocok dengan generator. Pada model ini kecepatan rotor mengikuti rasio tip-speed optimal tiap jumlah bilah, lalu menstabil dalam sekitar dua detik.'
    },
    {
      id: 'generator',
      title: '03 Generator',
      text: 'Generator mengubah putaran menjadi listrik. Daya generator = daya angin × Cp × η. Cp adalah bagian daya angin yang ditangkap rotor (puncak sintetis 0,45 untuk 2 bilah, 0,46 untuk 3 bilah, 0,44 untuk 4 bilah) dan η efisiensi generator diasumsikan 90%. Keluaran dibatasi kapasitas 500 kW.'
    },
    {
      id: 'converter',
      title: '04 Konverter & trafo',
      text: 'Konverter menyelaraskan tegangan dan frekuensi keluaran yang berubah-ubah sebelum masuk trafo unit. Pada model ini rangkaian konverter dan trafo unit digabung dengan asumsi efisiensi 97%.'
    },
    {
      id: 'stepup',
      title: '05 Gardu penaik',
      text: 'Trafo penaik menaikkan tegangan agar arus lebih kecil dan rugi saluran turun. Asumsi efisiensi trafo 98%. Setelah tahap ini daya siap dikirim melalui saluran transmisi.'
    },
    {
      id: 'transmission',
      title: '06 Transmisi',
      text: 'Saluran transmisi membawa daya ke pusat beban. Rugi jaringan diasumsikan 98% efisiensi. Total efisiensi penyaluran model ini 97% × 98% × 98% ≈ 93,2%, jadi daya yang sampai ke beban selalu lebih kecil daripada daya generator.'
    },
    {
      id: 'stepdown',
      title: '07 Gardu penurun',
      text: 'Trafo penurun gardu induk menurunkan tegangan transmisi ke tegangan distribusi. Tahap ini masih memakai asumsi gabungan trafo 98%; pada ilustrasi hanya ditandai sebagai bagian alur, bukan perhitungan terpisah.'
    },
    {
      id: 'distribution',
      title: '08 Trafo distribusi',
      text: 'Trafo distribusi menurunkan tegangan ke tingkat yang aman dipakai rumah dan sekolah. Jaringan tegangan rendah ini menyalurkan daya ke pelanggan; rugi teknisnya sudah tercakup dalam asumsi 98% jaringan pada perhitungan penyaluran.'
    },
    {
      id: 'homes',
      title: '09 Rumah warga',
      text: 'Rumah mewakili sekumpulan pengguna dengan beban kawasan 50, 100, atau 200 kW. Lampu rumah menyala bila daya yang sampai ke beban mencukupi kebutuhan itu. Lampu padam pada ilustrasi berarti kontribusi pembangkit contoh belum cukup, bukan berarti rumah pada jaringan nyata langsung kehilangan listrik.'
    }
  ];

  var PROCESS_SCOPE = 'Alur ini menunjukkan urutan pengubahan energi pada model PLTB, bukan diagram instalasi nyata. Setiap tahap memakai asumsi efisiensi sederhana agar hubungan antarbesaran mudah dipelajari.';

  function processOverview() {
    var items = PROCESS_STAGES.map(function (stage, index) {
      return '<li><strong>' + stage.title + '</strong><span>' + stage.text.split('. ')[0] + '.</span></li>';
    }).join('');
    return '<h2>Aliran energi PLTB</h2>' +
      '<p class="hint">Klik label tahap pada gambar untuk membaca rinciannya.</p>' +
      '<ol class="stage-overview">' + items + '</ol>' +
      '<p>' + PROCESS_SCOPE + '</p>';
  }

  return Object.freeze({
    PROCESS_STAGES: PROCESS_STAGES,
    PROCESS_SCOPE: PROCESS_SCOPE,
    processOverview: processOverview
  });
});
