/* ============================================================================
   fisika.js — model fisis modul PLTA. Murni hitungan, tanpa DOM.
   ----------------------------------------------------------------------------
   Dimuat sebagai skrip klasik. Bergantung pada KONFIG (dimuat lebih dulu).
   Seluruh isi berkas ini bisa diuji di luar peramban (lihat _analysis/uji-model.js).

   Dua persamaan yang dipakai, keduanya dari proposal:
       P_air  = rho * g * Q * H          (daya yang dibawa air)
       P_out  = eta * rho * g * Q * H    (daya listrik yang dihasilkan)

   Besaran lain:
   - putaran turbin  n ~ akar(Q*H)   -> untuk kecepatan putar gambar, TIDAK
     ditampilkan sebagai angka karena LKPD tidak memintanya.
   - kecepatan air di pipa  v = Q / A  -> untuk kecepatan partikel gambar.
   - tingkat terang lampu -> fungsi daya listrik saja.
   ========================================================================= */
var Fisika = (function () {
  'use strict';

  var C = KONFIG.fisika;

  /* Daya yang dibawa air, sebelum kerugian. Persamaan 2.14 proposal. */
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

  /* Putaran turbin pada sistem ini. Hanya dipakai untuk kecepatan putar
     gambar roda turbin; tidak pernah dicetak ke layar. */
  function putaran(q, h) {
    var rasio = (q * h) / (C.qAcuan * C.hAcuan);
    return C.rpmAcuan * Math.sqrt(Math.max(0, rasio));   // rpm
  }

  /* Kecepatan aliran di dalam pipa pesat. Diameter pipa tetap, jadi debit
     yang naik berarti kecepatan yang naik. */
  function kecepatanPipa(q) {
    return q / C.luasPipa;                      // m/s
  }

  /* Tingkat terang lampu dari daya listrik. Mengembalikan level 0..3 (untuk
     jumlah jendela yang menyala) dan fraksi 0..1 (untuk kehalusan cahaya). */
  function terang(pKW) {
    var T = KONFIG.terang;
    var ambang = T.ambang;
    var hasil = ambang[ambang.length - 1];
    for (var i = 0; i < ambang.length; i++) {
      if (pKW >= ambang[i].min) { hasil = ambang[i]; break; }
    }
    var fraksi = (pKW - T.matiKW) / (T.penuhKW - T.matiKW);
    fraksi = Math.max(0, Math.min(1, fraksi));
    return { level: hasil.level, label: hasil.label, kelas: hasil.kelas, fraksi: fraksi };
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
    var p = dayaKeluarKW(q, h);
    return {
      q: q,
      h: h,
      pAirKW: dayaAir(q, h) / 1000,
      p: p,
      n: putaran(q, h),
      vPipa: kecepatanPipa(q),
      terang: terang(p)
    };
  }

  return {
    dayaAir: dayaAir,
    dayaKeluar: dayaKeluar,
    dayaKeluarKW: dayaKeluarKW,
    putaran: putaran,
    kecepatanPipa: kecepatanPipa,
    terang: terang,
    bulatkan: bulatkan,
    formatAngka: formatAngka,
    hitung: hitung
  };
})();
