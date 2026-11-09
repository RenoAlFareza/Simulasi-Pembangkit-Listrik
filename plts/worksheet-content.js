/* Catatan model yang dipakai pada dialog rumus PLTS. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PLTSContent = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var MODEL_NOTE = 'Angka pada simulasi ini adalah model pembelajaran, bukan hasil pengukuran lapangan. ' +
    'Nilai efisiensi, suhu, dan faktor cuaca dibuat tetap agar hubungan antarbesaran mudah dibandingkan. ' +
    'Pada instalasi nyata, keluaran panel dipengaruhi awan, debu, orientasi atap, bayangan, dan mutu inverter.';

  return Object.freeze({ MODEL_NOTE: MODEL_NOTE });
});
