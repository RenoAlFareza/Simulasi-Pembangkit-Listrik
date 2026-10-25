/* ============================================================================
   modul-plta.js — visualisasi modul PLTA.
   ----------------------------------------------------------------------------
   Potongan melintang: waduk -> intake -> pipa pesat -> nosel -> turbin ->
   generator -> saluran keluar.  Susunan ini mengikuti bagan pada Gambar 2.16
   proposal (adaptasi U.S. Department of Energy).

   Turbin digambar sebagai turbin CROSSFLOW (Banki–Michell), bukan turbin impuls:
   nosel persegi + sangkar 24 sudu, dan air terlihat menembus drum dua kali.
   Alasannya fisis, bukan hiasan — pada head 4–25 m dan debit 0,05–0,60 m³/s,
   turbin impuls (Pelton) tidak dipakai; crossflow justru lazim pada rentang itu.

   Yang bergerak mengikuti besaran:
     kecepatan partikel di pipa  <- v = Q/A        (diameter pipa TETAP)
     kecepatan partikel jet      <- v = akar(2gH)
     tebal pita jet + bukaan nosel <- Q_turbin / Q_kapasitas
     putaran roda turbin         <- rpm
     aliran di dalam drum        <- rpm dan bukaan nosel
     air di saluran limpasan     <- Q_limpasan
     jumlah lampu menyala        <- daya keluaran (acuan TETAP: daya maks situs)
     gelombang muka air          <- preset
     langit, awan, hujan         <- preset
   ========================================================================= */
var ModulPLTA = (function () {
  'use strict';

  /* viewBox "0 50 1000 420": 50 unit langit teratas dipotong dan atap gedung
     dinaikkan, supaya bagian mesin menempati ~52 % tinggi kanvas (sebelumnya
     36 %, sehingga turbin — objek yang putarannya menjadi keluaran pengukuran —
     justru paling kecil). Koordinat tetap absolut; viewBox hanya mengubah
     jendela tampak. */
  var GEOM = {
    lebar: 420,        // tinggi kanvas (viewBox 0 50 1000 420)
    atas: 50,          // tepi atas viewBox dalam koordinat SVG
    airKanan: 252,     // tepi kanan waduk = muka hilir bendung
    dasar: 470,
    asalPipa: { x: 272, y: 366 },
    kendaliPipa: { x: 430, y: 390 },
    nosel: { x: 570, y: 404 },
    turbin: { x: 665, y: 412, r: 50 },
    generator: { x: 730, y: 358, w: 130, h: 56 },
    gedung: { x1: 545, y1: 320, x2: 900, y2: 470, puncak: 250 },
    /* Saluran limpasan: cabang buangan dari pipa pesat yang membawa kelebihan
       air melewati turbin. Kedua pipa di sini TERKUBUR di bawah lereng (pipa
       pesat pada x=499 ada di y=396 sementara tanah di y=349), jadi cabangnya
       juga digambar sebagai pipa terkubur yang turun ke hilir dan keluar dari
       tepi bawah gambar — bukan pita air yang mengambang di atas rerumputan.
       Titik cabang duduk tepat di jalur pipa pesat (x 499, y 396,4). */
    limpasan: { x1: 499, y1: 396.4, cx: 497, cy: 442, x2: 468, y2: 470 }
  };

  var JUMLAH_PARTIKEL_PIPA = 22;
  var JUMLAH_PARTIKEL_JET = 9;
  /* 9 partikel jet disebar dalam 3 baris x 3 kolom. Jumlah baris = tebal pita
     air di nosel; kolom = kerapatan butir sepanjang aliran. */
  var JUMLAH_BARIS_JET = 3;
  var JUMLAH_PARTIKEL_DALAM = 7;
  var JUMLAH_PARTIKEL_LIMPAS = 6;
  var JUMLAH_TETES = 70;

  var wadah = null;
  var el = {};
  var partikelPipa = [];
  var partikelJet = [];
  var partikelDalam = [];
  var partikelLimpas = [];
  var tetes = [];
  var panjangPipa = 0;
  var panjangLimpas = 0;
  var faseGelombang = 0;
  var sudutTurbin = 0;
  var presetKini = null;
  /* Acuan indikator daya: daya maksimum SITUS, bukan daya maksimum preset.
     Sebelumnya nilainya dihitung ulang di terapkanPreset() dari batas.qMaks
     preset, sehingga cuaca ikut mengubah bacaan alat: Q 0,20 m³/s pada H 25 m
     memberi 36,79 kW di keempat preset, tetapi lampunya menyala 3 di Kemarau
     dan 2 di tiga preset lain. Keadaan fisis yang sama harus tampak sama, dan
     nama "Indikator daya" menjanjikan fungsi daya saja. Acuan tetap juga
     membuat lampu punya arti yang bisa dibaca: penuh = kapasitas turbin
     dipakai pada head maksimum. */
  var dayaMaksSitus = 1;

  /* muka air sebagai fungsi head. H = 4 m -> y 300 ; H = 25 m -> y 150 */
  function mukaAir(h) {
    return 300 - (h - 4) * 7.143;
  }

  function angka(n, d) {
    return n.toFixed(d).replace('.', ',');
  }

  /* ---------------------------------------------------------------- langit */
  function bangunLangit() {
    return '' +
      '<defs>' +
        '<linearGradient id="plta-langit" x1="0" y1="0" x2="0" y2="1">' +
          '<stop id="plta-langit-atas" offset="0%" stop-color="#7cc2ea"/>' +
          '<stop id="plta-langit-bawah" offset="100%" stop-color="#dff2fb"/>' +
        '</linearGradient>' +
        '<linearGradient id="plta-air" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="#4aa8dd"/>' +
          '<stop offset="100%" stop-color="#1c6ea8"/>' +
        '</linearGradient>' +
        '<linearGradient id="plta-tanah" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="#7d8f63"/>' +
          '<stop offset="100%" stop-color="#4f5c40"/>' +
        '</linearGradient>' +
        '<filter id="plta-cahaya" x="-60%" y="-60%" width="220%" height="220%">' +
          '<feGaussianBlur stdDeviation="9"/>' +
        '</filter>' +
      '</defs>' +
      '<rect x="0" y="50" width="1000" height="420" fill="url(#plta-langit)"/>' +
      /* matahari */
      '<g id="plta-matahari">' +
        '<circle cx="112" cy="120" r="30" fill="#ffe89a" opacity=".85" filter="url(#plta-cahaya)"/>' +
        '<circle cx="112" cy="120" r="21" fill="#ffd75e"/>' +
      '</g>' +
      /* awan */
      '<g id="plta-awan" fill="#ffffff">' +
        '<ellipse cx="300" cy="138" rx="62" ry="22"/>' +
        '<ellipse cx="346" cy="124" rx="42" ry="19"/>' +
        '<ellipse cx="258" cy="126" rx="34" ry="16"/>' +
        '<ellipse cx="652" cy="114" rx="70" ry="24"/>' +
        '<ellipse cx="704" cy="100" rx="46" ry="20"/>' +
        '<ellipse cx="602" cy="102" rx="38" ry="17"/>' +
        '<ellipse cx="880" cy="154" rx="58" ry="21"/>' +
        '<ellipse cx="922" cy="140" rx="38" ry="17"/>' +
      '</g>' +
      /* hujan */
      '<g id="plta-hujan" stroke="#cfe3f2" stroke-width="1.6" stroke-linecap="round" opacity=".75"></g>';
  }

  /* --------------------------------------------------------------- daratan */
  function bentukDaratan() {
    /* Lereng kanan turun dari puncak bendung (252,112) ke dasar lembah.
       Sisi tegak x = 252 dari y 112 sampai 470 adalah tubuh bendung, sehingga
       muka air waduk selalu terkurung dan tidak pernah tampak melayang.
       Puncak dinaikkan dari 132 ke 112 agar sejajar dengan atap gedung baru. */
    return 'M 252 112 L 400 292 L 560 388 L 700 414 L 1000 420 L 1000 470 L 252 470 Z';
  }

  /* ------------------------------------------------------------- bangunan */
  function bangunGedung() {
    var g = GEOM.gedung, t = GEOM.turbin, gn = GEOM.generator;
    return '' +
      /* rumah pembangkit, potongan melintang */
      '<g>' +
        '<path d="M ' + (g.x1 - 12) + ' ' + g.y1 + ' L ' + ((g.x1 + g.x2) / 2) + ' ' + g.puncak +
          ' L ' + (g.x2 + 12) + ' ' + g.y1 + ' Z" fill="#8d99a6"/>' +
        '<rect x="' + g.x1 + '" y="' + g.y1 + '" width="' + (g.x2 - g.x1) + '" height="' + (g.y2 - g.y1) +
          '" rx="4" fill="#eef3f7" stroke="#9fb0be" stroke-width="2"/>' +
      '</g>' +
      /* generator. Label ditaruh di ATAS kotak (bukan di bawah) supaya tidak
         berebut ruang dengan lampu indikator daya di bawahnya. */
      '<g>' +
        '<rect x="' + gn.x + '" y="' + gn.y + '" width="' + gn.w + '" height="' + gn.h +
          '" rx="7" fill="#f6d36b" stroke="#b08a1e" stroke-width="2"/>' +
        '<path d="M ' + (gn.x + 22) + ' ' + (gn.y + gn.h / 2) + ' q 14 -16 28 0 q 14 16 28 0 q 14 -16 28 0" ' +
          'fill="none" stroke="#8a6a12" stroke-width="3" stroke-linecap="round"/>' +
        '<text x="' + (gn.x + gn.w / 2) + '" y="' + (gn.y - 8) + '" text-anchor="middle" ' +
          'font-size="12" font-weight="600" fill="#44535f">Generator</text>' +
      '</g>' +
      /* Lampu indikator daya, dengan label di bawahnya. Ketiga lampu harus
         sejajar; sebelumnya yang ketiga berbeda 4 unit sehingga tampak
         miring. Dinaikkan ke cy 434 agar label (y 454) tidak menempel tepi
         bawah gedung (470). */
      '<g id="plta-lampu">' +
        '<circle cx="748" cy="434" r="8" fill="#cfd8e0" stroke="#9fb0be"/>' +
        '<circle cx="778" cy="434" r="8" fill="#cfd8e0" stroke="#9fb0be"/>' +
        '<circle cx="808" cy="434" r="8" fill="#cfd8e0" stroke="#9fb0be"/>' +
      '</g>' +
      '<text x="778" y="454" text-anchor="middle" font-size="12" font-weight="600" ' +
        'fill="#44535f">Indikator daya</text>' +
      /* saluran keluar */
      '<g>' +
        '<path d="M 900 424 L 1000 430 L 1000 470 L 900 470 Z" fill="url(#plta-air)" opacity=".85"/>' +
        '<text x="990" y="416" text-anchor="end" font-size="12" font-weight="600" fill="#2f3d49">Saluran keluar</text>' +
      '</g>';
  }

  /* ---------------------------------------------------------------- turbin */
  /* Turbin crossflow (Banki–Michell). Yang membedakannya dari turbin impuls
     seperti Pelton: air masuk melewati nosel persegi selebar drum, lalu
     menembus sudu DUA KALI (lewat atas, turun, lalu lewat bawah). Karena itu
     roda digambar sebagai sangkar: dinding drum luar, silinder dalam yang
     berlubang, dan 24 sudu melintang yang miring di antara keduanya.
     Air yang menembus dua kali inilah yang membuat crossflow tetap masuk akal
     pada head 4–25 m — wilayah kerja turbin reaksi, bukan impuls. */
  function bangunTurbin() {
    var t = GEOM.turbin;
    var rLuar = t.r;                        // dinding drum
    var rDalam = t.r * 0.58;                // silinder dalam: batas lintasan kedua
    var jmlSudu = 24;
    var lengkung = 15 * Math.PI / 180;      // kemiringan sudu (circular pitch)
    var sudu = '';
    for (var i = 0; i < jmlSudu; i++) {
      var a1 = (i * 360 / jmlSudu) * Math.PI / 180;
      var a2 = a1 + lengkung;
      var x1 = t.x + Math.cos(a1) * rDalam, y1 = t.y + Math.sin(a1) * rDalam;
      var x2 = t.x + Math.cos(a2) * (rLuar - 4), y2 = t.y + Math.sin(a2) * (rLuar - 4);
      /* titik kendali ditarik ke dalam supaya sudu melengkung seperti sudu asli */
      var am = (a1 + a2) / 2 + 0.16;
      var xm = t.x + Math.cos(am) * (rDalam + 7), ym = t.y + Math.sin(am) * (rDalam + 7);
      sudu += '<path d="M ' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
              ' Q ' + xm.toFixed(1) + ' ' + ym.toFixed(1) +
              ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1) +
              '" fill="none" stroke="#2f4a5e" stroke-width="3.4" stroke-linecap="round"/>';
    }
    return '' +
      '<g>' +
        '<circle cx="' + t.x + '" cy="' + t.y + '" r="' + (t.r + 8) + '" fill="#b9c7d3" opacity=".55"/>' +
        '<g id="plta-roda">' +
          /* badan air di dalam sangkar, supaya terlihat air memang menembus */
          '<circle cx="' + t.x + '" cy="' + t.y + '" r="' + rDalam + '" fill="#cfe3f0"/>' +
          '<circle cx="' + t.x + '" cy="' + t.y + '" r="' + t.r + '" fill="none" ' +
            'stroke="#41566b" stroke-width="4"/>' +
          '<circle cx="' + t.x + '" cy="' + t.y + '" r="' + rDalam + '" fill="none" ' +
            'stroke="#7d8f9e" stroke-width="2"/>' +
          sudu +
          '<circle cx="' + t.x + '" cy="' + t.y + '" r="9" fill="#5a6f80"/>' +
        '</g>' +
        /* Label diletakkan di atas roda (y 412 - r 50 - 6 = 356), masih di dalam
           gedung dan viewBox. Di bawah roda tidak muat: 412+50+8+16 = 486 > 470. */
        '<text x="' + t.x + '" y="' + (t.y - t.r - 6) + '" text-anchor="middle" ' +
          'font-size="12" font-weight="600" fill="#2f4a5e">Turbin crossflow</text>' +
      '</g>';
  }

  /* Guide vane: mulut nosel yang melebar sebelum air menyentuh sudu. Tanpa ini
     nosel terlihat seperti ujung pipa biasa, dan bentuk penyempitan-meliai itu
     justru bagian yang mengubah tekanan air menjadi kecepatan.

     Dindingnya DINAMIS: pada head tetap v = akar(2gH) tidak berubah, jadi debit
     diatur oleh BUKAAN nosel (luas penampang), bukan oleh kecepatan. Membiarkan
     mulut selebar penuh pada debit kecil membuat gambar menyangkal angka —
     Q 0,05 m³/s tampak mengalir sebanyak Q 0,40 m³/s. */
  function jalurVane(sisi, bukaan) {
    var n = GEOM.nosel;
    var t = GEOM.turbin;
    var ujung = t.x - t.r - 2;              // tepi kiri roda
    var yM = t.y - 12;                      // tinggi mulut masuk drum
    var hN = 2 + 4 * bukaan;                // setengah tebal di kerongkongan
    var hM = 2 + 15 * bukaan;               // setengah tebal di mulut drum
    return 'M ' + n.x + ' ' + (n.y + sisi * hN) +
           ' L ' + ujung + ' ' + (yM + sisi * hM);
  }

  /* Pita air di antara kedua dinding vane. Digambar sebagai satu poligon
     tertutup supaya tebalnya menyempit dari kerongkongan ke mulut drum. */
  function jalurPitaJet(bukaan) {
    var n = GEOM.nosel;
    var t = GEOM.turbin;
    var ujung = t.x - t.r - 2;
    var yM = t.y - 12;
    var hN = 2 + 4 * bukaan;
    var hM = 2 + 15 * bukaan;
    return 'M ' + n.x + ' ' + (n.y - hN) +
           ' L ' + ujung + ' ' + (yM - hM) +
           ' L ' + ujung + ' ' + (yM + hM) +
           ' L ' + n.x + ' ' + (n.y + hN) + ' Z';
  }

  function bangunGuideVane() {
    var n = GEOM.nosel;
    var t = GEOM.turbin;
    var ujung = t.x - t.r - 2;              // tepi kiri roda
    return '' +
      '<g>' +
        '<path id="plta-vane-atas" d="M ' + n.x + ' ' + (n.y - 6) + ' L ' + ujung + ' ' + (n.y - 17) +
          '" stroke="#41566b" stroke-width="5" stroke-linecap="round" fill="none"/>' +
        '<path id="plta-vane-bawah" d="M ' + n.x + ' ' + (n.y + 6) + ' L ' + ujung + ' ' + (n.y + 17) +
          '" stroke="#41566b" stroke-width="5" stroke-linecap="round" fill="none"/>' +
      '</g>';
  }

  /* ------------------------------------------------------------------ pipa */
  function jalurPipa() {
    return 'M ' + GEOM.asalPipa.x + ' ' + GEOM.asalPipa.y +
           ' Q ' + GEOM.kendaliPipa.x + ' ' + GEOM.kendaliPipa.y +
           ' ' + GEOM.nosel.x + ' ' + GEOM.nosel.y;
  }

  /* Saluran limpasan: cabang dari pipa pesat yang membuang kelebihan air
     sebelum nosel. Ini bukan hisapan visual — debit di atas kapasitas turbin
     memang harus pergi ke suatu tempat, dan kalau semua partikel tetap masuk ke
     drum, gambar menyangkal angka (daya mendatar padahal airnya terlihat semua
     masuk). Cabangnya ditaruh di pipa pesat karena di situlah katup bypass pada
     PLTMH sungguhan berada: sebelum nosel, bukan di intake. */
  function jalurLimpas() {
    var l = GEOM.limpasan;
    return 'M ' + l.x1 + ' ' + l.y1 + ' Q ' + l.cx + ' ' + l.cy + ' ' + l.x2 + ' ' + l.y2;
  }

  /* Saluran limpasan: cabang buangan dari pipa pesat yang membawa kelebihan air
     melewati turbin. Salurannya SELALU digambar — di PLTMH sungguhan pipa
     bypass memang ada terus, yang berubah hanya ada-tidaknya air yang lewat.
     Menampilkan pipa yang muncul-tenggelam hanya saat debit tinggi akan
     terbaca sebagai animasi hiasan, bukan sebagai bagian alat. */
  function bangunLimpasan() {
    var d = jalurLimpas();
    return '' +
      '<g>' +
        /* sama seperti pipa pesat: dinding gelap lalu air di dalamnya */
        '<path d="' + d + '" fill="none" stroke="#41566b" stroke-width="13" stroke-linecap="round"/>' +
        '<path d="' + d + '" fill="none" stroke="#6f8ba3" stroke-width="7" stroke-linecap="round"/>' +
        /* katup bypass di titik percabangan, sedikit menonjol dari jalur pipa */
        '<circle cx="499" cy="396.4" r="8" fill="#8a6a12" stroke="#5c4609" stroke-width="2"/>' +
        '<path id="plta-jalur-limpas" d="' + d + '" fill="none" stroke="none"/>' +
        '<g id="plta-partikel-limpas"></g>' +
        /* Label: piring gelap seperti label "Pipa pesat", supaya tetap >= 4,5:1
           di atas gradasi tanah. Ditaruh di kiri jalur, di bawah label "Pipa
           pesat" (y 392-410) dan tidak menimpa dinding gedung (x1 = 545). */
        '<rect id="plta-limpas-piring" x="358" y="428" width="106" height="18" rx="4" ' +
          'fill="#41566b" opacity=".92"/>' +
        '<text id="plta-limpas-teks" x="411" y="441" text-anchor="middle" font-size="12" ' +
          'font-weight="600" fill="#ffffff">Saluran limpasan</text>' +
      '</g>';
  }

  function bangunPipa() {
    var d = jalurPipa();
    return '' +
      '<g>' +
        '<path d="' + d + '" fill="none" stroke="#41566b" stroke-width="17" stroke-linecap="round"/>' +
        '<path d="' + d + '" fill="none" stroke="#6f8ba3" stroke-width="11" stroke-linecap="round"/>' +
        '<path id="plta-jalur-pipa" d="' + d + '" fill="none" stroke="none"/>' +
        '<g id="plta-partikel-pipa"></g>' +
        /* Label diberi piring latar gelap agar tetap >= 4,5:1 di atas pipa. */
        '<rect x="322" y="392" width="62" height="18" rx="4" fill="#41566b" opacity=".92"/>' +
        '<text x="353" y="405" text-anchor="middle" font-size="12" font-weight="600" fill="#ffffff">Pipa pesat</text>' +
      '</g>' +
      /* struktur intake pada muka hulu bendung */
      '<g>' +
        '<rect x="238" y="332" width="36" height="138" rx="4" fill="#9aa8b4" stroke="#78868f" stroke-width="2"/>' +
        '<rect x="242" y="342" width="28" height="22" rx="3" fill="#2b3f52"/>' +
        '<line x1="310" y1="324" x2="276" y2="352" stroke="#44535f" stroke-width="1.2"/>' +
        '<rect x="286" y="308" width="50" height="18" rx="4" fill="#44535f" opacity=".92"/>' +
        '<text x="311" y="321" text-anchor="middle" font-size="12" font-weight="600" fill="#ffffff">Intake</text>' +
      '</g>' +
      /* jet air dari nosel ke roda turbin. Partikel air di DALAM drum punya
         grupnya sendiri: keduanya bergerak dengan aturan berbeda, dan
         mencampurnya di satu grup membuat "berapa butir yang terlihat"
         ambigu — yang dihitung jadi campuran jet dan isi drum. */
      /* Pita air dari nosel ke drum. Digambar SEBELUM partikel jet supaya butir
         air tetap terlihat di atas pitanya. Lebarnya menyetel ulang tiap frame
         mengikuti bukaan nosel (lihat jalurPitaJet). */
      '<path id="plta-pita-jet" d="" fill="#bfe4f7" opacity=".45"/>' +
      '<g id="plta-partikel-jet"></g>' +
      '<g id="plta-partikel-dalam"></g>';
  }

  /* ----------------------------------------------------------------- waduk */
  function bangunWaduk() {
    return '' +
      '<path id="plta-badan-air" fill="url(#plta-air)"/>' +
      '<path id="plta-garis-air" fill="none" stroke="#bfe4f7" stroke-width="2.5" opacity=".9"/>' +
      '<line id="plta-garis-datar" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="7 6" opacity=".55"/>' +
      /* garis ukur tinggi jatuh air. Label diberi piring latar supaya kontrasnya
         tidak bergantung pada warna gradien air di bawahnya (nilai lama 2,14:1). */
      '<g id="plta-ukur-h">' +
        '<line id="plta-ukur-garis" stroke="#ffffff" stroke-width="2"/>' +
        '<line id="plta-ukur-atas" stroke="#ffffff" stroke-width="2"/>' +
        '<line id="plta-ukur-bawah" stroke="#ffffff" stroke-width="2"/>' +
        '<rect id="plta-ukur-piring" x="0" y="0" width="112" height="22" rx="4" ' +
          'fill="#ffffff" opacity=".88"/>' +
        '<text id="plta-ukur-teks" font-size="13.5" font-weight="700" fill="#0d3b5c">H</text>' +
      '</g>' +
      /* Label waduk: putih di atas piring gelap agar >= 4,5:1 (nilai lama 4,07:1). */
      '<rect x="10" y="443" width="58" height="20" rx="4" fill="#0d3b5c" opacity=".82"/>' +
      '<text x="16" y="458" font-size="12" font-weight="700" fill="#ffffff">Waduk</text>';
  }

  function jalurGelombang(kanan, y, amp, fase) {
    var d = 'M 0 ' + y.toFixed(1);
    for (var x = 9; x <= kanan; x += 9) {
      var yy = y + Math.sin(x / 30 + fase) * amp + Math.sin(x / 12.5 + fase * 1.7) * amp * 0.35;
      d += ' L ' + x + ' ' + yy.toFixed(1);
    }
    return d;
  }

  /* ------------------------------------------------------------------ API */
  function bangun(container) {
    wadah = container;
    var svg =
      '<svg viewBox="0 50 1000 420" preserveAspectRatio="xMidYMid meet" role="img" ' +
        'aria-label="Potongan melintang PLTA: waduk, pipa pesat, turbin, dan generator">' +
        bangunLangit() +
        '<path d="' + bentukDaratan() + '" fill="url(#plta-tanah)"/>' +
        bangunWaduk() +
        bangunGedung() +
        bangunPipa() +
        bangunLimpasan() +
        bangunGuideVane() +
        bangunTurbin() +
      '</svg>';
    container.innerHTML = svg;

    el.svg = container.querySelector('svg');
    el.langitAtas = container.querySelector('#plta-langit-atas');
    el.langitBawah = container.querySelector('#plta-langit-bawah');
    el.matahari = container.querySelector('#plta-matahari');
    el.awan = container.querySelector('#plta-awan');
    el.hujan = container.querySelector('#plta-hujan');
    el.badanAir = container.querySelector('#plta-badan-air');
    el.garisAir = container.querySelector('#plta-garis-air');
    el.garisDatar = container.querySelector('#plta-garis-datar');
    el.roda = container.querySelector('#plta-roda');
    el.jalurPipa = container.querySelector('#plta-jalur-pipa');
    el.partikelPipa = container.querySelector('#plta-partikel-pipa');
    el.partikelJet = container.querySelector('#plta-partikel-jet');
    el.partikelDalam = container.querySelector('#plta-partikel-dalam');
    el.vaneAtas = container.querySelector('#plta-vane-atas');
    el.vaneBawah = container.querySelector('#plta-vane-bawah');
    el.pitaJet = container.querySelector('#plta-pita-jet');
    el.jalurLimpas = container.querySelector('#plta-jalur-limpas');
    el.partikelLimpas = container.querySelector('#plta-partikel-limpas');
    el.limpasPiring = container.querySelector('#plta-limpas-piring');
    el.limpasTeks = container.querySelector('#plta-limpas-teks');
    el.lampu = container.querySelector('#plta-lampu');
    /* Acuan indikator daya: kapasitas turbin pada head maksimum situs. */
    dayaMaksSitus = Fisika.dayaKeluarKW(
      KONFIG.fisika.qKapasitas, KONFIG.rentang.hMaks);
    el.ukur = {
      grup: container.querySelector('#plta-ukur-h'),
      garis: container.querySelector('#plta-ukur-garis'),
      atas: container.querySelector('#plta-ukur-atas'),
      bawah: container.querySelector('#plta-ukur-bawah'),
      piring: container.querySelector('#plta-ukur-piring'),
      teks: container.querySelector('#plta-ukur-teks')
    };

    panjangPipa = el.jalurPipa.getTotalLength();
    panjangLimpas = el.jalurLimpas ? el.jalurLimpas.getTotalLength() : 0;

    /* partikel air di dalam pipa */
    partikelPipa = [];
    for (var i = 0; i < JUMLAH_PARTIKEL_PIPA; i++) {
      var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('r', '3.4');
      c.setAttribute('fill', '#d5efff');
      c.setAttribute('opacity', '.9');
      el.partikelPipa.appendChild(c);
      partikelPipa.push({ node: c, u: i / JUMLAH_PARTIKEL_PIPA });
    }

    /* partikel jet: disebar dalam 3 BARIS melintang pita.
       Satu baris = satu lapis tebal air. Baris di luar bukaan nosel
       disembunyikan, sehingga debit kecil tampak sebagai benang tipis dan debit
       penuh tampak sebagai pita penuh — bukan sebagai aliran yang sama tebal. */
    partikelJet = [];
    for (var j = 0; j < JUMLAH_PARTIKEL_JET; j++) {
      var cj = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      cj.setAttribute('r', '3.1');
      cj.setAttribute('fill', '#eaf7ff');
      el.partikelJet.appendChild(cj);
      var baris = Math.floor(j / JUMLAH_BARIS_JET);
      var kolom = j % JUMLAH_BARIS_JET;
      partikelJet.push({
        node: cj,
        u: kolom / JUMLAH_BARIS_JET,
        baris: baris
      });
    }

    /* partikel di dalam drum turbin: menembus dua kali sebelum keluar */
    partikelDalam = [];
    for (var m = 0; m < JUMLAH_PARTIKEL_DALAM; m++) {
      var cd = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      cd.setAttribute('r', '2.8');
      cd.setAttribute('fill', '#0e5b8a');
      cd.setAttribute('opacity', '0');
      el.partikelDalam.appendChild(cd);
      partikelDalam.push({ node: cd, s: m / JUMLAH_PARTIKEL_DALAM });
    }

    /* partikel air limpasan: menuruni saluran bypass. Warnanya sengaja sama
       dengan partikel pipa (#d5efff) supaya terbaca sebagai air yang sama,
       hanya jalannya yang berbeda — bukan cairan lain. */
    partikelLimpas = [];
    for (var n = 0; n < JUMLAH_PARTIKEL_LIMPAS; n++) {
      var cl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      cl.setAttribute('r', '3.0');
      cl.setAttribute('fill', '#d5efff');
      cl.setAttribute('opacity', '0');
      el.partikelLimpas.appendChild(cl);
      partikelLimpas.push({ node: cl, u: n / JUMLAH_PARTIKEL_LIMPAS });
    }

    /* titik hujan */
    tetes = [];
    for (var k = 0; k < JUMLAH_TETES; k++) {
      var ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      ln.setAttribute('y2', '14');
      /* Ekor tetes 14 unit, jadi titik lahir dibatasi 56..454 agar ujung ekor
         (y + 14) tidak melewati tepi bawah viewBox 470. */
      var t = { node: ln, x: 4 + Math.random() * 992, y: 56 + Math.random() * 398, v: 420 + Math.random() * 260 };
      ln.setAttribute('x1', t.x.toFixed(1));
      ln.setAttribute('y1', t.y.toFixed(1));
      ln.setAttribute('x2', (t.x - 3).toFixed(1));
      ln.setAttribute('y2', (t.y + 14).toFixed(1));
      el.hujan.appendChild(ln);
      tetes.push(t);
    }
  }

  function terapkanPreset(preset) {
    presetKini = preset;
    el.langitAtas.setAttribute('stop-color', preset.langitAtas);
    el.langitBawah.setAttribute('stop-color', preset.langitBawah);
    el.matahari.setAttribute('opacity', preset.matahari ? '1' : '0');
    el.awan.setAttribute('opacity', String(preset.awan));
    el.hujan.style.display = preset.hujan ? '' : 'none';

    /* Acuan lampu TIDAK lagi bergantung pada preset cuaca. Dihitung sekali di
       bangun() dari kapasitas turbin dan head maksimum situs. */
  }

  /* k = keadaan simulasi ; dt = selang waktu detik, 0 berarti beku */
  function perbarui(k, dt) {
    var preset = presetKini;

    /* ---- muka air waduk ---- */
    var ya = mukaAir(k.h);
    faseGelombang += dt * (2 * Math.PI / preset.gelombangPeriode);
    var amp = preset.gelombangAmp;
    var gelombang = jalurGelombang(GEOM.airKanan, ya, amp, faseGelombang);
    el.badanAir.setAttribute('d',
      gelombang + ' L ' + GEOM.airKanan + ' ' + GEOM.dasar + ' L 0 ' + GEOM.dasar + ' Z');
    el.garisAir.setAttribute('d', gelombang);
    el.garisDatar.setAttribute('x1', '0');
    el.garisDatar.setAttribute('x2', String(GEOM.airKanan));
    el.garisDatar.setAttribute('y1', ya.toFixed(1));
    el.garisDatar.setAttribute('y2', ya.toFixed(1));

    /* ---- garis ukur head ---- */
    var xt = 196, yb = GEOM.turbin.y;
    el.ukur.garis.setAttribute('x1', String(xt));
    el.ukur.garis.setAttribute('x2', String(xt));
    el.ukur.garis.setAttribute('y1', (ya + 6).toFixed(1));
    el.ukur.garis.setAttribute('y2', (yb - 6).toFixed(1));
    el.ukur.atas.setAttribute('x1', String(xt - 7));
    el.ukur.atas.setAttribute('x2', String(xt + 7));
    el.ukur.atas.setAttribute('y1', ya.toFixed(1));
    el.ukur.atas.setAttribute('y2', ya.toFixed(1));
    el.ukur.bawah.setAttribute('x1', String(xt - 7));
    el.ukur.bawah.setAttribute('x2', String(xt + 7));
    el.ukur.bawah.setAttribute('y1', String(yb));
    el.ukur.bawah.setAttribute('y2', String(yb));
    el.ukur.teks.setAttribute('x', String(xt - 10));
    el.ukur.teks.setAttribute('y', ((ya + yb) / 2 + 5).toFixed(1));
    el.ukur.teks.setAttribute('text-anchor', 'end');
    el.ukur.teks.textContent = 'H = ' + angka(k.h, 1) + ' m';
    /* Piring latar mengikuti posisi teks. Lebar piring konstan (112) dengan
       ujung kanan menempel ke teks, sehingga teks tetap terbaca di gradien air. */
    if (el.ukur.piring) {
      el.ukur.piring.setAttribute('x', String(xt - 10 - 104));
      el.ukur.piring.setAttribute('y', (parseFloat(((ya + yb) / 2 + 5).toFixed(1)) - 16).toFixed(1));
    }

    /* ---- partikel air di dalam pipa : v = Q/A ---- */
    /* Seluruh debit sungguhan memang mengalir di pipa pesat sampai titik cabang,
       jadi jalur ini tidak diubah kapasitasnya. Yang dibagi di titik cabang
       adalah air SETELAHNYA, dan itu diurus oleh partikel jet + saluran
       limpasan di bawah. */
    var pxPerDetik = k.vPipa * 110 * KONFIG.kecepatanAnimasi;
    if (panjangPipa > 0) {
      for (var i = 0; i < partikelPipa.length; i++) {
        var p = partikelPipa[i];
        p.u += (pxPerDetik * dt) / panjangPipa;
        if (p.u >= 1) { p.u -= 1; }
        var titik = el.jalurPipa.getPointAtLength(p.u * panjangPipa);
        p.node.setAttribute('cx', titik.x.toFixed(1));
        p.node.setAttribute('cy', titik.y.toFixed(1));
      }
    }

    /* ---- pembagian air di titik cabang ---- */
    /* qTurbin = bagian debit yang melewati turbin, qLimpas = yang dibuang.
       Keduanya dipakai dengan cara berbeda:
       (1) qTurbin menentukan BUKAAN NOSEL, jadi tebal pita air yang masuk drum.
           Ini yang membuat Q 0,05 tampak sebagai benang tipis, padahal
           kecepatan butirnya sama dengan Q 0,40 (v = akar(2gH) tidak berubah);
       (2) qLimpas menentukan isi saluran limpasan, sehingga Q 0,40 dan Q 0,60
           tetap tidak identik walau jetnya sama-sama penuh — pada 0,60 m³/s
           nosel memang sudah terbuka penuh (0,40 m³/s lewat), dan 0,20 m³/s
           sisanya terlihat di saluran bypass.
       Tanpa (2), gambar menyangkal angka: daya berhenti naik tetapi semua air
       terlihat tetap masuk turbin. */
    var qTurbin = Math.max(0, k.qTurbin !== undefined ? k.qTurbin : k.q);
    var qLimpas = Math.max(0, k.qLimpas || 0);
    var qTotal = qTurbin + qLimpas;
    /* porsi air yang dibuang ke saluran limpasan, 0..1 */
    var porsiLimpas = qTotal > 0 ? qLimpas / qTotal : 0;

    /* ---- pembukaan nosel: tebal pita air ----
       Pada head tetap v = akar(2gH) TIDAK berubah, jadi debit diatur oleh luas
       penampang nosel. Bukaan = qTurbin / qKapasitas, 0..1. Inilah yang membuat
       Q 0,05 tampak sebagai benang tipis dan Q 0,40 sebagai pita penuh, padahal
       kecepatan butirnya sama. Sebelumnya hanya porsi turbin yang dipakai,
       sehingga di bawah kapasitas seluruh debit tampak sama tebal. */
    var qKapasitas = KONFIG.fisika.qKapasitas || 0.4;
    var bukaan = qKapasitas > 0 ? Math.min(1, Math.max(0, qTurbin / qKapasitas)) : 0;
    var hN = 2 + 4 * bukaan;
    var hM = 2 + 15 * bukaan;
    if (el.vaneAtas) {
      el.vaneAtas.setAttribute('d', jalurVane(-1, bukaan));
      el.vaneBawah.setAttribute('d', jalurVane(1, bukaan));
      el.pitaJet.setAttribute('d', jalurPitaJet(bukaan));
    }

    /* ---- partikel jet : v = akar(2gH), tebal mengikuti bukaan ---- */
    /* Ketiga baris SELALU tampak — yang berubah adalah jarak melintangnya
       terhadap sumbu jet. Menyembunyikan sebagian butir akan membuat aliran
       terputus-putus, padahal yang sebenarnya terjadi hanyalah pitanya menipis.
       Sebaran melintang inilah yang terbaca sebagai tebal air. */
    var nosel = GEOM.nosel, turb = GEOM.turbin;
    var masukX = turb.x - turb.r - 2;
    var masukY = turb.y - 12;
    var dx = masukX - nosel.x;
    var dy = masukY - nosel.y;
    var pxJet = k.vJet * 12 * KONFIG.kecepatanAnimasi;
    var tengahBaris = (JUMLAH_BARIS_JET - 1) / 2;
    for (var j = 0; j < partikelJet.length; j++) {
      var q = partikelJet[j];
      q.u += (pxJet * dt) / Math.max(1, Math.abs(dx));
      if (q.u > 1) { q.u -= 1; }
      /* sebaran melintang: baris 0 paling atas, baris terakhir paling bawah */
      var sebar = tengahBaris > 0 ? (q.baris - tengahBaris) / tengahBaris : 0;
      var hLokal = hN + (hM - hN) * q.u;
      var x = nosel.x + dx * q.u;
      var y = nosel.y + dy * q.u + sebar * hLokal * 0.8;
      q.node.setAttribute('cx', x.toFixed(1));
      q.node.setAttribute('cy', y.toFixed(1));
      q.node.setAttribute('opacity', String(0.25 + 0.75 * (1 - q.u)));
    }

    /* ---- partikel limpasan: menuruni saluran bypass ---- */
    /* Jumlahnya mengikuti porsi yang benar-benar dibuang, jadi pada
       Q <= Q_kapasitas salurannya kosong dan pada Q = 0,60 m³/s isinya penuh.
       Kecepatan tampaknya diskalakan (bukan v = Q/A) karena saluran ini digambar
       terpotong, hanya ~78 unit, padahal di lapangan menerus ke hilir. */
    var pxLimpas = Math.max(0, 40 * porsiLimpas) * KONFIG.kecepatanAnimasi;
    for (var n = 0; n < partikelLimpas.length; n++) {
      var pl = partikelLimpas[n];
      var tampakLimpas = panjangLimpas > 0 &&
        (n + 0.5) / partikelLimpas.length <= porsiLimpas + 0.0001;
      if (tampakLimpas) {
        pl.u += (pxLimpas * dt) / panjangLimpas;
        if (pl.u >= 1) { pl.u -= 1; }
        var titikL = el.jalurLimpas.getPointAtLength(pl.u * panjangLimpas);
        pl.node.setAttribute('cx', titikL.x.toFixed(1));
        pl.node.setAttribute('cy', titikL.y.toFixed(1));
        pl.node.setAttribute('opacity', String(0.3 + 0.65 * (1 - pl.u)));
      } else {
        pl.node.setAttribute('opacity', '0');
      }
    }

    /* ---- air di dalam drum: menembus sudu dua kali ---- */
    /* Partikel ini hanya ada selama roda berputar. Ia masuk di kiri atas,
       melintas ke bawah lalu keluar di kanan bawah — jalur dua lintasan yang
       menjadi ciri turbin crossflow. Tanpa ini, drum terlihat seperti roda
       biasa yang tidak dilalui air.
       Banyaknya air di dalam drum ikut bukaan nosel: pada debit kecil hanya
       sebagian jalur yang terisi, pada debit penuh seluruhnya. Tanpa skala ini
       jalur air di dalam drum tetap "penuh" walau noselnya hampir tertutup. */
    for (var m = 0; m < partikelDalam.length; m++) {
      var pm = partikelDalam[m];
      var terisiDalam = Math.max(0, Math.min(1, bukaan * partikelDalam.length - m));
      if (k.rpmTampil > 1 && terisiDalam > 0) {
        pm.s += dt * (0.35 + 0.65 * Math.min(1, k.rpmTampil / 1342));
        if (pm.s >= 1) { pm.s -= 1; }
        /* lintasan: kiri-atas -> tengah-bawah -> kanan-bawah */
        var s = pm.s;
        var lx = masukX + (turb.r * 2 - 6) * s;
        var ly = masukY + Math.sin(Math.PI * s) * (turb.r * 0.85) + 10 * s;
        pm.node.setAttribute('cx', lx.toFixed(1));
        pm.node.setAttribute('cy', ly.toFixed(1));
        pm.node.setAttribute('opacity', String(
          terisiDalam * 0.85 * Math.sin(Math.PI * Math.min(1, s * 1.15 + 0.05))));
      } else {
        pm.node.setAttribute('opacity', '0');
      }
    }

    /* ---- putaran roda turbin ---- */
    sudutTurbin += (k.rpmTampil * 0.4 * dt);
    if (sudutTurbin > 360000) { sudutTurbin -= 360000; }
    el.roda.setAttribute('transform',
      'rotate(' + sudutTurbin.toFixed(1) + ' ' + turb.x + ' ' + turb.y + ')');

    /* ---- lampu daya ---- */
    /* Pembagi TETAP (daya maksimum situs), bukan daya maksimum preset. Lihat
       catatan panjang pada deklarasi dayaMaksSitus. */
    var rasio = dayaMaksSitus > 0 ? k.p / dayaMaksSitus : 0;
    var menyala = rasio >= 0.60 ? 3 : rasio >= 0.30 ? 2 : rasio > 0.02 ? 1 : 0;
    var anak = el.lampu.children;
    for (var L = 0; L < anak.length; L++) {
      anak[L].setAttribute('fill', L < menyala ? '#ffd75e' : '#cfd8e0');
    }

    /* ---- hujan ---- */
    if (preset.hujan) {
      for (var t2 = 0; t2 < tetes.length; t2++) {
        var d = tetes[t2];
        d.y += d.v * dt;
        /* Daur ulang setelah ekor keluar viewBox (470). Titik lahir baru 52
           sehingga ekor (52+14=66) tetap di dalam area yang terlihat. */
        if (d.y > 456) { d.y = 52; d.x = 4 + Math.random() * 992; }
        d.node.setAttribute('x1', d.x.toFixed(1));
        d.node.setAttribute('y1', d.y.toFixed(1));
        d.node.setAttribute('x2', (d.x - 3).toFixed(1));
        d.node.setAttribute('y2', (d.y + 14).toFixed(1));
      }
    }
  }

  return {
    bangun: bangun,
    terapkanPreset: terapkanPreset,
    perbarui: perbarui,
    mukaAir: mukaAir
  };
})();
