/**
 * progress-chart.js — grafik garis SVG native tanpa dependensi.
 * Mendukung tooltip hover, grid, label sumbu, dan fallback aksesibilitas.
 */

import { shortDateLabel, fmtNum } from '../format.js';

const W = 640;
const H = 280;
const PAD = { left: 52, right: 18, top: 18, bottom: 30 };

/**
 * @param {HTMLElement} container elemen .chart-box berisi svg + tooltip
 * @param {object} opts
 *   { points: Array<{date:string, value:number|null}>,
 *     color: string, unit: string, valueLabel: string }
 * @returns {{counts:number, ok:boolean}}
 */
export function renderProgressChart(container, opts) {
  if (!container) return { ok: false };

  const points = (opts.points || []).filter((p) => p.value !== null && p.value !== undefined);

  if (points.length === 0) {
    container.innerHTML = `<p class="chart-empty-note">Belum ada data ${opts.valueLabel.toLowerCase()}.</p>`;
    return { ok: false, count: 0 };
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padMin = Math.max(0, min - range * 0.15);
  const padMax = max + range * 0.15;

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const x = (i) => PAD.left + (points.length === 1 ? chartW / 2 : (i / (points.length - 1)) * chartW);
  const y = (v) => PAD.top + (1 - (v - padMin) / (padMax - padMin)) * chartH;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)},${y(p.value).toFixed(2)}`).join(' ');
  const areaPath = `${linePath} L${x(points.length - 1).toFixed(2)},${y(padMin).toFixed(2)} L${x(0).toFixed(2)},${y(padMin).toFixed(2)} Z`;

  const gridLines = 4;
  let gridMarkup = '';
  let axisMarkup = '';
  for (let g = 0; g <= gridLines; g++) {
    const yy = PAD.top + (g / gridLines) * chartH;
    const value = padMax - (padMin + (g / gridLines) * (padMax - padMin));
    gridMarkup += `<line class="grid-line" x1="${PAD.left}" x2="${W - PAD.right}" y1="${yy.toFixed(2)}" y2="${yy.toFixed(2)}"></line>`;
    axisMarkup += `<text class="axis-text" x="${PAD.left - 8}" y="${(yy + 4).toFixed(2)}" text-anchor="end">${fmtNum(value, 1)}</text>`;
  }

  const xLabels = xTickLabels(points);
  const xTicks = xLabels
    .map((t) => `<text class="axis-text" x="${t[0].toFixed(2)}" y="${H - 8}" text-anchor="middle">${t[1]}</text>`)
    .join('');

  const dots = points
    .map((p, i) => {
      const cx = x(i);
      const cy = y(p.value);
      return `
        <circle class="pt" data-i="${i}" cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="4" fill="#fff" stroke="${opts.color}" stroke-width="2.5" style="cursor:pointer"></circle>
        <circle class="pt-hit" data-i="${i}" cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="14" fill="transparent" style="cursor:pointer"></circle>`;
    })
    .join('');

  container.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafik ${opts.valueLabel}">
      ${gridMarkup}
      ${axisMarkup}
      <path d="${areaPath}" fill="${opts.color}" opacity="0.08"></path>
      <path d="${linePath}" fill="none" stroke="${opts.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"></path>
      ${dots}
      ${xTicks}
    </svg>
    <div class="sr-only">
      ${opts.valueLabel}: ${points.map((p) => `${shortDateLabel(p.date)} ${p.value} ${opts.unit}`).join('; ')}.
    </div>`;

  bindTooltips(container, points, opts);
  return { ok: true, count: points.length };
}

function xTickLabels(points) {
  if (points.length <= 6) {
    return points.map((p, i) => [xOf(i, points), shortDateLabel(p.date)]);
  }
  const idxs = new Set([0, Math.floor((points.length - 1) / 3), Math.floor((2 * (points.length - 1)) / 3), points.length - 1]);
  return [...idxs].map((i) => [xOf(i, points), shortDateLabel(points[i].date)]);
}

function xOf(i, points) {
  const chartW = W - PAD.left - PAD.right;
  return PAD.left + (points.length === 1 ? chartW / 2 : (i / (points.length - 1)) * chartW);
}

function bindTooltips(container, points, opts) {
  const box = container.closest('.chart-box') || container;
  const tooltip = document.getElementById('chart-tooltip');
  if (!tooltip) return;

  const boxRect = () => box.getBoundingClientRect();
  const pointsEl = [...box.querySelectorAll('.pt-hit')];

  pointsEl.forEach((el) => {
    const i = Number(el.dataset.i);
    const show = (e) => {
      const p = points[i];
      tooltip.textContent = `${shortDateLabel(p.date)} · ${fmtNum(p.value, 1)} ${opts.unit}`;
      tooltip.classList.add('show');
      const rect = boxRect();
      let left = e.clientX - rect.left;
      let top = e.clientY - rect.top - 12;
      const tw = tooltip.offsetWidth;
      const th = tooltip.offsetHeight;
      if (left + tw > rect.width) left = rect.width - tw - 6;
      if (top < 0) top = 4;
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      const dot = box.querySelector(`.pt[data-i="${i}"]`);
      if (dot) dot.setAttribute('r', '6');
    };
    const hide = () => {
      tooltip.classList.remove('show');
      const dot = box.querySelector(`.pt[data-i="${i}"]`);
      if (dot) dot.setAttribute('r', '4');
    };
    el.addEventListener('pointerenter', show);
    el.addEventListener('pointermove', show);
    el.addEventListener('pointerleave', hide);
  });
}