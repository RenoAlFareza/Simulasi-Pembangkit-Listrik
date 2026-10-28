/* ============================================================================
   inti.js — perekat antara gambar, model fisis, dan kendali di layar.
   Bergantung pada KONFIG, Fisika, ModulPLTA (dimuat lebih dulu).

   Rancangan 0.3.0 (redesign Ronde 5). Prinsip yang dijaga berkas ini:

     1. Tidak ada tahap "Mulai" lalu "Catat Data". Simulasi selalu hidup:
        begitu siswa menggeser pengatur, air mengalir dan angka berubah.
        Yang diminta LKPD adalah mengamati SETELAH ALIRAN STABIL, jadi yang
        ada hanya penanda "menyesuaikan" sebentar lalu "stabil".

     2. Hanya DUA respon ditampilkan — daya listrik (kW) dan tingkat terang
        lampu — persis dua kolom respon di tabel LKPD.

     3. Satu percobaan mengunci satu variabel kontrol. Saat "Percobaan 1"
        dipilih, slider debit dinonaktifkan pada nilai tetap, dan sebaliknya.
        Ini yang menjaga syarat LKPD "jaga variabel kontrol tetap sama".

     4. Energi, putaran turbin, durasi, tabel data, dan grafik tidak
        ditampilkan: tidak satu pun diminta LKPD, dan di layar HP panel-panel
        itu mendorong gambar keluar dari layar.

     5. Konversi kW -> MW ditampilkan kecil di bawah daya, karena LKPD meminta
        satuan MW sedangkan angka simulasi berada di wilayah kW. Angka itu
        pembanding untuk memeriksa hasil hitung siswa, bukan jawaban siap
        salin.
   ========================================================================= */
var Inti = (function () {
  'use strict';

  var K = KONFIG;
  var $ = function (id) { return document.getElementById(id); };

  var keadaan = {
    percobaan: null,   // salah satu objek di KONFIG.percobaan
    q: 0.30,
    h: 15,
    rumusTerbuka: K.rumusTerbukaBawaan,
    /* Nilai yang digambar dan dihitung diredam menuju nilai pengatur, supaya
       perubahan terbaca sebagai "aliran menyesuaikan" lalu diam — bukan angka
       yang melompat seketika. */
    qTampil: 0.30,
    hTampil: 15,
    stabil: true,
    waktuStabil: 0
  };

  var el = {};

  function kumpulkanElemen() {
    el.wadahVisual = $('wadahVisual');
    el.status = $('statusAliran');
    el.daftarPercobaan = $('daftarPercobaan');
    el.catatanKontrol = $('catatanKontrol');

    el.sliderQ = $('sliderQ');
    el.sliderH = $('sliderH');
    el.nilaiQ = $('nilaiQ');
    el.nilaiH = $('nilaiH');
    el.kunciQ = $('kunciQ');
    el.kunciH = $('kunciH');

    el.nilaiDaya = $('nilaiDaya');
    el.nilaiDayaMW = $('nilaiDayaMW');
    el.nilaiTerang = $('nilaiTerang');
    el.tingkatTerang = $('tingkatTerang');

    el.btnRumus = $('btnRumus');
    el.isiRumus = $('isiRumus');
    el.labelTombolRumus = $('labelTombolRumus');
    el.panahRumus = $('panahRumus');
  }

  /* ------------------------------------------------------- mode percobaan */
  function bangunPercobaan() {
    var html = '';
    for (var i = 0; i < K.percobaan.length; i++) {
      var p = K.percobaan[i];
      var aktif = p.id === keadaan.percobaan.id;
      html += '<button type="button" class="pilih-percobaan'
        + (aktif ? ' aktif' : '') + '" data-percobaan="' + p.id
        + '" aria-pressed="' + (aktif ? 'true' : 'false') + '">'
        + '<span class="nomor">' + p.nomor + '</span>'
        + '<span class="judul">' + p.judul + '</span></button>';
    }
    el.daftarPercobaan.innerHTML = html;
    el.catatanKontrol.textContent = keadaan.percobaan.catatan;
  }

  function pilihPercobaan(id) {
    for (var i = 0; i < K.percobaan.length; i++) {
      if (K.percobaan[i].id === id) { keadaan.percobaan = K.percobaan[i]; }
    }

    var kunci = keadaan.percobaan.kunci;
    if (kunci.q !== undefined) {
      keadaan.q = kunci.q;
      keadaan.qTampil = kunci.q;
      el.sliderQ.value = String(kunci.q);
    }
    if (kunci.h !== undefined) {
      keadaan.h = kunci.h;
      keadaan.hTampil = kunci.h;
      el.sliderH.value = String(kunci.h);
    }

    bangunPercobaan();
    terapkanKunci();
    perbaruiLabel();
    perbaruiSemua(0);
    tandaiMenyesuaikan();
  }

  /* Slider variabel kontrol dinonaktifkan dan diberi keterangan tertulis
     mengapa terkunci — bukan dikunci diam-diam. */
  function terapkanKunci() {
    var ubah = keadaan.percobaan.ubah;
    var kunciQ = ubah !== 'q';
    var kunciH = ubah !== 'h';

    el.sliderQ.disabled = kunciQ;
    el.sliderH.disabled = kunciH;
    el.kunciQ.hidden = !kunciQ;
    el.kunciH.hidden = !kunciH;
  }

  /* ------------------------------------------------------------- pengatur */
  function perbaruiLabel() {
    el.nilaiQ.textContent = Fisika.formatAngka(keadaan.q, 2) + ' m³/s';
    el.nilaiH.textContent = Fisika.formatAngka(keadaan.h, 1) + ' m';
  }

  function tandaiMenyesuaikan() {
    keadaan.stabil = false;
    keadaan.waktuStabil = 0;
    el.status.textContent = 'Aliran menyesuaikan…';
    el.status.className = 'status menyesuaikan';
  }

  function tandaiStabil() {
    keadaan.stabil = true;
    /* Angka yang dibaca harus angka model yang tepat, bukan sisa redaman yang
       masih beberapa perseratus di bawahnya. Begitu dinyatakan stabil, nilai
       tampil dipaku pada nilai pengatur. */
    keadaan.qTampil = keadaan.q;
    keadaan.hTampil = keadaan.h;
    el.status.textContent = 'Aliran stabil — catat daya dan tingkat terangnya di LKPD.';
    el.status.className = 'status stabil';
  }

  /* ---------------------------------------------------- keluaran ke layar */
  function perbaruiKeluaran(hasil) {
    el.nilaiDaya.textContent = keadaan.stabil
      ? Fisika.formatAngka(hasil.p, 2) : '—';
    el.nilaiDayaMW.textContent = keadaan.stabil
      ? '= ' + Fisika.formatAngka(hasil.p / 1000, 4) + ' MW' : '= —';

    el.nilaiTerang.textContent = keadaan.stabil ? hasil.terang.label : '—';
    el.tingkatTerang.setAttribute('data-level', String(hasil.terang.level));
    el.tingkatTerang.setAttribute('data-kelas', hasil.terang.kelas);
  }

  function perbaruiSemua(dt) {
    var hasil = Fisika.hitung(keadaan.qTampil, keadaan.hTampil);
    ModulPLTA.perbarui({
      q: keadaan.qTampil,
      h: keadaan.hTampil,
      vPipa: hasil.vPipa,
      putaran: hasil.n,
      terang: hasil.terang,
      p: hasil.p
    }, dt);
    perbaruiKeluaran(hasil);
  }

  function perbaruiRumus() {
    el.btnRumus.setAttribute('aria-expanded', keadaan.rumusTerbuka ? 'true' : 'false');
    el.isiRumus.hidden = !keadaan.rumusTerbuka;
    el.labelTombolRumus.textContent = keadaan.rumusTerbuka
      ? 'Sembunyikan rumus' : 'Lihat rumus';
    el.panahRumus.textContent = keadaan.rumusTerbuka ? '▴' : '▾';
  }

  /* ----------------------------------------------------------------- gelung */
  var sebelumnya = 0;

  function gelung(sekarang) {
    var dt = sebelumnya ? Math.min(0.05, (sekarang - sebelumnya) / 1000) : 0;
    sebelumnya = sekarang;

    var redam = K.animasi.detikRedam;
    var laju = redam > 0 ? Math.min(1, (dt / redam) * 2.2) : 1;
    keadaan.qTampil += (keadaan.q - keadaan.qTampil) * laju;
    keadaan.hTampil += (keadaan.h - keadaan.hTampil) * laju;

    if (!keadaan.stabil) {
      keadaan.waktuStabil += dt;
      var dekat = Math.abs(keadaan.q - keadaan.qTampil) < 0.003
        && Math.abs(keadaan.h - keadaan.hTampil) < 0.03;
      if (dekat && keadaan.waktuStabil > 0.3) { tandaiStabil(); }
    }

    perbaruiSemua(dt);
    requestAnimationFrame(gelung);
  }

  /* -------------------------------------------------------------- peristiwa */
  function pasangPeristiwa() {
    el.daftarPercobaan.addEventListener('click', function (ev) {
      var tombol = ev.target.closest ? ev.target.closest('.pilih-percobaan') : null;
      if (!tombol) { return; }
      pilihPercobaan(tombol.getAttribute('data-percobaan'));
    });

    el.sliderQ.addEventListener('input', function () {
      keadaan.q = parseFloat(el.sliderQ.value);
      perbaruiLabel();
      tandaiMenyesuaikan();
    });

    el.sliderH.addEventListener('input', function () {
      keadaan.h = parseFloat(el.sliderH.value);
      perbaruiLabel();
      tandaiMenyesuaikan();
    });

    el.btnRumus.addEventListener('click', function () {
      keadaan.rumusTerbuka = !keadaan.rumusTerbuka;
      perbaruiRumus();
    });
  }

  /* ------------------------------------------------------------------ mulai */
  function mulai() {
    kumpulkanElemen();

    el.sliderQ.min = String(K.rentang.qMin);
    el.sliderQ.max = String(K.rentang.qMaks);
    el.sliderQ.step = String(K.rentang.qLangkah);
    el.sliderH.min = String(K.rentang.hMin);
    el.sliderH.max = String(K.rentang.hMaks);
    el.sliderH.step = String(K.rentang.hLangkah);

    el.sliderQ.value = String(K.bawaan.q);
    el.sliderH.value = String(K.bawaan.h);
    keadaan.q = K.bawaan.q;
    keadaan.h = K.bawaan.h;
    keadaan.qTampil = keadaan.q;
    keadaan.hTampil = keadaan.h;

    ModulPLTA.bangun(el.wadahVisual);

    /* Mode bawaan dipasang lewat pilihPercobaan supaya slider variabel
       kontrol ikut terkunci sejak halaman dibuka. */
    keadaan.percobaan = K.percobaan[0];
    perbaruiRumus();
    pasangPeristiwa();
    pilihPercobaan(K.bawaan.percobaan);
    requestAnimationFrame(gelung);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mulai);
  } else {
    mulai();
  }

  return { keadaan: keadaan };
})();
