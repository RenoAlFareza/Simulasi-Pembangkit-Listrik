// Halaman utama: dialog panduan singkat untuk tiga simulasi.
(function () {
  'use strict';

  var dialog = document.querySelector('#info-dialog');
  var title = document.querySelector('#dialog-title');
  var content = document.querySelector('#dialog-content');
  var kicker = document.querySelector('#dialog-kicker');
  if (!dialog || !title || !content || !kicker) return;

  var opener = null;

  function showDialog(heading, html, label, source) {
    opener = source || null;
    title.textContent = heading;
    content.innerHTML = html;
    kicker.textContent = label;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  var guide = document.querySelector('#guide-open');
  if (guide) {
    guide.addEventListener('click', function () {
      showDialog(
        'Belajar lewat percobaan.',
        '<ol>' +
          '<li><strong>Pilih sumber energi.</strong> Tenaga Air (PLTA), Tenaga Angin (PLTB), atau Tenaga Surya (PLTS).</li>' +
          '<li><strong>Atur dan amati.</strong> Ubah satu variabel, jalankan percobaan, lalu bandingkan hasilnya.</li>' +
          '<li><strong>Catat di LKPD.</strong> Isi LKPD digital, unduh PDF, dan gunakan sebagai bukti belajar.</li>' +
        '</ol>' +
          '<p>Gunakan mode <em>stabil</em> atau <em>LKPD</em> saat membandingkan hasil agar hanya satu variabel yang berubah.</p>',
        'PANDUAN SINGKAT',
        guide
      );
    });
  }

  function close() {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    if (opener && typeof opener.focus === 'function') opener.focus();
  }

  dialog.querySelectorAll('.dialog-close, .dialog-done').forEach(function (button) {
    button.addEventListener('click', close);
  });

  dialog.addEventListener('click', function (event) {
    if (event.target !== dialog) return;
    var rect = dialog.getBoundingClientRect();
    var inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!inside) close();
  });
})();
