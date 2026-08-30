/**
 * calculator-ui.js — halaman Kalkulator: form, perhitungan, hasil, rekomendasi.
 */

import { buildAssessment } from '../calculator/assessment.js';
import { buildRecommendation } from '../recommendation/engine.js';
import { BOUNDARIES, categoryColor, categoryBadgeClass, categoryLabel } from '../calculator/body-fat-classifier.js';
import { dayShort, typeLabel, isToday } from '../recommendation/workout.js';
import {
  getState, setAssessment, setRecommendation, createPlanFromRecommendation, savePlan, hasPlan,
} from '../state.js';
import { validateCalculatorForm, showFieldError, clearFieldErrors } from '../validation.js';
import { icon } from './icons.js';
import { confirmDialog, toast } from './modal.js';
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

const FIELD_IDS = ['gender', 'age', 'weight', 'height', 'neck', 'waist', 'targetWeight', 'activityLevel'];

export function initCalculator() {
  const form = document.getElementById('calculator-form');
  if (!form) return;

  initGenderSeg();

  const st = getState();
  if (st.assessment) {
    prefillForm(st.assessment);
    if (st.recommendation) {
      renderResult(st.assessment, st.recommendation, { saved: !!st.plan });
    }
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
  set('activityLevel', a.activityLevel);

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
    activityLevel: fd.get('activityLevel'),
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
      const assessment = buildAssessment(clean);
      const recommendation = buildRecommendation(assessment);
      setAssessment(assessment);
      setRecommendation(recommendation);
      renderResult(assessment, recommendation, { saved: hasPlan() });
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

function renderResult(assessment, recommendation, opts = {}) {
  const empty = document.getElementById('result-empty');
  const content = document.getElementById('result-content');
  const panel = document.getElementById('result-panel');
  if (!content) return;
  if (empty) empty.hidden = true;

  content.hidden = false;
  content.innerHTML = `
    ${assessmentCard(assessment)}
    ${warningsHtml(assessment.warnings)}
    ${recommendationCard(assessment, recommendation)}
    ${actionRow(assessment, opts.saved)}
    <div class="result-meta">
      ${assessment.formula} · Kategori ${escapeHtml(assessment.categoryLabel)}. Kalkulasi v${escapeHtml(assessment.calculationVersion)}.
    </div>`;

  content.querySelectorAll('.js-action-save').forEach((btn) => {
    btn.addEventListener('click', () => onSavePlan(assessment, recommendation, opts.saved));
  });

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

/* -------- Recommendation card -------- */

function recommendationCard(a, r) {
  const focusPills = [
    `Target ${r.targetBodyFatDisplay}`,
    a.timeline,
    r.workoutFocus,
    r.progressFocus,
  ].filter(Boolean);

  const proteinPct = pct(r.proteinTarget * 4, r.calorieTarget);
  const carbPct = pct(r.carbTarget * 4, r.calorieTarget);
  const fatPct = pct(r.fatTarget * 9, r.calorieTarget);

  return `
    <section class="card animate-fade-up" aria-label="Rekomendasi personal">
      <div class="rec-hero">
        <span class="rec-icon">${icon('lightbulb', { size: 22 })}</span>
        <div style="flex:1;min-width:220px">
          <h3>${escapeHtml(r.primaryFocus)}</h3>
          <div class="rec-focus-line">
            ${focusPills.map((p) => `<span class="chip">${escapeHtml(p)}</span>`).join('')}
          </div>
        </div>
      </div>

      ${r.why ? `<p style="color:var(--color-text-muted);font-size:14px;margin-top:12px">${escapeHtml(r.why)}</p>` : ''}

      <hr class="divider">
      <div class="strategy-line">${escapeHtml(r.calorieStrategy)}</div>

      <div class="nutrition-tiles">
        ${tile('Kalori target', `${fmtKcal(r.calorieTarget)} <small>kkal</small>`, 'zap')}
        ${tile('Protein', `${fmtNum(r.proteinTarget, 1)} <small>g</small>`, 'utensils')}
        ${tile('Karbohidrat', `${fmtNum(r.carbTarget, 1)} <small>g</small>`, 'utensils')}
        ${tile('Lemak', `${fmtNum(r.fatTarget, 1)} <small>g</small>`, 'utensils')}
      </div>

      <div class="macro-row">
        <div class="macro-label"><span>Protein</span><span class="macro-value">${fmtNum(r.proteinTarget, 1)} g · ${Math.round(proteinPct)}%</span></div>
        <div class="macro-bar"><div class="macro-fill" style="width:${proteinPct}%;background:var(--color-primary)"></div></div>
      </div>
      <div class="macro-row">
        <div class="macro-label"><span>Karbohidrat</span><span class="macro-value">${fmtNum(r.carbTarget, 1)} g · ${Math.round(carbPct)}%</span></div>
        <div class="macro-bar"><div class="macro-fill" style="width:${carbPct}%;background:var(--color-info)"></div></div>
      </div>
      <div class="macro-row">
        <div class="macro-label"><span>Lemak</span><span class="macro-value">${fmtNum(r.fatTarget, 1)} g · ${Math.round(fatPct)}%</span></div>
        <div class="macro-bar"><div class="macro-fill" style="width:${fatPct}%;background:var(--color-warning)"></div></div>
      </div>

      ${r.what && r.how ? `
        <div class="alert alert-info" style="margin-top:18px">
          <span class="alert-icon">${icon('lightbulb', { size: 18 })}</span>
          <div class="alert-body"><strong>${escapeHtml(r.what)}</strong> ${escapeHtml(r.how)}</div>
        </div>` : ''}

      ${mealPlanHtml(r.mealPlan)}
      ${weekStripHtml(r.weeklySchedule, r.workoutFocus)}

      ${r.safetyFlag ? `
        <div class="alert alert-warning" style="margin-top:16px">
          <span class="alert-icon">${icon('alert-triangle', { size: 18 })}</span>
          <div class="alert-body"><strong>Perhatian</strong> Body fat Anda berada di batas rendah. Rekomendasi difokuskan pada pemeliharaan, bukan pengurangan.</div>
        </div>` : ''}
    </section>`;
}

function tile(label, valueHtml, ic) {
  return `
    <div class="nutrition-tile">
      <div class="nt-label">${icon(ic, { size: 14 })} ${label}</div>
      <div class="nt-value">${valueHtml}</div>
    </div>`;
}

function mealPlanHtml(meals) {
  if (!meals || meals.length === 0) return '';
  return `
    <hr class="divider">
    <h3 style="margin-bottom:14px">Contoh Menu Harian</h3>
    <div class="meals-stack">
      ${meals
        .map(
          (m) => `
        <div class="meal-card">
          <div class="meal-header">
            <div>
              <div class="meal-name">${escapeHtml(m.meal)}</div>
              <div class="meal-macro">P ${fmtNum(m.protein, 1)} g · KH ${fmtNum(m.carbs, 1)} g · L ${fmtNum(m.fat, 1)} g</div>
            </div>
            <div class="meal-kcal">${fmtKcal(m.calories)} kkal</div>
          </div>
          <div class="meal-foods">
            ${m.foods
              .map(
                (f) => `<div class="meal-food"><span>${escapeHtml(f.name)} <small style="color:var(--color-text-faint)">(${escapeHtml(f.serving)})</small></span><span>${fmtKcal(f.calories)} kkal</span></div>`,
              )
              .join('')}
          </div>
        </div>`,
        )
        .join('')}
    </div>`;
}

function weekStripHtml(days, workoutFocus) {
  if (!days || days.length === 0) return '';
  const typeIcon = {
    strength: 'dumbbell',
    cardio: 'activity',
    recovery: 'heart',
    light: 'zap',
    rest: 'moon',
  };
  const typeClass = { strength: 'wd-strength', cardio: 'wd-cardio', recovery: 'wd-recovery', light: 'wd-light', rest: 'wd-rest' };
  return `
    <hr class="divider">
    <h3 style="margin-bottom:6px">Jadwal Latihan Ini</h3>
    <p style="color:var(--color-text-muted);font-size:13px;margin-bottom:14px">${escapeHtml(workoutFocus || '')}</p>
    <div class="week-strip" role="list" aria-label="Jadwal latihan mingguan">
      ${days
        .map((d) => {
          const today = isToday(d.day_of_week);
          const cls = typeClass[d.type] ?? 'wd-rest';
          return `
          <div class="week-day ${cls} ${today ? 'is-today' : ''}" role="listitem">
            <div class="wd-label">${today ? 'Hari ini' : dayShort(d.day_of_week)}</div>
            <div class="wd-type">${icon(typeIcon[d.type] || 'check', { size: 18 })}</div>
            <div class="wd-title">${escapeHtml(d.title)}</div>
          </div>`;
        })
        .join('')}
    </div>`;
}

/* -------- Save plan / actions -------- */

function actionRow(a, saved) {
  const primary = saved
    ? 'Perbarui Rencana dengan hasil ini'
    : 'Simpan sebagai Rencana';
  const sub = saved
    ? 'Hasil baru akan menggantikan rencana aktif. Riwayat check-in lama tetap tersimpan.'
    : 'Simpan hasil kalkulasi, target nutrisi, menu, dan jadwal latihan sebagai rencana Anda.';
  return `
    <section class="card animate-fade-up" aria-label="Simpan rencana" style="background:#f6f8fa">
      <h3 style="margin-bottom:6px">Rencana ${saved ? 'diperbarui' : 'dibuat'} dari hasil ini</h3>
      <p style="color:var(--color-text-muted);font-size:13.5px;margin-bottom:16px">${sub}</p>
      <div class="result-actions">
        <button type="button" class="btn btn-primary js-action-save">
          ${icon('check', { size: 18 })} ${primary}
        </button>
        ${saved ? `<a class="btn btn-secondary" href="plan.html">${icon('target', { size: 18 })} Lihat Rencana</a>` : ''}
      </div>
      ${saved ? `<p class="form-summary" style="margin-top:14px">Ubah data lalu tekan Hitung untuk mengubah rekomendasi, kemudian simpan untuk memperbarui rencana.</p>` : ''}
    </section>`;
}

function onSavePlan(assessment, recommendation, wasSaved) {
  if (wasSaved) {
    confirmDialog({
      title: 'Perbarui rencana aktif?',
      body: `
        <p>Hasil terbaru akan menggantikan rencana aktif Anda (target, kalori, menu, dan jadwal latihan).</p>
        <p><strong>Riwayat check-in lama akan dipertahankan</strong> dan rencana dimulai kembali dari <strong>Minggu 1</strong>.</p>`,
      confirmText: 'Perbarui Rencana',
    }).then((yes) => {
      if (yes) savePlanFrom(assessment, recommendation, true);
    });
    return;
  }
  savePlanFrom(assessment, recommendation, false);
}

function savePlanFrom(assessment, recommendation, isUpdate) {
  const { plan, baselineLog } = createPlanFromRecommendation(assessment, recommendation);
  savePlan(plan, baselineLog);
  toast(isUpdate ? 'Rencana diperbarui. Dimulai dari Minggu 1.' : 'Rencana berhasil disimpan.', 'success');
  // refresh action state
  const content = document.getElementById('result-content');
  if (content) {
    content.querySelector('.js-action-save')?.closest('section')?.replaceWith(htmlFragment(actionRow(assessment, true)));
    content.querySelector('.js-action-save')?.addEventListener('click', () => onSavePlan(assessment, recommendation, true));
  }
}

/* ---------------- helpers ---------------- */

function pct(part, total) {
  return total > 0 ? (part / total) * 100 : 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function htmlFragment(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}