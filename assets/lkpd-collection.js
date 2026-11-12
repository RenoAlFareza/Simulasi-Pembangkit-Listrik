/* Pemeriksaan kelengkapan, unduh PDF, dan pengiriman LKPD untuk PLTB & PLTS.
   Di HTML lokal (file://) pengiriman otomatis tidak tersedia; PDF tetap bisa diunduh. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else {
    root.LKPDCollection = factory();
    root.LKPDCollection.init(root);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var RECIPIENT = 'renoalfareza21@gmail.com';

  function text(value) {
    return String(value === null || value === undefined ? '' : value).trim();
  }

  function validate(payload) {
    var items = [];
    var labels = {
      kelas: 'Kelas',
      kelompok: 'Kelompok',
      tanggal: 'Tanggal percobaan',
      anggota: 'Nama anggota kelompok',
      hipotesis: 'Hipotesis'
    };

    ['kelas', 'kelompok', 'tanggal', 'anggota', 'hipotesis'].forEach(function (key) {
      if (!text(payload[key])) items.push({ field: key, message: labels[key] + ' belum diisi.' });
    });

    ['kelas', 'kelompok', 'tanggal', 'anggota'].forEach(function (key) {
      if (text(payload[key]).length > 500) items.push({ field: key, message: labels[key] + ' terlalu panjang.' });
    });

    ['hipotesis', 'kesimpulan'].forEach(function (key) {
      if (text(payload[key]).length > 20000) {
        items.push({ field: key, message: (key === 'hipotesis' ? 'Hipotesis' : 'Kesimpulan') + ' terlalu panjang.' });
      }
    });

    if (text(payload.tanggal) && !/^\d{4}-\d{2}-\d{2}$/.test(text(payload.tanggal))) {
      items.push({ field: 'tanggal', message: 'Format tanggal harus TTTT-BB-HH.' });
    } else if (text(payload.tanggal)) {
      var date = new Date(text(payload.tanggal) + 'T00:00:00Z');
      if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text(payload.tanggal)) {
        items.push({ field: 'tanggal', message: 'Tanggal kalender tidak valid.' });
      }
    }

    var assignment = text(payload.assignment) || 'both';

    (payload.answers || []).forEach(function (block) {
      var needed = assignment === 'both' || assignment === block.id;
      var rows = (block.rows || []).filter(function (row) {
        return text(row.control) || text(row.variable) || text(row.power);
      });

      if (needed) {
        if (!text(block.analysis)) {
          items.push({
            field: block.id === (payload.answers[0] || {}).id ? 'analisis1' : 'analisis2',
            message: 'Analisis ' + block.heading + ' belum diisi.'
          });
        }
        if (rows.length < 3) {
          items.push({ field: 'observations', message: block.heading + ': isi minimal tiga baris pengamatan.' });
        }
      }

      if (rows.length > 20) {
        items.push({ field: 'observations', message: block.heading + ': maksimal 20 baris pengamatan.' });
      }

      if (!rows.length) return;

      // Kedua variabel bebas, jadi syaratnya bukan lagi "kolom pertama tetap"
      // melainkan setiap baris harus menguji pasangan nilai yang berbeda.
      var pairs = {};
      var duplicate = false;
      rows.forEach(function (row) {
        var pair = text(row.control) + '|' + text(row.variable);
        if (pair === '|') return;
        if (pairs[pair]) duplicate = true;
        pairs[pair] = true;
      });
      if (duplicate) {
        items.push({
          field: 'observations',
          message: block.heading + ': ada baris yang memakai nilai sama; ubah minimal satu variabel.'
        });
      }
    });

    if (!text(payload.kesimpulan)) items.push({ field: 'kesimpulan', message: 'Kesimpulan belum diisi.' });
    if (text(payload.kesimpulan).length > 20000) items.push({ field: 'kesimpulan', message: 'Kesimpulan terlalu panjang.' });

    try {
      var size = new TextEncoder().encode(JSON.stringify(payload)).length;
      if (size > 200000) {
        items.push({ field: 'kesimpulan', message: 'Data terlalu besar untuk dikumpulkan. Kurangi panjang jawaban.' });
      }
    } catch (error) {
      /* TextEncoder tidak tersedia — lewati pemeriksaan ukuran */
    }

    return items;
  }

  function filename(payload) {
    var base = 'LKPD-' + (payload.brand || 'Energi') + '-' + (text(payload.kelas) || 'Kelas') + '-' + (text(payload.kelompok) || 'Kelompok');
    return base.replace(/[^A-Za-z0-9_-]+/g, '-').slice(0, 115) + '.pdf';
  }

  function init(w) {
    var d = w.document;
    if (!d) return;

    function pick(selector) {
      return d.querySelector(selector);
    }

    var buttons = Array.prototype.slice.call(d.querySelectorAll('[data-download-pdf]'));
    var submit = pick('#submit');
    var check = pick('#check');
    var list = pick('#submission-errors');
    var message = pick('#message');
    var busy = false;

    function setMessage(text, isError) {
      if (!message) return;
      message.textContent = text;
      message.setAttribute('data-error', isError ? 'true' : 'false');
    }

    function snapshot() {
      var api = w.EnergyWorksheet || w.LKPDWorksheet.current;
      if (api && typeof api.snapshot === 'function') return api.snapshot();
      return null;
    }

    function reveal(field) {
      var selector = field === 'observations' ? '#observations' : field === 'kesimpulan' ? '#analysis' : field === 'hipotesis' ? '#hypothesis' : '#identity';
      var target = d.querySelector('[data-field="' + field + '"]');
      if (target) {
        var fold = target.closest('details');
        if (fold) fold.open = true;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (typeof target.focus === 'function') target.focus({ preventScroll: true });
        return;
      }
      var section = pick(selector);
      if (section) {
        if (section.tagName === 'DETAILS') section.open = true;
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    function showErrors(items) {
      if (!list) return;
      list.textContent = '';
      if (!items.length) {
        list.hidden = true;
        return;
      }
      items.forEach(function (item) {
        var li = d.createElement('li');
        var link = d.createElement('a');
        link.href = '#' + item.field;
        link.textContent = item.message;
        link.addEventListener('click', function (event) {
          event.preventDefault();
          reveal(item.field);
        });
        li.appendChild(link);
        list.appendChild(li);
      });
      list.hidden = false;
    }

    function download(bytes, name) {
      var blob = new Blob([bytes], { type: 'application/pdf' });
      var url = URL.createObjectURL(blob);
      var link = d.createElement('a');
      link.href = url;
      link.download = name;
      d.body.appendChild(link);
      link.click();
      link.remove();
      w.setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 60000);
    }

    async function makePdf(payload, draft) {
      if (!w.EnergyPdf) throw new Error('Pembuat PDF belum dimuat.');
      await new Promise(function (resolve) {
        w.setTimeout(resolve, 20);
      });
      return w.EnergyPdf.build(payload, { draft: draft });
    }

    async function handleDownload(draftOnly) {
      if (busy) return;
      var payload = snapshot();
      if (!payload) {
        setMessage('Isian LKPD belum siap. Muat ulang halaman lalu coba lagi.', true);
        return;
      }
      busy = true;
      var previous = buttons.map(function (button) {
        return button.textContent;
      });
      buttons.forEach(function (button) {
        button.disabled = true;
        button.textContent = 'Menyiapkan…';
      });
      try {
        var incomplete = validate(payload).length > 0;
        var bytes = await makePdf(payload, incomplete);
        download(bytes, filename(payload));
        setMessage(
          incomplete
            ? 'PDF draf diunduh. Lengkapi isian sebelum mengirim.'
            : 'PDF lengkap diunduh.',
          false
        );
      } catch (error) {
        setMessage('PDF gagal dibuat: ' + error.message, true);
      } finally {
        busy = false;
        buttons.forEach(function (button, index) {
          button.disabled = false;
          button.textContent = previous[index];
        });
      }
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        handleDownload(false);
      });
    });

    if (check) {
      check.addEventListener('click', function () {
        var payload = snapshot();
        if (!payload) return;
        var items = validate(payload);
        showErrors(items);
        setMessage(
          items.length ? 'Ada ' + items.length + ' bagian yang perlu dilengkapi.' : 'Semua bagian wajib sudah lengkap.',
          items.length > 0
        );
      });
    }

    if (submit) {
      submit.addEventListener('click', function () {
        var payload = snapshot();
        if (!payload) return;
        var items = validate(payload);
        showErrors(items);
        var bridge = Boolean(w.google && w.google.script && w.google.script.run);
        if (!bridge) {
          setMessage('Pengiriman belum aktif pada HTML lokal. PDF tetap bisa diunduh lewat tombol Unduh PDF.', true);
          return;
        }
        if (items.length) {
          setMessage('Lengkapi dulu bagian yang ditandai sebelum mengirim.', true);
          return;
        }
        submit.disabled = true;
        setMessage('Mengirim PDF…', false);
        w.google.script.run
          .withSuccessHandler(function () {
            submit.disabled = false;
            setMessage('LKPD terkirim ke ' + RECIPIENT + '.', false);
          })
          .withFailureHandler(function (error) {
            submit.disabled = false;
            setMessage('Pengiriman gagal: ' + (error && error.message ? error.message : error), true);
          })
          .submitWorksheet(payload);
      });
    }

    setMessage('Pengiriman belum aktif pada HTML lokal. PDF tetap bisa diunduh.', false);
  }

  return Object.freeze({ validate: validate, filename: filename, init: init, RECIPIENT: RECIPIENT });
});
