/**
 * format.js — utilitas format angka & tanggal berbahasa Indonesia.
 */

export const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export const MONTHS_ID_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function fmtNum(value, decimals = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const num = Number(value);
  return num.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtInt(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return Number(value).toLocaleString('id-ID');
}

export function fmtKcal(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return Math.round(Number(value)).toLocaleString('id-ID');
}

export function fmtSigned(value, decimals = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const num = Number(value);
  const abs = Math.abs(num).toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  if (num > 0) return `+${abs}`;
  return `−${abs}`;
}

export function fmtChange(value, decimals = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const num = Number(value);
  const abs = Math.abs(num).toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  if (Math.abs(num) < 0.05) return `±${abs}`;
  return num < 0 ? `${abs}` : `+${abs}`;
}

export function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

export function fmtDateLong(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getDate()} ${MONTHS_ID_FULL[d.getMonth()]} ${d.getFullYear()}`;
}

export function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function shortDateLabel(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]}`;
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}