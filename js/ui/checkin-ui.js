/**
 * checkin-ui.js — halaman Check-in Mingguan.
 * Mencatat pengukuran + feedback; mencegah duplikat per minggu; memajukan minggu.
 */

import {
  getPlan, getState, getCurrentWeek, getProgress, hasCheckinForWeek,
  completedCount, addCheckin, incrementWeek, computeChange,
} from '../state.js';
import { validateCheckinForm, showFieldError, clearFieldErrors } from '../validation.js';
import { icon } from './icons.js';
import { toast } from './modal.js';
import { fmtNum, fmtChange, fmtDateLong, todayISO } from '../format.js';

const ENERGY_LABELS = ['', 'Sangat rendah', 'Rendah', 'Netral', 'Tinggi', 'Sangat tinggi'];
const DIFFICULTY_LABELS = ['', 'Sangat mudah', 'Mudah', 'Sedang', 'Sulit', 'Sangat sulit'];

const FIELD_IDS = ['weight', 'waist', 'bodyFat', 'workoutsCompleted', 'energy', 'difficulty', 'feedback'];

export function initCheckin() {
  const root = document.getElementById('checkin-page');
  if (!root) return;

  const plan = getPlan();
  if (!plan) {
    root.innerHTML = emptyState();
    return;
  }

  const week = getCurrentWeek();
  if (hasCheckinForWeek(week)) {
    root.innerHTML = alreadyDoneCard(plan, week);
    return;
  }

  root.innerHTML = renderForm(plan, week);
  bindSliders(root);
  bindCounter(root);
  bindSubmit(root);
}

/* ---------------- States ---------------- */

function emptyState() {
  return `
    <section class="card empty-state">
      <div class="empty-icon" data-icon="calendar" aria-hidden="true"></div>
      <h2>Belum ada rencana</h2>
      <p>Simpan hasil kalkulasi sebagai rencana terlebih dahulu agar bisa melakukan check-in mingguan.</p>
      <a class="btn btn-primary" href="index.html">${icon('calculator', { size: 18 })} Buat Rencana</a>
    </section>`;
}

function alreadyDoneCard(plan, week) {
  const last = getState().checkins[getState().checkins.length - 1];
  return `
    <div class="page-header">
      <h1>Check-in Mingguan</h1>
      <p class="subtitle">Check-in untuk <strong>Minggu ${week}</strong> sudah tercatat. Anda dapat melihat progres di halaman Progres.</p>
    </div>
    <section class="card success-card">
      <div class="success-icon">${icon('check', { size: 24 })}</div>
      <div>
        <h2>Check-in ${fmtDateLong(last?.date ?? '')} tersimpan</h2>
        <p>
          Berat <strong>${fmtNum(last?.weight, 1)} kg</strong>
          ${last?.waist != null ? `· Pinggang <strong>${fmtNum(last?.waist, 1)} cm</strong>` : ''}
          ${last?.bodyFat != null ? `· Body fat <strong>${fmtNum(last?.bodyFat, 1)}%</strong>` : ''}
        </p>
        <div class="result-actions" style="margin:0">
          <a class="btn btn-primary" href="progress.html">${icon('activity', { size: 18 })} Lihat Progres</a>
          ${week === plan.currentWeek ? '' : `<a class="btn btn-secondary" href="plan.html">${icon('dumbbell', { size: 18 })} Rencana</a>`}
        </div>
      </div>
    </section>`;
}

/* ---------------- Form ---------------- */

function renderForm(plan, week) {
  const { scheduled, done } = completedCount(plan);
  const last = getProgress()[getProgress().length - 1];

  return `
    <div class="page-header">
      <h1>Check-in Mingguan <span class="badge badge-brand">Minggu ${week}</span></h1>
      <p class="subtitle">Catat pengukuran dan feedback Anda di akhir minggu ini untuk memantau progres.</p>
    </div>

    <div class="checkin-form-wrap">
      <form id="checkin-form" class="card" novalidate>
        ${last ? `
          <div class="alert alert-info" style="margin-bottom:18px">
            <span class="alert-icon">${icon('info', { size: 18 })}</span>
            <div class="alert-body"><strong>Check-in sebelumnya</strong> ${fmtDateLong(last.date)} — berat ${fmtNum(last.weight, 1)} kg${last.waist != null ? `, pinggang ${fmtNum(last.waist, 1)} cm` : ''}. Anda menyelesaikan ${done}/${scheduled} latihan.</div>
          </div>` : ''}

        <fieldset class="checkin-fieldset">
          <legend>Pengukuran</legend>
          <div class="form-row">
            <div class="input-group">
              <label class="input-label" for="weight">Berat Badan <span class="label-hint">kg, 30–300</span> <span class="required-mark" aria-hidden="true">*</span></label>
              <div class="form-control-wrap with-unit">
                <input class="form-control" type="number" id="weight" name="weight" min="30" max="300" step="0.1" inputmode="decimal" placeholder="cth. 67.5">
                <span class="unit-suffix" aria-hidden="true">kg</span>
              </div>
              <p class="field-error" id="weight-error" hidden></p>
            </div>
            <div class="input-group">
              <label class="input-label" for="waist">Lingkar Pinggang <span class="label-hint">cm, opsional</span></label>
              <div class="form-control-wrap with-unit">
                <input class="form-control" type="number" id="waist" name="waist" min="40" max="200" step="0.1" inputmode="decimal" placeholder="cth. 79">
                <span class="unit-suffix" aria-hidden="true">cm</span>
              </div>
              <p class="field-error" id="waist-error" hidden></p>
            </div>
            <div class="input-group">
              <label class="input-label" for="bodyFat">Body Fat <span class="label-hint">%, opsional</span></label>
              <div class="form-control-wrap with-unit">
                <input class="form-control" type="number" id="bodyFat" name="bodyFat" min="1" max="60" step="0.1" inputmode="decimal" placeholder="cth. 18.5">
                <span class="unit-suffix" aria-hidden="true">%</span>
              </div>
              <p class="field-error" id="bodyFat-error" hidden></p>
            </div>
            <div class="input-group">
              <label class="input-label" for="workoutsCompleted">Latihan Selesai <span class="label-hint">dari ${scheduled}</span></label>
              <div class="form-control-wrap">
                <input class="form-control" type="number" id="workoutsCompleted" name="workoutsCompleted" min="0" max="30" step="1" inputmode="numeric" value="${done}">
              </div>
              <p class="field-error" id="workoutsCompleted-error" hidden></p>
            </div>
          </div>
        </fieldset>

        <fieldset class="checkin-fieldset">
          <legend>Feedback</legend>
          ${slider('energy', 'Tingkat Energi', ENERGY_LABELS)}
          ${slider('difficulty', 'Kesulitan Latihan', DIFFICULTY_LABELS)}
          <div class="input-group" style="margin-top:4px">
            <label class="input-label" for="feedback">Catatan <span class="label-hint">opsional</span></label>
            <textarea class="form-control" id="feedback" name="feedback" rows="4" maxlength="1000" placeholder="Bagaimana minggu ini berjalan? Apa yang terasa mudah/sulit?"></textarea>
            <div class="char-counter"><span id="feedback-count">0</span>/1000</div>
            <p class="field-error" id="feedback-error" hidden></p>
          </div>
        </fieldset>

        <div class="checkin-footer">
          <span class="hint">Penting: check-in hanya satu kali per minggu. Data disimpan lokal.</span>
          <button type="submit" class="btn btn-primary btn-lg" style="width:auto;padding:0 26px" id="btn-checkin">
            ${icon('check', { size: 18 })} Simpan Check-in
          </button>
        </div>
      </form>
    </div>`;
}

function slider(id, label, optionLabels) {
  return `
    <div class="input-group">
      <div class="range-wrap">
        <div class="range-row">
          <label class="input-label" for="${id}" style="margin:0">${label}</label>
          <span class="range-value" id="${id}-value" aria-hidden="true">3</span>
        </div>
        <input type="range" id="${id}" name="${id}" min="1" max="5" step="1" value="3">
        <div class="range-labels">
          <span class="left">1 — ${optionLabels[1]}</span>
          <span class="right">${optionLabels[5]} — 5</span>
        </div>
        <div class="slider-label-display" id="${id}-display">${optionLabels[3]}</div>
        <p class="field-error" id="${id}-error" hidden></p>
      </div>
    </div>`;
}

/* ---------------- Bindings ---------------- */

function bindSliders(root) {
  ['energy', 'difficulty'].forEach((id) => {
    const range = root.querySelector(`#${id}`);
    if (!range) return;
    const update = () => {
      const value = Number(range.value);
      range.style.setProperty('--range-progress', `${((value - 1) / 4) * 100}%`);
      const valEl = root.querySelector(`#${id}-value`);
      if (valEl) valEl.textContent = value;
      const displayEl = root.querySelector(`#${id}-display`);
      const labels = id === 'energy' ? ENERGY_LABELS : DIFFICULTY_LABELS;
      if (displayEl) displayEl.textContent = labels[value];
    };
    range.addEventListener('input', update);
    range.addEventListener('change', update);
    update();
  });
}

function bindCounter(root) {
  const textarea = root.querySelector('#feedback');
  const count = root.querySelector('#feedback-count');
  if (!textarea || !count) return;
  const update = () => {
    count.textContent = textarea.value.length;
  };
  textarea.addEventListener('input', update);
}

function bindSubmit(root) {
  const form = root.querySelector('#checkin-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const values = {
      weight: fd.get('weight'),
      waist: fd.get('waist'),
      bodyFat: fd.get('bodyFat'),
      workoutsCompleted: fd.get('workoutsCompleted'),
      energy: fd.get('energy'),
      difficulty: fd.get('difficulty'),
      feedback: fd.get('feedback'),
    };

    clearFieldErrors(form, FIELD_IDS);
    const { ok, errors, values: clean } = validateCheckinForm(values);
    if (!ok) {
      for (const [field, message] of Object.entries(errors)) {
        const input = document.getElementById(field);
        if (input) showFieldError(input, message);
      }
      toast('Periksa kembali isian yang ditandai.', 'danger');
      return;
    }

    const { weightChange, waistChange } = computeChange(clean.weight, clean.waist);
    const week = getCurrentWeek();
    const { scheduled } = completedCount(getPlan());

    addCheckin({
      week,
      date: todayISO(),
      weight: clean.weight,
      waist: clean.waist,
      bodyFat: clean.bodyFat,
      workoutsScheduled: scheduled,
      workoutsCompleted: clean.workoutsCompleted,
      energy: clean.energy,
      difficulty: clean.difficulty,
      feedback: clean.feedback,
      weightChange: weightChange ?? null,
      waistChange: waistChange ?? null,
    });

    incrementWeek();
    toast(`Check-in Minggu ${week} disimpan.`, 'success');
    renderSuccess(root, clean, week, weightChange, waistChange);
  });
}

function renderSuccess(root, values, week, weightChange, waistChange) {
  root.innerHTML = `
    <div class="page-header">
      <h1>Check-in Minggu ${week}</h1>
    </div>
    <section class="card success-card">
      <div class="success-icon">${icon('check', { size: 24 })}</div>
      <div>
        <h2>Check-in tersimpan</h2>
        <p>
          Berat ${fmtNum(values.weight, 1)} kg
          ${weightChange != null ? `<span class="${weightChange > 0 ? '' : ''}">(${fmtChange(weightChange, 1)} kg)</span>` : ''}
          ${values.waist != null ? `· Pinggang ${fmtNum(values.waist, 1)} cm${waistChange != null ? ` (${fmtChange(waistChange, 1)} cm)` : ''}` : ''}
          ${values.bodyFat != null ? `· Body fat ${fmtNum(values.bodyFat, 1)}%` : ''}
        </p>
        <p>Anda kini berada di <strong>Minggu ${getCurrentWeek()}</strong>. Jadwal latihan minggu ini tersedia di Rencana.</p>
        <div class="result-actions" style="margin:0">
          <a class="btn btn-primary" href="plan.html">${icon('dumbbell', { size: 18 })} Buka Rencana</a>
          <a class="btn btn-secondary" href="progress.html">${icon('activity', { size: 18 })} Lihat Progres</a>
        </div>
      </div>
    </section>`;
}