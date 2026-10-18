/** Calculator form and results. */
import { buildAssessment } from '../calculator/assessment.js?v=calculator-only-14';
import { spectrumPosition } from './spectrum.js';
import { getState, setAssessment } from '../state.js?v=calculator-only-14';
import { validateCalculatorForm, showFieldError, clearFieldErrors } from '../validation.js?v=calculator-only-14';
import { icon } from './icons.js';
import { toast } from './modal.js';
import { fmtNum, fmtKcal, escapeHtml } from '../format.js';

const FIELD_IDS = ['age', 'weight', 'height', 'waist', 'hip', 'targetWeight'];
const BMI_RANGES = [
  { min: 12, max: 18.5, color: '#3b82f6' },
  { min: 18.5, max: 25, color: '#14b8a6' },
  { min: 25, max: 30, color: '#f59e0b' },
  { min: 30, max: 45, color: '#dc2626' },
];

export function initCalculator() {
  const form = document.getElementById('calculator-form');
  if (!form) return;
  restoreCalculator(form);
  window.addEventListener('bodyfit:calculator-change', () => restoreCalculator(form));
  document.getElementById('gender-seg')?.addEventListener('click', (event) => {
    const button = event.target.closest('.seg-option');
    if (!button) return;
    setGenderPressed(button.dataset.value);
    clearGenderError();
    clearResult();
  });
  form.addEventListener('input', () => {
    clearFieldErrors(form, FIELD_IDS);
    clearResult();
  });
  form.addEventListener('submit', onSubmit);
}

function restoreCalculator(form) {
  form.reset();
  FIELD_IDS.forEach((id) => { form.elements[id].value = ''; });
  setGenderPressed(null);
  clearFieldErrors(form, FIELD_IDS);
  clearGenderError();
  clearResult();
  // Restore validated calculator data, including data from an imported backup.
  const saved = getState().assessment;
  if (saved) {
    FIELD_IDS.forEach((id) => {
      form.elements[id].value = id === 'targetWeight'
        ? (saved.targetWeightManual ? saved.targetWeight : '')
        : (saved[id] ?? '');
    });
    setGenderPressed(saved.gender);
    renderResult(saved);
  }
}

function setGenderPressed(gender) {
  document.querySelectorAll('#gender-seg .seg-option').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.value === gender));
  });
}

function clearResult() {
  const empty = document.getElementById('result-empty');
  const content = document.getElementById('result-content');
  if (empty) empty.hidden = false;
  if (content) { content.hidden = true; content.innerHTML = ''; }
}

function onSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const values = Object.fromEntries(FIELD_IDS.map((id) => [id, data.get(id)]));
  values.gender = document.querySelector('#gender-seg .seg-option[aria-pressed="true"]')?.dataset.value;
  clearFieldErrors(form, FIELD_IDS);
  clearGenderError();
  clearResult();
  const result = validateCalculatorForm(values);
  if (!result.ok) {
    for (const [field, message] of Object.entries(result.errors)) {
      if (field === 'gender') showGenderError(message);
      else showFieldError(form.elements[field], message);
    }
    toast('Periksa kembali isian yang ditandai.', 'danger');
    (result.errors.gender ? document.querySelector('#gender-seg button') : form.querySelector('[aria-invalid="true"]'))?.focus();
    return;
  }
  try {
    const assessment = buildAssessment(result.values);
    setAssessment(assessment);
    renderResult(assessment);
    document.getElementById('result-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    if (error.field) {
      showFieldError(form.elements[error.field], error.message);
      form.elements[error.field]?.focus();
    }
    toast(error.message || 'Terjadi kesalahan saat menghitung.', 'danger');
  }
}

function showGenderError(message) {
  const seg = document.getElementById('gender-seg');
  seg?.classList.add('invalid');
  seg?.setAttribute('aria-invalid', 'true');
  seg?.setAttribute('aria-describedby', 'gender-error');
  const error = document.getElementById('gender-error');
  if (error) { error.textContent = message; error.hidden = false; error.setAttribute('role', 'alert'); }
}

function clearGenderError() {
  const seg = document.getElementById('gender-seg');
  seg?.classList.remove('invalid');
  seg?.removeAttribute('aria-invalid');
  seg?.removeAttribute('aria-describedby');
  const error = document.getElementById('gender-error');
  if (error) error.hidden = true;
}

function renderResult(a) {
  const empty = document.getElementById('result-empty');
  const content = document.getElementById('result-content');
  if (!content) return;
  if (empty) empty.hidden = true;
  const marker = spectrumPosition(a.bmi, BMI_RANGES);
  const difference = a.weightDiff === 0 ? 'Pertahankan berat saat ini'
    : `${a.weightDiff > 0 ? 'Selisih turun' : 'Selisih naik'} ${fmtNum(Math.abs(a.weightDiff), 1)} kg`;
  content.hidden = false;
  content.innerHTML = `
    <section class="card result-card animate-fade-up" aria-label="Hasil kalkulator BMI">
      <div class="big-summary">
        <div>
          <h2 class="bf-eyebrow">Indeks Massa Tubuh (BMI)</h2>
          <div class="bmi-number bmi-primary" data-result="bmi">${fmtNum(a.bmi, 2)} <small>kg/m²</small></div>
          <div class="badge-row"><span class="badge badge-${a.bmiTone}" data-result="category">${escapeHtml(a.bmiLabel)}</span></div>
        </div>
        <div class="target-panel">
          <div class="tp-label">Target Berat ${a.targetWeightManual ? 'Pilihan Anda' : 'Otomatis'}</div>
          <div class="tp-value" data-result="target">${fmtNum(a.targetWeight, 1)} kg</div>
          <div class="tp-note">${difference}</div>
          <div class="tp-note">BMI pada target: ${fmtNum(a.targetBmi, 2)}</div>
        </div>
      </div>
      <div class="bmi-spotlight">
        <div class="bmi-scale">
          <div class="bmi-bar">
            ${BMI_RANGES.map((range) => `<span class="spectrum-segment" style="width:25%;background:${range.color}"></span>`).join('')}
            <span class="bmi-marker" style="left:${marker.toFixed(2)}%" aria-hidden="true"></span>
          </div>
          <div class="bmi-ticks">
            <span>&lt; 18,5<br>Kurang</span><span>18,5 – &lt; 25<br>Normal</span>
            <span>25 – &lt; 30<br>Berlebih</span><span>≥ 30<br>Obesitas</span>
          </div>
          <p class="result-note">Kategori berdasarkan nilai BMI sebelum pembulatan.</p>
        </div>
      </div>
      <p class="result-note">${escapeHtml(a.bmiDescription)}</p>
      <p class="result-note"><strong>Rentang berat untuk BMI normal:</strong> ${fmtNum(a.healthyWeight.min, 1)}–${fmtNum(a.healthyWeight.max, 1)} kg pada tinggi ${fmtNum(a.height, 1)} cm. Target otomatis menggunakan batas terdekat, atau berat saat ini jika sudah normal.</p>
      <div class="metric-grid">
        ${metricCard('Estimasi Lemak Tubuh', a.bodyFat == null ? 'Tidak tersedia' : `${fmtNum(a.bodyFat, 1)}%`, 'percent', 'body-fat')}
        ${metricCard('BMR (Energi Istirahat)', `${fmtKcal(a.bmr)} kkal/hari`, 'flame')}
        ${metricCard('Tinggi Badan', `${fmtNum(a.height, 1)} cm`, 'ruler')}
        ${metricCard('Lingkar Pinggang', a.waist == null ? 'Belum diisi' : `${fmtNum(a.waist, 1)} cm`, 'ruler')}
        ${metricCard('Lingkar Panggul', a.hip == null ? 'Belum diisi' : `${fmtNum(a.hip, 1)} cm`, 'ruler')}
        ${metricCard('Rasio Pinggang / Panggul', a.waistHipRatio == null ? 'Belum tersedia' : fmtNum(a.waistHipRatio, 2), 'activity', 'waist-hip-ratio')}
      </div>
      <p class="result-note">${icon('info', { size: 14 })} BMI = ${fmtNum(a.weight, 1)} kg ÷ (${fmtNum(a.height / 100, 3)} m)². Jenis kelamin, umur, data lingkar, dan target berat tidak mengubah BMI.</p>
      <p class="result-note">Estimasi lemak tubuh: ${escapeHtml(a.formula)}. BMR menggunakan Mifflin–St Jeor dan bukan kebutuhan kalori harian. Rasio pinggang-panggul tersedia jika kedua lingkar diisi. Hasil ini bukan diagnosis medis.</p>
      ${a.warnings.map((warning) => `<div class="alert result-warning alert-warning" role="note"><span class="alert-icon">${icon('info', { size: 18 })}</span><div class="alert-body">${escapeHtml(warning.message)}</div></div>`).join('')}
    </section>`;
}

function metricCard(label, value, name, result = '') {
  return `<div class="metric-card"><div class="metric-label"><span class="card-icon">${icon(name, { size: 16 })}</span>${label}</div><div class="metric-value"${result ? ` data-result="${result}"` : ''}>${value}</div></div>`;
}
