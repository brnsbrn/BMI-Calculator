/*
 * runtime-notice.js - fallback ringan, tanpa ES Module.
 * Saat bootstrap ES Modules gagal, tampilkan informasi penyelesaian yang sesuai
 * tanpa menutupi header/logo dan tanpa mengklaim semua error berasal dari file://.
 */
(function () {
  'use strict';

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function show() {
    if (document.querySelector('.runtime-notice-wrap')) return;
    var isFile = location.protocol === 'file:';
    var wrapper = el('div', 'runtime-notice-wrap');
    var container = el('div', 'container');
    var notice = el('section', 'runtime-notice');
    notice.setAttribute('role', 'alert');
    notice.setAttribute('aria-label', 'Informasi pemuatan aplikasi');

    var icon = el('span', 'runtime-notice-icon', '!');
    icon.setAttribute('aria-hidden', 'true');
    var body = el('div', 'runtime-notice-body');
    body.appendChild(el('strong', '', isFile ? 'Aplikasi belum berjalan penuh.' : 'Sebagian skrip aplikasi gagal dimuat.'));
    body.appendChild(el('p', '', isFile
      ? 'BodyFit dibuka langsung lewat file://, sehingga modul JavaScript, header, dan navigasi tidak aktif. Jalankan server lokal, lalu buka alamat localhost.'
      : 'Periksa tab Console dan Network di browser untuk memastikan seluruh berkas JavaScript dapat diakses tanpa error.'));

    if (isFile) {
      var steps = el('div', 'runtime-steps');
      steps.appendChild(el('span', '', 'Di terminal folder proyek:'));
      steps.appendChild(el('code', '', 'python -m http.server 8000'));
      steps.appendChild(el('span', '', 'Kemudian buka:'));
      var link = el('a', '', 'http://localhost:8000');
      link.href = 'http://localhost:8000';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      steps.appendChild(link);
      body.appendChild(steps);
    } else {
      body.appendChild(el('span', 'runtime-tip', 'Jika memakai hosting, periksa path skrip, status 404, MIME type, dan error di Console.'));
    }

    var close = el('button', 'runtime-notice-close', 'x');
    close.type = 'button';
    close.setAttribute('aria-label', 'Tutup notifikasi');
    close.addEventListener('click', function () {
      wrapper.remove();
    });

    notice.append(icon, body, close);
    container.appendChild(notice);
    wrapper.appendChild(container);
    var header = document.getElementById('site-header');
    if (header) header.insertAdjacentElement('afterend', wrapper);
    else document.body.insertAdjacentElement('afterbegin', wrapper);
  }

  window.BodyFitRuntime = { show: show };

  window.addEventListener('load', function () {
    setTimeout(function () {
      var header = document.getElementById('site-header');
      if (header && !header.innerHTML.trim()) show();
    }, 850);
  });
})();
