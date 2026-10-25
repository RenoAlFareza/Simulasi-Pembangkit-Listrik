/* ============================================================================
   inti.js — pengendali simulasi PLTA: waktu, fase percobaan, pencatatan data,
   dan grafik. Bergantung pada KONFIG, Fisika, ModulPLTA (dimuat lebih dulu).

   Prinsip yang dijaga berkas ini:
     1. Satu percobaan = satu kondisi. Q dan H dikunci selama percobaan
        berjalan, sehingga daya tetap dan E = P x t dapat dihitung tepat.
     2. Timer berjalan 1:1 dengan waktu nyata dan memakai jam dinding
        (performance.now), bukan jumlah bingkai, supaya tidak melenceng
        ketika bingkai tersendat.
     3. Fase pemulihan putaran (2 detik) berlangsung sebelum timer mulai,
        sehingga energi hanya dihitung selama selang yang tercatat. Selama
        fase itu daya dan energi ditampilkan "—", bukan angka penuh, karena
        generator belum mencapai kondisi mantapnya.
     4. Durasi dikunci begitu ada satu baris data. Energi baru sebanding
        antar-baris bila durasinya sama; mengubah durasi di tengah sesi akan
        membuat kWh dari percobaan berbeda tidak bisa dibandingkan.
     5. Garis model pada grafik sebar hanya sah untuk SATU nilai besaran yang
        tidak dipakai sebagai sumbu-x. Keterangannya menyebut nilai itu dan
        berapa titik yang benar-benar dilaluinya — tidak diam-diam memakai
        baris terakhir seolah-olah semua titik satu kondisi.
   ========================================================================= */
(function () {
  'use strict';

  var K = KONFIG;
  var KUNCI_SIMPAN = 'simulasi-plta-v1';

  /* Warna seri data. Label putih di dalam titik butuh >= 4,5:1, jadi tiap warna
     harus cukup gelap. Nilai lama #1f9d55 (3,49:1) dan #d98a1f (2,76:1) gagal;
     palet ini semuanya >= 5,6:1 terhadap putih. */
  var WARNA = ['#0d47a1', '#a01d12', '#146c3b', '#8a5f10', '#5b2a80',
               '#00636d', '#8c0d45', '#3b241f'];

  var el = {};
  var keadaan = {
    preset: 'cerah',
    durasi: K.durasi.bawaan,
    q: 0.30,
    h: 15,
    fase: 'siap',
    /* Fase asal sebelum dijeda: 'mulai' (pemulihan putaran) atau 'jalan'.
       Tanpa ini, jeda saat pemulihan akan melompat langsung ke jam percobaan
       dan sisa fase pemulihan hilang (lihat tekanJeda). */
    jedaDari: null,
    t: 0,
    tSejakMulai: 0,
    energi: 0,
    rpmTampil: 0,
    animasi: 1,
    qKunci: 0.30,
    hKunci: 15,
    pKunci: 0,
    nKunci: 0,
    data: [],
    jejakRpm: [],
    titikSekarang: [],
    /* Ditandai begitu jejak percobaan ini masuk ke jejakRpm, supaya "Catat Data"
       lalu "Ulangi Percobaan" tidak menyimpan kurva yang sama dua kali. */
    jejakDisimpan: false,
    /* Ditandai setelah baris data tercatat, supaya satu percobaan tidak bisa
       menghasilkan dua baris walau tombol Catat ditekan berulang. */
    sudahDicatat: false,
    grafik: 'q-p',
    garisModel: K.garisModelBawaan,
    rumusTerbuka: K.rumusTerbukaBawaan,
    nomorData: 0
  };

  /* -------------------------------------------------------------- jam dinding */
  function buatJam() {
    return {
      jalan: false,
      akumulasi: 0,
      sejak: 0,
      mulai: function () { this.sejak = performance.now() / 1000; this.jalan = true; },
      jeda: function () {
        if (this.jalan) { this.akumulasi += performance.now() / 1000 - this.sejak; this.jalan = false; }
      },
      nilai: function () {
        return this.akumulasi + (this.jalan ? performance.now() / 1000 - this.sejak : 0);
      },
      set: function (v) { this.akumulasi = v; this.jalan = false; },
      reset: function () { this.akumulasi = 0; this.jalan = false; }
    };
  }
  var jamRamp = buatJam();
  var jamJalan = buatJam();

  /* ------------------------------------------------------------------ bantu */
  function $(id) { return document.getElementById(id); }
  function balikkan() { return keadaan.fase === 'mulai' || keadaan.fase === 'jalan' || keadaan.fase === 'jeda'; }

  function presetKini() { return Fisika.presetById(keadaan.preset); }

  /* Kondisi yang sedang dipakai: nilai terkunci saat berjalan, nilai pengatur
     saat berhenti. */
  function qEfektif() { return balikkan() ? keadaan.qKunci : keadaan.q; }
  function hEfektif() { return balikkan() ? keadaan.hKunci : keadaan.h; }

  function detikKeTeks(d) {
    var m = Math.floor(d / 60);
    var s = Math.floor(d % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function aturPesan(teks, kelas) {
    el.pesanStatus.textContent = teks;
    el.pesanStatus.className = 'pesan-status' + (kelas ? ' ' + kelas : '');
  }

  /* Garis model hanya boleh tampil bila dicentang DAN sudah ada minimal satu
     titik data. Menampilkannya pada tabel kosong berarti memperlihatkan bentuk
     hubungan yang justru ingin ditemukan murid pada tahap merumuskan hipotesis. */
  function garisModelTampil() {
    return keadaan.garisModel && keadaan.data.length > 0;
  }

  /* Durasi terkunci setelah baris pertama tercatat. Alasannya bukan kekakuan
     teknis, melainkan kesetaraan: energi (kWh) hanya bisa dibandingkan antar
     baris bila selang waktunya sama. Terkunci sampai data dihapus — persis
     cermin dari cara preset dikunci selama satu percobaan. */
  function durasiTerkunci() {
    return keadaan.data.length > 0;
  }

  /* ------------------------------------------------------------- simpan/muat */
  function simpan() {
    try {
      localStorage.setItem(KUNCI_SIMPAN, JSON.stringify({
        preset: keadaan.preset,
        durasi: keadaan.durasi,
        grafik: keadaan.grafik,
        garisModel: keadaan.garisModel,
        rumusTerbuka: keadaan.rumusTerbuka,
        data: keadaan.data.slice(-200),
        nomorData: keadaan.nomorData
      }));
    } catch (e) { /* penyimpanan penuh atau diblokir: data tetap aman di layar */ }
  }

  function muat() {
    var mentah = null;
    try { mentah = localStorage.getItem(KUNCI_SIMPAN); } catch (e) { mentah = null; }
    if (!mentah) { return; }
    try {
      var s = JSON.parse(mentah);
      if (s && typeof s === 'object') {
        if (Fisika.presetById(s.preset).id === s.preset) { keadaan.preset = s.preset; }
        if (K.durasi.pilihan.indexOf(s.durasi) >= 0) { keadaan.durasi = s.durasi; }
        if (typeof s.grafik === 'string') { keadaan.grafik = s.grafik; }
        if (typeof s.garisModel === 'boolean') { keadaan.garisModel = s.garisModel; }
        if (typeof s.rumusTerbuka === 'boolean') { keadaan.rumusTerbuka = s.rumusTerbuka; }
        if (Array.isArray(s.data)) {
          keadaan.data = s.data.filter(function (b) {
            return b && typeof b.q === 'number' && typeof b.h === 'number';
          });
          keadaan.data.forEach(function (b, i) { b.warna = WARNA[i % WARNA.length]; });
        }
        if (typeof s.nomorData === 'number') { keadaan.nomorData = s.nomorData; }
      }
    } catch (e) { /* berkas simpanan rusak: mulai dari keadaan bersih */ }
  }

  /* --------------------------------------------------------------- bangun UI */
  function bangunPreset() {
    var wadah = $('daftarPreset');
    wadah.innerHTML = '';
    K.preset.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'preset' + (p.id === keadaan.preset ? ' aktif' : '');
      b.setAttribute('aria-pressed', p.id === keadaan.preset ? 'true' : 'false');
      b.dataset.preset = p.id;
      b.innerHTML = '<strong>' + p.nama + '</strong><span>Q maks ' + Fisika.formatAngka(p.qMaks, 2) +
                    ' m³/s</span>';
      b.addEventListener('click', function () { pilihPreset(p.id); });
      wadah.appendChild(b);
    });
    $('ketPreset').textContent = presetKini().keterangan;
  }

  function bangunDurasi() {
    var wadah = $('pilihDurasi');
    wadah.innerHTML = '';
    K.durasi.pilihan.forEach(function (d) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'durasi' + (d === keadaan.durasi ? ' aktif' : '');
      b.setAttribute('aria-pressed', d === keadaan.durasi ? 'true' : 'false');
      b.dataset.durasi = String(d);
      b.textContent = d + ' s';
      b.addEventListener('click', function () {
        /* Durasi ikut dikunci begitu ada baris data: lihat perbaruiKunci().
           Penjagaan di sini hanya jaring pengaman untuk klik programatik. */
        if (balikkan() || durasiTerkunci()) { return; }
        keadaan.durasi = d;
        bangunDurasi();
        perbaruiTimer();
        simpan();
      });
      wadah.appendChild(b);
    });
  }

  function bangunPilihGrafik() {
    var wadah = $('pilihGrafik');
    wadah.innerHTML = '';
    K.grafik.forEach(function (g) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = keadaan.grafik === g.id ? 'aktif' : '';
      b.setAttribute('aria-pressed', keadaan.grafik === g.id ? 'true' : 'false');
      b.dataset.grafik = g.id;
      b.textContent = g.judul;
      b.addEventListener('click', function () {
        keadaan.grafik = g.id;
        bangunPilihGrafik();
        gambarSebar();
        simpan();
      });
      wadah.appendChild(b);
    });
  }

  function bangunKepalaTabel() {
    var tr = document.createElement('tr');
    var th = document.createElement('th');
    th.textContent = 'No';
    th.setAttribute('scope', 'col');
    tr.appendChild(th);
    K.kolom.forEach(function (k) {
      var c = document.createElement('th');
      c.setAttribute('scope', 'col');
      c.innerHTML = k.label + '<br><span style="font-weight:600">(' + k.satuan + ')</span>';
      tr.appendChild(c);
    });
    el.kepalaTabel.innerHTML = '';
    el.kepalaTabel.appendChild(tr);
  }

  /* -------------------------------------------------------------- batas nilai */
  function batasKini() { return Fisika.batas(keadaan.preset); }

  /* Penanda kapasitas pada trek slider debit.
     Tiga hal yang harus benar:
     (1) posisinya dihitung dari min/max slider saat ini, bukan dari 0,05/0,60
         yang tetap — karena batas atas berubah mengikuti preset;
     (2) ia disembunyikan bila kapasitas berada di luar jangkauan slider
         (preset Kemarau berhenti di 0,20 m³/s, jadi penanda 0,40 tidak punya
         tempat di trek dan tidak boleh menempel di ujung kanan);
     (3) offset 9 px di kedua ujung meniru inset thumb bawaan peramban supaya
         garisnya jatuh di titik yang sama dengan nilai pada trek. */
  var INSET_TREK = 9;

  function perbaruiPenandaKapasitas() {
    var penanda = $('penandaKapasitas');
    if (!penanda) { return; }
    var qKap = KONFIG.fisika.qKapasitas;
    var min = parseFloat(el.sliderQ.min), maks = parseFloat(el.sliderQ.max);
    var ket = $('ketKapasitas');
    if (!(maks > min) || qKap < min || qKap > maks) {
      penanda.style.display = 'none';
      /* Keterangan ikut disembunyikan: menjelaskan garis yang tidak ada akan
         membuat murid mencari-cari sesuatu yang memang sengaja tidak digambar. */
      if (ket) { ket.style.display = 'none'; }
      return;
    }
    var porsi = (qKap - min) / (maks - min);
    penanda.style.display = '';
    penanda.style.left = 'calc(' + INSET_TREK + 'px + (100% - ' + (INSET_TREK * 2) + 'px) * ' + porsi.toFixed(5) + ')';
    penanda.setAttribute('title', 'Kapasitas turbin ' + Fisika.formatAngka(qKap, 2) + ' m³/s');
    if (ket) { ket.style.display = ''; }
  }

  function terapkanBatas() {
    var b = batasKini();
    el.sliderQ.min = String(b.qMin);
    el.sliderQ.max = String(b.qMaks);
    el.sliderH.min = String(b.hMin);
    el.sliderH.max = String(b.hMaks);
    $('minQ').textContent = Fisika.formatAngka(b.qMin, 2);
    $('maksQ').textContent = Fisika.formatAngka(b.qMaks, 2) + ' m³/s';
    $('minH').textContent = Fisika.formatAngka(b.hMin, 0) + ' m';
    $('maksH').textContent = Fisika.formatAngka(b.hMaks, 0) + ' m';

    if (keadaan.q > b.qMaks) { keadaan.q = b.qMaks; }
    if (keadaan.q < b.qMin) { keadaan.q = b.qMin; }
    if (keadaan.h > b.hMaks) { keadaan.h = b.hMaks; }
    if (keadaan.h < b.hMin) { keadaan.h = b.hMin; }
    el.sliderQ.value = String(keadaan.q);
    el.sliderH.value = String(keadaan.h);
    perbaruiPenandaKapasitas();
    perbaruiLabelPengatur();
  }

  function perbaruiLabelPengatur() {
    var teksQ = Fisika.formatAngka(keadaan.q, 2) + ' m³/s';
    var teksH = Fisika.formatAngka(keadaan.h, 1) + ' m';
    $('nilaiQ').textContent = teksQ;
    $('nilaiH').textContent = teksH;
    /* Tanpa aria-valuetext, pembaca layar mengumumkan "0.3" tanpa satuan. */
    el.sliderQ.setAttribute('aria-valuetext', teksQ);
    el.sliderH.setAttribute('aria-valuetext', teksH);
    /* Persentase terhadap maksimum situs dulu tinggal di panel Hasil
       Pengukuran. Karena panel itu sekarang hanya memuat hasil ukur, keterangan
       yang sebenarnya milik PENGATUR ini dipindahkan ke sini: dekat slidernya
       sendiri, tempat murid melihat angka yang diubahnya. */
    var head = Fisika.headRelatif(keadaan.h);
    $('ketHead').textContent = teksH + ' — ' +
      Fisika.formatAngka(head.persen, 0) + ' % dari maksimum situs (' +
      Fisika.formatAngka(K.rentang.hMaks, 0) + ' m). Bukan hasil pengukuran, ' +
      'melainkan perbandingan dengan situs ini.';
  }

  function pilihPreset(id) {
    if (balikkan()) { return; }
    /* Preset menentukan batas atas debit dan tinggi jatuh. Menggantinya setelah
       ada data bisa membuat titik lama berada di luar jangkauan sumbu. Data
       TIDAK dihapus (itu akan menghilangkan pekerjaan murid dan memaksa dialog
       yang memblokir); sebagai gantinya grafik digambar ulang dan titik yang
       berada di luar jangkauan ditandai secara terlihat di tepi bidang, dengan
       keterangan berapa titik yang di luar. */
    keadaan.preset = id;
    ModulPLTA.terapkanPreset(Fisika.presetById(id));
    terapkanBatas();
    bangunPreset();
    resetKeSiap();
    perbaruiSemua(0);
    gambarSebar();
    gambarRpm();
    simpan();
  }

  /* --------------------------------------------------------------- tindakan */
  function resetKeSiap() {
    keadaan.fase = 'siap';
    keadaan.jedaDari = null;
    keadaan.t = 0;
    keadaan.tSejakMulai = 0;
    keadaan.energi = 0;
    keadaan.rpmTampil = 0;
    keadaan.animasi = 1;
    keadaan.titikSekarang = [];
    keadaan.jejakDisimpan = false;
    keadaan.sudahDicatat = false;
    jamRamp.reset();
    jamJalan.reset();
  }

  function tekanMulai() {
    if (keadaan.fase === 'mulai' || keadaan.fase === 'jalan') { return; }
    if (keadaan.fase === 'selesai') { resetKeSiap(); }

    keadaan.fase = 'mulai';
    keadaan.animasi = 1;
    keadaan.qKunci = keadaan.q;
    keadaan.hKunci = keadaan.h;
    var hasil = Fisika.hitung(keadaan.qKunci, keadaan.hKunci);
    keadaan.pKunci = hasil.p;
    keadaan.nKunci = hasil.n;
    keadaan.titikSekarang = [{ x: 0, n: 0 }];
    keadaan.jejakDisimpan = false;
    keadaan.sudahDicatat = false;
    jamRamp.mulai();
    aturPesan('Turbin mulai berputar. Timer akan berjalan setelah putaran tercapai.', 'sorot');
    perbaruiKunci();
  }

  function tekanJeda() {
    if (keadaan.fase === 'jalan') {
      jamJalan.jeda();
      keadaan.jedaDari = 'jalan';
      keadaan.fase = 'jeda';
      aturPesan('Dijeda pada ' + detikKeTeks(keadaan.t) + '. Timer dan energi berhenti.');
    } else if (keadaan.fase === 'jeda') {
      /* Kembali ke fase asal, bukan selalu ke 'jalan': bila dijeda saat
         pemulihan putaran, sisa fase pemulihan harus diteruskan. */
      if (keadaan.jedaDari === 'mulai') {
        jamRamp.mulai();
        keadaan.fase = 'mulai';
        aturPesan('Dilanjutkan. Putaran turbin meneruskan pemulihan.', 'sorot');
      } else {
        jamJalan.mulai();
        keadaan.fase = 'jalan';
        aturPesan('Percobaan dilanjutkan.', 'sorot');
      }
      keadaan.jedaDari = null;
    } else if (keadaan.fase === 'mulai') {
      jamRamp.jeda();
      keadaan.jedaDari = 'mulai';
      keadaan.fase = 'jeda';
      aturPesan('Dijeda saat pemulihan putaran.');
    }
    perbaruiKunci();
  }

  function tekanUlangi() {
    if (keadaan.t > 0 && keadaan.titikSekarang.length) {
      simpanJejak();
    }
    resetKeSiap();
    perbaruiSemua(0);
    aturPesan('Percobaan dikembalikan ke nol. Tabel data tetap tersimpan.');
    perbaruiKunci();
  }

  /* warnaPaksa: warna baris tabel yang menjadi pasangan kurva ini, supaya
     warna jejak di grafik sama dengan warna titik data/baris tabel. */
  function simpanJejak(warnaPaksa) {
    if (keadaan.jejakDisimpan) { return; }
    keadaan.jejakDisimpan = true;
    keadaan.jejakRpm.push({
      label: 'Debit ' + Fisika.formatAngka(keadaan.qKunci, 2) + ' · Tinggi jatuh air ' + Fisika.formatAngka(keadaan.hKunci, 1),
      warna: warnaPaksa || WARNA[keadaan.jejakRpm.length % WARNA.length],
      titik: keadaan.titikSekarang.slice()
    });
    if (keadaan.jejakRpm.length > 6) { keadaan.jejakRpm.shift(); }
  }

  function tekanCatat() {
    if (keadaan.fase !== 'selesai' || keadaan.sudahDicatat) { return; }
    var q = keadaan.qKunci, h = keadaan.hKunci;
    var p = Fisika.dayaKeluarKW(q, h);
    var n = Fisika.rpm(q, h);
    var t = Fisika.bulatkan(keadaan.t, 2);
    var baris = {
      no: keadaan.nomorData + 1,
      /* preset dicatat per baris supaya CSV tetap jujur bila murid berganti
         skenario di tengah sesi; kolom tabel tidak menampilkannya. */
      preset: keadaan.preset,
      q: q, h: h, t: t,
      p: Fisika.bulatkan(p, 2),
      e: Fisika.bulatkan(Fisika.energiKWh(p, t), 3),
      n: Fisika.bulatkan(n, 0),
      warna: WARNA[keadaan.nomorData % WARNA.length]
    };
    keadaan.nomorData += 1;
    keadaan.data.push(baris);
    /* Satu percobaan hanya boleh menghasilkan satu baris, walau tombol
       ditekan berkali-kali (mis. klik ganda atau papan tik). */
    keadaan.sudahDicatat = true;
    if (keadaan.titikSekarang.length) { simpanJejak(baris.warna); }
    perbaruiTabel(true);
    perbaruiTombolData();
    perbaruiKunci();
    gambarSebar();
    gambarRpm();
    simpan();
    aturPesan('Data baris ' + baris.no + ' dicatat: ' + Fisika.formatAngka(baris.p, 2) +
              ' kW dan ' + Fisika.formatAngka(baris.e, 3) + ' kWh. Tekan Ulangi Percobaan untuk kondisi berikutnya.', 'selesai');
  }

  function tekanHapus() {
    if (!keadaan.data.length) { return; }
    var sedangBerjalan = balikkan();
    if (!window.confirm('Hapus semua ' + keadaan.data.length + ' baris data dan semua jejak grafik? Tindakan ini tidak bisa dibatalkan.')) {
      return;
    }
    keadaan.data = [];
    keadaan.jejakRpm = [];
    keadaan.titikSekarang = [];
    keadaan.nomorData = 0;
    resetKeSiap();
    /* Tabel dan grafik harus ikut dibersihkan. Tanpa ini, model data sudah
       kosong sementara layar masih menampilkan baris lama. */
    perbaruiTabel(false);
    perbaruiSemua(0);
    perbaruiTombolData();
    gambarSebar();
    gambarRpm();
    simpan();
    aturPesan(sedangBerjalan
      ? 'Semua data dihapus. Percobaan yang sedang berjalan ikut dihentikan.'
      : 'Semua data dihapus.');
  }

  /* --------------------------------------------------------------- tabel data */
  function perbaruiTabel(baru) {
    var tbody = el.isiTabel;
    tbody.innerHTML = '';
    if (!keadaan.data.length) {
      var tr0 = document.createElement('tr');
      tr0.className = 'tabel-kosong';
      var td0 = document.createElement('td');
      td0.colSpan = K.kolom.length + 1;
      td0.textContent = 'Belum ada data. Jalankan percobaan, lalu tekan Catat Data.';
      tr0.appendChild(td0);
      tbody.appendChild(tr0);
    } else {
      keadaan.data.forEach(function (b, i) {
        var tr = document.createElement('tr');
        if (baru && i === keadaan.data.length - 1) { tr.className = 'baru'; }
        var td = document.createElement('td');
        td.innerHTML = '<span class="contoh-titik" style="background:' + b.warna + '"></span>' + b.no;
        tr.appendChild(td);
        K.kolom.forEach(function (k) {
          var c = document.createElement('td');
          c.textContent = Fisika.formatAngka(b[k.kunci], k.desimal);
          tr.appendChild(c);
        });
        tbody.appendChild(tr);
      });
    }
    $('jumlahData').textContent = String(keadaan.data.length);
  }

  function perbaruiTombolData() {
    var ada = keadaan.data.length > 0;
    $('btnKartu').disabled = !ada;
    $('btnSalin').disabled = !ada;
    $('btnCsv').disabled = !ada;
    $('btnHapus').disabled = !ada;
  }

  function barisKeTeks(b, pemisah) {
    return K.kolom.map(function (k) { return Fisika.formatAngka(b[k.kunci], k.desimal); }).join(pemisah);
  }

  /* sertakanSkenario: hanya untuk CSV. Kolom tabel di layar (dan Salin Tabel)
     sengaja tidak menambah kolom agar urutannya tetap sama dengan tabel
     pengamatan E-LKM. CSV justru perlu kolom ini supaya baris dari skenario
     berbeda tidak tercampur tanpa penanda. */
  function teksTabel(pemisah, sertakanNomor, sertakanSkenario) {
    var kepala = [];
    if (sertakanNomor) { kepala.push('No'); }
    if (sertakanSkenario) { kepala.push('Skenario'); }
    K.kolom.forEach(function (k) { kepala.push(k.label + ' (' + k.satuan + ')'); });
    var baris = [kepala.join(pemisah)];
    keadaan.data.forEach(function (b) {
      var isi = [];
      if (sertakanNomor) { isi.push(String(b.no)); }
      if (sertakanSkenario) {
        isi.push(b.preset ? Fisika.presetById(b.preset).nama : presetKini().nama);
      }
      K.kolom.forEach(function (k) { isi.push(Fisika.formatAngka(b[k.kunci], k.desimal)); });
      baris.push(isi.join(pemisah));
    });
    return baris.join('\n');
  }

  function salinTeks(teks) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(teks);
    }
    return new Promise(function (selesai, gagal) {
      var ta = document.createElement('textarea');
      ta.value = teks;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      ok ? selesai() : gagal(new Error('izin papan klip ditolak'));
    });
  }

  /* Cap waktu lokal dalam bentuk yang aman untuk nama berkas: 2026-10-19_1432 */
  function capWaktuBerkas(d) {
    function dua(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + dua(d.getMonth() + 1) + '-' + dua(d.getDate()) +
      '_' + dua(d.getHours()) + dua(d.getMinutes());
  }

  /* Cap waktu yang mudah dibaca manusia, untuk baris komentar CSV. */
  function capWaktuBaca(d) {
    function dua(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + dua(d.getMonth() + 1) + '-' + dua(d.getDate()) +
      ' ' + dua(d.getHours()) + ':' + dua(d.getMinutes());
  }

  /* Jumlah baris data yang tercatat pada skenario selain yang sedang aktif.
     Bisa terjadi bila murid berganti skenario; CSV harus menyatakannya. */
  function jumlahSkenarioLain(aktif) {
    var n = 0;
    keadaan.data.forEach(function (b) {
      if (b.preset && b.preset !== aktif) { n++; }
    });
    return n;
  }

  function unduhCsv() {
    /* pemisah titik koma dan desimal koma: sesuai Excel ber-lokal Indonesia.
       Baris komentar '#' menyertakan metadata supaya berkas bisa dipakai
       sebagai dokumentasi guru/peneliti, bukan sekadar cadangan angka. */
    var kini = new Date();
    var namaSekarang = presetKini().nama;
    var lain = jumlahSkenarioLain(keadaan.preset);

    var meta = [];
    meta.push('# Simulasi Pembangkit Listrik Tenaga Air — data percobaan');
    meta.push('# Skenario aktif: ' + namaSekarang +
      ' (debit maks ' + Fisika.formatAngka(presetKini().qMaks, 2) + ' m³/s; ' +
      'tinggi jatuh air 4–' + Fisika.formatAngka(K.rentang.hMaks, 0) + ' m, sifat situs)');
    meta.push('# Durasi target per percobaan: ' + keadaan.durasi + ' s');
    meta.push('# Tanggal unduh: ' + capWaktuBaca(kini));
    meta.push('# Kelompok: ' + '____________________');
    meta.push('# Jumlah baris data: ' + keadaan.data.length);
    if (lain) {
      meta.push('# PERHATIAN: ' + lain + ' baris berasal dari skenario lain. ' +
        'Kolom "Skenario" pada tiap baris menunjukkan asalnya.');
    }
    meta.push('#');

    var teks = meta.join('\n') + '\n' + teksTabel(';', true, true);
    var blob = new Blob(['\ufeff' + teks], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    /* Nama berkas memuat tanggal dan jam supaya beberapa unduhan dalam satu
       pertemuan tidak saling menimpa dan tidak menyesatkan. */
    a.download = 'data-plta-' + keadaan.preset + '-' + capWaktuBerkas(kini) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function bukaKartu() {
    var b = keadaan.data[keadaan.data.length - 1];
    if (!b) { return; }
    var html = '';
    K.kolom.forEach(function (k) {
      html += '<div class="kotak-besar"><span class="kb-label">' + k.label + '</span>' +
              '<span class="kb-angka">' + Fisika.formatAngka(b[k.kunci], k.desimal) + '</span>' +
              '<span class="kb-satuan">' + k.satuan + '</span></div>';
    });
    el.kartuIsi.innerHTML = html;
    /* Skenario dan durasi target ikut ditulis: tanpa itu angka di kartu tidak
       bisa dipertanggungjawabkan saat disalin ke E-LKM. */
    var namaSkenario = b.preset ? Fisika.presetById(b.preset).nama : presetKini().nama;
    el.kartuBaris.textContent = 'Baris ke-' + b.no + ' dari ' + keadaan.data.length +
      ' · Skenario ' + namaSkenario + ' · Durasi target ' + keadaan.durasi + ' s' +
      '. Tekan Salin Tabel untuk menyalin seluruh baris sekaligus.';
    el.lapisKartu.hidden = false;
    kunciLatar(true);
    /* aria-modal hanya deklarasi; fokus harus benar-benar dipindahkan. */
    el.kartuBesar.focus();
  }

  /* Kunci latar saat dialog terbuka: kontrol di belakang tidak dapat difokus
     dan halaman tidak dapat digulir. */
  function kunciLatar(aktif) {
    var utama = document.querySelector('main');
    var kepala = document.querySelector('header');
    var isi = document.getElementById('isiRumus');
    if (!utama || !kepala) { return; }
    if (aktif) {
      utama.setAttribute('inert', '');
      kepala.setAttribute('inert', '');
      document.body.style.overflow = 'hidden';
    } else {
      utama.removeAttribute('inert');
      kepala.removeAttribute('inert');
      document.body.style.overflow = '';
    }
  }

  function tutupKartu() {
    if (el.lapisKartu.hidden) { return; }
    el.lapisKartu.hidden = true;
    kunciLatar(false);
    /* Kembalikan fokus ke tombol pembuka, bukan ke awal halaman. */
    $('btnKartu').focus();
  }

  /* ------------------------------------------------------------------ grafik */
  function siapkanKanvas(c) {
    var r = c.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    var w = Math.max(1, Math.round(r.width));
    var h = Math.max(1, Math.round(r.height));
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    var ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx: ctx, w: w, h: h };
  }

  var TANGGA_SUMBU = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  function pembulatanAtas(v) {
    if (v <= 0) { return 1; }
    var p = Math.pow(10, Math.floor(Math.log10(v)));
    var n = v / p;
    for (var i = 0; i < TANGGA_SUMBU.length; i++) {
      if (n <= TANGGA_SUMBU[i]) { return TANGGA_SUMBU[i] * p; }
    }
    return 10 * p;
  }

  function sumbu(ctx, kiri, atas, kanan, bawah, xMin, xMax, yMin, yMax, xLabel, yLabel, xDesimal, yDesimal) {
    ctx.strokeStyle = '#cfdae4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(kiri, atas);
    ctx.lineTo(kiri, bawah);
    ctx.lineTo(kanan, bawah);
    ctx.stroke();

    ctx.fillStyle = '#5b6b7a';                    /* 5,38:1 - lolos WCAG */
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (var i = 0; i <= 5; i++) {
      var x = kiri + (kanan - kiri) * i / 5;
      var xv = xMin + (xMax - xMin) * i / 5;
      ctx.strokeStyle = '#eef3f8';
      ctx.beginPath();
      ctx.moveTo(x, atas);
      ctx.lineTo(x, bawah);
      ctx.stroke();
      ctx.fillText(Fisika.formatAngka(xv, xDesimal), x, bawah + 6);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (var j = 0; j <= 5; j++) {
      var y = bawah - (bawah - atas) * j / 5;
      var yv = yMin + (yMax - yMin) * j / 5;
      ctx.strokeStyle = '#eef3f8';
      ctx.beginPath();
      ctx.moveTo(kiri, y);
      ctx.lineTo(kanan, y);
      ctx.stroke();
      ctx.fillText(Fisika.formatAngka(yv, yDesimal), kiri - 6, y);
    }
    ctx.fillStyle = '#44535f';                    /* 7,29:1 */
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(xLabel, (kiri + kanan) / 2, bawah + 32);
    ctx.save();
    ctx.translate(12, (atas + bawah) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = 'top';
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
  }

  function gambarSebar() {
    var k = el.kanvasSebar;
    if (!k) { return; }
    var s = siapkanKanvas(k);
    var pilihan = K.grafik.filter(function (g) { return g.id === keadaan.grafik; })[0] || K.grafik[0];
    var kiri = 54, atas = 12, kanan = s.w - 14, bawah = s.h - 38;
    if (kanan <= kiri || bawah <= atas) { return; }

    var b = batasKini();

    /* ------------------------------------------------- garis model sebar ----
       Garis model adalah grafik P(Q) atau P(H) pada kondisi LAIN yang tetap.
       Karena itu ia hanya sah bila seluruh titik data memakai nilai besaran
       lainnya yang sama. Versi lama mengambil nilai dari baris data TERAKHIR
       dan menggambar garisnya untuk semua titik — kurva yang benar secara
       hitungan tetapi tidak mewakili satu pun titik di sebelah kirinya, dan
       keterangannya hanya menyebut "(data terakhir)". Sekarang: hitung nilai
       yang berbeda; bila lebih dari satu, garis TIDAK digambar dan alasannya
       ditulis. Menarik garis yang tidak berlaku lebih buruk daripada tidak
       menggambar apa pun. */
    var sumbuX = pilihan.x;                 // 'q' atau 'h'
    var lain = sumbuX === 'q' ? 'h' : 'q';
    var nilaiLain = {};
    var nilaiDurasi = {};
    keadaan.data.forEach(function (d) {
      nilaiLain[Fisika.bulatkan(d[lain], 2)] = true;
      if (pilihan.y === 'e') { nilaiDurasi[Fisika.bulatkan(d.t, 2)] = true; }
    });
    var daftarLain = Object.keys(nilaiLain).map(Number).sort(function (a, c) { return a - c; });
    var daftarDurasi = Object.keys(nilaiDurasi).map(Number).sort(function (a, c) { return a - c; });
    var seragam = daftarLain.length === 1 && daftarDurasi.length <= 1;

    var hAcu = sumbuX === 'q' ? (seragam ? daftarLain[0] : hEfektif()) : hEfektif();
    var qAcu = sumbuX === 'h' ? (seragam ? daftarLain[0] : qEfektif()) : qEfektif();
    var tAcu = daftarDurasi.length ? daftarDurasi[0] : Math.max(keadaan.t, keadaan.durasi);
    var garisTampil = garisModelTampil() && seragam;

    var xMaks = pilihan.x === 'q' ? b.qMaks : b.hMaks;
    var xDesimal = pilihan.x === 'q' ? 2 : 1;

    /* Nilai model pada suatu x. Dipakai untuk menggambar garis putus-putus
       sekaligus untuk menentukan tinggi sumbu, supaya kurva model tidak
       pernah keluar dari area plot. */
    var modelY = function (x) {
      if (pilihan.y === 'p') {
        return pilihan.x === 'q' ? Fisika.dayaKeluarKW(x, hAcu) : Fisika.dayaKeluarKW(qAcu, x);
      }
      var p = pilihan.x === 'q' ? Fisika.dayaKeluarKW(x, hAcu) : Fisika.dayaKeluarKW(qAcu, x);
      return Fisika.energiKWh(p, tAcu);
    };

    var yMaks = 0;
    keadaan.data.forEach(function (d) { yMaks = Math.max(yMaks, d[pilihan.y]); });
    if (garisTampil) { yMaks = Math.max(yMaks, modelY(xMaks)); }
    yMaks = pembulatanAtas(yMaks > 0 ? yMaks : 1);
    var yDesimal = pilihan.y === 'p' ? (yMaks < 10 ? 2 : 1) : 3;

    sumbu(s.ctx, kiri, atas, kanan, bawah, 0, xMaks, 0, yMaks,
          pilihan.xLabel, pilihan.yLabel, xDesimal, yDesimal);

    var px = function (x) { return kiri + (kanan - kiri) * (x / xMaks); };
    var py = function (y) { return bawah - (bawah - atas) * (y / yMaks); };

    /* Garis model memakai warna lebih gelap agar lolos ambang kontras non-teks 3:1. */
    if (garisTampil) {
      s.ctx.strokeStyle = '#7b8b99';
      s.ctx.lineWidth = 2.5;
      s.ctx.setLineDash([6, 5]);
      s.ctx.beginPath();
      for (var i = 0; i <= 40; i++) {
        var x = xMaks * i / 40;
        var y = modelY(x);
        i === 0 ? s.ctx.moveTo(px(x), py(y)) : s.ctx.lineTo(px(x), py(y));
      }
      s.ctx.stroke();
      s.ctx.setLineDash([]);
    }

    /* Titik yang berada di luar jangkauan preset aktif (mis. setelah skenario
       diganti) TIDAK dipotong diam-diam: digambar sebagai panah di tepi bidang
       dan dihitung di keterangan. Sebelumnya titik itu hilang dari grafik
       padahal masih tercatat di tabel. */
    var diLuar = [];
    keadaan.data.forEach(function (d) {
      var x = px(d[pilihan.x]), y = py(d[pilihan.y]);
      var luarX = d[pilihan.x] > xMaks, luarY = d[pilihan.y] > yMaks;
      if (luarX || luarY) {
        diLuar.push(d);
        var xTepi = Math.min(Math.max(x, kiri + 6), kanan - 6);
        var yTepi = Math.min(Math.max(y, atas + 6), bawah - 6);
        s.ctx.beginPath();
        s.ctx.arc(xTepi, yTepi, 6, 0, Math.PI * 2);
        s.ctx.fillStyle = d.warna;
        s.ctx.fill();
        s.ctx.strokeStyle = '#ffffff';
        s.ctx.lineWidth = 1.6;
        s.ctx.stroke();
        /* panah kecil menunjuk arah keluarnya titik */
        var ax = luarX ? (x > kanan ? -1 : 1) : 0;
        var ay = luarY ? (y < atas ? 1 : -1) : 0;
        s.ctx.beginPath();
        s.ctx.moveTo(xTepi + ax * 9, yTepi + ay * 9);
        s.ctx.lineTo(xTepi + ax * 16, yTepi + ay * 16);
        s.ctx.strokeStyle = d.warna;
        s.ctx.lineWidth = 2.5;
        s.ctx.stroke();
        return;
      }
      s.ctx.beginPath();
      s.ctx.arc(x, y, 5.5, 0, Math.PI * 2);
      s.ctx.fillStyle = d.warna;
      s.ctx.fill();
      s.ctx.strokeStyle = '#ffffff';
      s.ctx.lineWidth = 1.6;
      s.ctx.stroke();
      s.ctx.fillStyle = '#ffffff';
      s.ctx.font = '700 9px system-ui, sans-serif';
      s.ctx.textAlign = 'center';
      s.ctx.textBaseline = 'middle';
      s.ctx.fillText(String(d.no), x, y + 0.5);
    });

    /* keterangan */
    var ket = [];
    if (!keadaan.data.length) {
      ket.push('Belum ada data. Jalankan percobaan lalu tekan Catat Data.');
    } else {
      ket.push(keadaan.data.length + ' titik data.');
    }
    if (diLuar.length) {
      ket.push(diLuar.length + ' titik berada di luar jangkauan skenario ' +
        presetKini().nama + ' (ditandai panah di tepi bidang).');
    }
    /* Grafik energi sengaja dipertahankan walau bentuknya pasti menyerupai
       grafik daya: E = P x t dengan t sama untuk semua titik, jadi kurvanya
       hanya beda skala sumbu tegak. Murid yang menyadari hal ini sedang
       menguji pemahamannya sendiri, bukan menemukan cacat alat. Nyatakan
       terang-terangan supaya tidak ada yang menyimpulkan grafiknya salah. */
    if (pilihan.y === 'e' && keadaan.data.length) {
      ket.push('Energi = daya x durasi, dan durasinya sama untuk semua titik, ' +
        'jadi bentuk grafik ini memang sama dengan grafik dayanya; hanya skala ' +
        'sumbu tegaknya yang berbeda sebesar faktor durasi.');
    }
    if (garisTampil) {
      ket.push('Garis putus-putus = perhitungan model pada ' +
        (pilihan.x === 'q' ? 'tinggi jatuh air = ' + Fisika.formatAngka(hAcu, 1) + ' m' : 'debit = ' + Fisika.formatAngka(qAcu, 2) + ' m³/s') +
        (pilihan.y === 'e' ? ' dan t = ' + Fisika.formatAngka(tAcu, 0) + ' s' : '') +
        ', yaitu kondisi yang sama untuk semua titik ini.');
    } else if (keadaan.garisModel && keadaan.data.length) {
      /* Garis tidak digambar karena titik-titiknya tidak satu kondisi. Diam
         saja akan membuat murid mengira centangnya rusak; sebutkan sebabnya
         dan apa yang harus dilakukan. */
      var sebab = [];
      if (daftarLain.length > 1) {
        sebab.push(daftarLain.length + ' nilai ' + (sumbuX === 'q' ? 'tinggi jatuh air' : 'debit') + ' berbeda');
      }
      if (daftarDurasi.length > 1) {
        sebab.push(daftarDurasi.length + ' durasi berbeda');
      }
      ket.push('Garis model tidak digambar karena titik-titik ini berasal dari ' +
        sebab.join(' dan ') + '. Garis model hanya sah bila kondisi lainnya seragam: ' +
        'buat titik-titik dengan ' + (sumbuX === 'q' ? 'tinggi jatuh air' : 'debit') +
        ' yang sama' + (pilihan.y === 'e' ? ' dan durasi yang sama' : '') + '.');
    }
    $('ketGrafikSebar').textContent = ket.join(' ');
  }

  function gambarRpm() {
    var k = el.kanvasRpm;
    if (!k) { return; }
    var s = siapkanKanvas(k);
    var kiri = 54, atas = 12, kanan = s.w - 14, bawah = s.h - 38;
    if (kanan <= kiri || bawah <= atas) { return; }

    var semua = keadaan.jejakRpm.slice();
    if (keadaan.titikSekarang.length) {
      /* Percobaan yang sedang berjalan memakai warna baris yang AKAN dipakai
         saat dicatat (nomorData), supaya warna kurva = warna baris tabel. */
      semua.push({ label: 'percobaan ini', warna: WARNA[keadaan.nomorData % WARNA.length],
                   titik: keadaan.titikSekarang, aktif: true });
    }

    var xMaks = 0, yMaks = 600;
    semua.forEach(function (j) {
      j.titik.forEach(function (p) {
        xMaks = Math.max(xMaks, p.x);
        yMaks = Math.max(yMaks, p.n);
      });
    });
    xMaks = Math.max(xMaks, keadaan.durasi + K.fisika.detikMulai);
    yMaks = pembulatanAtas(yMaks);

    sumbu(s.ctx, kiri, atas, kanan, bawah, 0, xMaks, 0, yMaks,
          'Waktu sejak Mulai (s)', 'Putaran turbin (rpm)', 0, 0);

    var px = function (x) { return kiri + (kanan - kiri) * (x / xMaks); };
    var py = function (y) { return bawah - (bawah - atas) * (y / yMaks); };

    /* pita fase pemulihan putaran */
    s.ctx.fillStyle = 'rgba(217, 138, 31, .12)';
    s.ctx.fillRect(px(0), atas, px(K.fisika.detikMulai) - px(0), bawah - atas);
    s.ctx.fillStyle = '#8a5f10';                  /* 5,14:1 */
    s.ctx.font = '600 11px system-ui, sans-serif';
    s.ctx.textAlign = 'center';
    s.ctx.textBaseline = 'top';
    if (px(K.fisika.detikMulai) - px(0) > 30) {
      s.ctx.fillText('pemulihan', (px(0) + px(K.fisika.detikMulai)) / 2, atas + 3);
    }

    if (!semua.length) {
      s.ctx.fillStyle = '#5b6b7a';                /* 5,38:1 */
      s.ctx.font = '13px system-ui, sans-serif';
      s.ctx.textAlign = 'center';
      s.ctx.textBaseline = 'middle';
      s.ctx.fillText('Grafik terisi saat percobaan berjalan.', (kiri + kanan) / 2, (atas + bawah) / 2);
    }

    semua.forEach(function (j) {
      if (j.titik.length < 2) { return; }
      s.ctx.beginPath();
      j.titik.forEach(function (p, i) {
        i === 0 ? s.ctx.moveTo(px(p.x), py(p.n)) : s.ctx.lineTo(px(p.x), py(p.n));
      });
      s.ctx.strokeStyle = j.warna;
      s.ctx.globalAlpha = j.aktif ? 1 : 0.38;
      s.ctx.lineWidth = j.aktif ? 2.4 : 1.8;
      s.ctx.stroke();
      s.ctx.globalAlpha = 1;
    });

    var terakhir = semua[semua.length - 1];
    if (terakhir && terakhir.titik.length) {
      var p = terakhir.titik[terakhir.titik.length - 1];
      s.ctx.beginPath();
      s.ctx.arc(px(p.x), py(p.n), 4, 0, Math.PI * 2);
      s.ctx.fillStyle = terakhir.warna;
      s.ctx.fill();
    }

    var ket = [];
    /* jejakRpm berisi percobaan yang sudah selesai; kurva yang sedang berjalan
       tidak ikut dihitung, jadi jumlahnya dibaca dari jejakRpm, bukan dari semua. */
    if (keadaan.jejakRpm.length) {
      ket.push(keadaan.jejakRpm.length + ' percobaan sebelumnya ditampilkan pudar.');
    }
    ket.push('Fase pemulihan ' + K.fisika.detikMulai + ' detik tidak dihitung dalam energi.');
    $('ketGrafikRpm').textContent = ket.join(' ');

    gambarLegendaRpm(semua);
  }

  /* Legenda jejak putaran. Ditempatkan di HTML, bukan digambar di kanvas, supaya
     terbaca pembaca layar dan tidak menutupi area plot pada layar sempit.
     Tanpa ini murid tidak tahu kurva pudar mana milik kondisi mana. */
  function gambarLegendaRpm(semua) {
    var wadah = $('legendaRpm');
    if (!wadah) { return; }
    wadah.innerHTML = '';
    semua.forEach(function (j) {
      if (!j.titik || j.titik.length < 2) { return; }
      var li = document.createElement('li');
      if (!j.aktif) { li.className = 'pudar'; }
      var titik = document.createElement('span');
      titik.className = 'legenda-titik';
      titik.style.background = j.warna;
      var teks = document.createElement('span');
      teks.textContent = j.label;
      li.appendChild(titik);
      li.appendChild(teks);
      wadah.appendChild(li);
    });
  }

  /* ---------------------------------------------------------------- keluaran */
  function perbaruiKeluaran() {
    var q = qEfektif(), h = hEfektif();
    var hasil = Fisika.hitung(q, h);
    /* Selama fase pemulihan, daya listrik belum mencapai kondisi mantapnya:
       putaran masih menanjak dari nol dan generator belum mengikuti. Menampilkan
       angka penuh di sini akan membuat murid membaca "daya sudah ada padahal
       roda baru berputar lambat". Karena itu daya dan energi ditampilkan "—"
       sampai fase 'jalan' dimulai; nilai mantapnya baru sah saat itu. */
    var mantap = !(keadaan.fase === 'mulai');
    $('nilaiDaya').textContent = mantap ? Fisika.formatAngka(hasil.p, 2) : '—';
    $('nilaiEnergi').textContent = mantap ? Fisika.formatAngka(keadaan.energi, 3) : '—';
    /* Saat berhenti, putaran yang tampil adalah nilai mantap (pratinjau).
       Selama percobaan, pakai rpmTampil supaya angka mengikuti putaran roda
       yang sebenarnya — termasuk saat masih menanjak di fase pemulihan. */
    var nTampil = (keadaan.fase === 'mulai' || keadaan.fase === 'jalan' || keadaan.fase === 'jeda')
      ? keadaan.rpmTampil
      : hasil.n;
    $('nilaiRpm').textContent = Fisika.formatAngka(nTampil, 0);

    /* Tinggi jatuh air TIDAK lagi ditampilkan di sini. Panel ini khusus hasil
       ukur percobaan — daya, energi, putaran — sedangkan head adalah besaran
       yang DIATUR lewat slider. Persentase terhadap maksimum situs kini
       menempel pada slidernya (lihat perbaruiLabelPengatur). */
    var catatan = [];
    if (hasil.qLimpas > 0.0001) {
      catatan.push('Debit ' + Fisika.formatAngka(q, 2) + ' m³/s melebihi kapasitas turbin ' +
        Fisika.formatAngka(K.fisika.qKapasitas, 2) + ' m³/s: ' +
        Fisika.formatAngka(hasil.qLimpas, 2) + ' m³/s melimpas dan tidak menambah daya.');
    }
    catatan.push('Energi = daya × durasi berjalan.');
    $('catatanEnergi').textContent = catatan.join(' ');
  }

  function perbaruiTimer() {
    el.timerTeks.textContent = detikKeTeks(keadaan.t);
    el.timerTotal.textContent = detikKeTeks(keadaan.durasi);
    $('timerJam').textContent = '= ' + Fisika.formatAngka(keadaan.t / 3600, 4) + ' jam';
  }

  function perbaruiKunci() {
    var kunci = balikkan();
    var kunciPenuh = kunci && K.kunciSaatBerjalan;
    el.sliderQ.disabled = kunciPenuh;
    el.sliderH.disabled = kunciPenuh;
    Array.prototype.forEach.call(document.querySelectorAll('.preset'), function (b) { b.disabled = kunciPenuh; });

    /* Durasi punya dua alasan terkunci, dan keduanya berbeda:
       - selama percobaan berjalan, karena durasi adalah bagian dari kondisi
         yang sedang diukur;
       - setelah ada data, karena energi antar-baris hanya sebanding bila
         selang waktunya sama. Terkunci sampai data dihapus. */
    var kunciDurasi = kunciPenuh || durasiTerkunci();
    Array.prototype.forEach.call(document.querySelectorAll('.durasi'), function (b) { b.disabled = kunciDurasi; });
    var ketDurasi = $('ketDurasi');
    if (ketDurasi) {
      ketDurasi.textContent = durasiTerkunci()
        ? 'Durasi terkunci di ' + keadaan.durasi + ' s karena sudah ada data. Energi hanya bisa ' +
          'dibandingkan bila durasinya sama. Hapus semua data untuk memilih durasi lain.'
        : 'Semua kelompok memakai durasi yang sama supaya energi (kWh) bisa dibandingkan. ' +
          'Durasi terkunci setelah data pertama dicatat.';
    }

    el.btnStart.disabled = (keadaan.fase === 'mulai' || keadaan.fase === 'jalan');
    el.btnPause.disabled = !kunci;
    el.btnPause.textContent = keadaan.fase === 'jeda' ? 'Lanjut' : 'Jeda';
    el.btnUlangi.disabled = (keadaan.fase === 'siap' && keadaan.t === 0);

    /* Satu percobaan = satu baris. Catat hanya boleh setelah percobaan selesai,
       supaya setiap baris mewakili kondisi dengan durasi penuh dan energi
       antar-baris tetap sebanding. Dua tombol (bilah kendali + panel) harus
       selalu dalam keadaan sama. */
    var bolehCatat = keadaan.fase === 'selesai';
    el.btnCatat.disabled = !bolehCatat;
    if (el.btnCatatBilah) { el.btnCatatBilah.disabled = !bolehCatat; }
  }

  function perbaruiSemua(dt) {
    var q = qEfektif(), h = hEfektif();
    var hasil = Fisika.hitung(q, h);
    ModulPLTA.perbarui({
      q: q, h: h,
      qTurbin: hasil.qTurbin,
      qLimpas: hasil.qLimpas,
      vPipa: hasil.vPipa,
      vJet: hasil.vJet,
      rpmTampil: keadaan.rpmTampil,
      p: hasil.p
    }, dt);
    perbaruiKeluaran();
    perbaruiTimer();
    perbaruiKunci();
  }

  /* -------------------------------------------------------------- gelung utama */
  var sebelumnya = 0;

  /* Preferensi sistem: kurangi gerak. Dibaca hidup supaya perubahan setelan
     langsung berlaku tanpa memuat ulang halaman. */
  var kueriGerak = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var gerakDikurangi = !!(kueriGerak && kueriGerak.matches);
  if (kueriGerak && kueriGerak.addEventListener) {
    kueriGerak.addEventListener('change', function (e) { gerakDikurangi = e.matches; });
  } else if (kueriGerak && kueriGerak.addListener) {
    kueriGerak.addListener(function (e) { gerakDikurangi = e.matches; });
  }

  function gelung(sekarang) {
    var dt = sebelumnya ? Math.min(0.1, (sekarang - sebelumnya) / 1000) : 0;
    sebelumnya = sekarang;

    /* dt = 0 berarti beku. Dipakai saat dijeda supaya animasi (roda, partikel,
       hujan, gelombang) ikut berhenti, bukan hanya timer.
       Fase 'siap' sengaja TIDAK dibekukan: saat berhenti, menggeser slider
       harus langsung memperlihatkan perubahan kecepatan aliran (pratinjau). */
    if (keadaan.fase === 'jeda') { dt = 0; }

    if (keadaan.fase === 'mulai') {
      var tr = jamRamp.nilai();
      keadaan.tSejakMulai = tr;
      if (tr >= K.fisika.detikMulai) {
        keadaan.fase = 'jalan';
        jamRamp.reset();
        jamJalan.mulai();
        keadaan.rpmTampil = keadaan.nKunci;
        aturPesan('Timer berjalan. Amati daya, energi, dan putaran sampai ' +
                  keadaan.durasi + ' detik.', 'sorot');
        perbaruiKunci();
      } else {
        keadaan.rpmTampil = keadaan.nKunci * (tr / K.fisika.detikMulai);
      }
    } else if (keadaan.fase === 'jalan') {
      var t = jamJalan.nilai();
      var tamat = t >= keadaan.durasi;
      if (tamat) {
        t = keadaan.durasi;
        jamJalan.set(t);
      }
      keadaan.t = t;
      keadaan.tSejakMulai = K.fisika.detikMulai + t;
      keadaan.rpmTampil = keadaan.nKunci;
      /* Q dan H terkunci: daya tetap, sehingga energi dihitung tepat.
         Dihitung sebelum pesan status supaya angka di pesan dan di tabel sama. */
      keadaan.energi = Fisika.energiKWh(keadaan.pKunci, t);
      if (tamat) {
        keadaan.fase = 'selesai';
        keadaan.animasi = 1;
        aturPesan('Durasi ' + keadaan.durasi + ' detik tercapai. Energi terkunci pada ' +
                  Fisika.formatAngka(keadaan.energi, 3) + ' kWh. Tekan Catat Data.', 'selesai');
        perbaruiKunci();
      }
    } else if (keadaan.fase === 'selesai') {
      keadaan.animasi = Math.max(0, keadaan.animasi - dt / 1.2);
      keadaan.rpmTampil = keadaan.nKunci * keadaan.animasi;
    }

    /* Rekam titik kurva putaran. Dikerjakan untuk semua fase percobaan dan
       memakai x = tSejakMulai untuk SEMUA fase, supaya jarak antar titik
       konsisten dan fase pemulihan ikut tergambar.
       Sebelumnya titik hanya didorong saat fase 'jalan' dan membandingkan
       t (0..durasi) dengan x (t + detikMulai), sehingga titik baru muncul
       setiap ~2,1 detik dan kurva baru mulai di detik ke-2. */
    if (keadaan.fase === 'mulai' || keadaan.fase === 'jalan') {
      var xTitik = keadaan.tSejakMulai;
      var terakhir = keadaan.titikSekarang[keadaan.titikSekarang.length - 1];
      if (!terakhir || xTitik - terakhir.x > 0.08) {
        keadaan.titikSekarang.push({ x: xTitik, n: keadaan.rpmTampil });
        if (keadaan.titikSekarang.length > 1200) { keadaan.titikSekarang.shift(); }
      }
    }

    /* Hormati preferensi pengurangan gerak: dt = 0 membuat seluruh animasi
       (roda, partikel, jet, gelombang, hujan) beku tanpa mematikan fungsi
       lain. Angka panel dan timer tetap berjalan seperti biasa. */
    perbaruiSemua(gerakDikurangi ? 0 : dt);

    if (keadaan.fase === 'mulai' || keadaan.fase === 'jalan') {
      gambarRpm();
    }

    requestAnimationFrame(gelung);
  }

  /* -------------------------------------------------------------------- pasang */
  function pasangPeristiwa() {
    el.btnStart.addEventListener('click', tekanMulai);
    el.btnPause.addEventListener('click', tekanJeda);
    el.btnUlangi.addEventListener('click', tekanUlangi);
    el.btnCatat.addEventListener('click', tekanCatat);
    if (el.btnCatatBilah) { el.btnCatatBilah.addEventListener('click', tekanCatat); }
    el.btnHapus.addEventListener('click', tekanHapus);

    el.sliderQ.addEventListener('input', function () {
      if (balikkan()) { return; }
      keadaan.q = parseFloat(el.sliderQ.value);
      if (keadaan.fase === 'selesai') { resetKeSiap(); }
      perbaruiLabelPengatur();
      perbaruiSemua(0);
      simpan();
    });
    el.sliderH.addEventListener('input', function () {
      if (balikkan()) { return; }
      keadaan.h = parseFloat(el.sliderH.value);
      if (keadaan.fase === 'selesai') { resetKeSiap(); }
      perbaruiLabelPengatur();
      perbaruiSemua(0);
      simpan();
    });

    $('centangModel').addEventListener('change', function () {
      keadaan.garisModel = this.checked;
      gambarSebar();
      simpan();
    });

    $('btnRumus').addEventListener('click', function () {
      keadaan.rumusTerbuka = !keadaan.rumusTerbuka;
      terapkanRumus();
      simpan();
    });

    $('btnKartu').addEventListener('click', bukaKartu);
    $('btnTutupKartu').addEventListener('click', tutupKartu);
    el.lapisKartu.addEventListener('click', function (e) {
      if (e.target === el.lapisKartu) { tutupKartu(); }
    });
    document.addEventListener('keydown', function (e) {
      if (el.lapisKartu.hidden) { return; }
      if (e.key === 'Escape') { tutupKartu(); return; }
      /* Jebakan fokus: Tab & Shift+Tab berputar hanya di dalam dialog. */
      if (e.key !== 'Tab') { return; }
      var fokusable = el.lapisKartu.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!fokusable.length) { return; }
      var pertama = fokusable[0];
      var terakhir = fokusable[fokusable.length - 1];
      if (e.shiftKey && document.activeElement === pertama) {
        e.preventDefault();
        terakhir.focus();
      } else if (!e.shiftKey && document.activeElement === terakhir) {
        e.preventDefault();
        pertama.focus();
      }
    });

    $('btnSalin').addEventListener('click', function () {
      salinTeks(teksTabel('\t', true)).then(function () {
        aturPesan('Tabel disalin. Tempelkan ke E-LKM dengan Ctrl+V.', 'selesai');
      }, function () {
        aturPesan('Penyalinan otomatis ditolak peramban. Gunakan Unduh CSV, atau Kartu Data untuk menyalin manual.');
      });
    });
    $('btnCsv').addEventListener('click', unduhCsv);

    var ukuranTerakhir = 0;
    window.addEventListener('resize', function () {
      var w = window.innerWidth;
      if (Math.abs(w - ukuranTerakhir) < 12) { return; }
      ukuranTerakhir = w;
      gambarSebar();
      gambarRpm();
    });
  }

  function terapkanRumus() {
    $('isiRumus').hidden = !keadaan.rumusTerbuka;
    $('btnRumus').setAttribute('aria-expanded', keadaan.rumusTerbuka ? 'true' : 'false');
    $('btnRumus').querySelector('span').textContent = keadaan.rumusTerbuka ? 'Sembunyikan rumus' : 'Tampilkan rumus';
  }

  function mulai() {
    el.pesanStatus = $('pesanStatus');
    el.timerTeks = $('timerTeks');
    el.timerTotal = $('timerTotal');
    el.sliderQ = $('sliderQ');
    el.sliderH = $('sliderH');
    el.kepalaTabel = $('kepalaTabel');
    el.isiTabel = $('isiTabel');
    el.kanvasSebar = $('kanvasSebar');
    el.kanvasRpm = $('kanvasRpm');
    el.lapisKartu = $('lapisKartu');
    el.kartuBesar = el.lapisKartu.querySelector('.kartu-besar');
    el.kartuIsi = $('kartuIsi');
    el.kartuBaris = $('kartuBaris');
    el.btnStart = $('btnStart');
    el.btnPause = $('btnPause');
    el.btnUlangi = $('btnUlangi');
    el.btnCatat = $('btnCatat');
    el.btnCatatBilah = $('btnCatatBilah');
    el.btnHapus = $('btnHapus');

    muat();

    ModulPLTA.bangun($('wadahVisual'));
    ModulPLTA.terapkanPreset(presetKini());

    bangunPreset();
    bangunDurasi();
    bangunPilihGrafik();
    bangunKepalaTabel();
    terapkanBatas();

    $('centangModel').checked = keadaan.garisModel;
    terapkanRumus();

    perbaruiTabel(false);
    perbaruiTombolData();
    perbaruiSemua(0);
    gambarSebar();
    gambarRpm();
    aturPesan('Atur debit dan tinggi jatuh air, lalu tekan Mulai.');

    pasangPeristiwa();
    requestAnimationFrame(gelung);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mulai);
  } else {
    mulai();
  }
})();


