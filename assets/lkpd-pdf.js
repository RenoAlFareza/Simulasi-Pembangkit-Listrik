/* Pembuat PDF LKPD untuk PLTB & PLTS — turunan dari pdf-export.js PLTA.
   Memakai window.PDFLib, window.fontkit, dan window.PLTA_PDF_ASSETS (font TTF base64). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./pdf-lib.min.js'), require('./fontkit.umd.min.js'), root);
  } else {
    root.EnergyPdf = factory(root.PDFLib, root.fontkit, root);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (PDFLib, fontkit, root) {
  'use strict';

  function clean(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/\r\n?/g, '\n')
      .replace(/\t/g, '    ')
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
  }

  function b64bytes(text) {
    if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(text, 'base64'));
    var binary = atob(text);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function build(payload, options) {
    options = options || {};
    var assets = options.assets || root.PLTA_PDF_ASSETS;
    if (!assets || !assets.font) throw new Error('Font PDF belum tersedia.');
    if (!PDFLib) throw new Error('Pustaka PDF belum dimuat.');

    var doc = await PDFLib.PDFDocument.create();
    doc.registerFontkit(fontkit);
    var font = await doc.embedFont(b64bytes(assets.font), { subset: true });

    var ink = PDFLib.rgb(0.09, 0.24, 0.22);
    var green = PDFLib.rgb(0.04, 0.38, 0.34);
    var muted = PDFLib.rgb(0.4, 0.48, 0.43);
    var line = PDFLib.rgb(0.85, 0.89, 0.83);
    var cream = PDFLib.rgb(0.97, 0.98, 0.95);
    var pale = PDFLib.rgb(0.93, 0.96, 0.89);
    var white = PDFLib.rgb(1, 1, 1);

    var page = null;
    var y = 0;

    function draw(text, x, top, size, color) {
      if (!page) return;
      page.drawText(clean(text), { x: x, y: top, size: size || 10, font: font, color: color || ink });
    }

    function wrap(text, size, width) {
      var lines = [];
      String(clean(text) || '')
        .split('\n')
        .forEach(function (paragraph) {
          var words = paragraph.split(/\s+/).filter(Boolean);
          if (!words.length) {
            lines.push('');
            return;
          }
          var current = '';
          words.forEach(function (word) {
            var candidate = current ? current + ' ' + word : word;
            if (font.widthOfTextAtSize(candidate, size) <= width) {
              current = candidate;
              return;
            }
            if (current) lines.push(current);
            if (font.widthOfTextAtSize(word, size) <= width) {
              current = word;
              return;
            }
            var piece = '';
            Array.prototype.forEach.call(word, function (character) {
              if (font.widthOfTextAtSize(piece + character, size) > width) {
                lines.push(piece);
                piece = character;
              } else {
                piece += character;
              }
            });
            current = piece;
          });
          if (current) lines.push(current);
        });
      return lines;
    }

    function fresh() {
      page = doc.addPage([595.28, 841.89]);
      page.drawRectangle({ x: 0, y: 0, width: 595.28, height: 841.89, color: white });
      draw(payload.brand || 'PLTB', 42, 799, 22, green);
      draw((payload.subtitle || 'LABORATORIUM ENERGI TERBARUKAN') + '  /  LKPD DIGITAL', 150, 804, 8, muted);
      page.drawLine({ start: { x: 42, y: 781 }, end: { x: 553, y: 781 }, color: line, thickness: 1 });
      y = 756;
    }

    function room(height) {
      if (!page || y - height < 62) fresh();
    }

    function heading(number, title) {
      room(62);
      draw(number, 42, y, 8, muted);
      y -= 25;
      draw(title, 42, y, 17, green);
      y -= 25;
    }

    function paragraph(value, size) {
      size = size || 10;
      var lines = wrap(value || 'Belum diisi.', size, 485);
      lines.forEach(function (text) {
        room(17);
        draw(text, 54, y, size);
        y -= 15;
      });
      y -= 10;
    }

    function answer(label, value) {
      room(65);
      draw(label, 54, y, 10, green);
      y -= 18;
      var lines = wrap(value || 'Belum diisi.', 10, 459);
      var index = 0;
      while (index < lines.length) {
        room(48);
        var count = Math.min(lines.length - index, Math.max(1, Math.floor((y - 77) / 16)));
        var height = count * 16 + 22;
        page.drawRectangle({
          x: 42,
          y: y - height + 12,
          width: 511,
          height: height,
          color: white,
          borderColor: line,
          borderWidth: 0.7
        });
        for (var i = 0; i < count; i += 1) {
          draw(lines[index + i], 55, y - 3 - i * 16, 10);
        }
        index += count;
        y -= height + 7;
        if (index < lines.length) {
          fresh();
          draw(label + ' (lanjutan)', 54, y, 10, green);
          y -= 20;
        }
      }
      y -= 8;
    }

    /* ---------- tabel pengamatan ---------- */

    var widths = [26, 74, 74, 80, 71, 50, 0];

    function tableHead(titles) {
      room(80);
      var height = 40;
      var x = 42;
      titles.forEach(function (title, index) {
        var width = widths[index] || 0;
        if (!width) return;
        page.drawRectangle({
          x: x,
          y: y - height,
          width: width,
          height: height,
          color: pale,
          borderColor: line,
          borderWidth: 0.65
        });
        var lines = wrap(title, 7.5, width - 10);
        lines.slice(0, 3).forEach(function (text, lineIndex) {
          var t = font.widthOfTextAtSize(text, 7.5);
          draw(text, x + (width - t) / 2, y - 13 - lineIndex * 9, 7.5, green);
        });
        x += width;
      });
      y -= height;
    }

    function tableRow(values) {
      var height = Math.max(30, Math.max.apply(null, values.map(function (value, index) {
        return wrap(value, 8.5, (widths[index] || 40) - 10).length * 11 + 16;
      })));
      if (y - height < 70) {
        fresh();
        tableHead(values.map(function (_, index) {
          return index === 0 ? 'No.' : 'Lanjutan';
        }));
      }
      var x = 42;
      values.forEach(function (value, index) {
        var width = widths[index] || 0;
        if (!width) return;
        page.drawRectangle({
          x: x,
          y: y - height,
          width: width,
          height: height,
          color: white,
          borderColor: line,
          borderWidth: 0.65
        });
        var lines = wrap(value, 8.5, width - 10);
        lines.forEach(function (text, lineIndex) {
          var t = font.widthOfTextAtSize(text, 8.5);
          draw(text, x + (width - t) / 2, y - 15 - lineIndex * 11, 8.5, ink);
        });
        x += width;
      });
      y -= height;
    }

    function observation(answerBlock) {
      room(60);
      draw(answerBlock.heading, 54, y, 11, green);
      y -= 18;
      draw(answerBlock.controlLabel + '  ·  ' + answerBlock.variableLabel, 54, y, 8, muted);
      y -= 18;
      tableHead(['No.', answerBlock.controlLabel, answerBlock.variableLabel, 'Daya (MW)', 'LED', 'Waktu (s)', '']);
      if (!answerBlock.rows.length) {
        tableRow(['–', 'Belum ada pengamatan', '', '', '', '', '']);
      } else {
        answerBlock.rows.forEach(function (row, index) {
          tableRow([
            String(index + 1),
            row.control || '',
            row.variable || '',
            row.power || '',
            row.led || '',
            row.time || '',
            ''
          ]);
        });
      }
      y -= 14;
    }

    /* ---------- isi dokumen ---------- */

    fresh();
    draw(payload.title || 'LKPD', 42, y, 22, green);
    y -= 28;
    draw('LABORATORIUM ENERGI TERBARUKAN', 42, y, 9, muted);
    y -= 34;

    heading('01 / IDENTITAS KELOMPOK', 'Identitas peserta didik');

    var cards = [
      { label: 'Kelas', value: payload.kelas },
      { label: 'Kelompok', value: payload.kelompok },
      { label: 'Tanggal percobaan', value: payload.tanggal },
      { label: 'Percobaan dikumpulkan', value: payload.assignmentLabel }
    ];
    room(96);
    var cardHeight = 62;
    cards.forEach(function (card, index) {
      var column = index % 2;
      var row = Math.floor(index / 2);
      var x = 42 + column * 260;
      var top = y - row * (cardHeight + 12);
      page.drawRectangle({
        x: x,
        y: top - cardHeight,
        width: 248,
        height: cardHeight,
        color: cream,
        borderColor: line,
        borderWidth: 0.6
      });
      draw(card.label, x + 12, top - 18, 7.5, muted);
      draw(card.value || 'Belum diisi', x + 12, top - 36, 10, ink);
    });
    y -= 2 * (cardHeight + 12) + 12;

    answer('Nama anggota kelompok', payload.anggota);

    heading('02 / HIPOTESIS', 'Dugaan awal');
    paragraph(payload.hipotesis);

    heading('03 / HASIL PENGAMATAN', 'Data percobaan');
    (payload.answers || []).forEach(function (block) {
      observation(block);
      answer(block.analysisLabel, block.analysis);
    });

    heading('04 / KESIMPULAN', 'Kesimpulan');
    paragraph(payload.kesimpulan);

    var pages = doc.getPages();
    pages.forEach(function (item, index) {
      item.drawLine({ start: { x: 42, y: 45 }, end: { x: 553, y: 45 }, color: line, thickness: 0.7 });
      item.drawText(clean(options.draft ? 'DRAF - isian belum lengkap' : (payload.brand || 'PLTB') + ' - LKPD digital'), {
        x: 42,
        y: 29,
        size: 8,
        font: font,
        color: muted
      });
      item.drawText(clean((index + 1) + ' / ' + pages.length), {
        x: 515,
        y: 29,
        size: 8,
        font: font,
        color: muted
      });
    });

    doc.setTitle('LKPD ' + (payload.title || '') + ' - ' + (payload.kelompok || 'Draf'));
    doc.setAuthor((payload.brand || 'PLTB') + ' - Laboratorium Energi Terbarukan');
    return doc.save();
  }

  return Object.freeze({ build: build });
});
