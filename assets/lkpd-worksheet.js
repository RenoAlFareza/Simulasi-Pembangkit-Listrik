/* LKPD bersama untuk PLTB & PLTS — tabel pengamatan, penyimpanan, ekspor, kemajuan.
   Skrip klasik (bukan modul ES) agar halaman bisa dibuka langsung lewat file://. */
(function (root) {
  'use strict';

  var STORAGE_PREFIX = 'energi-lab-lkpd-';

  function read(table) {
    var out = [];
    Array.prototype.forEach.call(table.querySelectorAll('tr'), function (tr) {
      var row = {};
      Array.prototype.forEach.call(tr.querySelectorAll('[data-key]'), function (el) {
        row[el.getAttribute('data-key')] = el.value;
      });
      out.push(row);
    });
    return out;
  }

  function isBlank(row) {
    return !row || Object.keys(row).every(function (k) {
      return String(row[k] || '').trim() === '';
    });
  }

  function filled(row) {
    return row && ['control', 'variable', 'power', 'led'].every(function (k) {
      return String(row[k] || '').trim() !== '';
    });
  }

  function create(options) {
    var d = document;
    var key = STORAGE_PREFIX + options.key;
    var types = options.types;
    var tables = {};
    var feedback = {};
    var review = {};
    var reviewList = {};
    var state = { fields: {}, rows: {}, assignment: 'both' };

    types.forEach(function (type) {
      tables[type.id] = d.querySelector('#table-' + type.id);
      feedback[type.id] = d.querySelector('#feedback-' + type.id);
      review[type.id] = d.querySelector('#review-' + type.id);
      reviewList[type.id] = d.querySelector('#review-list-' + type.id);
      state.rows[type.id] = [];
    });

    var sheet = {
      get rows() {
        var current = {};
        types.forEach(function (type) {
          current[type.id] = tables[type.id] ? read(tables[type.id]) : [];
        });
        return current;
      }
    };

    /* ---------- nomor baris & tombol hapus ---------- */

    function renumber(type) {
      var table = tables[type.id];
      if (!table) return;
      Array.prototype.forEach.call(table.querySelectorAll('tr'), function (tr, index) {
        var cell = tr.querySelector('td');
        if (cell) cell.textContent = String(index + 1);
        var button = tr.querySelector('.row-remove');
        if (button) button.setAttribute('aria-label', 'Hapus ' + type.id + ' baris ' + (index + 1));
        Array.prototype.forEach.call(tr.querySelectorAll('[data-key]'), function (el) {
          el.setAttribute('aria-label', type.id + ' ' + el.getAttribute('data-key') + ' baris ' + (index + 1));
        });
      });
    }

    function addRow(type) {
      var table = tables[type.id];
      if (!table) return;
      var count = table.querySelectorAll('tr').length;
      if (count >= 20) {
        note(type, 'Maksimal 20 baris pengamatan per percobaan.');
        return;
      }
      var template = table.querySelector('tr');
      if (!template) return;
      var copy = template.cloneNode(true);
      Array.prototype.forEach.call(copy.querySelectorAll('[data-key]'), function (el) {
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = '';
      });
      table.appendChild(copy);
      renumber(type);
      rowsChanged();
    }

    function bindTable(type) {
      var table = tables[type.id];
      if (!table) return;
      table.addEventListener('click', function (event) {
        var remove = event.target.closest('.row-remove');
        if (!remove) return;
        var tr = remove.closest('tr');
        var total = table.querySelectorAll('tr').length;
        if (total <= 3) {
          note(type, 'Sisakan minimal tiga baris pengamatan.');
          return;
        }
        tr.remove();
        renumber(type);
        rowsChanged();
      });
      table.addEventListener('input', rowsChanged);
      table.addEventListener('change', rowsChanged);
      renumber(type);
    }

    /* ---------- catatan pemeriksaan ---------- */

    function note(type, message) {
      var el = feedback[type.id];
      if (!el) return;
      el.textContent = message || '';
      el.classList.toggle('is-warning', Boolean(message));
    }

    function inspect(type) {
      var items = [];
      var list = sheet.rows[type.id].map(function (row, index) {
        return { row: row, index: index };
      }).filter(function (item) {
        return !isBlank(item.row);
      });

      if (!list.length) return items;

      // Kedua kolom boleh berubah, jadi yang diperiksa bukan lagi ketetapan
      // kolom pertama melainkan baris kembar: dua baris dengan isi sama tidak
      // memberi informasi baru.
      var seen = {};
      list.forEach(function (item) {
        var pair = String(item.row.control || '').trim() + '|' + String(item.row.variable || '').trim();
        if (pair === '|') return;
        if (seen[pair]) {
          items.push('Baris ' + (item.index + 1) + ' memakai nilai yang sama dengan baris ' + seen[pair] + '.');
        } else {
          seen[pair] = item.index + 1;
        }
      });

      list.forEach(function (item) {
        var power = String(item.row.power || '').trim();
        if (!power) return;
        var parsed = Number(power.replace(',', '.'));
        if (!Number.isFinite(parsed)) {
          items.push('Daya pada baris ' + (item.index + 1) + ' belum berupa angka.');
        } else if (parsed < 0) {
          items.push('Daya pada baris ' + (item.index + 1) + ' bernilai negatif.');
        }
      });

      return items;
    }

    function refreshReview(type) {
      var box = review[type.id];
      var list = reviewList[type.id];
      if (!box || !list) return;
      var items = inspect(type);
      list.textContent = '';
      items.forEach(function (message) {
        var li = d.createElement('li');
        li.textContent = message;
        list.appendChild(li);
      });
      var summary = box.querySelector('summary');
      if (summary) summary.textContent = 'Periksa kembali · ' + items.length + ' catatan';
      box.hidden = items.length === 0;
      note(type, items.length ? 'Ada ' + items.length + ' catatan untuk diperiksa.' : '');
    }

    /* ---------- penyimpanan ---------- */

    function fields() {
      var out = {};
      Array.prototype.forEach.call(d.querySelectorAll('[data-field]'), function (el) {
        out[el.getAttribute('data-field')] = el.value;
      });
      return out;
    }

    function save() {
      state.fields = fields();
      state.rows = sheet.rows;
      var assignment = d.querySelector('#assignment');
      state.assignment = assignment ? assignment.value : 'both';
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        /* penyimpanan penuh atau diblokir — abaikan, isian tetap di halaman */
      }
      var status = d.querySelector('[data-field="kelas"]');
      var badge = d.getElementById('save-status');
      if (badge && status !== null) {
        badge.textContent = 'Tersimpan di perangkat ini';
      }
    }

    function restore() {
      var raw = null;
      try {
        raw = localStorage.getItem(key);
      } catch (error) {
        return;
      }
      if (!raw) {
        clearTables();
        return;
      }
      var data;
      try {
        data = JSON.parse(raw);
      } catch (error) {
        clearTables();
        return;
      }
      if (data.fields) {
        Array.prototype.forEach.call(d.querySelectorAll('[data-field]'), function (el) {
          var value = data.fields[el.getAttribute('data-field')];
          if (typeof value === 'string') el.value = value;
        });
      }
      if (data.rows) {
        types.forEach(function (type) {
          var rows = data.rows[type.id];
          if (!Array.isArray(rows) || !rows.length) return;
          var table = tables[type.id];
          if (!table) return;
          ensureRows(type, Math.max(3, Math.min(20, rows.length)));
          Array.prototype.forEach.call(table.querySelectorAll('tr'), function (tr, index) {
            var row = rows[index] || {};
            Array.prototype.forEach.call(tr.querySelectorAll('[data-key]'), function (el) {
              var value = row[el.getAttribute('data-key')];
              if (value === undefined || value === null) return;
              if (el.tagName === 'SELECT') {
                el.value = value;
                if (el.selectedIndex < 0) el.selectedIndex = 0;
              } else {
                el.value = value;
              }
            });
          });
        });
      }
      if (typeof data.assignment === 'string') {
        var assignment = d.querySelector('#assignment');
        if (assignment) assignment.value = data.assignment;
      }
    }

    function ensureRows(type, count) {
      var table = tables[type.id];
      if (!table) return;
      while (table.querySelectorAll('tr').length < count) {
        var template = table.querySelector('tr');
        if (!template) return;
        var copy = template.cloneNode(true);
        Array.prototype.forEach.call(copy.querySelectorAll('[data-key]'), function (el) {
          if (el.tagName === 'SELECT') el.selectedIndex = 0;
          else el.value = '';
        });
        table.appendChild(copy);
      }
      renumber(type);
    }

    function clearTables() {
      types.forEach(function (type) {
        var table = tables[type.id];
        if (!table) return;
        Array.prototype.forEach.call(table.querySelectorAll('[data-key]'), function (el) {
          if (el.tagName === 'SELECT') el.selectedIndex = 0;
          else el.value = '';
        });
        renumber(type);
      });
    }

    /* ---------- kemajuan ---------- */

    function progress() {
      var f = fields();
      var count = 0;
      ['kelas', 'kelompok', 'tanggal', 'anggota', 'hipotesis', 'analisis1', 'analisis2', 'kesimpulan'].forEach(function (name) {
        if (String(f[name] || '').trim()) count += 1;
      });
      types.forEach(function (type) {
        var rows = sheet.rows[type.id];
        if (rows.some(filled)) count += 1;
      });
      var bar = d.getElementById('progress');
      var label = d.getElementById('progress-label');
      if (bar) {
        bar.max = 10;
        bar.value = Math.min(10, count);
      }
      if (label) label.textContent = Math.min(10, count) + ' dari 10';
      return count;
    }

    function rowsChanged() {
      types.forEach(function (type) {
        refreshReview(type);
      });
      progress();
      save();
    }

    /* ---------- tambah pengamatan dari simulasi ---------- */

    sheet.addObservation = function (typeId, record) {
      var type = types.filter(function (item) {
        return item.id === typeId;
      })[0];
      if (!type) return false;
      var table = tables[type.id];
      if (!table) return false;
      var rows = Array.prototype.slice.call(table.querySelectorAll('tr'));
      if (rows.length > 20) return false;
      var target = rows.filter(function (tr) {
        var values = Array.prototype.map.call(tr.querySelectorAll('[data-key]'), function (el) {
          return el.value;
        });
        return values.every(function (value) {
          return String(value || '').trim() === '';
        });
      })[0];
      if (!target) {
        if (rows.length >= 20) return false;
        var template = rows[rows.length - 1];
        target = template.cloneNode(true);
        Array.prototype.forEach.call(target.querySelectorAll('[data-key]'), function (el) {
          if (el.tagName === 'SELECT') el.selectedIndex = 0;
          else el.value = '';
        });
        table.appendChild(target);
      }
      if (!target) return false;
      Array.prototype.forEach.call(target.querySelectorAll('[data-key]'), function (el) {
        var name = el.getAttribute('data-key');
        if (record[name] === undefined) return;
        if (el.tagName === 'SELECT') {
          el.value = String(record[name]);
        } else {
          el.value = String(record[name]);
        }
      });
      renumber(type.id);
      rowsChanged();
      return true;
    };

    /* ---------- ekspor teks ---------- */

    function exportText() {
      var f = fields();
      var lines = [];
      lines.push(options.title + ' — LKPD');
      lines.push('='.repeat(options.title.length + 8));
      lines.push('');
      lines.push('Kelas: ' + (f.kelas || '-'));
      lines.push('Kelompok: ' + (f.kelompok || '-'));
      lines.push('Tanggal: ' + (f.tanggal || '-'));
      lines.push('Anggota: ' + (f.anggota || '-'));
      var assignment = d.querySelector('#assignment');
      if (assignment) {
        var chosen = assignment.options[assignment.selectedIndex];
        lines.push('Percobaan dikumpulkan: ' + (chosen ? chosen.textContent : '-'));
      }
      lines.push('');
      lines.push('Hipotesis');
      lines.push(f.hipotesis || 'Belum diisi.');
      types.forEach(function (type) {
        lines.push('');
        lines.push(type.heading || type.title);
        var rows = sheet.rows[type.id].filter(function (row) {
          return !isBlank(row);
        });
        if (!rows.length) {
          lines.push('Belum ada pengamatan.');
          return;
        }
        rows.forEach(function (row, index) {
          lines.push(
            (index + 1) + '. ' + type.controlLabel + ' ' + (row.control || '-') +
            ' · ' + type.variableLabel + ' ' + (row.variable || '-') +
            ' · daya ' + (row.power || '-') + ' MW' +
            ' · LED ' + (row.led || '-') +
            ' · waktu ' + (row.time || '-') + ' detik'
          );
        });
      });
      lines.push('');
      types.forEach(function (type) {
        lines.push(type.analysisLabel || type.title);
        lines.push(f[type.analysisField] || 'Belum diisi.');
        lines.push('');
      });
      lines.push('Kesimpulan');
      lines.push(f.kesimpulan || 'Belum diisi.');
      lines.push('');
      lines.push('Dibuat dengan ' + options.title + ' — Laboratorium Energi Terbarukan.');
      return lines.join('\n');
    }

    function downloadText() {
      var name = (options.title + '-LKPD-' + (fields().kelompok || 'Kelompok')).replace(/[^A-Za-z0-9_-]+/g, '-');
      var blob = new Blob([exportText()], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var link = d.createElement('a');
      link.href = url;
      link.download = name + '.txt';
      d.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 60000);
    }

    /* ---------- pemasangan ---------- */

    types.forEach(bindTable);

    types.forEach(function (type) {
      var button = d.querySelector('[data-add="' + type.id + '"]');
      if (button) {
        button.addEventListener('click', function () {
          addRow(type);
        });
      }
      var start = d.querySelector('[data-start="' + type.id + '"]');
      if (start) {
        start.addEventListener('click', function () {
          if (typeof options.onStart === 'function') options.onStart(type.id);
        });
      }
    });

    var identity = d.querySelector('#identity');
    if (identity) {
      identity.addEventListener('input', rowsChanged);
      identity.addEventListener('change', rowsChanged);
    }

    var analysis = d.querySelector('#analysis');
    if (analysis) {
      analysis.addEventListener('input', function () {
        progress();
        save();
      });
    }

    var hypothesis = d.querySelector('#hypothesis textarea');
    if (hypothesis) {
      hypothesis.addEventListener('input', function () {
        progress();
        save();
      });
    }

    var assignment = d.querySelector('#assignment');
    if (assignment) {
      assignment.addEventListener('change', function () {
        types.forEach(function (type) {
          var tag = d.querySelector('[data-requirement="' + type.id + '"]');
          if (!tag) return;
          var needed = assignment.value === 'both' || assignment.value === type.id;
          tag.textContent = needed ? 'Wajib diisi' : 'Opsional';
          tag.classList.toggle('is-optional', !needed);
        });
        rowsChanged();
      });
    }

    var exportButton = d.getElementById('export');
    if (exportButton) exportButton.addEventListener('click', downloadText);

    var clearButton = d.getElementById('clear-sheet');
    if (clearButton) {
      clearButton.addEventListener('click', function () {
        if (!root.confirm('Hapus semua isian LKPD di perangkat ini?')) return;
        try {
          localStorage.removeItem(key);
        } catch (error) {
          /* abaikan */
        }
        Array.prototype.forEach.call(d.querySelectorAll('[data-field]'), function (el) {
          el.value = '';
        });
        clearTables();
        var badge = d.getElementById('save-status');
        if (badge) badge.textContent = 'Isian dihapus';
        rowsChanged();
      });
    }

    Array.prototype.forEach.call(d.querySelectorAll('a[href^="#"]'), function (link) {
      link.addEventListener('click', function (event) {
        var target = d.querySelector(link.getAttribute('href'));
        if (!target) return;
        event.preventDefault();
        var fold = target.closest('details');
        if (fold) fold.open = true;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    restore();
    types.forEach(function (type) {
      refreshReview(type);
    });
    progress();

    sheet.snapshot = function () {
      var f = fields();
      var assignmentEl = d.querySelector('#assignment');
      return {
        title: options.title,
        brand: options.brand,
        subtitle: options.subtitle,
        key: options.key,
        kelas: f.kelas || '',
        kelompok: f.kelompok || '',
        tanggal: f.tanggal || '',
        anggota: f.anggota || '',
        hipotesis: f.hipotesis || '',
        kesimpulan: f.kesimpulan || '',
        assignment: assignmentEl ? assignmentEl.value : 'both',
        answers: types.map(function (type) {
          return {
            id: type.id,
            heading: type.heading || type.title,
            controlLabel: type.controlLabel,
            variableLabel: type.variableLabel,
            analysisLabel: type.analysisLabel || type.title,
            analysis: f[type.analysisField] || '',
            rows: sheet.rows[type.id].filter(function (row) {
              return !isBlank(row);
            })
          };
        })
      };
    };

    sheet.progress = progress;
    sheet.save = save;
    return sheet;
  }

  root.LKPDWorksheet = { create: create };
})(typeof globalThis !== 'undefined' ? globalThis : this);
