/* ============================================================================
   modul-plta.js — gambar potongan melintang PLTA dalam SVG.
   ----------------------------------------------------------------------------
   Rancangan 0.3.0 (redesign Ronde 5). Acuan gambarnya potongan melintang PLTA
   dengan turbin REAKSI di dalam rumah pembangkit — bukan turbin impuls dengan
   nosel dan pancaran air. Alur, kiri ke kanan:

     Waduk -> bendungan -> pipa pesat -> rumah pembangkit (generator di lantai
     atas, turbin di ruang bawah tanah) -> pipa hisap -> sungai BAWAH TANAH.
     Generator -> transformator -> jalur transmisi -> rumah (jendela menyala)
     yang berdiri tepat di atas sungai bawah tanah itu.

   Tata letak tegak (penting supaya gambar terbaca):
     y < 300        : udara bebas — waduk, bendungan, rumah pembangkit, rumah
     y = 300        : permukaan tanah
     y 366..440     : rongga sungai bawah tanah
   Jadi rumah di atas tanah memang berdiri di atas sungai yang mengalir di
   bawahnya, dan air keluar tidak pernah tampak menembus permukaan.

   Yang bergerak, dan besaran yang menggerakkannya:
     muka air waduk          <- tinggi jatuh air H
     kecepatan partikel pipa <- v = Q / A (diameter pipa tetap)
     putaran roda turbin     <- n ~ akar(Q*H)
     aliran sungai bawah     <- debit air Q
     jumlah & terang jendela <- daya listrik (kW)
   ========================================================================= */
var ModulPLTA = (function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';

  /* ---------------------------------------------------------------- geometri
     Kanvas 560 x 470: cukup lebar untuk alur kiri-ke-kanan, cukup sempit
     supaya label masih terbaca saat gambar menyusut ke lebar layar HP. */
  var G = {
    lebar: 560,
    tinggi: 470,

    /* Permukaan tanah. Segala yang di bawah garis ini adalah tanah, kecuali
       rongga sungai bawah tanah. */
    tanah: 300,

    /* Skala tegak: 1 meter head = 7,6 unit gambar. Muka air waduk dihitung
       dari tanah, jadi panjang garis ukur H benar-benar sebanding dengan H. */
    skalaM: 7.6,

    waduk: { kiri: 0, kanan: 118, dasar: 300 },

    dam: { muka: 112, tumit: 152, atas: 88, dasar: 300, puncakKiri: 118, puncakKanan: 140 },

    intake: { x: 108, y: 274, w: 16, h: 18 },

    pipa: 'M 110 282 Q 168 326 238 322',

    /* Rumah pembangkit: generator di lantai atas, turbin di ruang bawah. */
    gedung: { x: 232, y: 196, w: 116, h: 104 },
    generator: { x: 252, y: 216, w: 44, h: 30 },
    pit: { x: 250, y: 300, w: 84, h: 62 },
    turbin: { x: 292, y: 330, r: 24 },
    hisap: 'M 292 354 Q 330 380 366 392',

    trafo: { x: 356, y: 244, w: 26, h: 34 },

    tiang: { x: 412, dasar: 300, puncak: 148 },

    rumah: { x: 442, y: 214, w: 104, h: 86, puncak: 176, atapKiri: 436, atapKanan: 552 },
    jendela: [454, 484, 514],

    sungai: { x: 356, y: 366, w: 204, h: 74, airY: 388, airH: 34 },

    jumlahPartikelPipa: 16,
    jumlahPartikelSungai: 9
  };

  var el = {};
  var sudutTurbin = 0;
  var partikelPipa = [];
  var partikelSungai = [];
  var panjangPipa = 1;
  var jalurPipa = null;

  /* ------------------------------------------------------------------- ukur */
  function mukaAir(h) {
    var tinggi = Math.max(0, h) * G.skalaM;
    return Math.max(20, G.tanah - tinggi);
  }

  function angka(n, d) {
    return Number(n).toFixed(d);
  }

  function desimalKoma(n, d) {
    return angka(n, d).replace('.', ',');
  }

  /* -------------------------------------------------------------- bangun SVG */
  function bangun(wadah) {
    wadah.innerHTML = ''
      + '<svg viewBox="0 0 ' + G.lebar + ' ' + G.tinggi + '" '
      + 'role="img" aria-labelledby="pltaJudul" aria-describedby="pltaKet">'
      + '<title id="pltaJudul">Potongan melintang Pembangkit Listrik Tenaga Air</title>'
      + '<desc id="pltaKet">Air dari waduk turun lewat pipa pesat, memutar turbin '
      + 'di dalam rumah pembangkit, lalu keluar lewat pipa hisap menuju sungai '
      + 'bawah tanah. Listrik dari generator naik ke transformator, menyeberang '
      + 'lewat jalur transmisi, dan menyalakan rumah di atas sungai bawah tanah itu.</desc>'
      + defs() + isiGambar() + '</svg>';

    el.svg = wadah.querySelector('svg');

    el.air       = el.svg.querySelector('#plta-air-waduk');
    el.garisAir  = el.svg.querySelector('#plta-garis-air');
    el.ukurGaris = el.svg.querySelector('#plta-ukur-garis');
    el.ukurAtas  = el.svg.querySelector('#plta-ukur-atas');
    el.teksHead  = el.svg.querySelector('#plta-teks-head');

    el.roda           = el.svg.querySelector('#plta-roda');
    el.partikelPipa   = el.svg.querySelector('#plta-partikel-pipa');
    el.partikelSungai = el.svg.querySelector('#plta-partikel-sungai');
    el.cahaya         = el.svg.querySelector('#plta-cahaya');
    el.jendela = [
      el.svg.querySelector('#plta-jendela-0'),
      el.svg.querySelector('#plta-jendela-1'),
      el.svg.querySelector('#plta-jendela-2')
    ];

    jalurPipa = el.svg.querySelector('#plta-jalur-pipa');
    panjangPipa = jalurPipa && jalurPipa.getTotalLength
      ? jalurPipa.getTotalLength() : 200;

    buatPartikelPipa();
    buatPartikelSungai();
    buatSuduTurbin();
  }

  function buatPartikelPipa() {
    partikelPipa = [];
    for (var i = 0; i < G.jumlahPartikelPipa; i++) {
      var c = document.createElementNS(SVGNS, 'circle');
      c.setAttribute('r', '2.5');
      c.setAttribute('fill', '#f0fbff');
      c.setAttribute('opacity', '0.95');
      el.partikelPipa.appendChild(c);
      partikelPipa.push({ node: c, u: i / G.jumlahPartikelPipa });
    }
  }

  function buatPartikelSungai() {
    var s = G.sungai;
    partikelSungai = [];
    for (var i = 0; i < G.jumlahPartikelSungai; i++) {
      var c = document.createElementNS(SVGNS, 'circle');
      c.setAttribute('r', '2.3');
      c.setAttribute('cy', angka(s.airY + s.airH / 2 + 4, 1));
      c.setAttribute('fill', '#9fd8f2');
      c.setAttribute('opacity', '0.9');
      el.partikelSungai.appendChild(c);
      partikelSungai.push({ node: c, x: s.x + (s.w * i) / G.jumlahPartikelSungai });
    }
  }

  /* Roda turbin reaksi: lingkaran dalam (runner) dengan sudu melengkung. */
  function buatSuduTurbin() {
    var t = G.turbin;
    var sudu = '';
    for (var i = 0; i < 12; i++) {
      var a = (i * 30) * Math.PI / 180;
      var x1 = t.x + Math.cos(a) * 8;
      var y1 = t.y + Math.sin(a) * 8;
      var x2 = t.x + Math.cos(a + 0.55) * (t.r - 4);
      var y2 = t.y + Math.sin(a + 0.55) * (t.r - 4);
      sudu += '<path d="M ' + angka(x1, 1) + ' ' + angka(y1, 1) + ' Q '
        + angka(t.x + Math.cos(a + 0.2) * (t.r * 0.55), 1) + ' '
        + angka(t.y + Math.sin(a + 0.2) * (t.r * 0.55), 1) + ' '
        + angka(x2, 1) + ' ' + angka(y2, 1) + '" fill="none" '
        + 'stroke="#bfe4f7" stroke-width="2.8" stroke-linecap="round"/>';
    }
    el.roda.innerHTML = '<circle cx="' + t.x + '" cy="' + t.y + '" r="'
      + (t.r - 3) + '" fill="#1d4f79" opacity="0.55"/>' + sudu
      + '<circle cx="' + t.x + '" cy="' + t.y + '" r="6.5" fill="#a8c4d6"/>';
  }

  /* ------------------------------------------------------------- isi gambar */
  function isiGambar() {
    return latar() + tanah() + sungaiBawah() + wadukAir() + dam()
      + intake() + pipa() + pitTurbin() + gedung() + trafo()
      + transmisi() + rumah() + ukuran() + label();
  }

  function defs() {
    return '<defs>'
      + '<linearGradient id="plta-langit" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0" stop-color="#cfe6f5"/><stop offset="1" stop-color="#f2f9fd"/>'
      + '</linearGradient>'
      + '<linearGradient id="plta-air" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0" stop-color="#9fd4ef"/><stop offset="1" stop-color="#5fadd2"/>'
      + '</linearGradient>'
      + '<linearGradient id="plta-beton" x1="0" y1="0" x2="1" y2="0">'
      + '<stop offset="0" stop-color="#e4e9ee"/><stop offset="1" stop-color="#aab7c2"/>'
      + '</linearGradient>'
      + '<radialGradient id="plta-nyala">'
      + '<stop offset="0" stop-color="#ffe08a" stop-opacity="0.92"/>'
      + '<stop offset="0.5" stop-color="#ffcf5c" stop-opacity="0.3"/>'
      + '<stop offset="1" stop-color="#ffcf5c" stop-opacity="0"/>'
      + '</radialGradient>'
      + '</defs>';
  }

  function latar() {
    return '<rect x="0" y="0" width="' + G.lebar + '" height="' + G.tinggi
      + '" fill="url(#plta-langit)"/>';
  }

  function tanah() {
    var t = G.tanah;
    return '<rect x="0" y="' + t + '" width="' + G.lebar + '" height="'
      + (G.tinggi - t) + '" fill="#a9805a"/>'
      + '<rect x="0" y="' + t + '" width="' + G.lebar + '" height="9" fill="#6da34d"/>'
      + '<path d="M 0 ' + (t + 9) + ' L ' + G.lebar + ' ' + (t + 9) + '" '
      + 'stroke="#5a8a3f" stroke-width="2" opacity="0.65"/>';
  }

  /* Rongga sungai di bawah permukaan tanah: dibuka sebagai ruang gelap, dengan
     air mengalir di dasarnya. Digambar SESUDAH tanah supaya terlihat sebagai
     rongga yang digali, bukan tambalan di atas rumput. */
  function sungaiBawah() {
    var s = G.sungai;
    return '<g id="plta-sungai">'
      + '<path d="M ' + s.x + ' ' + (s.y + 16) + ' Q ' + (s.x - 6) + ' ' + s.y
      + ' ' + (s.x + 20) + ' ' + s.y + ' L ' + (s.x + s.w) + ' ' + s.y
      + ' L ' + (s.x + s.w) + ' ' + (s.y + s.h) + ' L ' + (s.x + 16) + ' '
      + (s.y + s.h) + ' Q ' + (s.x - 2) + ' ' + (s.y + s.h - 18) + ' ' + s.x
      + ' ' + (s.y + 16) + ' Z" fill="#1a2f3b"/>'
      + '<path d="M ' + (s.x + 6) + ' ' + s.airY + ' L ' + (s.x + s.w) + ' '
      + s.airY + ' L ' + (s.x + s.w) + ' ' + (s.y + s.h - 6) + ' L '
      + (s.x + 22) + ' ' + (s.y + s.h - 6) + ' Q ' + (s.x + 6) + ' '
      + (s.y + s.h - 20) + ' ' + (s.x + 6) + ' ' + s.airY + ' Z" fill="#2f7fa8"/>'
      + '<path d="M ' + (s.x + 8) + ' ' + s.airY + ' L ' + (s.x + s.w) + ' '
      + s.airY + '" stroke="#57a6c9" stroke-width="4" opacity="0.7"/>'
      + '<g id="plta-partikel-sungai"></g>'
      + '</g>';
  }

  function wadukAir() {
    var w = G.waduk;
    return '<polygon id="plta-air-waduk" points="0,186 ' + w.kanan + ',186 '
      + w.kanan + ',' + w.dasar + ' 0,' + w.dasar + '" fill="url(#plta-air)"/>'
      + '<line id="plta-garis-air" x1="0" y1="186" x2="' + w.kanan + '" y2="186" '
      + 'stroke="#dbf2fd" stroke-width="3"/>';
  }

  function dam() {
    var d = G.dam;
    return '<path d="M ' + d.muka + ' ' + d.dasar + ' L ' + d.puncakKiri + ' '
      + d.atas + ' L ' + d.puncakKanan + ' ' + d.atas + ' L ' + d.tumit + ' '
      + d.dasar + ' Z" fill="url(#plta-beton)" stroke="#8d99a4" stroke-width="2"/>'
      /* sambungan pengecoran: garis mendatar tipis, menandakan beton bertingkat */
      + '<path d="M ' + (d.muka + 2) + ' 150 L ' + (d.tumit - 2) + ' 150 M '
      + (d.muka + 1) + ' 210 L ' + (d.tumit - 1) + ' 210 M ' + d.muka + ' 262 L '
      + d.tumit + ' 262" stroke="#5d6b78" stroke-opacity="0.15" stroke-width="2"/>'
      /* mercu: bagian atas bendungan sedikit lebih terang */
      + '<path d="M ' + d.puncakKiri + ' ' + d.atas + ' L ' + d.puncakKanan + ' '
      + d.atas + ' L ' + (d.puncakKanan + 3) + ' ' + (d.atas + 6) + ' L '
      + (d.puncakKiri - 3) + ' ' + (d.atas + 6) + ' Z" fill="#c6d2dc"/>';
  }

  function intake() {
    var i = G.intake;
    return '<g id="plta-intake">'
      + '<rect x="' + (i.x - 5) + '" y="' + i.y + '" width="' + (i.w + 9)
      + '" height="' + i.h + '" fill="#3d5a6e"/>'
      + '<path d="M ' + (i.x - 2) + ' ' + (i.y + 4) + ' L ' + (i.x - 2) + ' '
      + (i.y + i.h - 4) + ' M ' + (i.x + 4) + ' ' + (i.y + 4) + ' L '
      + (i.x + 4) + ' ' + (i.y + i.h - 4) + ' M ' + (i.x + 10) + ' '
      + (i.y + 4) + ' L ' + (i.x + 10) + ' ' + (i.y + i.h - 4) + '" '
      + 'stroke="#9fd4ef" stroke-width="2.4"/>'
      + '</g>';
  }

  function pipa() {
    return '<g id="plta-pipa">'
      + '<path d="' + G.pipa + '" fill="none" stroke="#3d5a6e" stroke-width="19" '
      + 'stroke-linecap="round"/>'
      + '<path d="' + G.pipa + '" fill="none" stroke="#4a8fb3" stroke-width="12" '
      + 'stroke-linecap="round"/>'
      + '<path id="plta-jalur-pipa" d="' + G.pipa + '" fill="none" stroke="none"/>'
      + '<g id="plta-partikel-pipa"></g>'
      + '</g>';
  }

  function pitTurbin() {
    var p = G.pit, t = G.turbin;
    return '<g id="plta-turbin">'
      /* ruang turbin di bawah lantai rumah pembangkit */
      + '<rect x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h
      + '" rx="3" fill="#22404f"/>'
      + '<rect x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="8" '
      + 'fill="#3d5a6e"/>'
      /* pipa hisap: keluar dari ruang turbin menuju sungai bawah tanah */
      + '<path d="' + G.hisap + '" fill="none" stroke="#22404f" stroke-width="24" '
      + 'stroke-linecap="round"/>'
      + '<path d="' + G.hisap + '" fill="none" stroke="#4a8fb3" stroke-width="13" '
      + 'stroke-linecap="round"/>'
      /* rumah keong (casing) dan roda turbin */
      + '<circle cx="' + t.x + '" cy="' + t.y + '" r="' + (t.r + 6)
      + '" fill="#2b6ca3" stroke="#17303d" stroke-width="2"/>'
      + '<g id="plta-roda"></g>'
      + '</g>';
  }

  function gedung() {
    var g = G.gedung, gn = G.generator, t = G.turbin;
    var cx = gn.x + gn.w / 2;
    return '<g id="plta-gedung">'
      + '<rect x="' + g.x + '" y="' + g.y + '" width="' + g.w + '" height="' + g.h
      + '" fill="#eef3f7" stroke="#8d99a4" stroke-width="2"/>'
      /* atap pelat */
      + '<rect x="' + (g.x - 7) + '" y="' + (g.y - 11) + '" width="' + (g.w + 14)
      + '" height="12" rx="2" fill="#c0ccd6" stroke="#8d99a4" stroke-width="2"/>'
      /* pintu masuk di sisi kiri */
      + '<rect x="' + (g.x + 8) + '" y="' + (g.y + 58) + '" width="20" height="46" '
      + 'fill="#8a6440" stroke="#6d4e30" stroke-width="1.5"/>'
      /* generator */
      + '<rect x="' + gn.x + '" y="' + gn.y + '" width="' + gn.w + '" height="'
      + gn.h + '" rx="4" fill="#b7c8d8" stroke="#5c7488" stroke-width="2"/>'
      + '<path d="M ' + (gn.x + 10) + ' ' + (gn.y + 6) + ' L ' + (gn.x + 10) + ' '
      + (gn.y + gn.h - 6) + ' M ' + (gn.x + 22) + ' ' + (gn.y + 6) + ' L '
      + (gn.x + 22) + ' ' + (gn.y + gn.h - 6) + ' M ' + (gn.x + 34) + ' '
      + (gn.y + 6) + ' L ' + (gn.x + 34) + ' ' + (gn.y + gn.h - 6) + '" '
      + 'stroke="#6d879c" stroke-width="1.8"/>'
      /* poros generator menembus lantai turun ke turbin */
      + '<line x1="' + cx + '" y1="' + (gn.y + gn.h) + '" x2="' + cx + '" y2="'
      + (t.y - 4) + '" stroke="#6b7c8c" stroke-width="6"/>'
      + '</g>';
  }

  function trafo() {
    var t = G.trafo, g = G.gedung;
    return '<g id="plta-trafo">'
      /* kabel dari generator ke transformator */
      + '<path d="M ' + (g.x + g.w) + ' ' + (t.y + 10) + ' L ' + t.x + ' '
      + (t.y + 10) + '" stroke="#6b7c8c" stroke-width="4"/>'
      + '<rect x="' + t.x + '" y="' + t.y + '" width="' + t.w + '" height="'
      + t.h + '" rx="2" fill="#b23a2f" stroke="#7d281f" stroke-width="2"/>'
      + '<line x1="' + (t.x + 7) + '" y1="' + (t.y + 6) + '" x2="' + (t.x + 7)
      + '" y2="' + (t.y + t.h - 6) + '" stroke="#e8b0a8" stroke-width="2"/>'
      + '</g>';
  }

  function transmisi() {
    var tg = G.tiang, tr = G.trafo, r = G.rumah;
    var xTrafo = tr.x + tr.w, yTrafo = tr.y + 8;
    return '<g id="plta-transmisi">'
      /* trafo -> tiang */
      + '<path d="M ' + xTrafo + ' ' + yTrafo + ' Q ' + (tg.x - 4) + ' '
      + (yTrafo - 60) + ' ' + tg.x + ' ' + (tg.puncak + 6) + '" fill="none" '
      + 'stroke="#3d5a6e" stroke-width="2.4"/>'
      /* tiang */
      + '<line x1="' + tg.x + '" y1="' + tg.dasar + '" x2="' + tg.x + '" y2="'
      + tg.puncak + '" stroke="#5b6b7a" stroke-width="5"/>'
      + '<line x1="' + (tg.x - 15) + '" y1="' + (tg.puncak + 10) + '" x2="'
      + (tg.x + 15) + '" y2="' + (tg.puncak + 10) + '" stroke="#5b6b7a" '
      + 'stroke-width="4"/>'
      + '<line x1="' + (tg.x - 9) + '" y1="' + (tg.puncak + 30) + '" x2="'
      + (tg.x + 9) + '" y2="' + (tg.puncak + 30) + '" stroke="#5b6b7a" '
      + 'stroke-width="3.5"/>'
      /* tiang -> atap rumah */
      + '<path d="M ' + tg.x + ' ' + (tg.puncak + 10) + ' Q ' + (tg.x + 16) + ' '
      + (tg.puncak - 6) + ' ' + (r.atapKiri + 18) + ' ' + (r.y - 26) + '" '
      + 'fill="none" stroke="#3d5a6e" stroke-width="2.4"/>'
      + '</g>';
  }

  function rumah() {
    var r = G.rumah, j = G.jendela;
    var atap = 'M ' + r.atapKiri + ' ' + r.y + ' L ' + (r.x + r.w / 2) + ' '
      + r.puncak + ' L ' + r.atapKanan + ' ' + r.y + ' Z';
    var s = '<g id="plta-rumah">'
      /* aura cahaya di belakang rumah */
      + '<ellipse id="plta-cahaya" cx="' + (r.x + r.w / 2) + '" cy="'
      + (r.y + 46) + '" rx="118" ry="84" fill="url(#plta-nyala)" opacity="0"/>'
      + '<rect x="' + r.x + '" y="' + r.y + '" width="' + r.w + '" height="'
      + r.h + '" fill="#f8f1e2" stroke="#a8927a" stroke-width="2"/>'
      + '<path d="' + atap + '" fill="#b5503f" stroke="#8a3a2c" stroke-width="2"/>'
      + '<rect x="' + (r.x + 12) + '" y="' + (r.y + 52) + '" width="19" '
      + 'height="34" fill="#8a6440" stroke="#6d4e30" stroke-width="1.5"/>';
    for (var i = 0; i < 3; i++) {
      s += '<rect id="plta-jendela-' + i + '" x="' + j[i] + '" y="' + (r.y + 20)
        + '" width="22" height="24" rx="2" fill="#6b7b88" stroke="#a8927a" '
        + 'stroke-width="2"/>';
    }
    return s + '</g>';
  }

  function ukuran() {
    return '<g id="plta-ukur">'
      + '<line id="plta-ukur-garis" x1="74" y1="186" x2="74" y2="' + G.tanah
      + '" stroke="#0d3b57" stroke-width="2" stroke-dasharray="7 6" opacity="0.85"/>'
      + '<path id="plta-ukur-atas" d="M 74 186 l -5 9 l 10 0 Z" fill="#0d3b57"/>'
      + '<path d="M 74 ' + G.tanah + ' l -5 -9 l 10 0 Z" fill="#0d3b57"/>'
      + '<text id="plta-teks-head" x="84" y="180" font-size="18" font-weight="800" '
      + 'fill="#0d3b57" paint-order="stroke" stroke="#ffffff" stroke-width="5" '
      + 'stroke-linejoin="round">H = 15,0 m</text>'
      + '</g>';
  }

  /* Teks label dengan garis putih di belakang huruf (paint-order) supaya tetap
     terbaca di atas air, beton, maupun tanah. */
  function label() {
    function t(x, y, isi, ukuran, jangkar, rotasi) {
      var putar = rotasi
        ? ' transform="rotate(' + rotasi + ' ' + x + ' ' + y + ')"' : '';
      return '<text x="' + x + '" y="' + y + '" font-size="' + (ukuran || 16)
        + '" font-weight="700" fill="#16222e" text-anchor="' + (jangkar || 'start')
        + '" paint-order="stroke" stroke="#ffffff" stroke-width="4.5" '
        + 'stroke-linejoin="round"' + putar + '>' + isi + '</text>';
    }
    return '<g id="plta-label">'
      + t(10, 292, 'Waduk')
      + t(127, 78, 'Bendungan', 16, 'middle')
      + t(168, 344, 'Pipa pesat', 14, 'middle', 16)
      + t(246, 340, 'Turbin', 16, 'end')
      + t(290, 188, 'Rumah pembangkit', 15, 'middle')
      + t(250, 240, 'Generator', 13, 'end')
      + t(369, 236, 'Transformator', 12, 'middle')
      + t(420, 138, 'Jalur transmisi', 13, 'start')
      + t(494, 164, 'Rumah', 16, 'middle')
      + '<text x="262" y="404" font-size="12" font-weight="700" fill="#f2f7fa" '
      + 'text-anchor="end" paint-order="stroke" stroke="#1a2f3b" '
      + 'stroke-width="3.5" stroke-linejoin="round">Jalur keluar</text>'
      + '<text x="470" y="430" font-size="13" font-weight="700" fill="#cfe8f5" '
      + 'text-anchor="middle" paint-order="stroke" stroke="#1a2f3b" '
      + 'stroke-width="3.5" stroke-linejoin="round">Sungai bawah tanah</text>'
      + '</g>';
  }

  /* --------------------------------------------------------------- perbarui */
  function perbarui(k, dt) {
    /* --- muka air waduk dan garis ukur H --- */
    var y = mukaAir(k.h);
    el.air.setAttribute('points',
      '0,' + angka(y, 1) + ' ' + G.waduk.kanan + ',' + angka(y, 1) + ' '
      + G.waduk.kanan + ',' + G.waduk.dasar + ' 0,' + G.waduk.dasar);
    el.garisAir.setAttribute('y1', angka(y, 1));
    el.garisAir.setAttribute('y2', angka(y, 1));

    el.ukurGaris.setAttribute('y1', angka(y, 1));
    el.ukurAtas.setAttribute('d', 'M 74 ' + angka(y, 1) + ' l -5 9 l 10 0 Z');
    el.teksHead.setAttribute('y', angka(y - 9, 1));
    el.teksHead.textContent = 'H = ' + desimalKoma(k.h, 1) + ' m';

    /* --- partikel di pipa pesat, kecepatannya v = Q / A --- */
    var langkah = (k.vPipa * 44 * KONFIG.animasi.kecepatan * dt) / panjangPipa;
    for (var i = 0; i < partikelPipa.length; i++) {
      var pp = partikelPipa[i];
      pp.u += langkah;
      if (pp.u > 1) { pp.u -= 1; }
      var pt = jalurPipa.getPointAtLength(pp.u * panjangPipa);
      pp.node.setAttribute('cx', angka(pt.x, 1));
      pp.node.setAttribute('cy', angka(pt.y, 1));
    }

    /* --- roda turbin, putarannya n ~ akar(Q*H) --- */
    sudutTurbin = (sudutTurbin + k.putaran * 0.5 * dt) % 360;
    el.roda.setAttribute('transform', 'rotate(' + angka(sudutTurbin, 1) + ' '
      + G.turbin.x + ' ' + G.turbin.y + ')');

    /* --- aliran sungai bawah tanah mengikuti debit --- */
    var s = G.sungai;
    var vSungai = 10 + 110 * (k.q / KONFIG.rentang.qMaks);
    for (var n = 0; n < partikelSungai.length; n++) {
      var ps = partikelSungai[n];
      ps.x += vSungai * dt;
      if (ps.x > s.x + s.w - 10) { ps.x = s.x + 26; }
      ps.node.setAttribute('cx', angka(ps.x, 1));
    }

    /* --- rumah: jumlah jendela menyala dan terangnya aura --- */
    var t = k.terang;
    for (var w = 0; w < el.jendela.length; w++) {
      el.jendela[w].setAttribute('fill', w < t.level ? '#ffdd6b' : '#6b7b88');
    }
    el.cahaya.setAttribute('opacity', angka(t.fraksi * 0.9, 2));
  }

  return {
    bangun: bangun,
    perbarui: perbarui,
    mukaAir: mukaAir
  };
})();
