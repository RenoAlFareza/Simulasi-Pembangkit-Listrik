/* Model fisika PLTB — skrip klasik, tanpa modul ES, agar bisa dibuka lewat file:// */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PLTBModel = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var MODEL = Object.freeze({
    rated: 500000,          // W — kapasitas generator
    cutIn: 3,               // m/s
    cutOut: 25,             // m/s
    radius: 20,             // m
    area: Math.PI * 20 * 20,
    airDensity: 1.225,      // kg/m³
    generatorEfficiency: 0.90,
    converter: 0.97,
    transformer: 0.98,
    grid: 0.98,
    responseSeconds: 0.8,   // tetapan waktu respons putaran
    capacity: 500000,       // acuan indikator LED
    deliveryEfficiency: 0.97 * 0.98 * 0.98
  });

  // Profil Cp sintetis per jumlah bilah: puncak dan rasio tip-speed optimal.
  var BLADE_PROFILE = {
    2: { peak: 0.45, optimal: 8.5 },
    3: { peak: 0.46, optimal: 7.0 },
    4: { peak: 0.44, optimal: 5.0 }
  };

  function profile(blades) {
    return BLADE_PROFILE[blades] || BLADE_PROFILE[3];
  }

  function clamp(value, low, high) {
    return value < low ? low : value > high ? high : value;
  }

  /* Daya angin tersedia: P = ½·ρ·A·v³ (watt). */
  function windPower(speed) {
    var v = Math.max(0, Number(speed) || 0);
    return 0.5 * MODEL.airDensity * MODEL.area * Math.pow(v, 3);
  }

  /* Koefisien daya Cp sebagai fungsi rasio tip-speed. Puncak tepat di λ optimal. */
  function cpAt(lambda, blades) {
    var p = profile(blades);
    if (!(lambda > 0)) return 0;
    var ratio = lambda / p.optimal;
    return p.peak * ratio * Math.exp(1 - ratio);
  }

  /* Putaran rotor yang membuat TSR berada di titik optimal (rpm). */
  function targetRpm(speed, blades) {
    var p = profile(blades);
    var v = Math.max(0, Number(speed) || 0);
    if (v <= 0) return 0;
    return (p.optimal * v / MODEL.radius) * 60 / (2 * Math.PI);
  }

  /* Kecepatan angin minimum agar daya generator menyentuh kapasitas. */
  function ratedSpeed(blades) {
    var p = profile(blades);
    var denom = 0.5 * MODEL.airDensity * MODEL.area * p.peak * MODEL.generatorEfficiency;
    return Math.cbrt(MODEL.rated / denom);
  }

  /* Sudut bilah: 0° saat normal, naik saat kapasitas tercapai, 90° saat angin berbahaya. */
  function pitchAt(speed, blades) {
    var v = Math.max(0, Number(speed) || 0);
    if (v >= MODEL.cutOut) return 90;
    var start = ratedSpeed(blades);
    if (v <= start) return 0;
    var span = MODEL.cutOut - start;
    return span > 0 ? clamp((v - start) / span, 0, 1) * 90 : 0;
  }

  /* Titik operasi tunak untuk satu kondisi angin. */
  function turbinePoint(speed, blades) {
    var v = Math.max(0, Number(speed) || 0);
    var rpm = v >= MODEL.cutOut ? 0 : targetRpm(v, blades);
    return {
      rpm: rpm,
      pitch: pitchAt(v, blades),
      limited: v >= ratedSpeed(blades) && v < MODEL.cutOut
    };
  }

  /* Daya generator sesaat untuk putaran tertentu (watt). */
  function generatorPower(speed, blades, rpm) {
    var v = Math.max(0, Number(speed) || 0);
    if (v < MODEL.cutIn || v >= MODEL.cutOut) return 0;
    var omega = (Math.max(0, rpm) * 2 * Math.PI) / 60; // rad/s
    var lambda = omega * MODEL.radius / v;
    var power = windPower(v) * cpAt(lambda, blades) * MODEL.generatorEfficiency;
    return clamp(power, 0, MODEL.rated);
  }

  /* Satu langkah simulasi: kelambatan putaran, daya, energi, dan geometri rotor. */
  function advanceExperiment(speed, blades, omega, elapsed, dt, windMode) {
    var base = Math.max(0, Number(speed) || 0);
    var step = Math.max(0, Number(dt) || 0);
    var t = Math.max(0, Number(elapsed) || 0);
    var wind = windMode === 'gusts' ? Math.max(0, base + 10 * Math.sin(t / 3)) : base;
    var point = turbinePoint(wind, blades);
    var tau = MODEL.responseSeconds;
    var settled = point.rpm + (Math.max(0, Number(omega) || 0) - point.rpm) * Math.exp(-step / tau);
    var next = Math.max(0, settled);
    var power = generatorPower(wind, blades, next);
    return {
      omega: next,
      angleDegrees: next * 6 * step,
      power: power,
      energyJ: power * step,
      wind: wind,
      point: point
    };
  }

  /* Daya yang benar-benar sampai ke beban setelah rugi penyaluran. */
  function deliveredPower(power) {
    return Math.max(0, Number(power) || 0) * MODEL.deliveryEfficiency;
  }

  function deliveryEfficiency() {
    return MODEL.deliveryEfficiency;
  }

  /* Daya listrik teoretis tanpa batas kapasitas (dipakai untuk pembanding). */
  function electricalPower(speed, blades) {
    var v = Math.max(0, Number(speed) || 0);
    if (v < MODEL.cutIn || v >= MODEL.cutOut) return 0;
    var p = profile(blades);
    return Math.min(MODEL.rated, windPower(v) * p.peak * MODEL.generatorEfficiency);
  }

  /* Ambang LED: <1 kW mati, <20% redup, <50% sedang, sisanya terang. */
  function indicator(power) {
    var p = Math.max(0, Number(power) || 0);
    if (p < 1000) return 'Mati';
    var ratio = p / MODEL.capacity;
    if (ratio < 0.2) return 'Redup';
    if (ratio < 0.5) return 'Sedang';
    return 'Terang';
  }

  /* Angka gaya Indonesia: "0,500" atau "6" -> Number; kosong -> NaN. */
  function number(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    if (value === null || value === undefined) return NaN;
    var text = String(value).trim().replace(/\s+/g, '').replace(',', '.');
    if (!text) return NaN;
    var parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  /* Pemeriksaan ringan terhadap baris LKPD; dipakai untuk catatan, bukan memblokir. */
  function validateRows(rows) {
    var notes = [];
    (rows || []).forEach(function (row, index) {
      var power = number(row && row.power);
      if (!Number.isFinite(power)) notes.push('Baris ' + (index + 1) + ': daya generator belum berupa angka.');
      else if (power < 0) notes.push('Baris ' + (index + 1) + ': daya tidak boleh negatif.');
      if (row && row.led && ['Mati', 'Redup', 'Sedang', 'Terang'].indexOf(row.led) < 0) {
        notes.push('Baris ' + (index + 1) + ': tingkat terang LED tidak dikenal.');
      }
    });
    return notes;
  }

  return {
    MODEL: MODEL,
    profiles: BLADE_PROFILE,
    windPower: windPower,
    electricalPower: electricalPower,
    cpAt: cpAt,
    ratedSpeed: ratedSpeed,
    turbinePoint: turbinePoint,
    generatorPower: generatorPower,
    advanceExperiment: advanceExperiment,
    deliveredPower: deliveredPower,
    deliveryEfficiency: deliveryEfficiency,
    indicator: indicator,
    number: number,
    validateRows: validateRows
  };
});
