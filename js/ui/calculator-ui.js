/**
 * calculator-ui.js — halaman Kalkulator: form, perhitungan, hasil.
 */

import { buildAssessment } from '../calculator/assessment.js';
import { BOUNDARIES, categoryColor, categoryBadgeClass, categoryLabel } from '../calculator/body-fat-classifier.js';
import { getState, setAssessment } from '../state.js';
import { validateCalculatorForm, showFieldError, clearFieldErrors } from '../validation.js';
import { icon } from './icons.js';
import { toast } from './modal.js';
import { fmtNum, fmtKcal, escapeHtml } from '../format.js';

const BF_MIN = 0;
const BF_MAX = 60;
const BMI_MIN = 12;
const BMI_MAX = 45;

const BMI_SEGMENTS = [
  { to: 18.5, label: 'Kurang', color: '#3b82f6' },
  { to: 25, label: 'Normal', color: '#14b8a6' },
  { to: 30, label: 'Berlebih', color: '#f59e0b' },
  { to: 45, label: 'Obesitas', color: '#dc2626' },
];

const FIELD_IDS = ['gender', 'age', 'weight', 'height', 'neck', 'waist', 'targetWeight'];

export function initCalculator() {
  const form = document.getElementById('calculator-form');
  if (!form) return;

  initGenderSeg();

  const st = getState();
  if (st.assessment) {
    prefillForm(st.assessment);
    renderResult(st.assessment);
  }

  form.addEventListener('submit', onSubmit);
}

/* ---------------- Form helpers ---------------- */

function initGenderSeg() {
  const seg = document.getElementById('gender-seg');
  if (!seg) return;
  ensureGenderDefault(seg);
  seg.addEventListener('click', (e) => {
    const btn = e.target.closest('.seg-option');
    if (!btn) return;
    const gender = btn.dataset.value;
    setGenderPressed(seg, gender);
    toggleNeck(gender === 'male');
  });
}

function ensureGenderDefault(seg) {
  const active = [...seg.querySelectorAll('.seg-option')].some((b) => b.getAttribute('aria-pressed') === 'true');
  if (!active) {
    setGenderPressed(seg, 'male');
    toggleNeck(true);
  }
}

function setGenderPressed(seg, gender) {
  seg.querySelectorAll('.seg-option').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === gender)));
}

function readGender(seg) {
  const active = seg ? seg.querySelector('.seg-option[aria-pressed="true"]') : null;
  return (active && active.dataset.value) || null;
}

function toggleNeck(show) {
  const neckGroup = document.getElementById('neck')?.closest('.input-group');
  if (!neckGroup) return;
  neckGroup.hidden = !show;
}

function prefillForm(a) {
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value ?? '';
  };
  set('age', a.age);
  set('weight', a.weight);
  set('height', a.height);
  set('neck', a.neck);
  set('waist', a.waist);
  set('targetWeight', a.targetWeightManual ? a.targetWeight : '');

  const seg = document.getElementById('gender-seg');
  if (seg) {
    seg.querySelectorAll('.seg-option').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.value === a.gender));
    });
  }
  toggleNeck(a.gender === 'male');
}

/* ---------------- Submit / calculate ---------------- */

function onSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const fd = new FormData(form);
  const values = {
    gender: readGender(document.getElementById('gender-seg')) || fd.get('gender') || 'male',
    age: fd.get('age'),
    weight: fd.get('weight'),
    height: fd.get('height'),
    neck: fd.get('neck'),
    waist: fd.get('waist'),
    targetWeight: fd.get('targetWeight'),
  };

  clearFieldErrors(form, FIELD_IDS);
  const { ok, errors, values: clean } = validateCalculatorForm(values);

  if (!ok) {
    for (const [field, message] of Object.entries(errors)) {
      const input = document.getElementById(field);
      if (input) showFieldError(input, message);
    }
    toast('Periksa kembali isian yang ditandai.', 'danger');
    document.getElementById('result-empty')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  setLoading(true);

  // Biarkan state "Menghitung…" terlihat sebentar lalu komputasi.
  setTimeout(() => {
    try {
      const assessment = buildAssessment({ ...clean, activityLevel: 'moderate' });
      setAssessment(assessment);
      renderResult(assessment);
    } catch (err) {
      toast(err.message || 'Terjadi kesalahan saat menghitung.', 'danger');
    } finally {
      setLoading(false);
    }
  }, 120);
}

function setLoading(loading) {
  const btn = document.getElementById('btn-calculate');
  if (!btn) return;
  const defaultEl = btn.querySelector('.btn-default');
  const loadingEl = btn.querySelector('.btn-loading');
  if (defaultEl) defaultEl.hidden = loading;
  if (loadingEl) loadingEl.hidden = !loading;
  btn.disabled = loading;
}

/* ---------------- Result rendering ---------------- */

function renderResult(assessment) {
  const empty = document.getElementById('result-empty');
  const content = document.getElementById('result-content');
  const panel = document.getElementById('result-panel');
  if (!content) return;
  if (empty) empty.hidden = true;

  content.hidden = false;
  content.innerHTML = `
    ${assessmentCard(assessment)}
    ${warningsHtml(assessment.warnings)}`;

  panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* -------- Assessment card -------- */

function assessmentCard(a) {
  const markerPct = clamp(((a.bodyFat - BF_MIN) / (BF_MAX - BF_MIN)) * 100, 0, 100);
  const bmiPct = clamp(((a.bmi - BMI_MIN) / (BMI_MAX - BMI_MIN)) * 100, 0, 100);

  const segments = BOUNDARIES
    .map((s) => {
      const width = ((Math.min(s.max, BF_MAX) - Math.max(s.min, BF_MIN)) / (BF_MAX - BF_MIN)) * 100;
      return `<span class="spectrum-segment" style="width:${width.toFixed(2)}%;background:${categoryColor(s.category)}"></span>`;
    })
    .join('');

  const bmiBar = BMI_SEGMENTS
    .map((s, i) => {
      const prev = i === 0 ? BMI_MIN : BMI_SEGMENTS[i - 1].to;
      const width = ((s.to - prev) / (BMI_MAX - BMI_MIN)) * 100;
      return `<span class="spectrum-segment" style="width:${width.toFixed(2)}%;background:${s.color}"></span>`;
    })
    .join('');

  return `
    <section class="card animate-fade-up" aria-label="Hasil komposisi tubuh">
      <div class="big-summary">
        <div>
          <p class="bf-eyebrow">Persentase Lemak Tubuh</p>
          <div class="big-bf-number">${fmtNum(a.bodyFat)}<small>%</small></div>
          <div class="badge-row">
            <span class="badge ${categoryBadgeClass(a.category)}" data-icon="body-fat">${escapeHtml(a.categoryLabel)}</span>
            <span class="badge badge-info">BMI ${fmtNum(a.bmi, 1)} · ${escapeHtml(a.bmiLabel)}</span>
            <span class="badge badge-neutral">Massa lemak ${fmtNum(a.fatMass, 1)} kg</span>
            <span class="badge badge-neutral">Massa tanpa lemak ${fmtNum(a.leanMass, 1)} kg</span>
          </div>
        </div>
        <div class="target-panel">
          <div class="tp-label">Target</div>
          <div class="tp-value">${a.targetWeight != null ? `${fmtNum(a.targetWeight, 1)} kg` : '—'}</div>
          <div class="tp-note">Body fat target ${a.targetBodyFat != null ? `${a.targetBodyFat}%` : 'Pertahankan'} · ${escapeHtml(a.timeline)}</div>
        </div>
      </div>

      <div class="spectrum">
        <div class="spectrum-bar">
          ${segments}
          <span class="spectrum-marker" style="left:${markerPct.toFixed(2)}%" aria-hidden="true"></span>
        </div>
        <div class="spectrum-scale">
          <span>${BF_MIN}%</span>${[6, 14, 18, 25].map((t) => `<span>${t}%</span>`).join('')}<span>${BF_MAX}%</span>
        </div>
        <ul class="spectrum-legend" role="list">
          ${BOUNDARIES.map((s) => `<li><span class="dot" style="background:${categoryColor(s.category)}"></span>&lt;${s.max}% ${escapeHtml(categoryLabel(s.category))}</li>`).join('')}
        </ul>
      </div>

      <hr class="divider">

      <div class="metric-grid">
        ${metricCard('Tinggi', `${fmtNum(a.height, 1)} cm`, 'ruler')}
        ${metricCard('BMR', `${fmtKcal(a.bmr)} kkal`, 'flame')}
        ${metricCard('Kebutuhan Harian (TDEE)', `${fmtKcal(a.tdee)} kkal`, 'zap')}
        ${metricCard('Target Berat', a.targetWeight != null ? `${fmtNum(a.targetWeight, 1)} kg` : '—', 'target')}
      </div>

      <hr class="divider">

      <div class="bmi-spotlight">
        <div>
          <p class="bf-eyebrow">Indeks Massa Tubuh</p>
          <div class="bmi-number">${fmtNum(a.bmi, 1)} <small>kg/m²</small></div>
        </div>
        <div class="bmi-scale">
          <div class="bmi-bar">${bmiBar}<span class="bmi-marker" style="left:${bmiPct.toFixed(2)}%"></span></div>
          <div class="bmi-ticks">
            ${BMI_SEGMENTS.map((s) => `<span>${s.to}</span>`).join('')}
          </div>
          <p style="color:var(--color-text-muted);font-size:13px;margin-top:10px">${a.bmiDescription}</p>
        </div>
      </div>
    </section>`;
}

function metricCard(label, value, ic) {
  return `
    <div class="metric-card">
      <div class="metric-label"><span class="card-icon">${icon(ic, { size: 16 })}</span>${label}</div>
      <div class="metric-value">${value}</div>
    </div>`;
}

/* -------- Warnings -------- */

function warningsHtml(warnings) {
  if (!warnings || warnings.length === 0) return '';
  return warnings
    .map(
      (w) => `
      <div class="card warning-card" role="note">
        <div class="alert ${w.severity === 'danger' ? 'alert-danger' : 'alert-warning'}" style="border:none;margin:0;box-shadow:none">
          <span class="alert-icon">${icon(w.severity === 'danger' ? 'alert-triangle' : 'info', { size: 18 })}</span>
          <div class="alert-body"><strong>${escapeHtml(w.title)}</strong> ${escapeHtml(w.message)}</div>
        </div>
      </div>`,
    )
    .join('');
}



/* ---------------- helpers ---------------- */

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}