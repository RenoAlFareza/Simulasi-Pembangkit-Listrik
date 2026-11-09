/* Aplikasi simulasi PLTS — skrip klasik, dimuat setelah model/worksheet/collection. */
(function () {
  'use strict';

  var $ = function (selector) {
    return document.querySelector(selector);
  };

  var Model = window.PLTSModel;
  var Process = window.PLTSProcess;
  var MODEL_NOTE = window.PLTSContent.MODEL_NOTE;

  var controls = {
    experiment: $('#experiment'),
    irradiance: $('#irradiance'),
    tilt: $('#tilt'),
    weather: $('#weather'),
    load: $('#load'),
    duration: $('#duration'),
    dayStart: $('#day-start'),
    daySpan: $('#day-span')
  };

  /* Lintasan baku LKPD: 06:00 -> 12:00. Berakhir tepat tengah hari sehingga
     angka acuan (matahari 60°) tetap berlaku, tetapi selama percobaan matahari
     terbit lalu naik: fajar -> pagi -> siang. */
  var STANDARD_START = 6;
  var STANDARD_SPAN = 6;
  var SUNRISE = Model.MODEL.sunrise;
  var SUNSET = Model.MODEL.sunset;
  /* Batas akhir busur yang boleh dipilih pada eksplorasi (21:00 = malam). */
  var LAST_HOUR = 21;
  // Keterangan arah busur diturunkan dari jam mulai dan jam akhir, bukan dari
  // lama hari saja: busur 12:00–18:00 bukan "fajar ke tengah hari".
  function arcLabel(startHour, endHour) {
    if (startHour >= 18 || endHour <= 6) return 'malam, tanpa pembangkitan';
    if (endHour <= 12) return 'matahari naik menuju tengah hari';
    if (startHour >= 12) return 'matahari turun dari siang ke sore';
    if (endHour >= 19) return 'fajar, siang, lalu malam';
    return 'pagi menuju sore';
  }

  var INVERTER = Model.MODEL.inverter;

  var running = false;
  var paused = false;
  var elapsed = 0;
  var last = 0;
  var power = 0;
  var energy = 0;
  var recorded = false;
  var frame = 0;
  var samples = [{ t: 0, p: 0 }];
  // Nilai terendah selama satu percobaan: menunjukkan bahwa awan yang lewat
  // sempat menurunkan daya, bukan hanya nilai akhirnya.
  var minPower = null;
  var minPoa = null;

  var sheet = window.LKPDWorksheet.create({
    key: 'plts',
    title: 'PLTS',
    brand: 'PLTS',
    subtitle: 'LABORATORIUM PLTS',
    types: [
      {
        id: 'light',
        title: 'Percobaan 1 · Intensitas cahaya',
        heading: 'Percobaan 1 · Intensitas cahaya',
        controlLabel: 'Sudut panel',
        variableLabel: 'Intensitas cahaya',
        analysisField: 'analisis1',
        analysisLabel: 'Percobaan 1 · Intensitas cahaya',
        controlHint: 'Sudut panel sebaiknya tetap di semua baris karena menjadi variabel kontrol.'
      },
      {
        id: 'tilt',
        title: 'Percobaan 2 · Sudut panel',
        heading: 'Percobaan 2 · Sudut panel',
        controlLabel: 'Intensitas cahaya',
        variableLabel: 'Sudut panel',
        analysisField: 'analisis2',
        analysisLabel: 'Percobaan 2 · Sudut panel',
        controlHint: 'Intensitas cahaya sebaiknya tetap di semua baris karena menjadi variabel kontrol.'
      }
    ],
    onStart: function (type) {
      configureExperiment(type);
    }
  });

  window.EnergyWorksheet = sheet;

  function fmt(value, digits) {
    var n = digits === undefined ? 3 : digits;
    return Number(value).toLocaleString('id-ID', {
      minimumFractionDigits: n,
      maximumFractionDigits: n
    });
  }

  function clock(seconds) {
    var total = Math.max(0, Math.floor(seconds));
    return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
  }

  /* Jam matahari saat ini (0–24) menurut posisi percobaan. */
  function hourNow() {
    return Model.hourAt(elapsed, +controls.duration.value, +controls.dayStart.value, +controls.daySpan.value);
  }

  function options() {
    var hour = hourNow();
    return {
      explore: controls.weather.value !== 'lkpd',
      weather: controls.weather.value,
      hour: hour,
      elevation: Model.elevationAt(hour)
    };
  }

  /* LKPD selalu memakai busur baku agar semua baris bisa dibandingkan. */
  /* Sekali klik: satu hari penuh lewat mode eksplorasi (cerah, 15 jam).
     Dipakai agar fase sore dan malam mudah dilihat tanpa mengubah angka LKPD. */
  function dayTour() {
    if (running) return;
    controls.weather.value = 'clear';
    controls.daySpan.value = '15';
    controls.dayStart.value = String(SUNRISE);
    reset();
  }

  function standardArc() {
    if (controls.weather.value !== 'lkpd') return;
    // Mode LKPD: jam mulai DAN lama hari dikunci 06:00 -> 12:00. Semua baris
    // memakai rentang yang sama dan angka selalu dicatat saat matahari tepat di
    // puncak (elevasi 60 derajat), sehingga antarbaris bisa dibandingkan.
    controls.daySpan.value = STANDARD_SPAN;
    controls.dayStart.value = String(STANDARD_START);
  }

  /* ---------------- geometri panel ---------------- */

  function geometry() {
    var angle = +controls.tilt.value;
    var rad = (angle * Math.PI) / 180;

    $('#panelTilt').setAttribute('transform', 'rotate(' + -angle + ')');

    var x = 85 * Math.cos(rad);
    var y = -85 * Math.sin(rad);
    $('#angleArc').setAttribute('d', 'M85 0A85 85 0 0 0 ' + x + ' ' + y);
    $('#angleLabel').textContent = 'Sudut ' + angle + '°';

    var ex = 200 + 300 * Math.cos(rad) + 83 * Math.sin(rad);
    var ey = 590 - 300 * Math.sin(rad) + 83 * Math.cos(rad);
    ['panelSupport', 'panelSupportInset'].forEach(function (id) {
      $('#' + id).setAttribute('d', 'M460 738L' + ex + ' ' + ey);
    });
    $('#angleArc').style.visibility = angle === 0 ? 'hidden' : 'visible';

    applySky(+controls.dayStart.value);
  }

  /* ---------------- langit & fase hari ---------------- */

  var SKY = {
    day: { top: '#5ea8e0', mid: '#a9d3ef', horizon: '#e8f4ff', low: '#fdf6e6' },
    night: { top: '#0a1428', mid: '#14213a', horizon: '#1e2c46', low: '#26334c' },
    overcast: { top: '#c3cbd2', mid: '#dfe3e6', horizon: '#eceeed', low: '#f2f3f2' }
  };

  var skyCache = {};

  function clamp01(value) {
    return value < 0 ? 0 : value > 1 ? 1 : value;
  }

  function mixHex(a, b, t) {
    t = clamp01(t);
    var ar = parseInt(a.slice(1, 3), 16);
    var ag = parseInt(a.slice(3, 5), 16);
    var ab = parseInt(a.slice(5, 7), 16);
    var br = parseInt(b.slice(1, 3), 16);
    var bg = parseInt(b.slice(3, 5), 16);
    var bb = parseInt(b.slice(5, 7), 16);
    var r = Math.round(ar + (br - ar) * t);
    var g = Math.round(ag + (bg - ag) * t);
    var bl = Math.round(ab + (bb - ab) * t);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  }

  // progress: 0..1 sepanjang durasi percobaan (pagi → siang → sore)
  /* Palet fase hari. */
  var PHASES = {
    pagi: { top: '#8db8db', mid: '#c6dced', horizon: '#f8d3ac', low: '#fde4c6' },
    redup: { top: '#93a7bd', mid: '#c4b1a6', horizon: '#eeb384', low: '#f8cfaa' },
    siang: { top: '#4d9fdb', mid: '#93c9ea', horizon: '#ddeeee', low: '#f7f7e8' },
    sore: { top: '#7a89b4', mid: '#d3a29a', horizon: '#f6ad74', low: '#f9cf9b' },
    malam: { top: '#0a1428', mid: '#14213a', horizon: '#1e2c46', low: '#26334c' },
    mendung: { top: '#c3cbd2', mid: '#dfe3e6', horizon: '#eceeed', low: '#f2f3f2' },
    hujan: { top: '#7c8794', mid: '#98a3ad', horizon: '#b6bec6', low: '#c9d0d5' }
  };

  function stampHour(value) {
    var h = Math.floor(value);
    var m = Math.floor((value - h) * 60);
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  /* Nama fase diturunkan dari tingkat cahaya (intensitas sumber), bukan dari jam
     dinding. Intensitas adalah variabel kontrol LKPD: 1.000 W/m² harus terbaca
     "Siang", bukan "Fajar". Jam hanya menentukan arah pagi atau sore. */
  function skyLabel(bright, progress, elevation) {
    // Di dekat ufuk label mengikuti posisi matahari: 400 W/m² pada pukul 06.00
    // tetap "Fajar" karena matahari baru terbit. Namun cahaya penuh (≥0,62) tetap
    // terbaca siang, sesuai permintaan agar 1.000 W/m² tidak pernah jadi senja.
    if (elevation < 8 && bright < 0.62) return progress < 0.5 ? 'Fajar' : 'Senja';
    if (bright >= 0.9) return elevation >= 30 ? 'Siang terik' : 'Siang';
    if (bright >= 0.62 || elevation >= 50) return 'Siang';
    if (bright >= 0.34) return progress < 0.5 ? 'Pagi' : 'Sore';
    if (bright >= 0.14) return progress < 0.5 ? 'Fajar' : 'Senja';
    return progress < 0.5 ? 'Fajar redup' : 'Senja redup';
  }

  function smooth(t) {
    t = clamp01(t);
    return t * t * (3 - 2 * t);
  }

  function blend(a, b, t) {
    return {
      top: mixHex(a.top, b.top, t),
      mid: mixHex(a.mid, b.mid, t),
      horizon: mixHex(a.horizon, b.horizon, t),
      low: mixHex(a.low, b.low, t)
    };
  }

  /* Busur hari: 0 = pagi, .5 = siang, 1 = sore. */
  function dayAt(progress) {
    if (progress < 0.5) return blend(PHASES.pagi, PHASES.siang, smooth(progress / 0.5));
    return blend(PHASES.siang, PHASES.sore, smooth(clamp01((progress - 0.42) / 0.58)));
  }

  /* `hour` = jam matahari (0–24). Langit, ketinggian matahari, dan kecerahan
     semuanya diturunkan dari elevasi matahari pada jam itu. */
  function applySky(hour) {
    var weather = controls.weather.value;
    var time = hour === null || hour === undefined ? +controls.dayStart.value : hour;
    var elevation = Model.elevationAt(time);
    var daylight = Model.daylightFactor(elevation);

    // Kecerahan langit ditentukan intensitas sumber yang dipilih - inilah variabel
    // kontrol LKPD, jadi 1.000 W/m2 harus terbaca "Siang". Cuaca tidak mengubah
    // nilai ini: cuaca menahan cahaya sebelum sampai ke panel, bukan meredupkan
    // matahari.
    var bright = clamp01(Math.max(0, +controls.irradiance.value) / 1000);

    // Busur 06:00 -> 18:00 dipetakan ke 0 -> 1.
    var progress = clamp01((time - SUNRISE) / (SUNSET - SUNRISE));

    // Warna langit condong ke tengah hari bila cahaya kuat, dan mengikuti jam
    // bila cahaya lemah, tanpa menghapus gerak pagi -> sore.
    var hueProgress = clamp01(0.5 + (progress - 0.5) * (1 - 0.7 * bright));

    var cloudy = weather === 'cloud' ? 1 : 0;
    var rainy = weather === 'rain' ? 1 : 0;

    // Fajar dan senja: +/-0,9 jam di sekitar terbit (06:00) dan terbenam (18:00).
    var TWILIGHT = 0.9;
    var nearHorizon = Math.abs(time - SUNRISE) <= TWILIGHT || Math.abs(time - SUNSET) <= TWILIGHT;
    // Malam hanya ditentukan jam: matahari sudah di bawah ufuk.
    var night = daylight <= 0.02 && !nearHorizon;

    var duskWeight = !night && daylight <= 0.02
      ? clamp01(1 - Math.abs(time - SUNRISE) / TWILIGHT) + clamp01(1 - Math.abs(time - SUNSET) / TWILIGHT)
      : 0;
    duskWeight = clamp01(duskWeight);

    var sky = night ? PHASES.malam : dayAt(hueProgress);
    // Cahaya kuat menahan warna hangat senja agar 1.000 W/m2 tetap biru cerah.
    if (duskWeight > 0) sky = blend(sky, PHASES.redup, duskWeight * 0.55 * (1 - bright * 0.55));

    // Intensitas rendah: kaki langit menghangat & berkabut, langit atas tetap biru.
    if (!night && bright < 0.6) {
      var dim = (0.6 - bright) / 0.6;
      var haze = PHASES.redup;
      sky = {
        top: mixHex(sky.top, haze.top, dim * 0.18),
        mid: mixHex(sky.mid, haze.mid, dim * 0.34),
        horizon: mixHex(sky.horizon, haze.horizon, dim * 0.72),
        low: mixHex(sky.low, haze.low, dim * 0.78)
      };
    }
    // Mendung dan hujan menggelapkan langit: awan menahan cahaya.
    if (!night && cloudy) sky = blend(sky, PHASES.mendung, 0.78);
    if (!night && rainy) sky = blend(sky, PHASES.hujan, 0.82);

    var key = sky.top + sky.mid + sky.horizon + sky.low;
    if (key !== skyCache.key) {
      skyCache.key = key;
      document.getElementById('skyStop0').setAttribute('stop-color', sky.top);
      document.getElementById('skyStop1').setAttribute('stop-color', sky.mid);
      document.getElementById('skyStop2').setAttribute('stop-color', sky.horizon);
      document.getElementById('skyStop3').setAttribute('stop-color', sky.low);
    }

    // Lapisan gelap: malam penuh, mendung sedikit, hujan lebih.
    var veil = Math.max(cloudy * 0.08, rainy * 0.2);
    $('#skyNight').style.opacity = String(clamp01(night ? 0.34 : veil));
    var ground = $('#skyNightGround');
    if (ground) ground.style.opacity = String(clamp01(night ? 0.5 : Math.max(cloudy * 0.12, rainy * 0.24)));
    $('#skyStars').style.opacity = night ? '1' : '0';
    $('#skyMoon').style.opacity = night ? '1' : '0';
    document.body.classList.toggle('sky-night', night);

    // Cahaya hangat di kaki langit.
    var warm = night ? 0 : clamp01(0.25 + Math.abs(hueProgress - 0.5) * 1.1) * clamp01(1.05 - bright * 0.45);
    var glow = $('#skyGlow');
    var warmColor = hueProgress < 0.5 ? '#f9c59c' : '#f59a5c';
    ['skyGlowStop0', 'skyGlowStop1', 'skyGlowStop2'].forEach(function (id) {
      var stop = document.getElementById(id);
      if (stop) stop.setAttribute('stop-color', warmColor);
    });
    glow.style.opacity = String(clamp01(warm) * (rainy ? 0.12 : cloudy ? 0.24 : 0.5));

    // Awan: makin tebal, makin pekat dan makin menutup.
    var cover = cloudy ? 0.75 : rainy ? 0.9 : (1 - bright) * 0.45;
    var cloudTone = night ? '#3f4d63' : mixHex('#ffffff', rainy ? '#76818d' : '#97a3ae', cover);
    $('#skyClouds').setAttribute('fill', cloudTone);
    $('#skyClouds').setAttribute('opacity', cloudy ? '.95' : rainy ? '1' : String(0.45 + bright * 0.35));

    // Hujan: garis tipis miring di belakang panel, hanya saat cuaca hujan.
    var rain = $('#skyRain');
    // Hujan tidak boleh muncul hanya karena malam: dulu `night ? '0.18'`
    // membuat garis hujan ikut tampil pada langit berbintang.
    if (rain) rain.style.opacity = rainy ? (night ? '0.5' : '0.72') : '0';

    // Matahari bergerak rendah -> tinggi -> rendah. Kecerahan dari intensitas;
    // awan menutupinya, jadi tampak meredup tanpa mengubah nilai sumber.
    var sun = $('#sunDisc');
    var rays = $('#sunRays');
    if (night) {
      sun.style.opacity = '0';
      rays.style.opacity = '0';
    } else {
      var lift = clamp01(daylight);
      var dx = (progress * 2 - 1) * 210;
      var dy = (1 - lift) * 260;
      var move = 'translate(' + dx.toFixed(1) + ' ' + dy.toFixed(1) + ')';
      var scale = 0.78 + bright * 0.22 - (1 - lift) * 0.06;

      var horizonFade = duskWeight > 0 ? clamp01(0.55 - duskWeight * 0.4) : 1;
      var coverFade = 1 - cloudy * 0.35 - rainy * 0.6;
      sun.style.opacity = String(clamp01((0.28 + bright * 0.8) * horizonFade * coverFade));
      sun.setAttribute(
        'transform',
        move + ' translate(300 150) scale(' + scale.toFixed(3) + ') translate(-300 -150)'
      );
      rays.style.opacity = String(clamp01((0.14 + bright * 0.7) * (rainy ? 0.2 : cloudy ? 0.45 : 1)));
      rays.setAttribute('transform', move);

      var sunColor = mixHex('#ff9f4d', '#ffd24a', clamp01(bright * 1.25 + lift * 0.2));
      var disc = sun.querySelectorAll('circle');
      if (disc.length > 1) disc[1].setAttribute('fill', sunColor);
      if (disc.length > 0) disc[0].setAttribute('fill', sunColor);
      rays.setAttribute('stroke', mixHex('#f0a63c', '#efc24d', clamp01(bright)));
    }

    // Label fase: fase hari, bukan cuaca. Cuaca terbaca dari langit & awan.
    var tag = $('#skyPhase');
    var badge = document.querySelector('#skyPhaseBadge rect');
    tag.textContent = night ? 'Malam' : skyLabel(bright, progress, elevation);
    tag.style.fill = night ? '#cdddf0' : '#3f6070';
    if (badge) {
      badge.setAttribute('fill', night ? '#16243a' : '#ffffff');
      badge.setAttribute('opacity', night ? '.55' : String(0.5 + bright * 0.32));
    }
  }

  /* ---------------- grafik ---------------- */

  function draw() {
    var canvas = $('#chart');
    if (!canvas) return;
    var width = Math.max(280, Math.round(canvas.clientWidth || 800));
    var height = 220;
    var ratio = window.devicePixelRatio || 1;
    var pixelWidth = Math.round(width * ratio);
    var pixelHeight = Math.round(height * ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    var context = canvas.getContext('2d');
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);

    var peak = samples.reduce(function (max, sample) {
      return Math.max(max, sample.p);
    }, 0);
    var max = Math.min(1e6, Math.max(1e5, Math.ceil((peak * 1.1) / 1e5) * 1e5));

    var left = 51;
    var right = width - 15;
    var top = 25;
    var bottom = 180;

    context.font = '11px system-ui, sans-serif';
    context.lineWidth = 1;

    for (var i = 0; i <= 4; i += 1) {
      var y = top + ((bottom - top) * i) / 4;
      context.strokeStyle = '#eadfcf';
      context.beginPath();
      context.moveTo(left, y);
      context.lineTo(right, y);
      context.stroke();
      context.fillStyle = '#8c775d';
      context.fillText(fmt((max * (4 - i)) / 4 / 1e6, 3), 2, y + 4);
    }

    context.fillStyle = '#8c775d';
    context.fillText('MW AC', 2, 13);

    for (var t = 0; t <= 3; t += 1) {
      context.fillText(
        String(Math.round((+controls.duration.value * t) / 3)),
        left + ((right - left) * t) / 3 - 7,
        199
      );
    }
    context.fillText('Waktu (s)', width / 2 - 24, 218);

    context.strokeStyle = '#c87520';
    context.lineWidth = 2.5;
    context.beginPath();
    samples.forEach(function (sample, index) {
      var x = left + (sample.t / +controls.duration.value) * (right - left);
      var py = bottom - (sample.p / max) * (bottom - top);
      if (index) context.lineTo(x, py);
      else context.moveTo(x, py);
    });
    context.stroke();
  }

  window.addEventListener('resize', draw);

  /* ---------------- indikator ---------------- */

  var lampMet = null;

  function house(met) {
    met = !!met;
    if (met === lampMet) return;
    lampMet = met;

    $('#houseLight').setAttribute('fill', met ? '#f9df87' : '#c6d2bd');
    $('#houseBulb').setAttribute('fill', met ? '#ffe48a' : '#c4d1bd');
    $('#houseLampGlow').setAttribute('opacity', met ? '.85' : '0');
    $('#houseLampRays').setAttribute('opacity', met ? '1' : '0');
    $('#houseLampTitle').textContent = met
      ? 'Kontribusi PLTS mencukupi beban kawasan'
      : 'Kontribusi PLTS belum mencukupi beban kawasan';
  }

  /* ---------------- status pencatatan ---------------- */

  function canRecord() {
    return !running && elapsed >= +controls.duration.value && !recorded &&
      controls.weather.value === 'lkpd';
  }

  function recordState() {
    $('#record').disabled = !canRecord();
    var note = 'Tunggu durasi selesai; catat daya AC inverter.';
    if (controls.weather.value !== 'lkpd') note = 'Pilih mode LKPD untuk mencatat percobaan.';
    else if (recorded) note = 'Hasil sudah dicatat. Pilih kondisi berikutnya.';
    else if (canRecord()) note = 'Hasil akhir dibekukan. Catat ke LKPD.';
    $('#record-note').textContent = note;
  }

  /* ---------------- kunci kontrol ---------------- */

  function locks() {
    var type = controls.experiment.value;
    controls.irradiance.disabled = running || type === 'tilt';
    controls.tilt.disabled = running || type === 'light';
    ['experiment', 'weather', 'load', 'duration'].forEach(function (key) {
      controls[key].disabled = running;
    });

    standardArc();
    var lkpd = controls.weather.value === 'lkpd';
    var span = +controls.daySpan.value;
    controls.dayStart.max = String(LAST_HOUR - span);
    if (+controls.dayStart.value > LAST_HOUR - span) controls.dayStart.value = String(LAST_HOUR - span);
    if (+controls.dayStart.value < +controls.dayStart.min) controls.dayStart.value = controls.dayStart.min;
    controls.daySpan.disabled = running || lkpd;
    controls.daySpan.value = String(span);

    var startHour = +controls.dayStart.value;
    var endHour = startHour + span;
    var durationSeconds = +controls.duration.value;
    var hoursPerRun = span;
    var speed = (span * 3600) / durationSeconds;
    $('#day-startOut').textContent = stampHour(startHour);
    var sliderSpan = +controls.dayStart.max - +controls.dayStart.min;
    var sliderFill = sliderSpan > 0 ? ((startHour - +controls.dayStart.min) / sliderSpan) * 100 : 0;
    // Saat lama hari 15 jam hanya ada satu titik awal, jadi slider dikunci dan
    // label kanan menampilkan akhir busur — bukan jam yang sama dengan label kiri.
    $('#day-start-max').textContent = sliderSpan > 0
      ? stampHour(+controls.dayStart.max)
      : '■ ' + stampHour(endHour);
    controls.dayStart.style.setProperty('--percent', sliderFill + '%');
    controls.dayStart.disabled = running || lkpd || sliderSpan <= 0;
    $('#time-scale').textContent = durationSeconds + ' detik sama dengan ' +
      (hoursPerRun === 1 ? '1 jam' : hoursPerRun + ' jam') + ' di dunia nyata (' +
      Math.round(speed).toLocaleString('id-ID') + '×).';
    $('#timer-scale').textContent = durationSeconds + ' detik = ' +
      (hoursPerRun === 1 ? '1 jam' : hoursPerRun + ' jam') + ' nyata · ' +
      stampHour(startHour) + ' → ' + stampHour(endHour);
    $('#day-hint').textContent = lkpd
      ? 'Mode LKPD memakai busur baku ' + stampHour(startHour) + ' sampai ' + stampHour(endHour) +
        ': matahari terbit lalu naik sampai tepat di puncak, jadi angka dicatat pada ' +
        'elevasi acuan. Jam dan cuaca dikunci agar antarbaris bisa dibandingkan. ' +
        'Untuk mencoba sore, malam, atau cuaca lain, pilih kondisi selain LKPD.'
      : 'Percobaan berjalan ' + stampHour(startHour) + ' sampai ' + stampHour(endHour) + ' — ' +
        (endHour <= 12 ? 'matahari terbit lalu naik menuju tengah hari'
          : startHour >= 18 ? 'malam, tanpa pembangkitan'
            : startHour >= 12 ? 'matahari turun dari siang menuju malam'
              : endHour >= 19 ? 'satu hari penuh: fajar, siang, lalu malam'
                : 'matahari naik lalu turun melewati tengah hari') + '.';
    $('#irradianceOut').textContent = controls.irradiance.value + ' W/m²';
    $('#tiltOut').textContent = controls.tilt.value + '°';
    $('#durationOut').textContent = controls.duration.value + ' detik';
    [controls.irradiance, controls.tilt, controls.duration].forEach(function (input) {
      var min = +input.min;
      var max = +input.max;
      input.style.setProperty('--percent', ((input.value - min) / (max - min)) * 100 + '%');
    });
    recommendations();
    recordState();
  }

  function recommendations() {
    var type = controls.experiment.value;
    var values = type === 'light' ? [400, 700, 1000] : [0, 30, 75];
    var root = $('#scenario-options');

    $('#scenario-description').textContent = type === 'light'
      ? 'Sudut 30° tetap · intensitas 400, 700, 1.000 W/m².'
      : 'Intensitas 800 W/m² tetap · sudut 0°, 30°, 75°.';

    var signature = type + ':' + values.join(',');
    if (root.dataset.signature !== signature) {
      root.replaceChildren();
      values.forEach(function (value) {
        var button = document.createElement('button');
        button.type = 'button';
        button.dataset.value = String(value);
        button.textContent = value + (type === 'light' ? ' W/m²' : '°');
        button.addEventListener('click', function () {
          if (running) return;
          controls.weather.value = 'lkpd';
          controls.duration.value = '30';
          controls.dayStart.value = String(STANDARD_START);
          controls.daySpan.value = String(STANDARD_SPAN);
          controls.irradiance.value = type === 'light' ? value : 800;
          controls.tilt.value = type === 'light' ? 30 : value;
          reset();
        });
        root.append(button);
      });
      root.dataset.signature = signature;
    }

    Array.prototype.forEach.call(root.children, function (button) {
      button.disabled = running;
      var matches = controls.weather.value === 'lkpd' && +controls.duration.value === 30 && (
        type === 'light'
          ? +controls.tilt.value === 30 && +controls.irradiance.value === +button.dataset.value
          : +controls.irradiance.value === 800 && +controls.tilt.value === +button.dataset.value
      );
      button.setAttribute('aria-pressed', String(matches));
    });
  }

  /* ---------------- reset ---------------- */

  function reset() {
    standardArc();
    running = false;
    paused = false;
    recorded = false;
    cancelAnimationFrame(frame);
    elapsed = 0;
    power = 0;
    energy = 0;
    samples = [{ t: 0, p: 0 }];
    $('#timer').textContent = clock(+controls.duration.value);
    ['power', 'dcPower', 'deliveredPower'].forEach(function (id) {
      $('#' + id).textContent = '0,000 MW';
    });
    $('#power-bar').style.width = '0';
    var preview = Model.solarPoint(
      +controls.irradiance.value,
      +controls.tilt.value,
      { explore: controls.weather.value !== 'lkpd', weather: controls.weather.value,
        hour: +controls.dayStart.value, elevation: Model.elevationAt(+controls.dayStart.value) }
    );
    $('#power').textContent = fmt(preview.ac / 1e6) + ' MW';
    $('#dcPower').textContent = fmt(preview.dc / 1e6) + ' MW';
    $('#deliveredPower').textContent = fmt(preview.delivered / 1e6) + ' MW';
    $('#power-bar').style.width = Math.min(100, (preview.ac / 1e6) * 100) + '%';
    $('#led').textContent = 'LED: ' + Model.indicator(preview.ac) + ' · indikator daya AC';
    $('#poa').textContent = 'Cahaya pada panel: ' + fmt(preview.poa, 1) + ' W/m²';
    $('#temperature').textContent = 'Suhu sel: ' +
      (controls.weather.value === 'lkpd'
        ? '25°C · tetap'
        : fmt(preview.temperature, 1) + '°C');
    power = preview.ac;
    minPower = null;
    minPoa = null;
    $('#lowest').textContent = 'Terendah: — · —';
    $('#energy').textContent = 'Energi AC: 0 kWh';
    $('#state').textContent = 'Belum aktif';
    var previewMet = preview.delivered >= +controls.load.value * 1000;
    $('#supply').textContent = preview.ac > 0
      ? (previewMet
        ? 'Kontribusi PLTS mencukupi beban kawasan'
        : 'Kontribusi PLTS belum mencukupi beban kawasan')
      : 'Pasokan belum aktif';
    $('#sceneStatus').textContent = 'Siap bereksperimen';
    $('#summary').textContent = 'Matahari ' + stampHour(+controls.dayStart.value) + ' sampai ' +
      stampHour(+controls.dayStart.value + +controls.daySpan.value) + ' (' +
      arcLabel(+controls.dayStart.value, +controls.dayStart.value + +controls.daySpan.value) +
      ') · daya awal ' +
      fmt(preview.ac / 1e6) + ' MW. Tekan Mulai untuk menjalankan percobaan.';
    $('#start').disabled = false;
    $('#pause').disabled = true;
    $('#pause').textContent = 'Ⅱ Jeda';
    $('#electricPath').style.opacity = '0';
    document.body.classList.add('solar-stopped');
    document.body.classList.remove('solar-paused');
    house(false);
    geometry();
    locks();
    draw();
  }

  /* ---------------- langkah simulasi ---------------- */

  function tick(now) {
    if (!running || paused) return;

    var duration = +controls.duration.value;
    var dt = Math.max(0, Math.min((now - last) / 1000, duration - elapsed));
    last = now;

    // Titik dihitung pada waktu akhir langkah: saat percobaan selesai, jam
    // tepat di ujung busur sehingga angka akhir dapat diulang persis.
    elapsed += dt;
    var point = Model.advanceSolar(+controls.irradiance.value, +controls.tilt.value, elapsed, dt, options());
    power = point.ac;
    energy += point.energyJ / 3600000;

    if (samples.length === 1 && samples[0].t === 0) samples[0].p = power;
    if (elapsed - samples[samples.length - 1].t >= 0.2 || elapsed >= duration) {
      samples.push({ t: elapsed, p: power });
    }

    $('#timer').textContent = clock(Math.ceil(duration - elapsed));
    $('#power').textContent = fmt(power / 1e6) + ' MW';
    $('#dcPower').textContent = fmt(point.dc / 1e6) + ' MW';
    $('#deliveredPower').textContent = fmt(point.delivered / 1e6) + ' MW';
    $('#power-bar').style.width = Math.min(100, (power / 1e6) * 100) + '%';
    $('#poa').textContent = 'Cahaya pada panel: ' + fmt(point.poa, 1) + ' W/m²';
    $('#temperature').textContent = 'Suhu sel: ' + fmt(point.temperature, 1) + '°C';
    // Terendah dihitung setelah panel menerima cahaya yang cukup (300 W/m²).
    // Di bawah ambang itu matahari masih rendah atau sudah terbenam, sehingga
    // barisnya hanya akan berisi 0 MW dan tidak berguna bagi pembahasan siswa.
    if (point.poa >= 300 && (minPower === null || power < minPower)) minPower = power;
    if (point.poa >= 300 && (minPoa === null || point.poa < minPoa)) minPoa = point.poa;
    $('#lowest').textContent = minPower === null
      ? 'Terendah: — · —'
      : 'Terendah: ' + fmt(minPower / 1e6) + ' MW · ' + fmt(minPoa, 0) + ' W/m²';
    $('#energy').textContent = 'Energi AC: ' + fmt(energy, 4) + ' kWh';
    $('#led').textContent = 'LED: ' + Model.indicator(power) + ' · indikator daya AC';

    var met = point.delivered >= +controls.load.value * 1000;
    $('#supply').textContent = met
      ? 'Kontribusi PLTS mencukupi beban kawasan'
      : 'Kontribusi PLTS belum mencukupi beban kawasan';
    house(met);
    $('#electricPath').style.opacity = power > 0 ? '.9' : '0';

    var state = power === 0
      ? 'Tidak ada pembangkitan'
      : point.limited
        ? 'Batas kapasitas inverter'
        : 'Beroperasi';
    $('#state').textContent = state;
    $('#sceneStatus').textContent = elapsed >= duration ? 'Selesai · hasil dibekukan' : state;
    $('#summary').textContent = controls.irradiance.value + ' W/m² · sudut ' + controls.tilt.value +
      '° · ' + stampHour(hourNow()) + ' (matahari ' + fmt(point.elevation, 0) + '°) · AC ' +
      fmt(power / 1e6) + ' MW · energi ' + fmt(energy, 4) + ' kWh';

    // Langit bergerak pelan melalui pagi → siang → sore (dibatasi ~8 fps)
    var step = Math.floor(elapsed * 4);
    if (step !== skyCache.step) {
      skyCache.step = step;
      applySky(hourNow());
    }

    draw();

    if (elapsed >= duration) {
      running = false;
      document.body.classList.add('solar-paused');
      $('#start').disabled = false;
      $('#pause').disabled = true;
      locks();
      return;
    }

    frame = requestAnimationFrame(tick);
  }

  /* ---------------- tombol ---------------- */

  $('#start').addEventListener('click', function () {
    reset();
    running = true;
    document.body.classList.remove('solar-stopped', 'solar-paused');
    $('#start').disabled = true;
    $('#pause').disabled = false;
    last = performance.now();
    locks();
    frame = requestAnimationFrame(tick);
  });

  $('#pause').addEventListener('click', function () {
    if (!running) return;
    paused = !paused;
    document.body.classList.toggle('solar-paused', paused);
    $('#pause').textContent = paused ? '▶ Lanjutkan' : 'Ⅱ Jeda';
    if (paused) {
      cancelAnimationFrame(frame);
    } else {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  });

  $('#reset').addEventListener('click', reset);

  $('#record').addEventListener('click', function () {
    if (!canRecord()) return;
    var type = controls.experiment.value;
    var saved = sheet.addObservation(type, {
      control: type === 'light' ? controls.tilt.value : controls.irradiance.value,
      variable: type === 'light' ? controls.irradiance.value : controls.tilt.value,
      power: fmt(power / 1e6),
      led: Model.indicator(power),
      time: Math.round(elapsed),
      load: controls.load.value
    });
    if (saved) recorded = true;
    recordState();
    $('#message').textContent = saved
      ? 'Hasil akhir dicatat ke LKPD.'
      : 'Tabel sudah berisi 20 pengamatan.';
  });

  /* ---------------- percobaan ---------------- */

  function configureExperiment(type) {
    controls.experiment.value = type;
    controls.weather.value = 'lkpd';
    controls.duration.value = '30';
    controls.dayStart.value = String(STANDARD_START);
    controls.daySpan.value = String(STANDARD_SPAN);
    controls.irradiance.value = type === 'light' ? 400 : 800;
    controls.tilt.value = type === 'light' ? 30 : 0;
    var rows = sheet.rows[type] || [];
    var first = null;
    for (var i = 0; i < rows.length; i += 1) {
      if (Number.isFinite(Model.number(rows[i].control))) {
        first = rows[i];
        break;
      }
    }
    if (first) {
      var control = Model.number(first.control);
      if (type === 'light') controls.tilt.value = control;
      else controls.irradiance.value = control;
    }
    reset();
    $('#sim').scrollIntoView({ behavior: 'smooth' });
  }

  controls.experiment.addEventListener('change', function () {
    configureExperiment(controls.experiment.value);
  });
  [controls.irradiance, controls.tilt, controls.duration].forEach(function (input) {
    input.addEventListener('input', reset);
  });
  [controls.weather, controls.load].forEach(function (input) {
    input.addEventListener('change', reset);
  });
  controls.dayStart.addEventListener('input', function () {
    controls.dayStart.dataset.touched = '1';
    reset();
  });
  controls.daySpan.addEventListener('change', reset);

  /* ---------------- dialog ---------------- */

  var dialog = $('#infoDialog');

  function info(html) {
    dialog.classList.remove('dialog-wide');
    $('#dialogBody').innerHTML = html;
    if (!dialog.open) dialog.showModal();
  }

  $('.close-dialog').addEventListener('click', function () {
    dialog.close();
  });

  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) dialog.close();
  });

  $('#formulaHelp').addEventListener('click', function () {
    info('<h2>Memahami daya panel surya</h2>' +
      '<div class="formula">P DC = G panel × A × η panel<br>P AC = min(kapasitas inverter, P DC × η kabel × η inverter)<br>P beban = P AC × η penyaluran</div>' +
      '<dl>' +
      '<dt>G panel · W/m²</dt><dd>Cahaya yang jatuh pada bidang panel, berbeda dari intensitas sumber. Model memakai cahaya langsung, baur dan pantulan tanah.</dd>' +
      '<dt>A · m²</dt><dd>Luas aktif tetap 5.000 m². Perubahan sudut tidak mengubah ukuran panel.</dd>' +
      '<dt>η panel</dt><dd>Efisiensi acuan 20% pada suhu sel 25°C. Cahaya diubah menjadi listrik DC.</dd>' +
      '<dt>Sudut panel dan sudut datang</dt><dd>Sudut panel diukur dari tanah. Sudut datang diukur terhadap garis tegak lurus panel. Sudut tegak lurus adalah 90° dikurangi elevasi matahari. Saat LKPD mencatat hasil, matahari berada di puncak (60°), sehingga cahaya langsung tegak lurus pada panel 30°. Karena matahari bergerak, sudut terbaik berubah sepanjang hari.</dd>' +
      '<dt>MWp, MW, kWh</dt><dd>1 MWp adalah kapasitas nominal acuan. MW merupakan daya aktual; kWh adalah energi selama percobaan. 1 MW = 1.000 kW.</dd>' +
      '<dt>Waktu</dt><dd>Percobaan adalah time-lapse: 30 detik mewakili beberapa jam. Pada mode LKPD, 30 detik mewakili 06:00–12:00 sehingga matahari terbit lalu naik dan angka dicatat saat tepat di puncak (elevasi 60°). Pada eksplorasi, jam mulai dan lama hari dapat diubah sampai 15 jam, sehingga matahari bisa naik, turun, atau melewati malam. Daya yang dibaca adalah daya sesaat; energi dijumlahkan sepanjang percobaan.</dd>' +
      '<dt>Suhu sel</dt><dd>Mode LKPD memakai 25°C tetap. Pada eksplorasi, sel lebih panas mengurangi efisiensi menurut asumsi model; lebih panas tidak selalu lebih banyak listrik.</dd>' +
      '<dt>Cuaca</dt><dd>Cerah meneruskan seluruh cahaya. Mendung menahan sekitar 55% cahaya dan hujan sekitar 75%, sehingga G panel turun sementara intensitas sumber tetap. Angka itu dipakai sebagai faktor pada G panel, bukan pada nilai intensitas, supaya intensitas tetap bersih sebagai variabel kontrol. Pada cuaca cerah, awan sesekali lewat dan menutup panel beberapa detik; daya turun lalu pulih. Baris Terendah mencatat nilai terendah setelah panel menerima cahaya minimal 300 W/m², jadi nilai itu menggambarkan penurunan karena awan, bukan karena matahari belum terbit.</dd>' +
      '</dl><p>' + MODEL_NOTE + '</p>');
  });

  $('#components').addEventListener('click', function () {
    info(Process.processOverview());
  });

  function showStage(id) {
    var index = -1;
    Process.PROCESS_STAGES.forEach(function (stage, position) {
      if (stage.id === id) index = position;
    });
    if (index < 0) return;
    var stage = Process.PROCESS_STAGES[index];
    info('<p class="eyebrow">TAHAP ' + (index + 1) + ' / 09</p>' +
      '<h2>' + stage.title + '</h2><p>' + stage.text + '</p>' +
      '<div class="stage-navigation">' +
      '<button id="prev-stage" ' + (index === 0 ? 'disabled' : '') + '>← Sebelumnya</button>' +
      '<button id="next-stage" ' + (index === 8 ? 'disabled' : '') + '>Selanjutnya →</button>' +
      '</div>');
    $('#prev-stage').addEventListener('click', function () {
      showStage(Process.PROCESS_STAGES[index - 1].id);
    });
    $('#next-stage').addEventListener('click', function () {
      showStage(Process.PROCESS_STAGES[index + 1].id);
    });
  }

  Array.prototype.forEach.call($('#solarPlant').querySelectorAll('[data-stage]'), function (element) {
    var id = element.dataset.stage;
    var index = -1;
    Process.PROCESS_STAGES.forEach(function (stage, position) {
      if (stage.id === id) index = position;
    });
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '0');
    element.setAttribute('aria-label', 'Tahap ' + (index + 1) + ': ' + (Process.PROCESS_STAGES[index] || {}).title);
    element.addEventListener('click', function () {
      showStage(id);
    });
    element.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showStage(id);
      }
    });
  });

  $('#day-tour').addEventListener('click', dayTour);

  $('#cutaway').textContent = 'Matahari bergerak';
  $('#cutaway').removeAttribute('aria-pressed');
  $('#cutaway').addEventListener('click', function () {
    info('<h2>Matahari bergerak selama percobaan</h2><p>Selama percobaan berjalan, matahari menyusuri busur ' +
      'dari timur ke barat. Sudut datang terhadap panel, cahaya yang diterima panel, dan suhu sel ikut berubah. ' +
      'Pada mode LKPD busur dikunci 06:00–12:00 supaya hanya satu variabel yang berubah; angka dicatat saat ' +
      'matahari tepat di puncak (elevasi 60°). Pada eksplorasi kamu bebas memilih jam mulai dan lama hari, ' +
      'termasuk satu hari penuh sampai malam. ' +
      'Ilustrasi tidak berskala.</p>');
  });

  $('#enlarge').addEventListener('click', function () {
    info('<h2>Aliran energi PLTS</h2>');
    dialog.classList.add('dialog-wide');
    var wrap = document.createElement('div');
    wrap.className = 'zoom-scene';
    var clone = $('#solarPlant').cloneNode(true);
    var prefix = 'zoom-solar-';
    Array.prototype.forEach.call(clone.querySelectorAll('[id]'), function (element) {
      element.id = prefix + element.id;
    });
    clone.id = prefix + 'plant';
    Array.prototype.forEach.call(clone.querySelectorAll('*'), function (element) {
      Array.prototype.forEach.call(element.attributes.slice(), function (attribute) {
        if (attribute.value.indexOf('url(#') >= 0) {
          element.setAttribute(attribute.name, attribute.value.replace(/url\(#/g, 'url(#' + prefix));
        }
        if ((attribute.name === 'href' || attribute.name === 'xlink:href') && attribute.value.charAt(0) === '#') {
          element.setAttribute(attribute.name, '#' + prefix + attribute.value.slice(1));
        }
      });
    });
    Array.prototype.forEach.call(clone.querySelectorAll('[data-stage]'), function (element) {
      element.removeAttribute('role');
      element.removeAttribute('tabindex');
    });
    wrap.append(clone);
    var note = document.createElement('p');
    note.className = 'hint';
    note.textContent = 'Geser untuk membaca detail. Cuplikan saat dibuka; tutup untuk mengikuti simulasi.';
    $('#dialogBody').append(wrap, note);
  });

  $('#write-prediction').addEventListener('click', function () {
    var fold = $('#hypothesis');
    fold.open = true;
    fold.scrollIntoView({ behavior: 'smooth' });
    fold.querySelector('textarea').focus({ preventScroll: true });
  });

  $('#help').addEventListener('click', function () {
    info('<h2>Mulai penyelidikan</h2><ol>' +
      '<li>Siapkan buku dan tulis hipotesis.</li>' +
      '<li>Pilih percobaan dan tiga kondisi rekomendasi.</li>' +
      '<li>Jalankan 30 detik per kondisi. Catat hasil akhir AC inverter.</li>' +
      '<li>Analisis hasil, periksa LKPD, lalu kirim PDF.</li></ol>');
  });

  window.addEventListener('scroll', function () {
    var sheetVisible = $('#lkpd').getBoundingClientRect().top < 160;
    Array.prototype.forEach.call(document.querySelectorAll('.tabbar .tab'), function (tab, index) {
      tab.classList.toggle('active', index === (sheetVisible ? 1 : 0));
    });
  }, { passive: true });

  Array.prototype.forEach.call(document.querySelectorAll('.tabbar .tab'), function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.getAttribute('href');
      if (!target || target.charAt(0) !== '#') return;
      var section = document.querySelector(target);
      if (!section) return;
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  reset();
  locks();
})();
