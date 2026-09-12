/**
 * shell.js — header, footer, navigasi, mobile menu, reset, ekspor/impor.
 */

import { icon } from './icons.js';
import { openModal, confirmDialog, toast } from './modal.js';
import { download, parseImportFile, applyImport } from '../export-import.js';
import { resetState, storageCorrupt } from '../state.js';
import { isPersistent } from '../storage.js';

const PAGES = [
  { page: 'calculator', label: 'Kalkulator', icon: 'calculator', href: 'index.html' },
  { page: 'plan', label: 'Rencana', icon: 'target', href: 'plan.html' },
  { page: 'progress', label: 'Progres', icon: 'activity', href: 'progress.html' },
  { page: 'checkin', label: 'Check-in', icon: 'calendar', href: 'check-in.html' },
];

const CURRENT_PAGE = document.body.dataset.page || 'calculator';

export function initShell() {
  renderHeader();
  renderFooter();
  menuToggle();

  document.getElementById('btn-export')?.addEventListener('click', onExport);
  document.getElementById('btn-import')?.addEventListener('click', onImport);
  document.getElementById('btn-reset')?.addEventListener('click', onReset);

  if (storageCorrupt) {
    warnCorrupt();
  } else if (!isPersistent()) {
    toast('Penyimpanan lokal tidak tersedia di browser ini. Data hanya berlaku untuk sesi ini.', 'danger');
  }
}

/* ---------------- Render ---------------- */

function navLinks(containerClass) {
  return PAGES.map(
    (p) => `
    <a class="nav-link ${p.page === CURRENT_PAGE ? 'active' : ''}" href="${p.href}"
       ${p.page === CURRENT_PAGE ? 'aria-current="page"' : ''}>
      <span class="nav-icon">${icon(p.icon, { size: 17 })}</span>${p.label}
    </a>`,
  ).join('');
}

function renderHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;
  header.className = 'app-header';
  header.innerHTML = `
    <div class="container">
      <div class="header-inner">
        <a class="brand" href="index.html" aria-label="Dinas Kesehatan Provinsi Kalimantan Timur — beranda BodyFit">
          <span class="brand-logo">
            <img src="assets/images/kaltim-logo.svg" alt="" width="44" height="54">
          </span>
          <span class="brand-name">Dinas Kesehatan<small>Provinsi Kalimantan Timur</small></span>
        </a>
        <nav class="nav-desktop" aria-label="Navigasi utama">${navLinks()}</nav>
        <button class="menu-toggle" id="menu-toggle" aria-label="Buka menu navigasi" aria-expanded="false" aria-controls="mobile-menu">
          ${icon('menu', { size: 20 })}
        </button>
      </div>
    </div>
    <div class="mobile-menu" id="mobile-menu">
      ${navLinks()}
      <div class="mobile-menu-footer">
        <div class="footer-data-actions" style="gap:18px">
          <button type="button" id="m-export">${icon('download', { size: 15 })} Ekspor</button>
          <button type="button" id="m-import">${icon('upload', { size: 15 })} Impor</button>
          <button type="button" id="m-reset">${icon('refresh-cw', { size: 15 })} Reset</button>
        </div>
        <span class="small-text">Semua data tersimpan lokal di perangkat Anda.</span>
      </div>
    </div>`;
}

function renderFooter() {
  const footer = document.getElementById('site-footer');
  if (!footer) return;
  footer.className = 'app-footer';
  footer.innerHTML = `
    <div class="container footer-inner">
      <div class="footer-meta">
        <span>© 2026 BodyFit</span>
        <span>Data diproses sepenuhnya di browser Anda — tanpa server.</span>
      </div>
      <div class="footer-data-actions" aria-label="Kelola data">
        <button id="btn-export">${icon('download', { size: 15 })} Ekspor</button>
        <button id="btn-import">${icon('upload', { size: 15 })} Impor</button>
        <button id="btn-reset">${icon('refresh-cw', { size: 15 })} Reset</button>
      </div>
    </div>`;
}

/* ---------------- Mobile menu ---------------- */

function menuToggle() {
  const button = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!button || !menu) return;

  button.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    button.setAttribute('aria-expanded', String(open));
    button.innerHTML = icon(open ? 'x' : 'menu', { size: 20 });
  });

  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      menu.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
      button.innerHTML = icon('menu', { size: 20 });
    }
  });

  document.getElementById('m-export')?.addEventListener('click', () => {
    menu.classList.remove('open');
    onExport();
  });
  document.getElementById('m-import')?.addEventListener('click', () => {
    menu.classList.remove('open');
    onImport();
  });
  document.getElementById('m-reset')?.addEventListener('click', () => {
    menu.classList.remove('open');
    onReset();
  });
}

/* ---------------- Data actions ---------------- */

function onExport() {
  try {
    download();
    toast('File backup berhasil diunduh.');
  } catch {
    toast('Gagal membuat file backup.', 'danger');
  }
}

async function onImport() {
  const state = await importFlow();
  if (state === 'done') {
    toast('Data berhasil diimpor. Halaman dimuat ulang…', 'success');
    setTimeout(() => window.location.reload(), 700);
  }
}

function onReset() {
  confirmReset().then((yes) => {
    if (!yes) return;
    resetState();
    toast('Semua data telah dihapus.', 'success');
    setTimeout(() => (window.location.href = './'), 500);
  });
}

function confirmReset() {
  return confirmDialog({
    title: 'Reset semua data?',
    body: `
      <p>Tindakan ini akan <strong>menghapus seluruh data</strong>: hasil kalkulasi, rencana, riwayat check-in, dan status latihan dari browser Anda.</p>
      <p>Tindakan ini tidak dapat dibatalkan. Pertimbangkan untuk <strong>mengekspor backup</strong> terlebih dahulu.</p>
    `,
    confirmText: 'Hapus semua data',
    danger: true,
  });
}

/* ---------------- Import flow ---------------- */

function importFlow() {
  return new Promise((resolve) => {
    let data = null;
    const fileInputId = 'import-file-input';

    const body = `
      <p>Pilih file backup yang sebelumnya diekspor dari BodyFit.</p>
      <label class="file-drop" id="file-drop" for="${fileInputId}">
        <div class="fd-icon">${icon('upload', { size: 26 })}</div>
        <strong>Klik untuk memilih file</strong><br>
        atau seret ke sini
      </label>
      <input type="file" id="${fileInputId}" accept="application/json,.json" hidden>
      <div id="import-status"></div>`;

    const modal = openModal({
      title: 'Impor data backup',
      body,
      footer: `
        <button type="button" class="btn btn-ghost" data-modal-cancel>Batal</button>
        <button type="button" class="btn btn-primary" id="import-confirm" hidden>Impor data</button>
      `,
      onClose: () => resolve('cancel'),
    });

    const dialog = document.querySelector('#modal-root .modal');
    const status = dialog.querySelector('#import-status');
    const confirmBtn = dialog.querySelector('#import-confirm');
    const drop = dialog.querySelector('#file-drop');
    const input = dialog.querySelector(`#${fileInputId}`);

    const handleFile = (file) => {
      if (!file) return;
      parseImportFile(file).then((res) => {
        if (!res.ok) {
          status.innerHTML = `<div class="alert alert-danger" style="margin-top:14px"><span class="alert-icon">${icon('alert-triangle', { size: 18 })}</span><div class="alert-body"><strong>Gagal impor</strong> ${res.error}</div></div>`;
          confirmBtn.hidden = true;
          data = null;
          drop.classList.add('dragover');
          return;
        }
        drop.classList.remove('dragover');
        data = res.data;
        confirmBtn.hidden = false;
        status.innerHTML = previewHtml(res.preview);
      });
    };

    input.addEventListener('change', () => {
      handleFile(input.files[0]);
    });
    input.addEventListener('click', (e) => e.stopPropagation());

    drop.addEventListener('click', () => input.click());
    ['dragover', 'dragenter'].forEach((ev) =>
      drop.addEventListener(ev, (e) => {
        e.preventDefault();
        drop.classList.add('dragover');
      }),
    );
    ['dragleave', 'drop'].forEach((ev) =>
      drop.addEventListener(ev, (e) => {
        e.preventDefault();
        drop.classList.remove('dragover');
      }),
    );
    drop.addEventListener('drop', (e) => handleFile(e.dataTransfer.files[0]));

    confirmBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!data) return;
      const result = applyImport(data);
      if (!result.ok) {
        status.innerHTML = `<div class="alert alert-danger" style="margin-top:14px"><span class="alert-icon">${icon('alert-triangle', { size: 18 })}</span><div class="alert-body"><strong>Gagal menyimpan</strong> ${result.error}</div></div>`;
        return;
      }
      modal.close();
      resolve('done');
    });

    dialog.addEventListener('click', (e) => {
      if (e.target.closest('[data-modal-cancel]')) modal.close();
    });
  });
}

function previewHtml(p) {
  const rows = [
    ['Data assessment', p.hasAssessment ? 'Tersedia' : 'Kosong'],
    ['Jenis kelamin', p.gender ?? '—'],
    ['Body fat', p.bodyFat != null ? `${p.bodyFat}%` : '—'],
    ['Target berat', p.targetWeight != null ? `${p.targetWeight} kg` : '—'],
    ['Rencana aktif', p.hasPlan ? `Ya (Minggu ${p.currentWeek})` : 'Tidak'],
    ['Jumlah check-in', String(p.checkinCount)],
    ['Check-in terakhir', p.lastCheckin ?? '—'],
    ['Berat terakhir', p.lastWeight != null ? `${p.lastWeight} kg` : '—'],
    ['Titik data grafik', String(p.progressCount)],
  ];
  return `
    <div class="import-preview" style="margin-top:14px">
      <table>
        <tbody>
          ${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
    <p style="margin-top:10px">Data saat ini akan <strong>diganti</strong> dengan isi backup ini. Lanjutkan?</p>`;
}

function warnCorrupt() {
  confirmDialog({
    title: 'Data tersimpan korup',
    body: `
      <p>BodyFit mendeteksi data tersimpan di browser Anda tidak dapat dibaca.</p>
      <p>Kami mengabaikannya dan mulai dari awal. Anda tidak kehilangan data server — semuanya lokal.</p>`,
    confirmText: 'Mulai dari awal',
  }).then((yes) => {
    if (yes) {
      resetState();
      toast('Tersimpan baru dibuat.', 'success');
    }
  });
}
