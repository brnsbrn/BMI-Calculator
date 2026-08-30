/**
 * progress-ui.js — halaman Progres: ringkasan, grafik, riwayat check-in.
 */

import { getPlan, getProgress, getState } from '../state.js';
import { renderProgressChart } from '../charts/progress-chart.js';
import { icon } from './icons.js';
import { fmtNum, fmtChange, fmtDateLong } from '../format.js';

export function initProgress() {
  const root = document.getElementById('progress-page');
  if (!root) return;

  const logs = getProgress();
  if (!getPlan() && logs.length === 0) {
    root.innerHTML = emptyState();
    return;
  }

  root.innerHTML = renderPage(logs);
  drawCharts(root, logs);
}

function emptyState() {
  return `
    <section class="card empty-state">
      <div class="empty-icon" data-icon="activity" aria-hidden="true"></div>
      <h2>Belum ada progres</h2>
      <p>Buat rencana lalu lakukan check-in mingguan. Grafik berat, body fat, dan lingkar pinggang Anda akan tampil di sini.</p>
      <a class="btn btn-primary" href="index.html">${icon('calculator', { size: 18 })} Mulai</a>
    </section>`;
}

/* ---------------- Page ---------------- */

function renderPage(logs) {
  const last = logs[logs.length - 1];
  const baseline = logs.find((l) => l.source === 'assessment') ?? logs[0];

  const weightChange = last && baseline ? last.weight - baseline.weight : null;
  const waistLogs = logs.filter((l) => l.waist != null);
  const bfLogs = logs.filter((l) => l.bodyFat != null);

  return `
    <div class="page-header">
      <h1>Progres</h1>
      <p class="subtitle">Pantau perkembangan Anda sejak baseline hingga check-in terakhir.</p>
    </div>

    <div class="summary-cards">
      ${summaryCard('Berat terakhir', last ? `${fmtNum(last.weight, 1)} kg` : '—', 'scale', 'tone-primary')}
      ${summaryCard(
        'Perubahan berat',
        weightChange == null ? '—' : `${fmtChange(weightChange, 1)} kg`,
        weightChange < 0 ? 'trending-down' : weightChange > 0 ? 'trending-up' : 'minus',
        weightChange < 0 ? 'tone-success' : weightChange > 0 ? 'tone-danger' : '',
      )}
      ${summaryCard('Body fat terakhir', bfLogs.length ? `${fmtNum(bfLogs[bfLogs.length - 1].bodyFat, 1)}%` : '—', 'body-fat', 'tone-info')}
      ${summaryCard('Pinggang terakhir', waistLogs.length ? `${fmtNum(waistLogs[waistLogs.length - 1].waist, 1)} cm` : '—', 'ruler', 'tone-warning')}
    </div>

    <div class="chart-grid" style="margin-top:22px">
      ${chartCard('Berat Badan', 'kg', 'Berat badan', '#0b7b6c', 'scale', logs)}
      ${chartCard('Body Fat', '%', 'Body fat', '#3b82f6', 'body-fat', bfLogs)}
      ${chartCard('Lingkar Pinggang', 'cm', 'Lingkar pinggang', '#f59e0b', 'ruler', waistLogs)}
      ${statCard(logs)}
    </div>

    <section class="card" aria-label="Riwayat check-in" style="margin-top:22px">
      <div class="card-header">
        <h2 class="card-title"><span class="card-icon">${icon('calendar', { size: 17 })}</span>Riwayat Check-in</h2>
        <a class="link-btn" href="check-in.html">Check-in sekarang →</a>
      </div>
      <div class="history-list">${historyRows(getState().checkins)}</div>
    </section>`;
}

function summaryCard(label, value, ic, tone) {
  return `
    <div class="metric-card ${tone || ''}">
      <span class="metric-label"><span class="card-icon">${icon(ic, { size: 16 })}</span>${label}</span>
      <span class="metric-value">${value}</span>
    </div>`;
}

function chartCard(title, unit, valueLabel, color, ic, points) {
  return `
    <section class="card chart-card">
      <div class="card-header">
        <h2 class="card-title"><span class="card-icon">${icon(ic, { size: 17 })}</span>${title}</h2>
        <div class="chart-legend">
          <span class="legend-dot" style="background:${color}"></span>
          <span style="font-size:12.5px;color:var(--color-text-muted)">${valueLabel} (${unit})</span>
        </div>
      </div>
      <div class="chart-box" data-chart data-color="${color}" data-unit="${unit}" data-label="${valueLabel}"><p class="chart-empty-note">Menyiapkan grafik…</p></div>
    </section>`;
}

function statCard(logs) {
  const checkins = getState().checkins;
  return `
    <section class="card" aria-label="Ringkasan">
      <div class="card-header">
        <h2 class="card-title"><span class="card-icon">${icon('info', { size: 17 })}</span>Ringkasan</h2>
      </div>
      <div class="nutrition-rows">
        ${statRow('Total check-in', String(checkins.length), 'calendar')}
        ${statRow('Minggu berjalan', logs.find((l) => l.week > 0) ? String(getState().plan?.currentWeek ?? 1) : '—', 'target')}
        ${statRow('Titik data grafik', `${(logs[0] ? 1 : 0)} + ${checkins.length}`, 'activity')}
      </div>
      <p class="form-summary" style="margin-top:14px">Grafik dimulai dari baseline pengukuran awal dan bertambah setiap kali Anda melakukan check-in.</p>
    </section>`;
}

function statRow(label, value, ic) {
  return `
    <div class="nutrition-row">
      <span class="n-icon">${icon(ic, { size: 18 })}</span>
      <span class="n-label">${label}</span>
      <span class="n-value">${value}</span>
    </div>`;
}

function historyRows(checkins) {
  if (!checkins.length) {
    return `<p class="chart-empty-note">Belum ada check-in. Lakukan check-in mingguan untuk mulai merekam progres.</p>`;
  }
  return [...checkins]
    .reverse()
    .map((c) => {
      const stats = [
        ['Berat', `${fmtNum(c.weight, 1)} kg`, changeClass(c.weightChange)],
        ['Pinggang', c.waist != null ? `${fmtNum(c.waist, 1)} cm` : '—', c.waistChange != null ? changeClass(c.waistChange) : ''],
        ['Body fat', c.bodyFat != null ? `${fmtNum(c.bodyFat, 1)}%` : '—', ''],
        ['Energi', `${c.energy}/5`, ''],
      ];
      return `
        <div class="checkin-card">
          <div class="checkin-top">
            <div class="checkin-week">${icon('calendar', { size: 16 })} Minggu ${c.week}</div>
            <div class="checkin-date">${fmtDateLong(c.date)}</div>
          </div>
          <div class="checkin-stats">
            ${stats
              .map(
                ([label, value, cls]) => `
              <div class="checkin-stat">
                <div class="stat-label">${label}</div>
                <div class="stat-value ${cls}">${value}</div>
              </div>`,
              )
              .join('')}
          </div>
          ${c.workoutsCompleted != null
            ? `<p class="notes-hint" style="margin-top:10px">Latihan ${c.workoutsCompleted}/${c.workoutsScheduled} · Kesulitan ${c.difficulty}/5</p>`
            : ''}
          ${c.feedback ? `<p class="checkin-feedback">“${escapeAttr(c.feedback)}”</p>` : ''}
        </div>`;
    })
    .join('');
}

function changeClass(value) {
  if (value == null) return '';
  if (value < 0) return 'down';
  if (value > 0) return 'up';
  return '';
}

function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------------- Charts ---------------- */

function drawCharts(root, logs) {
  root.querySelectorAll('[data-chart]').forEach((box) => {
    const label = (box.dataset.label || '').toLowerCase();
    const points = logs
      .map((l) => ({
        date: l.date,
        value: label.includes('berat') ? l.weight : label.includes('body fat') ? l.bodyFat : l.waist,
      }))
      .filter((p) => p.value != null);

    if (points.length >= 2) {
      renderProgressChart(box, {
        points,
        color: box.dataset.color,
        unit: box.dataset.unit,
        valueLabel: box.dataset.label,
      });
    } else {
      box.innerHTML = `<p class="chart-empty-note">${belumCukup(points.length, box.dataset.label)}</p>`;
    }
  });
}

function belumCukup(count, label) {
  if (count === 0) return `Belum ada data ${label.toLowerCase()}.`;
  return `Perlu data kedua (mis. hasil check-in) untuk menampilkan grafik ${label.toLowerCase()}.`;
}