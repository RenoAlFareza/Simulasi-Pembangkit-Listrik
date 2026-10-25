/* ============================================================================
   fisika.js — model fisis modul PLTA. Murni hitungan, tanpa DOM.
   ----------------------------------------------------------------------------
   Dimuat sebagai skrip klasik. Bergantung pada KONFIG (dimuat lebih dulu).
   Seluruh isi berkas ini bisa diuji di luar peramban (lihat _analysis/uji-model.js).

   Model: PLTA skala kecil / PLTMH mandiri dengan turbin crossflow dan generator
   magnet permanen berbeban tetap. Pada sistem seperti ini putaran turbin ikut
   berubah ketika debit atau head berubah:
       V ~ n   dan   P_listrik ~ V^2   ->   n ~ akar(P)
   karena P ~ Q*H, maka n ~ akar(Q*H).

   Dua pembatas yang membuat model ini tidak melampaui alatnya:
   1. Turbin punya kapasitas Q_kapasitas. Air di atas batas itu melimpas lewat
      pelimpah: ia tetap mengalir di dalam pipa (jadi kecepatan pipa dihitung
      dari debit sungguhan) tetapi tidak menambah daya listrik dan tidak
      menambah putaran turbin.
   2. Efisiensi 0,75 berlaku pada titik beban acuan. Konstannya dibayar dengan
      pembatas nomor 1, bukan dengan membuat kurva efisiensi melengkung.
   ========================================================================= */
var Fisika = (function () {
  'use strict';

  var C = KONFIG.fisika;
  var RENTANG = KONFIG.rentang;

  /* Debit yang benar-benar lewat turbin. Sisanya melimpas. */
  function debitTurbin(q) {
    return Math.min(q, C.qKapasitas);           // m3/s
  }

  /* Debit yang melimpas pada kondisi ini. Nol selama Q <= kapasitas. */
  function airLimpas(q) {
    return Math.max(0, q - C.qKapasitas);       // m3/s
  }

  /* Daya yang dibawa air KE TURBIN, sebelum kerugian. Persamaan 2.14 proposal.
     Debit di atas kapasitas tidak masuk ke turbin, jadi tidak dihitung. */
  function dayaAir(q, h) {
    return C.rho * C.g * debitTurbin(q) * h;    // watt
  }

  /* Daya keluaran listrik. Persamaan 2.15 proposal. */
  function dayaKeluar(q, h) {
    return C.eta * dayaAir(q, h);               // watt
  }

  function dayaKeluarKW(q, h) {
    return dayaKeluar(q, h) / 1000;             // kilowatt
  }

  /* Putaran turbin. Sama dengan rpmAcuan pada kondisi acuan. Ikut debit turbin,
     bukan debit sungai, sehingga kurva putaran mendatar setelah kapasitas. */
  function rpm(q, h) {
    var rasio = (debitTurbin(q) * h) / (C.qAcuan * C.hAcuan);
    return C.rpmAcuan * Math.sqrt(rasio);
  }

  /* Energi listrik. t dalam DETIK, hasil dalam kWh. */
  function energiKWh(dayaKW, detik) {
    return dayaKW * (detik / 3600);
  }

  /* Kecepatan aliran di dalam pipa pesat. Diameter pipa tetap, jadi debit
     yang naik berarti kecepatan yang naik — bukan pipa yang membesar.
     Memakai debit sungguhan: air limpasan tetap mengalir di dalam pipa. */
  function kecepatanPipa(q) {
    return q / C.luasPipa;                      // m/s
  }

  /* Kecepatan jet di nosel (Torricelli). */
  function kecepatanJet(h) {
    return Math.sqrt(2 * C.g * h);              // m/s
  }

  /* Posisi head dalam rentang situs. Head adalah sifat tempat (tinggi bendung
     dan topografi), bukan sifat musim, sehingga pembandingnya selalu rentang
     penuh 4–25 m — bukan batas per preset. */
  function headRelatif(h) {
    var rasio = RENTANG.hMaks > 0 ? h / RENTANG.hMaks : 0;
    return { rasio: rasio, persen: rasio * 100 };
  }

  function presetById(id) {
    var p = KONFIG.preset;
    for (var i = 0; i < p.length; i++) {
      if (p[i].id === id) { return p[i]; }
    }
    return p[0];
  }

  /* Batas pengatur. Preset hanya memangkas debit; head selalu 4–25 m. */
  function batas(presetId) {
    var p = presetById(presetId);
    return {
      qMin: RENTANG.qMin,
      qMaks: Math.min(p.qMaks, RENTANG.qMaks),
      hMin: RENTANG.hMin,
      hMaks: RENTANG.hMaks
    };
  }

  function bulatkan(nilai, desimal) {
    var f = Math.pow(10, desimal);
    return Math.round(nilai * f) / f;
  }

  function formatAngka(nilai, desimal) {
    var s = bulatkan(nilai, desimal).toFixed(desimal);
    return s.replace('.', ',');                 // koma desimal, kaidah Indonesia
  }

  /* Seluruh besaran turunan untuk satu kondisi, sekali hitung. */
  function hitung(q, h) {
    return {
      q: q,
      h: h,
      qTurbin: debitTurbin(q),
      qLimpas: airLimpas(q),
      pAirKW: dayaAir(q, h) / 1000,
      p: dayaKeluarKW(q, h),
      n: rpm(q, h),
      vPipa: kecepatanPipa(q),
      vJet: kecepatanJet(h),
      head: headRelatif(h)
    };
  }

  return {
    debitTurbin: debitTurbin,
    airLimpas: airLimpas,
    dayaAir: dayaAir,
    dayaKeluar: dayaKeluar,
    dayaKeluarKW: dayaKeluarKW,
    rpm: rpm,
    energiKWh: energiKWh,
    kecepatanPipa: kecepatanPipa,
    kecepatanJet: kecepatanJet,
    headRelatif: headRelatif,
    presetById: presetById,
    batas: batas,
    bulatkan: bulatkan,
    formatAngka: formatAngka,
    hitung: hitung
  };
})();
