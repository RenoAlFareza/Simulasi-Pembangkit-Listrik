/* Alur energi PLTS: sembilan tahap dari matahari sampai rumah warga. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PLTSProcess = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var PROCESS_STAGES = [
    {
      id: 'sun',
      title: '01 Matahari',
      text: 'Matahari berada pada elevasi tetap 60° pada model ini. Intensitas sumber diatur lewat slider 0–1.200 W/m². Cahaya yang benar-benar jatuh pada bidang panel selalu lebih kecil atau lebih besar daripada intensitas sumber, bergantung pada sudut panel dan komponen baur serta pantulan.'
    },
    {
      id: 'panel',
      title: '02 Panel surya',
      text: 'Panel mengubah cahaya menjadi listrik DC. Daya DC = cahaya pada panel × luas aktif × efisiensi panel. Luas aktif tetap 5.000 m² dan efisiensi acuan 20% pada suhu sel 25 °C. Sudut panel tidak mengubah ukuran panel, hanya jumlah cahaya yang diterimanya.'
    },
    {
      id: 'combiner',
      title: '03 Proteksi DC',
      text: 'Kotak gabung dan proteksi DC menyatukan keluaran beberapa rangkaian panel sebelum masuk inverter. Pada model ini tahap proteksi tidak diberi rugi tersendiri; rugi kabel dan inverter digabung pada tahap berikutnya.'
    },
    {
      id: 'inverter',
      title: '04 Inverter',
      text: 'Inverter mengubah listrik DC menjadi AC. Daya AC = min(kapasitas inverter, daya DC × efisiensi kabel × efisiensi inverter). Kapasitas inverter 1 MW AC, efisiensi kabel 97%, dan efisiensi inverter 98%. Ketika batas tercapai, daya AC berhenti bertambah walaupun cahaya masih naik.'
    },
    {
      id: 'stepup',
      title: '05 Trafo penaik',
      text: 'Trafo penaik menaikkan tegangan keluaran inverter agar siap dikirim. Asumsi efisiensi 98%. Setelah tahap ini daya masuk ke saluran transmisi menuju pusat beban.'
    },
    {
      id: 'transmission',
      title: '06 Transmisi',
      text: 'Saluran transmisi membawa daya ke pusat beban dengan asumsi efisiensi jaringan 98%. Pada PLTS, efisiensi penyaluran total 98% × 98% ≈ 96% karena rugi inverter sudah diperhitungkan saat menghitung daya AC.'
    },
    {
      id: 'stepdown',
      title: '07 Gardu penurun',
      text: 'Gardu penurun menurunkan tegangan transmisi ke tegangan distribusi. Tahap ini ditandai sebagai bagian alur; asumsi ruginya sudah tergabung dalam angka efisiensi penyaluran 96%.'
    },
    {
      id: 'distribution',
      title: '08 Trafo distribusi',
      text: 'Trafo distribusi menyalurkan daya ke jaringan tegangan rendah tempat rumah dan sekolah terhubung. Daya yang sampai ke beban = daya AC × efisiensi penyaluran, selalu lebih kecil daripada daya AC inverter.'
    },
    {
      id: 'homes',
      title: '09 Rumah warga',
      text: 'Rumah mewakili beban kawasan 200, 500, atau 800 kW. Lampu menyala bila daya yang sampai ke beban mencukupi kebutuhan itu. Pada siang cerah dengan intensitas tinggi, keluaran PLTS bisa melewati beban contoh; kelebihan daya pada jaringan nyata akan diserap beban lain.'
    }
  ];

  function processOverview() {
    var items = PROCESS_STAGES.map(function (stage) {
      return '<li><strong>' + stage.title + '</strong><span>' + stage.text.split('. ')[0] + '.</span></li>';
    }).join('');
    return '<h2>Aliran energi PLTS</h2>' +
      '<p class="hint">Klik label tahap pada gambar untuk membaca rinciannya.</p>' +
      '<ol class="stage-overview">' + items + '</ol>' +
      '<p>Alur ini menunjukkan urutan pengubahan energi pada model PLTS. Setiap tahap memakai asumsi efisiensi sederhana agar hubungan antarbesaran mudah dipelajari.</p>';
  }

  return Object.freeze({
    PROCESS_STAGES: PROCESS_STAGES,
    processOverview: processOverview
  });
});
