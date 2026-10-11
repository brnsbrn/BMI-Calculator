/**
 * calculator-ui.js — halaman Kalkulator: form, perhitungan, hasil.
 */

import { buildAssessment } from '../calculator/assessment.js';
import { BOUNDARIES, categoryColor, categoryBadgeClass, categoryLabel } from '../calculator/body-fat-classifier.js';
import { buildRecommendation } from '../recommendation/engine.js';
import {
  setAssessment,
  setRecommendation,
  createPlanFromRecommendation,
  savePlan,
} from '../state.js';
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

  resetCalculatorView(form);
  initGenderSeg();

  form.addEventListener('submit', onSubmit);
}

/* ---------------- Form helpers ---------------- */

function initGenderSeg() {
  const seg = document.getElementById('gender-seg');
  if (!seg) return;
  seg.addEventListener('click', (e) => {
    const btn = e.target.closest('.seg-option');
    if (!btn) return;
    const gender = btn.dataset.value;
    setGenderPressed(seg, gender);
    clearGenderError();
  });
}

function setGenderPressed(seg, gender) {
  seg.querySelectorAll('.seg-option').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === gender)));
}

function readGender(seg) {
  const active = seg ? seg.querySelector('.seg-option[aria-pressed="true"]') : null;
  return (active && active.dataset.value) || null;
}

function resetCalculatorView(form) {
  form.reset();
  form.querySelectorAll('input').forEach((input) => {
    input.value = '';
    input.defaultValue = '';
    input.removeAttribute('value');
    input.removeAttribute('aria-invalid');
    input.classList.remove('invalid');
  });
  document.querySelectorAll('#gender-seg .seg-option').forEach((button) => {
    button.setAttribute('aria-pressed', 'false');
  });
  clearGenderError();
  clearFieldErrors(form, FIELD_IDS);

  const empty = document.getElementById('result-empty');
  const content = document.getElementById('result-content');
  if (empty) empty.hidden = false;
  if (content) {
    content.hidden = true;
    content.innerHTML = '';
  }
}

/* ---------------- Submit / calculate ---------------- */

function onSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const fd = new FormData(form);
  const values = {
    gender: readGender(document.getElementById('gender-seg')) || fd.get('gender') || null,
    age: fd.get('age'),
    weight: fd.get('weight'),
    height: fd.get('height'),
    neck: fd.get('neck'),
    waist: fd.get('waist'),
    targetWeight: fd.get('targetWeight'),
    activityLevel: fd.get('activityLevel') || 'moderate',
  };

  clearFieldErrors(form, FIELD_IDS);
  clearGenderError();
  const { ok, errors, values: clean } = validateCalculatorForm(values);

  if (!ok) {
    for (const [field, message] of Object.entries(errors)) {
      if (field === 'gender') {
        showGenderError(message);
        continue;
      }
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
      const assessment = buildAssessment({ ...clean, activityLevel: clean.activityLevel || 'moderate' });
      const recommendation = buildRecommendation(assessment);
      setAssessment(assessment);
      setRecommendation(recommendation);
      const { plan, baselineLog } = createPlanFromRecommendation(assessment, recommendation);
      savePlan(plan, baselineLog);
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

function showGenderError(message) {
  const seg = document.getElementById('gender-seg');
  const errorEl = document.getElementById('gender-error');
  if (seg) {
    seg.classList.add('invalid');
    seg.setAttribute('aria-invalid', 'true');
  }
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.hidden = false;
    errorEl.setAttribute('role', 'alert');
  }
}

function clearGenderError() {
  const seg = document.getElementById('gender-seg');
  const errorEl = document.getElementById('gender-error');
  seg?.classList.remove('invalid');
  seg?.removeAttribute('aria-invalid');
  if (errorEl) errorEl.hidden = true;
}

/* ---------------- Result rendering ---------------- */

function renderResult(assessment) {
  const empty = document.getElementById('result-empty');
  const content = document.getElementById('result-content');
  const panel = document.getElementById('result-panel');
  if (!content) return;
  if (empty) empty.hidden = true;

  content.hidden = false;
  content.innerHTML = assessmentCard(assessment);

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
    <section class="card result-card animate-fade-up" aria-label="Hasil komposisi tubuh">
      <div class="big-summary">
        <div>
          <p class="bf-eyebrow">Persentase Lemak Tubuh</p>
          <div class="big-bf-number">${fmtNum(a.bodyFat)}<small>%</small></div>
          <div class="badge-row">
            <span class="badge ${categoryBadgeClass(a.category)}">${icon('body-fat', { size: 14 })}${escapeHtml(a.categoryLabel)}</span>
            <span class="badge badge-info">BMI ${fmtNum(a.bmi, 1)} · ${escapeHtml(a.bmiLabel)}</span>
            <span class="badge badge-neutral">Massa lemak ${fmtNum(a.fatMass, 1)} kg</span>
          </div>
        </div>
        <div class="target-panel">
          <div class="tp-label">Target</div>
          <div class="tp-value">${a.targetWeight != null ? `${fmtNum(a.targetWeight, 1)} kg` : '—'}</div>
          <div class="tp-note">Berat ideal Anda ± 2,2 kg</div>
        </div>
      </div>

      <div class="spectrum">
        <div class="spectrum-bar">
          ${segments}
          <span class="spectrum-marker" style="left:${markerPct.toFixed(2)}%" aria-hidden="true"></span>
        </div>
        <ul class="spectrum-legend" role="list">
          ${BOUNDARIES.map((s) => `<li><strong>${s.min === 0 ? '<' : `${s.min}–`}${s.max}%</strong><span>${escapeHtml(categoryLabel(s.category))}</span></li>`).join('')}
        </ul>
      </div>

      <div class="metric-grid">
        ${metricCard('Tinggi', `${fmtNum(a.height, 1)} cm`, 'ruler')}
        ${metricCard('BMI', `${fmtNum(a.bmi, 1)} kg/m²`, 'flame')}
        ${metricCard('Kebutuhan Kalori (TDEE)', `${fmtKcal(a.tdee)} kkal`, 'zap')}
        ${metricCard('Berat Badan Ideal', a.targetWeight != null ? `${fmtNum(a.targetWeight, 1)} kg` : '—', 'scale')}
      </div>

      <div class="bmi-spotlight">
        <div>
          <p class="bf-eyebrow">Indeks Massa Tubuh</p>
          <div class="bmi-number">${fmtNum(a.bmi, 1)} <small>kg/m²</small></div>
        </div>
        <div class="bmi-scale">
          <div class="bmi-bar">${bmiBar}<span class="bmi-marker" style="left:${bmiPct.toFixed(2)}%"></span></div>
          <div class="bmi-ticks">
            <span>&lt; 18,5<br>Kurus</span>
            <span>18,5 – 22,9<br>Normal</span>
            <span>23 – 24,9<br>Overweight</span>
            <span>25 – 29,9<br>Obesitas I</span>
            <span>≥ 30<br>Obesitas II</span>
          </div>
          <p class="result-note">${icon('info', { size: 14 })} Hasil ini adalah estimasi dan dapat bervariasi tergantung metode pengukuran yang digunakan.</p>
        </div>
      </div>
      ${warningsHtml(a.warnings)}
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
        <div class="alert result-warning ${w.severity === 'danger' ? 'alert-danger' : 'alert-warning'}" role="note">
          <span class="alert-icon">${icon(w.severity === 'danger' ? 'alert-triangle' : 'info', { size: 18 })}</span>
          <div class="alert-body"><strong>${escapeHtml(w.title)}</strong> ${escapeHtml(w.message)}</div>
        </div>
      `,
    )
    .join('');
}



/* ---------------- helpers ---------------- */

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
