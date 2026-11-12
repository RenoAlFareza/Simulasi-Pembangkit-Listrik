/* Aplikasi simulasi PLTB — skrip klasik, dimuat setelah model/worksheet/collection. */
(function () {
  'use strict';

  var $ = function (selector) {
    return document.querySelector(selector);
  };

  var Model = window.PLTBModel;
  var Process = window.PLTBProcess;

  var controls = {
    recordTarget: $('#record-target'),
    speed: $('#speed'),
    blades: $('#blades'),
    load: $('#load'),
    duration: $('#duration'),
    windMode: $('#wind-mode')
  };

  var RATED = Model.MODEL.rated;
  var CUT_IN = Model.MODEL.cutIn;
  var CUT_OUT = Model.MODEL.cutOut;

  var running = false;
  var paused = false;
  var elapsed = 0;
  var last = 0;
  var omega = 0;
  var power = 0;
  var energy = 0;
  var samples = [{ t: 0, p: 0 }];
  var frame = 0;
  var angle = 0;
  var stable = 0;
  var stoppedByWind = false;
  var sensorAngle = 0;
  var runRecorded = false;

  var sheet = window.LKPDWorksheet.create({
    key: 'pltb',
    title: 'PLTB',
    brand: 'PLTB',
    subtitle: 'LABORATORIUM PLTB',
    types: [
      {
        id: 'wind',
        title: 'Tabel 1 · Kecepatan angin',
        heading: 'Tabel 1 · Kecepatan angin',
        controlLabel: 'Jumlah bilah',
        variableLabel: 'Kecepatan angin',
        analysisField: 'analisis1',
        analysisLabel: 'Tabel 1 · Kecepatan angin'
      },
      {
        id: 'blades',
        title: 'Tabel 2 · Jumlah bilah',
        heading: 'Tabel 2 · Jumlah bilah',
        controlLabel: 'Kecepatan angin',
        variableLabel: 'Jumlah bilah',
        analysisField: 'analisis2',
        analysisLabel: 'Tabel 2 · Jumlah bilah'
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

  /* ---------------- gambar rotor ---------------- */

  function renderRotor() {
    var count = +controls.blades.value;
    var parts = '';
    for (var i = 0; i < count; i += 1) {
      parts += '<g transform="rotate(' + (i * 360) / count + ')">' +
        '<path class="pitch-blade" d="M-8 -5 Q-27 -89 -11 -169 Q-1 -188 7 -167 L9 -15Z" ' +
        'fill="url(#bladePaint)" stroke="#4f7d9b" stroke-width="3.5"></path></g>';
    }
    $('#rotorBlades').innerHTML = parts;
  }

  function updateMechanics(wind, pitch, dt) {
    sensorAngle = (sensorAngle + wind * 45 * dt) % 360;
    $('#anemometerCups').setAttribute('transform', 'rotate(' + sensorAngle + ' 606 219)');

    var direction = controls.windMode.value === 'gusts' ? 10 * Math.sin(elapsed / 3) : 0;
    $('#windVaneArrow').setAttribute('transform', 'rotate(' + direction + ' 558 217)');
    $('#windDirectionGroup').setAttribute('transform', 'rotate(' + direction + ' 181 352)');

    $('#pitch').textContent = 'Sudut bilah otomatis: ' + fmt(pitch, 0) + '°' +
      (pitch >= 89 ? ' · posisi aman' : '');
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
    var axisMax = Math.min(RATED, Math.max(10000, Math.ceil((peak * 1.12) / 10000) * 10000));

    var left = 51;
    var right = width - 14;
    var top = 27;
    var bottom = 180;
    var span = right - left;

    context.font = '11px system-ui, sans-serif';
    context.lineWidth = 1;

    for (var i = 0; i <= 4; i += 1) {
      var y = top + ((bottom - top) * i) / 4;
      context.strokeStyle = '#ddebed';
      context.beginPath();
      context.moveTo(left, y);
      context.lineTo(right, y);
      context.stroke();
      context.fillStyle = '#607c87';
      context.fillText(fmt((axisMax * (4 - i)) / 4 / 1e6, 3), 2, y + 4);
    }

    context.fillStyle = '#607c87';
    context.fillText('MW', 3, 14);

    var ticks = width < 500 ? 2 : 3;
    for (var t = 0; t <= ticks; t += 1) {
      var label = String(Math.round((+controls.duration.value * t) / ticks));
      context.fillText(label, left + (span * t) / ticks - context.measureText(label).width / 2, 199);
    }
    context.fillText('Waktu (s)', left + span / 2 - 24, 218);

    context.strokeStyle = '#2167d6';
    context.lineWidth = 2.5;
    context.beginPath();
    samples.forEach(function (sample, index) {
      var x = left + (sample.t / +controls.duration.value) * span;
      var py = bottom - (sample.p / axisMax) * (bottom - top);
      if (index) context.lineTo(x, py);
      else context.moveTo(x, py);
    });
    context.stroke();
  }

  window.addEventListener('resize', draw);

  /* ---------------- kunci kontrol ---------------- */

  function canRecord() {
    return controls.windMode.value === 'stable' && !running &&
      elapsed >= +controls.duration.value && !runRecorded;
  }

  function updateRecordAvailability() {
    $('#record').disabled = !canRecord();
    $('#record-note').textContent = controls.windMode.value !== 'stable'
      ? 'Pilih angin stabil untuk mencatat percobaan LKPD.'
      : runRecorded
        ? 'Hasil percobaan ini sudah dicatat. Pilih kondisi berikutnya.'
        : canRecord()
          ? 'Hasil akhir dibekukan. Catat ke LKPD.'
          : 'Tunggu durasi selesai. Rekomendasi: 30 detik untuk semua kondisi.';
  }

  function updateLocks() {
    var gusts = controls.windMode.value === 'gusts';
    // Kedua variabel bebas: slider kecepatan dan pemilih bilah hanya dikunci
    // selama percobaan berjalan supaya angka yang dicatat tidak bergeser.
    controls.speed.disabled = running;
    controls.blades.disabled = running;
    controls.recordTarget.disabled = running;
    controls.duration.disabled = running;
    controls.load.disabled = running;
    controls.windMode.disabled = running;
    $('#speedOut').textContent = controls.speed.value + ' m/s';
    $('#durationOut').textContent = controls.duration.value + ' detik';
    $('#wind-mode-hint').textContent = gusts
      ? 'Angin berfluktuasi di sekitar nilai slider. Eksplorasi ini tidak dicatat ke LKPD.'
      : 'Angin tetap agar hasil mudah dibandingkan.';
    updateRecordAvailability();
    updateScenarioButtons();
    updateControlMeters();
  }

  // Nilai cepat untuk masing-masing variabel. Memilih satu tombol hanya
  // memasang nilai variabel itu; variabel lain dibiarkan apa adanya.
  var QUICK_VALUES = [
    { field: 'speed', value: 6, label: '6 m/s' },
    { field: 'speed', value: 8, label: '8 m/s' },
    { field: 'speed', value: 10, label: '10 m/s' },
    { field: 'blades', value: 2, label: '2 bilah' },
    { field: 'blades', value: 3, label: '3 bilah' },
    { field: 'blades', value: 4, label: '4 bilah' }
  ];

  function updateScenarioButtons() {
    var root = $('#scenario-options');

    $('#scenario-description').textContent =
      'Pilih nilai cepat untuk salah satu variabel. Nilai variabel lainnya tetap bisa kamu ubah sendiri.';

    var signature = QUICK_VALUES.map(function (item) {
      return item.field + item.value;
    }).join(',');

    if (root.dataset.signature !== signature) {
      root.replaceChildren();
      QUICK_VALUES.forEach(function (item) {
        var button = document.createElement('button');
        button.type = 'button';
        button.dataset.value = String(item.value);
        button.dataset.field = item.field;
        button.textContent = item.label;
        button.addEventListener('click', function () {
          if (running) return;
          controls.windMode.value = 'stable';
          controls.duration.value = '30';
          controls.load.value = '100';
          controls[item.field].value = String(item.value);
          reset();
        });
        root.append(button);
      });
      root.dataset.signature = signature;
    }

    Array.prototype.forEach.call(root.children, function (button) {
      button.disabled = running;
      var matches = controls.windMode.value === 'stable' && +controls.duration.value === 30 &&
        +controls[button.dataset.field].value === +button.dataset.value;
      button.setAttribute('aria-pressed', String(matches));
    });
  }

  function updateControlMeters() {
    [controls.speed, controls.duration].forEach(function (input) {
      var min = +input.min;
      var max = +input.max;
      input.style.setProperty('--percent', ((input.value - min) / (max - min)) * 100 + '%');
    });
    var bar = $('#power-bar');
    if (bar) bar.style.width = Math.min(100, (power / RATED) * 100) + '%';
  }

  /* ---------------- indikator rumah ---------------- */

  var lampMet = null;

  function setHouseLamp(met) {
    met = !!met;
    if (met === lampMet) return;
    lampMet = met;

    $('#houseLight').setAttribute('fill', met ? '#f9df87' : '#c6d2bd');
    $('#houseBulb').setAttribute('fill', met ? '#ffe48a' : '#c4d1bd');
    $('#houseLampGlow').setAttribute('opacity', met ? '.85' : '0');
    $('#houseLampRays').setAttribute('opacity', met ? '1' : '0');
    $('#houseLampTitle').textContent = met
      ? 'Indikator menyala · kontribusi PLTB mencukupi beban contoh'
      : 'Indikator padam · kontribusi PLTB belum mencukupi beban contoh';
  }

  function updateSafetyWarning(wind) {
    var danger = wind >= CUT_OUT;
    $('#wind-safety-warning').hidden = !danger;
    document.querySelector('.scene-head').classList.toggle('safety-active', danger);
    $('#sceneStatus').classList.toggle('danger-status', danger);
    $('#state').classList.toggle('danger-status', danger);
    if (danger) $('#sceneStatus').textContent = '⚠ Berhenti untuk keselamatan';
  }

  /* ---------------- reset ---------------- */

  function reset() {
    runRecorded = false;
    running = false;
    paused = false;
    cancelAnimationFrame(frame);
    elapsed = 0;
    omega = 0;
    power = 0;
    energy = 0;
    stable = 0;
    angle = 0;
    $('#rotor').setAttribute('transform', 'rotate(0)');
    samples = [{ t: 0, p: 0 }];
    stoppedByWind = false;
    $('#timer').textContent = clock(+controls.duration.value);
    $('#power').textContent = '0,000 MW';
    $('#windPower').textContent = 'Daya angin: 0 kW';
    $('#rpm').textContent = 'Rotor: 0 rpm';
    $('#energy').textContent = 'Energi: 0 kWh';
    $('#summary').textContent = 'Jalankan percobaan untuk melihat hasilnya.';
    $('#state').textContent = 'Belum aktif';
    $('#led').textContent = 'LED: Mati';
    $('#supply').textContent = 'Pasokan belum aktif';
    $('#sceneStatus').textContent = 'Siap bereksperimen';
    setHouseLamp(false);
    $('#electricPath').style.opacity = '0';
    $('#start').disabled = false;
    $('#pause').disabled = true;
    $('#pause').textContent = 'Ⅱ Jeda';
    $('#record').disabled = true;
    renderRotor();
    updateLocks();
    sensorAngle = 0;
    $('#deliveredPower').textContent = '0,000 MW';
    $('#lineLoss').textContent = '0,0 kW';
    $('#actualWind').textContent = 'Angin aktual: ' + fmt(+controls.speed.value, 1) + ' m/s';
    updateMechanics(
      +controls.speed.value,
      Model.turbinePoint(+controls.speed.value, +controls.blades.value).pitch,
      0
    );
    updateSafetyWarning(+controls.speed.value);
    draw();
  }

  /* ---------------- langkah simulasi ---------------- */

  function tick(now) {
    if (!running || paused) return;

    var duration = +controls.duration.value;
    var dt = Math.max(0, Math.min((now - last) / 1000, duration - elapsed));
    var blades = +controls.blades.value;
    last = now;

    var next = Model.advanceExperiment(+controls.speed.value, blades, omega, elapsed, dt, controls.windMode.value);

    elapsed += dt;
    omega = next.omega;
    angle = (angle + next.angleDegrees) % 360;
    power = next.power;
    energy += next.energyJ / 3600000;

    var wind = next.wind;
    var point = next.point;
    var delivered = Model.deliveredPower(power);
    var cutOff = wind >= CUT_OUT;
    var gusts = controls.windMode.value === 'gusts';

    stable = point.rpm ? Math.abs(point.rpm - omega) / point.rpm < 0.05 : elapsed >= 5;

    $('#rotor').setAttribute('transform', 'rotate(' + angle + ')');

    if (!samples.length || elapsed - samples[samples.length - 1].t >= 0.2 || elapsed >= duration) {
      samples.push({ t: elapsed, p: power });
    }

    stoppedByWind = cutOff;
    $('#timer').textContent = clock(Math.ceil(duration - elapsed));
    $('#power').textContent = fmt(power / 1e6) + ' MW';
    $('#deliveredPower').textContent = fmt(delivered / 1e6) + ' MW';
    $('#lineLoss').textContent = fmt((power - delivered) / 1000, 1) + ' kW';
    $('#actualWind').textContent = 'Angin aktual: ' + fmt(wind, 1) + ' m/s';
    $('#windPower').textContent = 'Daya angin: ' + fmt(Model.windPower(wind) / 1000, 1) + ' kW';
    $('#rpm').textContent = 'Rotor: ' + fmt(omega, 1) + ' rpm';
    $('#energy').textContent = 'Energi generator: ' + fmt(energy, 4) + ' kWh';
    $('#gear').setAttribute('transform', 'rotate(' + angle * 3 + ' 450 296)');
    $('#led').textContent = 'LED: ' + Model.indicator(power) + ' · indikator daya generator';

    var met = delivered >= +controls.load.value * 1000;
    $('#supply').textContent = met
      ? 'Kontribusi PLTB mencukupi beban contoh'
      : 'Kontribusi PLTB belum mencukupi beban contoh';
    setHouseLamp(met);

    $('#electricPath').style.opacity = power > 0 ? '.9' : '0';
    document.querySelector('.winds').style.animationDuration = 12 / Math.max(wind, 1) + 's';
    updateMechanics(wind, point.pitch, dt);

    var status = cutOff
      ? 'Berhenti untuk keselamatan'
      : wind < CUT_IN
        ? 'Angin belum cukup untuk pembangkitan'
        : !stable
          ? 'Putaran menstabilkan'
          : point.limited
            ? 'Kapasitas tercapai · sudut bilah diatur'
            : 'Beroperasi';

    $('#state').textContent = status;
    $('#sceneStatus').textContent = elapsed >= duration ? 'Selesai · hasil dibekukan' : status;
    updateSafetyWarning(wind);
    updateRecordAvailability();
    $('#summary').textContent = (gusts ? 'Angin berembus · acuan' : 'Angin stabil') + ' ' +
      controls.speed.value + ' m/s · ' + blades + ' bilah · generator ' + fmt(power / 1e6) +
      ' MW · ke beban ' + fmt(delivered / 1e6) + ' MW';

    draw();
    updateControlMeters();

    if (elapsed >= duration) {
      running = false;
      $('#electricPath').style.animationPlayState = 'paused';
      document.querySelector('.winds').style.animationPlayState = 'paused';
      $('#start').disabled = false;
      $('#pause').disabled = true;
      updateLocks();
      return;
    }

    frame = requestAnimationFrame(tick);
  }

  /* ---------------- tombol ---------------- */

  $('#start').addEventListener('click', function () {
    if (!paused) reset();
    running = true;
    paused = false;
    $('#electricPath').style.animationPlayState = 'running';
    document.querySelector('.winds').style.animationPlayState = 'running';
    last = performance.now();
    $('#start').disabled = true;
    $('#pause').disabled = false;
    updateLocks();
    frame = requestAnimationFrame(tick);
  });

  $('#pause').addEventListener('click', function () {
    if (!running) return;
    paused = !paused;
    $('#electricPath').style.animationPlayState = paused ? 'paused' : 'running';
    document.querySelector('.winds').style.animationPlayState = paused ? 'paused' : 'running';
    $('#pause').textContent = paused ? '▶ Lanjutkan' : 'Ⅱ Jeda';
    if (!paused) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frame);
    }
  });

  $('#reset').addEventListener('click', reset);

  $('#record').addEventListener('click', function () {
    if (!canRecord()) return;
    var type = controls.recordTarget.value;
    var record = {
      control: type === 'wind' ? controls.blades.value : controls.speed.value,
      variable: type === 'wind' ? controls.speed.value : controls.blades.value,
      power: fmt(power / 1e6),
      led: Model.indicator(power),
      time: Math.round(elapsed),
      load: controls.load.value
    };
    var saved = sheet.addObservation(type, record);
    if (saved) runRecorded = true;
    updateRecordAvailability();
    $('#message').textContent = saved
      ? 'Hasil akhir dicatat ke ' + (type === 'wind' ? 'tabel kecepatan angin' : 'tabel jumlah bilah') + '.'
      : 'Tabel sudah berisi 20 pengamatan.';
  });

  /* ---------------- percobaan ---------------- */

  function configureExperiment(type) {
    controls.recordTarget.value = type;
    controls.windMode.value = 'stable';
    var rows = sheet.rows[type] || [];
    var first = null;
    for (var i = 0; i < rows.length; i += 1) {
      if (rows[i].control !== undefined && String(rows[i].control).trim() !== '') {
        first = rows[i];
        break;
      }
    }
    if (first) {
      var control = Model.number(first.control);
      if (type === 'wind' && [2, 3, 4].indexOf(control) >= 0) controls.blades.value = control;
      else if (type === 'blades' && control >= 0 && control <= 28) controls.speed.value = control;
    } else {
      controls.speed.value = '6';
      controls.blades.value = '3';
      controls.duration.value = '30';
    }
    reset();
    $('#sim').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  controls.recordTarget.addEventListener('change', reset);
  controls.blades.addEventListener('change', reset);
  controls.speed.addEventListener('input', reset);
  controls.duration.addEventListener('input', reset);
  controls.load.addEventListener('change', reset);
  controls.windMode.addEventListener('change', reset);

  /* ---------------- dialog ---------------- */

  var dialog = $('#infoDialog');

  function showInfo(html) {
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
    showInfo('<h2>Memahami daya angin</h2>' +
      '<div class="formula">P angin = ½ × ρ × A × v³<br>P generator = P angin × Cp × η<br>P beban = P generator × η penyaluran</div>' +
      '<dl>' +
      '<dt>P · daya, watt (W)</dt><dd>Daya angin tersedia di udara; daya generator adalah keluaran pembangkit; daya beban sudah dikurangi rugi penyaluran. 1 MW = 1.000 kW.</dd>' +
      '<dt>ρ · massa jenis udara</dt><dd>Asumsi tetap 1,225 kg/m³.</dd>' +
      '<dt>A · luas sapuan rotor</dt><dd>A = πr² dengan r = 20 m. Mengganti jumlah bilah tidak mengubah luas lingkaran sapuan.</dd>' +
      '<dt>v · kecepatan angin (m/s)</dt><dd>Kecepatan dua kali memberi daya angin teoritis delapan kali; keluaran generator tetap dibatasi kapasitas.</dd>' +
      '<dt>Cp · bagian daya yang ditangkap rotor</dt><dd>Berubah mengikuti perbandingan kecepatan ujung bilah terhadap angin. Profil sintetis 2/3/4 bilah memiliki Cp puncak 0,45/0,46/0,44 dan rasio optimal 8,5/7/5. Hasil bergantung kondisi operasi, bukan sekadar jumlah bilah. Kurva ini untuk belajar, bukan kalibrasi turbin nyata.</dd>' +
      '<dt>η · efisiensi generator</dt><dd>Asumsi 90%. Model memakai kurva mulai halus dari 3 sampai 5 m/s dan respons putaran sekitar 2 detik. Kapasitas 500 kW, penghentian pada 25 m/s.</dd>' +
      '<dt>η penyaluran · bagian daya sampai ke beban</dt><dd>Asumsi konverter 97%, gabungan trafo 98%, dan jaringan 98%: total sekitar 93,2%. Kerugian nyata bergantung peralatan dan kondisi jaringan.</dd>' +
      '</dl>' +
      '<p>Sudut bilah diatur otomatis ketika kapasitas tercapai. Indikator menunjukkan posisi aman 90° saat angin terlalu kuat. Ukuran bilah pada ilustrasi tetap; angka sudut ini ilustratif dan bukan hasil model aerodinamika rinci.</p>' +
      '<p>LED LKPD menunjukkan tingkat daya generator. Rumah mewakili sekumpulan pengguna; kebutuhan 50–200 kW merupakan beban kawasan. Lampu rumah adalah indikator kecukupan kontribusi PLTB sesudah rugi penyaluran. Lampu padam pada gambar tidak berarti rumah yang terhubung jaringan nyata langsung mati.</p>' +
      '<p>Untuk LKPD gunakan angin stabil, durasi yang sama, dan catat hasil setelah selesai. Kesimpulan jumlah bilah hanya berlaku untuk kondisi model yang diamati, bukan semua turbin nyata. Angin berembus memakai variasi sintetis sekitar nilai acuan; mode eksplorasi ini tidak bisa dicatat ke tabel agar angka yang dibandingkan tetap sebanding.</p>');
  });

  $('#components').addEventListener('click', function () {
    showInfo(Process.processOverview());
  });

  function showStage(id) {
    var index = -1;
    Process.PROCESS_STAGES.forEach(function (stage, position) {
      if (stage.id === id) index = position;
    });
    if (index < 0) return;
    var stage = Process.PROCESS_STAGES[index];
    showInfo('<p class="eyebrow">TAHAP ' + String(index + 1).padStart(2, '0') + ' / 09</p>' +
      '<h2>' + stage.title + '</h2><p>' + stage.text + '</p>' +
      '<div class="stage-navigation">' +
      '<button id="previous-stage" ' + (index === 0 ? 'disabled' : '') + '>← Sebelumnya</button>' +
      '<button id="next-stage" ' + (index === Process.PROCESS_STAGES.length - 1 ? 'disabled' : '') + '>Selanjutnya →</button>' +
      '</div><button id="all-stages" class="text-btn">Lihat seluruh alur ↗</button>');
    $('#previous-stage').addEventListener('click', function () {
      showStage(Process.PROCESS_STAGES[index - 1].id);
    });
    $('#next-stage').addEventListener('click', function () {
      showStage(Process.PROCESS_STAGES[index + 1].id);
    });
    $('#all-stages').addEventListener('click', function () {
      showInfo(Process.processOverview());
    });
  }

  Array.prototype.forEach.call($('#windPlant').querySelectorAll('[data-stage]'), function (label) {
    var id = label.dataset.stage;
    var index = -1;
    Process.PROCESS_STAGES.forEach(function (stage, position) {
      if (stage.id === id) index = position;
    });
    label.setAttribute('role', 'button');
    label.setAttribute('tabindex', '0');
    label.setAttribute('aria-label', 'Tahap ' + (index + 1) + ': ' + (Process.PROCESS_STAGES[index] || {}).title);
    label.addEventListener('click', function () {
      showStage(id);
    });
    label.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showStage(id);
      }
    });
  });

  $('#cutaway').addEventListener('click', function () {
    var open = $('#cutaway').getAttribute('aria-pressed') === 'true';
    $('#cutaway').setAttribute('aria-pressed', String(!open));
    $('#cutaway').textContent = 'Penampang: ' + (open ? 'tertutup' : 'terbuka');
    $('#nacelleCover').setAttribute('visibility', open ? 'visible' : 'hidden');
  });

  $('#enlarge').addEventListener('click', function () {
    showInfo('<h2>Aliran energi PLTB</h2>');
    dialog.classList.add('dialog-wide');
    var wrap = document.createElement('div');
    wrap.className = 'zoom-scene';
    var clone = $('#windPlant').cloneNode(true);
    var prefix = 'zoom-wind-';
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
      element.removeAttribute('aria-label');
    });
    wrap.append(clone);
    var note = document.createElement('p');
    note.className = 'hint';
    note.textContent = 'Geser gambar untuk membaca detail. Cuplikan kondisi saat dibuka; tutup untuk mengikuti pembaruan simulasi.';
    $('#dialogBody').append(wrap, note);
  });

  /* ---------------- navigasi & bantuan ---------------- */

  $('#write-prediction').addEventListener('click', function () {
    var fold = $('#hypothesis');
    fold.open = true;
    fold.scrollIntoView({ behavior: 'smooth', block: 'start' });
    fold.querySelector('textarea').focus({ preventScroll: true });
  });

  $('#help').addEventListener('click', function () {
    showInfo('<h2>Mulai penyelidikan</h2><ol>' +
      '<li>Siapkan buku catatan dan tulis hipotesis.</li>' +
      '<li>Pilih tabel tujuan catat, lalu ubah satu variabel lebih dulu agar pengaruhnya terbaca. Kedua variabel tetap bebas kamu sesuaikan.</li>' +
      '<li>Tekan Mulai. Amati putaran, daya, dan pasokan ke rumah. Di ponsel, geser gambar ke samping.</li>' +
      '<li>Catat hasil di buku, lalu lengkapi dan kirim LKPD.</li></ol>');
  });

  var labTabs = Array.prototype.slice.call(document.querySelectorAll('.tabbar .tab'));

  function updateLabTab() {
    var onSheet = $('#lkpd').getBoundingClientRect().top < 160;
    labTabs.forEach(function (tab, index) {
      var active = index === (onSheet ? 1 : 0);
      tab.classList.toggle('active', active);
      if (active) tab.setAttribute('aria-current', 'location');
      else tab.removeAttribute('aria-current');
    });
  }

  window.addEventListener('scroll', updateLabTab, { passive: true });
  updateLabTab();

  [controls.speed, controls.duration].forEach(function (input) {
    input.addEventListener('input', updateControlMeters);
  });

  Array.prototype.forEach.call(document.querySelectorAll('.tabbar .tab'), function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.getAttribute('href');
      if (!target || target.charAt(0) !== '#') return;
      var section = document.querySelector(target);
      if (!section) return;
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  var powerObserver = new MutationObserver(function () {
    var bar = $('#power-bar');
    if (bar) bar.style.width = Math.min(100, (power / RATED) * 100) + '%';
  });
  powerObserver.observe($('#power'), { childList: true, characterData: true, subtree: true });

  reset();
  updateControlMeters();
})();
