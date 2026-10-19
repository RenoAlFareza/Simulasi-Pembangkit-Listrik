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
        sehingga energi hanya dihitung selama selang yang tercatat.
   ========================================================================= */
(function () {
  'use strict';

  var K = KONFIG;
  var KUNCI_SIMPAN = 'simulasi-plta-v1';

  var WARNA = ['#1565c0', '#c0392b', '#1f9d55', '#d98a1f', '#7b3fa0',
               '#00838f', '#ad1457', '#4e342e'];

  var el = {};
  var keadaan = {
    preset: 'cerah',
    durasi: K.durasi.bawaan,
    q: 0.30,
    h: 15,
    fase: 'siap',
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
      b.dataset.preset = p.id;
      b.innerHTML = '<strong>' + p.nama + '</strong><span>Q maks ' + Fisika.formatAngka(p.qMaks, 2) +
                    ' m³/s<br>H maks ' + Fisika.formatAngka(p.hMaks, 1) + ' m</span>';
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
      b.dataset.durasi = String(d);
      b.textContent = d + ' s';
      b.addEventListener('click', function () {
        if (balikkan()) { return; }
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
    tr.appendChild(th);
    K.kolom.forEach(function (k) {
      var c = document.createElement('th');
      c.innerHTML = k.label + '<br><span style="font-weight:600">(' + k.satuan + ')</span>';
      tr.appendChild(c);
    });
    el.kepalaTabel.innerHTML = '';
    el.kepalaTabel.appendChild(tr);
  }

  /* -------------------------------------------------------------- batas nilai */
  function batasKini() { return Fisika.batas(keadaan.preset); }

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
    perbaruiLabelPengatur();
  }

  function perbaruiLabelPengatur() {
    $('nilaiQ').textContent = Fisika.formatAngka(keadaan.q, 2) + ' m³/s';
    $('nilaiH').textContent = Fisika.formatAngka(keadaan.h, 1) + ' m';
  }

  function pilihPreset(id) {
    if (balikkan()) { return; }
    keadaan.preset = id;
    ModulPLTA.terapkanPreset(Fisika.presetById(id));
    terapkanBatas();
    bangunPreset();
    resetKeSiap();
    perbaruiSemua(0);
    simpan();
  }

  /* --------------------------------------------------------------- tindakan */
  function resetKeSiap() {
    keadaan.fase = 'siap';
    keadaan.t = 0;
    keadaan.tSejakMulai = 0;
    keadaan.energi = 0;
    keadaan.rpmTampil = 0;
    keadaan.animasi = 1;
    keadaan.titikSekarang = [];
    keadaan.jejakDisimpan = false;
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
    var hasil = Fisika.hitung(keadaan.qKunci, keadaan.hKunci, keadaan.preset);
    keadaan.pKunci = hasil.p;
    keadaan.nKunci = hasil.n;
    keadaan.titikSekarang = [];
    keadaan.jejakDisimpan = false;
    jamRamp.mulai();
    aturPesan('Turbin mulai berputar. Timer akan berjalan setelah putaran tercapai.', 'sorot');
    perbaruiKunci();
  }

  function tekanJeda() {
    if (keadaan.fase === 'jalan') {
      jamJalan.jeda();
      keadaan.fase = 'jeda';
      aturPesan('Dijeda pada ' + detikKeTeks(keadaan.t) + '. Timer dan energi berhenti.');
    } else if (keadaan.fase === 'jeda') {
      jamJalan.mulai();
      keadaan.fase = 'jalan';
      aturPesan('Percobaan dilanjutkan.', 'sorot');
    } else if (keadaan.fase === 'mulai') {
      jamRamp.jeda();
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

  function simpanJejak() {
    if (keadaan.jejakDisimpan) { return; }
    keadaan.jejakDisimpan = true;
    keadaan.jejakRpm.push({
      label: 'Q ' + Fisika.formatAngka(keadaan.qKunci, 2) + ' · H ' + Fisika.formatAngka(keadaan.hKunci, 1),
      warna: WARNA[(keadaan.jejakRpm.length + keadaan.data.length) % WARNA.length],
      titik: keadaan.titikSekarang.slice()
    });
    if (keadaan.jejakRpm.length > 6) { keadaan.jejakRpm.shift(); }
  }

  function tekanCatat() {
    if (keadaan.t < 1) { return; }
    var q = keadaan.qKunci, h = keadaan.hKunci;
    var p = Fisika.dayaKeluarKW(q, h);
    var n = Fisika.rpm(q, h);
    var t = Fisika.bulatkan(keadaan.t, 2);
    var baris = {
      no: keadaan.nomorData + 1,
      q: q, h: h, t: t,
      p: Fisika.bulatkan(p, 2),
      e: Fisika.bulatkan(Fisika.energiKWh(p, t), 3),
      n: Fisika.bulatkan(n, 0),
      warna: WARNA[keadaan.nomorData % WARNA.length]
    };
    keadaan.nomorData += 1;
    keadaan.data.push(baris);
    if (keadaan.titikSekarang.length) { simpanJejak(); }
    perbaruiTabel(true);
    perbaruiTombolData();
    gambarSebar();
    gambarRpm();
    simpan();
    aturPesan('Data baris ' + baris.no + ' dicatat: ' + Fisika.formatAngka(baris.p, 2) +
              ' kW dan ' + Fisika.formatAngka(baris.e, 3) + ' kWh. Tekan Ulangi Percobaan untuk kondisi berikutnya.', 'selesai');
  }

  function tekanHapus() {
    if (!keadaan.data.length) { return; }
    if (!window.confirm('Hapus semua ' + keadaan.data.length + ' baris data dan semua jejak grafik? Tindakan ini tidak bisa dibatalkan.')) {
      return;
    }
    keadaan.data = [];
    keadaan.jejakRpm = [];
    keadaan.titikSekarang = [];
    keadaan.nomorData = 0;
    resetKeSiap();
    perbaruiSemua(0);
    perbaruiTombolData();
    simpan();
    aturPesan('Semua data dihapus.');
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

  function teksTabel(pemisah, sertakanNomor) {
    var kepala = [];
    if (sertakanNomor) { kepala.push('No'); }
    K.kolom.forEach(function (k) { kepala.push(k.label + ' (' + k.satuan + ')'); });
    var baris = [kepala.join(pemisah)];
    keadaan.data.forEach(function (b) {
      var isi = [];
      if (sertakanNomor) { isi.push(String(b.no)); }
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

  function unduhCsv() {
    /* pemisah titik koma dan desimal koma: sesuai Excel ber-lokal Indonesia */
    var teks = teksTabel(';', true);
    var blob = new Blob(['\ufeff' + teks], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'data-plta-' + presetKini().id + '.csv';
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
    el.kartuBaris.textContent = 'Baris ke-' + b.no + ' dari ' + keadaan.data.length +
      '. Tekan Salin Tabel untuk menyalin seluruh baris sekaligus.';
    el.lapisKartu.hidden = false;
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

    ctx.fillStyle = '#7b8b99';
    ctx.font = '11px system-ui, sans-serif';
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
    ctx.fillStyle = '#5b6b7a';
    ctx.font = '600 11px system-ui, sans-serif';
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
    var xRef = keadaan.data.length ? keadaan.data[keadaan.data.length - 1] : null;
    var hAcu = xRef ? xRef.h : hEfektif();
    var qAcu = xRef ? xRef.q : qEfektif();
    var tAcu = xRef ? xRef.t : Math.max(keadaan.t, keadaan.durasi);

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
    if (keadaan.garisModel) { yMaks = Math.max(yMaks, modelY(xMaks)); }
    yMaks = pembulatanAtas(yMaks > 0 ? yMaks : 1);
    var yDesimal = pilihan.y === 'p' ? (yMaks < 10 ? 2 : 1) : 3;

    sumbu(s.ctx, kiri, atas, kanan, bawah, 0, xMaks, 0, yMaks,
          pilihan.xLabel, pilihan.yLabel, xDesimal, yDesimal);

    var px = function (x) { return kiri + (kanan - kiri) * (x / xMaks); };
    var py = function (y) { return bawah - (bawah - atas) * (y / yMaks); };

    if (keadaan.garisModel) {
      s.ctx.strokeStyle = '#9db4c6';
      s.ctx.lineWidth = 2;
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

    keadaan.data.forEach(function (d) {
      var x = px(d[pilihan.x]), y = py(d[pilihan.y]);
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
    if (keadaan.garisModel) {
      ket.push('Garis putus-putus = perhitungan model pada ' +
        (pilihan.x === 'q' ? 'H = ' + Fisika.formatAngka(hAcu, 1) + ' m' : 'Q = ' + Fisika.formatAngka(qAcu, 2) + ' m³/s') +
        (pilihan.y === 'e' ? ' dan t = ' + Fisika.formatAngka(tAcu, 0) + ' s' : '') +
        (xRef ? ' (data terakhir)' : ' (kondisi saat ini)') + '.');
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
      semua.push({ label: 'sedang berjalan', warna: WARNA[keadaan.data.length % WARNA.length],
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
          'Waktu sejak Mulai (s)', 'Putaran (rpm)', 0, 0);

    var px = function (x) { return kiri + (kanan - kiri) * (x / xMaks); };
    var py = function (y) { return bawah - (bawah - atas) * (y / yMaks); };

    /* pita fase pemulihan putaran */
    s.ctx.fillStyle = 'rgba(217, 138, 31, .12)';
    s.ctx.fillRect(px(0), atas, px(K.fisika.detikMulai) - px(0), bawah - atas);
    s.ctx.fillStyle = '#a8761a';
    s.ctx.font = '600 10px system-ui, sans-serif';
    s.ctx.textAlign = 'center';
    s.ctx.textBaseline = 'top';
    if (px(K.fisika.detikMulai) - px(0) > 30) {
      s.ctx.fillText('pemulihan', (px(0) + px(K.fisika.detikMulai)) / 2, atas + 3);
    }

    if (!semua.length) {
      s.ctx.fillStyle = '#8fa0ae';
      s.ctx.font = '12px system-ui, sans-serif';
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
  }

  /* ---------------------------------------------------------------- keluaran */
  function perbaruiKeluaran() {
    var q = qEfektif(), h = hEfektif();
    var hasil = Fisika.hitung(q, h, keadaan.preset);
    $('nilaiDaya').textContent = Fisika.formatAngka(hasil.p, 2);
    $('nilaiEnergi').textContent = Fisika.formatAngka(keadaan.energi, 3);
    $('nilaiRpm').textContent = Fisika.formatAngka(hasil.n, 0);
    $('nilaiWaduk').textContent = hasil.waduk.label;
    $('titikWaduk').style.background = hasil.waduk.warna;

    var persen = hasil.waduk.rasio * 100;
    $('catatanEnergi').textContent = 'Muka air ' + Fisika.formatAngka(persen, 0) + ' % dari maksimum preset ' +
      presetKini().nama + '. Energi = daya × durasi berjalan.';
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
    Array.prototype.forEach.call(document.querySelectorAll('.durasi'), function (b) { b.disabled = kunciPenuh; });

    el.btnStart.disabled = (keadaan.fase === 'mulai' || keadaan.fase === 'jalan');
    el.btnPause.disabled = !kunci;
    el.btnPause.textContent = keadaan.fase === 'jeda' ? 'Lanjut' : 'Jeda';
    el.btnUlangi.disabled = (keadaan.fase === 'siap' && keadaan.t === 0);

    var bolehCatat = keadaan.t >= 1 && keadaan.fase !== 'mulai';
    el.btnCatat.disabled = !bolehCatat;
  }

  function perbaruiSemua(dt) {
    var q = qEfektif(), h = hEfektif();
    var hasil = Fisika.hitung(q, h, keadaan.preset);
    ModulPLTA.perbarui({
      q: q, h: h,
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

  function gelung(sekarang) {
    var dt = sebelumnya ? Math.min(0.1, (sekarang - sebelumnya) / 1000) : 0;
    sebelumnya = sekarang;

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
      if (keadaan.titikSekarang.length === 0 ||
          t - keadaan.titikSekarang[keadaan.titikSekarang.length - 1].x > 0.08) {
        keadaan.titikSekarang.push({ x: keadaan.tSejakMulai, n: keadaan.nKunci });
        if (keadaan.titikSekarang.length > 1200) { keadaan.titikSekarang.shift(); }
      }
    } else if (keadaan.fase === 'selesai') {
      keadaan.animasi = Math.max(0, keadaan.animasi - dt / 1.2);
      keadaan.rpmTampil = keadaan.nKunci * keadaan.animasi;
    }

    perbaruiSemua(dt);

    if (keadaan.fase === 'jalan' || keadaan.fase === 'mulai') {
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
    $('btnTutupKartu').addEventListener('click', function () { el.lapisKartu.hidden = true; });
    el.lapisKartu.addEventListener('click', function (e) {
      if (e.target === el.lapisKartu) { el.lapisKartu.hidden = true; }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !el.lapisKartu.hidden) { el.lapisKartu.hidden = true; }
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
    el.kartuIsi = $('kartuIsi');
    el.kartuBaris = $('kartuBaris');
    el.btnStart = $('btnStart');
    el.btnPause = $('btnPause');
    el.btnUlangi = $('btnUlangi');
    el.btnCatat = $('btnCatat');
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
    aturPesan('Atur debit dan head, lalu tekan Mulai.');

    pasangPeristiwa();
    requestAnimationFrame(gelung);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mulai);
  } else {
    mulai();
  }
})();
