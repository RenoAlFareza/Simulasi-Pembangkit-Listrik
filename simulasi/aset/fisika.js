/* ============================================================================
   fisika.js — model fisis modul PLTA. Murni hitungan, tanpa DOM.
   ----------------------------------------------------------------------------
   Dimuat sebagai skrip klasik. Bergantung pada KONFIG (dimuat lebih dulu).
   Seluruh isi berkas ini bisa diuji di luar peramban (lihat _analysis/uji-model.js).

   Model: PLTA skala kecil / PLTMH mandiri dengan generator magnet permanen
   berbeban tetap. Pada sistem seperti ini putaran turbin ikut berubah ketika
   debit atau head berubah:
       V ~ n   dan   P_listrik ~ V^2   ->   n ~ akar(P)
   karena P ~ Q*H, maka n ~ akar(Q*H).
   ========================================================================= */
var Fisika = (function () {
  'use strict';

  var C = KONFIG.fisika;

  /* Daya yang tersedia pada air, sebelum kerugian. Persamaan 2.14 proposal. */
  function dayaAir(q, h) {
    return C.rho * C.g * q * h;                 // watt
  }

  /* Daya keluaran listrik. Persamaan 2.15 proposal. */
  function dayaKeluar(q, h) {
    return C.eta * dayaAir(q, h);               // watt
  }

  function dayaKeluarKW(q, h) {
    return dayaKeluar(q, h) / 1000;             // kilowatt
  }

  /* Putaran turbin. Sama dengan rpmAcuan pada kondisi acuan. */
  function rpm(q, h) {
    var rasio = (q * h) / (C.qAcuan * C.hAcuan);
    return C.rpmAcuan * Math.sqrt(rasio);
  }

  /* Energi listrik. t dalam DETIK, hasil dalam kWh. */
  function energiKWh(dayaKW, detik) {
    return dayaKW * (detik / 3600);
  }

  /* Kecepatan aliran di dalam pipa pesat. Diameter pipa tetap, jadi debit
     yang naik berarti kecepatan yang naik — bukan pipa yang membesar. */
  function kecepatanPipa(q) {
    return q / C.luasPipa;                      // m/s
  }

  /* Kecepatan jet di nosel (Torricelli). */
  function kecepatanJet(h) {
    return Math.sqrt(2 * C.g * h);              // m/s
  }

  /* Label kondisi waduk diturunkan dari muka air relatif terhadap preset. */
  function kondisiWaduk(h, hMaks) {
    var rasio = hMaks > 0 ? h / hMaks : 0;
    var daftar = KONFIG.ambangWaduk;
    for (var i = 0; i < daftar.length; i++) {
      if (rasio >= daftar[i].min) {
        return { label: daftar[i].label, warna: daftar[i].warna, rasio: rasio };
      }
    }
    var akhir = daftar[daftar.length - 1];
    return { label: akhir.label, warna: akhir.warna, rasio: rasio };
  }

  function presetById(id) {
    var p = KONFIG.preset;
    for (var i = 0; i < p.length; i++) {
      if (p[i].id === id) { return p[i]; }
    }
    return p[0];
  }

  /* Batas pengatur untuk sebuah preset. */
  function batas(presetId) {
    var p = presetById(presetId);
    return {
      qMin: KONFIG.rentang.qMin, qMaks: Math.min(p.qMaks, KONFIG.rentang.qMaks),
      hMin: KONFIG.rentang.hMin, hMaks: Math.min(p.hMaks, KONFIG.rentang.hMaks)
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
  function hitung(q, h, presetId) {
    var preset = presetById(presetId);
    var pKW = dayaKeluarKW(q, h);
    return {
      q: q,
      h: h,
      pAirKW: dayaAir(q, h) / 1000,
      p: pKW,
      n: rpm(q, h),
      vPipa: kecepatanPipa(q),
      vJet: kecepatanJet(h),
      waduk: kondisiWaduk(h, preset.hMaks)
    };
  }

  return {
    dayaAir: dayaAir,
    dayaKeluar: dayaKeluar,
    dayaKeluarKW: dayaKeluarKW,
    rpm: rpm,
    energiKWh: energiKWh,
    kecepatanPipa: kecepatanPipa,
    kecepatanJet: kecepatanJet,
    kondisiWaduk: kondisiWaduk,
    presetById: presetById,
    batas: batas,
    bulatkan: bulatkan,
    formatAngka: formatAngka,
    hitung: hitung
  };
})();
