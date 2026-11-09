/* Model fisika PLTS — skrip klasik, tanpa modul ES, agar bisa dibuka lewat file:// */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PLTSModel = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var MODEL = Object.freeze({
    area: 5000,               // m² luas aktif panel
    panelEfficiency: 0.20,    // pada suhu sel 25 °C
    tempCoefficient: -0.004,  // per °C
    inverter: 1000000,        // W AC
    cable: 0.97,
    inverterEfficiency: 0.98,
    transformer: 0.98,
    grid: 0.98,
    deliveryEfficiency: 0.98 * 0.98,   // 96 % — rugi inverter sudah masuk P AC
    sunElevation: 60,         // derajat, elevasi pada tengah hari (acuan)
    sunrise: 6,               // jam matahari terbit
    sunset: 18,               // jam matahari terbenam
    referenceElevation: 60,   // elevasi acuan: di sini model sama dengan versi lama
    albedo: 0.20,
    diffuseFraction: 0.13,    // porsi baur terhadap sinar langsung
    noct: 45,                 // °C suhu sel nominal
    ambient: 25,              // °C
    rainAmbient: 20,          // °C — hujan mendinginkan udara sekitar panel
    stc: 1000,                // W/m²
    cellAtStc: 25
  });

  /* Bagian cahaya yang lolos cuaca, diukur pada bidang panel (POA), bukan pada
     matahari. Matahari tetap terang di gambar; yang turun adalah cahaya yang
     sampai ke panel. Nilai tunggal di sini membuat satu tempat untuk mengubah
     seluruh perilaku cuaca. */
  var WEATHER_FACTOR = Object.freeze({
    lkpd: 1,      // mode LKPD: cerah, suhu sel tetap
    clear: 1,
    cloud: 0.45,
    rain: 0.25
  });

  /* Awan lewat: satu peristiwa singkat yang berulang selama percobaan.
     Hanya aktif pada eksplorasi cerah — pada mendung/hujan tidak ada yang perlu
     dilewati awan, dan pada LKPD peristiwa ini ditiadakan agar hasil dapat diulang. */
  var PASSING = Object.freeze({
    period: 11,   // detik antar-awan
    width: 4.2,   // detik awan menutup
    depth: 0.4    // bagian cahaya yang hilang: POA tinggal 60 %, turun sekitar 40 %
  });

  function clamp(value, low, high) {
    return value < low ? low : value > high ? high : value;
  }

  function toNumber(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function weatherFactor(weather) {
    var key = String(weather || 'lkpd');
    return WEATHER_FACTOR[key] === undefined ? 1 : WEATHER_FACTOR[key];
  }

  /* ---------------- posisi matahari ---------------- */

  /* Elevasi matahari (derajat) pada jam tertentu.
     Busur sederhana: 0° saat terbit, MODEL.sunElevation saat tengah hari, 0° saat terbenam.
     Di luar jam siang elevasi negatif tidak dipakai — dianggap sudah di bawah ufuk. */
  function elevationAt(hour) {
    var h = toNumber(hour, 12);
    var span = MODEL.sunset - MODEL.sunrise;
    var t = (h - MODEL.sunrise) / span;
    if (!(t > 0 && t < 1)) return 0;
    return MODEL.sunElevation * Math.sin(Math.PI * t);
  }

  /* Bagian cahaya yang tersedia dibandingkan elevasi acuan 60°.
     Nilai 1 terjadi tepat pada elevasi acuan sehingga angka model lama tetap berlaku. */
  function daylightFactor(elevation) {
    var reference = Math.sin((MODEL.referenceElevation * Math.PI) / 180);
    var current = Math.sin((clamp(toNumber(elevation, MODEL.referenceElevation), 0, 90) * Math.PI) / 180);
    return clamp(current / reference, 0, 1.05);
  }

  /* Jam (0–24) dari posisi 0..1 sepanjang durasi percobaan. */
  function hourAt(elapsed, duration, startHour, span) {
    var t = toNumber(elapsed, 0);
    var d = Math.max(1e-6, toNumber(duration, 1));
    var from = toNumber(startHour, 9);
    var length = toNumber(span, 0);
    return from + (t / d) * length;
  }

  /* ---------------- cahaya ---------------- */

  /* Intensitas sumber (W/m²) setelah koreksi ketinggian matahari.
     `irradiance` adalah acuan pada elevasi 60°. Cuaca TIDAK mengubah nilai ini:
     matahari tetap bersinar, awan yang menahan cahaya sebelum sampai ke panel. */
  function sourceAt(irradiance, options) {
    var source = Math.max(0, toNumber(irradiance, 0));
    var elevation = options && options.elevation !== undefined
      ? options.elevation
      : MODEL.referenceElevation;
    return source * daylightFactor(elevation);
  }

  /* Bagian cahaya yang hilang karena awan yang sedang lewat (0..1).
     0 berarti tidak ada awan di depan panel. */
  function passingShade(elapsed) {
    var t = toNumber(elapsed, 0);
    if (!(PASSING.period > 0)) return 0;
    var phase = t % PASSING.period;
    if (phase >= PASSING.width) return 0;
    // Naik-turun halus: 0 di tepi, 1 di tengah peristiwa.
    return PASSING.depth * Math.sin((Math.PI * phase) / PASSING.width);
  }

  /* Sudut datang terhadap garis tegak lurus panel (derajat). */
  function incidenceAngle(tilt, elevation) {
    var elev = elevation === undefined ? MODEL.referenceElevation : toNumber(elevation, MODEL.referenceElevation);
    return Math.abs(clamp(toNumber(tilt, 0), 0, 90) - (90 - elev));
  }

  /* Cahaya pada bidang panel: langsung + baur + pantulan tanah (W/m²). */
  function panelIrradiance(source, tilt, elevation) {
    var beta = clamp(toNumber(tilt, 0), 0, 90);
    var elev = elevation === undefined ? MODEL.referenceElevation : toNumber(elevation, MODEL.referenceElevation);
    var rad = (beta * Math.PI) / 180;
    var elevationRad = (Math.max(0, elev) * Math.PI) / 180;
    var cosIncidence = Math.cos(((beta - (90 - elev)) * Math.PI) / 180);
    var direct = source * Math.max(0, cosIncidence);
    var horizontalDiffuse = source * MODEL.diffuseFraction * Math.sin(elevationRad);
    var diffuse = horizontalDiffuse * (1 + Math.cos(rad)) / 2;
    var globalHorizontal = source * Math.sin(elevationRad) + horizontalDiffuse;
    var reflected = MODEL.albedo * globalHorizontal * (1 - Math.cos(rad)) / 2;
    return Math.max(0, direct + diffuse + reflected);
  }

  /* Efisiensi panel setelah koreksi suhu. */
  function efficiencyAt(temperature) {
    var factor = 1 + MODEL.tempCoefficient * (temperature - MODEL.cellAtStc);
    return MODEL.panelEfficiency * clamp(factor, 0.5, 1.05);
  }

  /* Suhu sel: tetap 25 °C pada mode LKPD, dihitung pada eksplorasi.
     Hujan menurunkan suhu udara sekitar, sehingga sel lebih dingin walau
     cahayanya justru berkurang. */
  function cellTemperature(poa, options) {
    var explore = Boolean(options && options.explore);
    if (!explore) return MODEL.cellAtStc;
    var weather = (options && options.weather) || 'clear';
    var ambient = weather === 'rain' ? MODEL.rainAmbient : MODEL.ambient;
    return ambient + ((MODEL.noct - 20) / 800) * poa;
  }

  /* Titik kerja lengkap untuk satu kondisi. */
  function solarPoint(irradiance, tilt, options) {
    var elevation = options && options.elevation !== undefined
      ? toNumber(options.elevation, MODEL.referenceElevation)
      : MODEL.referenceElevation;
    var weather = (options && options.weather) || 'lkpd';
    var source = sourceAt(irradiance, options);
    var factor = weatherFactor(weather);
    var shade = options && options.shade !== undefined ? clamp(toNumber(options.shade, 0), 0, 1) : 0;
    // Cuaca dan awan menahan cahaya sebelum mencapai bidang panel, jadi
    // keduanya bekerja pada POA — bukan pada intensitas sumber.
    var poa = panelIrradiance(source, tilt, elevation) * factor * (1 - shade);
    var temperature = cellTemperature(poa, options);
    var dc = poa * MODEL.area * efficiencyAt(temperature);
    var ac = Math.min(MODEL.inverter, dc * MODEL.cable * MODEL.inverterEfficiency);
    var delivered = ac * MODEL.deliveryEfficiency;
    return {
      source: source,
      poa: poa,
      temperature: temperature,
      dc: dc,
      ac: ac,
      delivered: delivered,
      limited: dc * MODEL.cable * MODEL.inverterEfficiency > MODEL.inverter,
      efficiency: efficiencyAt(temperature),
      elevation: elevation,
      hour: options && options.hour !== undefined ? toNumber(options.hour, 12) : null,
      weather: weather,
      shade: shade
    };
  }

  /* Satu langkah simulasi. Awah lewat hanya hidup pada eksplorasi cerah. */
  function advanceSolar(irradiance, tilt, elapsed, dt, options) {
    var explore = Boolean(options && options.explore);
    var weather = (options && options.weather) || 'lkpd';
    var shade = 0;
    if (explore && weather === 'clear') shade = passingShade(elapsed);

    var merged = {};
    if (options) {
      for (var key in options) {
        if (Object.prototype.hasOwnProperty.call(options, key)) merged[key] = options[key];
      }
    }
    merged.shade = shade;

    var point = solarPoint(irradiance, tilt, merged);
    var step = Math.max(0, toNumber(dt, 0));
    point.energyJ = point.ac * step;
    return point;
  }

  /* Ambang LED: <1 kW mati, <20 % redup, <50 % sedang, sisanya terang. */
  function indicator(power) {
    var p = Math.max(0, toNumber(power, 0));
    if (p < 1000) return 'Mati';
    var ratio = p / MODEL.inverter;
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

  return {
    MODEL: MODEL,
    WEATHER_FACTOR: WEATHER_FACTOR,
    PASSING: PASSING,
    weatherFactor: weatherFactor,
    elevationAt: elevationAt,
    daylightFactor: daylightFactor,
    hourAt: hourAt,
    sourceAt: sourceAt,
    passingShade: passingShade,
    incidenceAngle: incidenceAngle,
    panelIrradiance: panelIrradiance,
    efficiencyAt: efficiencyAt,
    cellTemperature: cellTemperature,
    solarPoint: solarPoint,
    advanceSolar: advanceSolar,
    indicator: indicator,
    number: number
  };
});
