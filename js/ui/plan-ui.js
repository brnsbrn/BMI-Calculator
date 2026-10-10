/**
 * plan-ui.js — halaman Rencana Saya: target, nutrisi, menu, jadwal latihan + toggle.
 */

import {
  getPlan, getState, getCurrentWeek, getWorkoutStatus, toggleWorkout, completedCount,
} from '../state.js';
import { dayLabel, typeLabel, isToday } from '../recommendation/workout.js';
import { icon } from './icons.js';
import { toast } from './modal.js';
import { fmtNum, fmtKcal, escapeHtml } from '../format.js';

export function initPlan() {
  const root = document.getElementById('plan-page');
  if (!root) return;

  const plan = getPlan();
  if (!plan) {
    root.innerHTML = emptyState();
    return;
  }

  root.innerHTML = renderPage(plan);
  bindWorkoutList(root, plan);
}

function emptyState() {
  return `
    <section class="card empty-state">
      <div class="empty-icon" data-icon="target" aria-hidden="true"></div>
      <h2>Belum ada rencana</h2>
      <p>Hitung komposisi tubuh Anda terlebih dahulu, lalu simpan hasilnya sebagai rencana personal.</p>
      <a class="btn btn-primary" href="index.html">${icon('calculator', { size: 18 })} Buat Rencana</a>
    </section>`;
}

function renderPage(plan) {
  const a = getState().assessment;
  const week = getCurrentWeek();
  const { scheduled, done } = completedCount(plan);
  const donePct = scheduled > 0 ? Math.round((done / scheduled) * 100) : 0;

  return `
    <div class="page-header-row">
      <div class="page-header" style="margin-bottom:0">
        <h1>Rencana Saya</h1>
        <p class="subtitle">Target nutrisi, contoh menu, dan jadwal latihan untuk minggu ini. Dicentang otomatis tersimpan di perangkat Anda.</p>
      </div>
      <div class="page-header-actions">
        <a class="btn btn-secondary" href="index.html">${icon('calculator', { size: 17 })} Hitung Ulang</a>
        <a class="btn btn-primary" href="check-in.html">${icon('calendar', { size: 17 })} Check-in Mingguan</a>
      </div>
    </div>

    <div class="plan-hero">
      <div>
        <div class="badge badge-neutral">Minggu ${week}</div>
        <div class="plan-targets">
          <span class="badge badge-brand">Target body fat ${plan.targetBodyFat != null ? `${plan.targetBodyFat}%` : 'Pertahankan'}</span>
          ${plan.targetWeight != null ? `<span class="badge badge-success">Target berat ${fmtNum(plan.targetWeight, 1)} kg</span>` : ''}
          <span class="badge badge-neutral">${escapeHtml(plan.timeline)}</span>
        </div>
      </div>
      <div class="plan-progress">
        <span class="progress-label">Latihan minggu ini</span>
        <div class="progress-bar" style="width:200px"><div class="progress-fill" style="width:${donePct}%;background:var(--color-primary)"></div></div>
        <span class="progress-value">${done}/${scheduled} selesai</span>
      </div>
    </div>

    <div class="dashboard-grid" style="margin-top:22px">
      <div class="section-stack">
        <section class="card" aria-label="Strategi nutrisi">
          <div class="card-header">
            <h2 class="card-title"><span class="card-icon">${icon('zap', { size: 17 })}</span>Strategi Nutrisi</h2>
          </div>
          <p class="strategy-line">${escapeHtml(plan.nutrition.guidance || 'Ikuti pedoman makronutrien di bawah ini.')}</p>
          <div class="nutrition-rows">
            ${nutritionRow('zap', 'Kalori target', `${plan.nutrition.calorieTargetMin}–${plan.nutrition.calorieTargetMax} kkal`) }
            ${nutritionRow('utensils', 'Protein', `${plan.nutrition.proteinTargetMin}–${plan.nutrition.proteinTargetMax} g`)}
            ${nutritionRow('utensils', 'Karbohidrat', `${fmtNum(plan.nutrition.carbTarget, 1)} g`)}
            ${nutritionRow('utensils', 'Lemak', `${fmtNum(plan.nutrition.fatTarget, 1)} g`)}
          </div>
          ${macroBars(plan)}
        </section>

        <section class="card" aria-label="Contoh menu harian">
          <div class="card-header">
            <h2 class="card-title"><span class="card-icon">${icon('utensils', { size: 17 })}</span>Contoh Menu Harian</h2>
            <p class="card-subtitle">Menu fleksibel — sesuaikan proporsi & porsi dengan kebutuhan Anda.</p>
          </div>
          ${mealPlanHtml(plan.mealPlan)}
        </section>
      </div>

      <div class="plan-side">
        <section class="card" aria-label="Jadwal latihan minggu ini">
          <div class="card-header">
            <div>
              <h2 class="card-title"><span class="card-icon">${icon('dumbbell', { size: 17 })}</span>Jadwal Minggu ${week}</h2>
              <p class="card-subtitle">${escapeHtml(plan.workoutFocus || '')}</p>
            </div>
            <div class="badge badge-success">${done}/${scheduled}</div>
          </div>
          <div class="workout-list" id="workout-list">${workoutRows(plan)}</div>
        </section>

        <div class="plan-last-assessment card" aria-label="Data pengukuran terakhir">
          <strong style="font-size:14px">Data pengukuran terakhir</strong>
          ${a ? `
            <div class="pa-row"><span>Body fat</span><span>${fmtNum(a.bodyFat, 1)}%</span></div>
            <div class="pa-row"><span>Berat</span><span>${fmtNum(a.weight, 1)} kg</span></div>
            <div class="pa-row"><span>Lingkar pinggang</span><span>${fmtNum(a.waist, 1)} cm</span></div>
            <div class="pa-row"><span>BMR</span><span>${fmtKcal(a.bmr)} kkal</span></div>
            <div class="pa-row"><span>Kategori</span><span>${escapeHtml(a.categoryLabel)}</span></div>
            <button type="button" class="link-btn" style="margin-top:8px" onclick="location.href='index.html'">Hitung ulang pengukuran →</button>` : `
            <div class="pa-row"><span>Belum ada pengukuran tersimpan.</span></div>`}
        </div>

        <section class="card" style="background:linear-gradient(180deg,#F7FBFA 0%,#F2F7F8 100%)">
          <h2 class="card-title">Check-in nominal</h2>
          <p style="color:var(--color-text-muted);font-size:13.5px">Catat berat, lingkar pinggang, energi, dan tingkat kesulitan latihan setiap akhir minggu untuk memantau progres.</p>
          <a class="btn btn-primary" href="check-in.html" style="margin-top:12px">${icon('calendar', { size: 17 })} Lakukan Check-in</a>
        </section>
      </div>
    </div>`;
}

function nutritionRow(ic, label, value) {
  return `
    <div class="nutrition-row">
      <span class="n-icon">${icon(ic, { size: 18 })}</span>
      <span class="n-label">${label}</span>
      <span class="n-value">${value}</span>
    </div>`;
}

function macroBars(plan) {
  const p = plan.nutrition;
  const calorieTarget = p.calorieTarget || 1;
  const proteinPct = ((p.proteinTarget * 4) / calorieTarget) * 100;
  const carbPct = ((p.carbTarget * 4) / calorieTarget) * 100;
  const fatPct = ((p.fatTarget * 9) / calorieTarget) * 100;
  return `
    <div style="margin-top:16px">
      <div class="macro-row">
        <div class="macro-label"><span>Protein</span><span class="macro-value">${Math.round(proteinPct)}%</span></div>
        <div class="macro-bar"><div class="macro-fill" style="width:${proteinPct}%;background:var(--color-primary)"></div></div>
      </div>
      <div class="macro-row">
        <div class="macro-label"><span>Karbohidrat</span><span class="macro-value">${Math.round(carbPct)}%</span></div>
        <div class="macro-bar"><div class="macro-fill" style="width:${carbPct}%;background:var(--color-info)"></div></div>
      </div>
      <div class="macro-row">
        <div class="macro-label"><span>Lemak</span><span class="macro-value">${Math.round(fatPct)}%</span></div>
        <div class="macro-bar"><div class="macro-fill" style="width:${fatPct}%;background:var(--color-warning)"></div></div>
      </div>
    </div>`;
}

function mealPlanHtml(meals) {
  if (!meals || meals.length === 0) {
    return `<p class="chart-empty-note">Menu belum tersedia — buat rencana dari hasil kalkulasi.</p>`;
  }
  return `
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
              .map((f) => `<div class="meal-food"><span>${escapeHtml(f.name)} <small style="color:var(--color-text-faint)">(${escapeHtml(f.serving)})</small></span><span>${fmtKcal(f.calories)} kkal</span></div>`)
              .join('')}
          </div>
        </div>`,
        )
        .join('')}
    </div>`;
}

function workoutRows(plan) {
  const week = getCurrentWeek();
  return plan.workouts
    .map((w) => {
      const today = isToday(w.day_of_week);
      const status = getWorkoutStatus(week, w.day_of_week);
      const done = status?.completed === true;
      const rest = w.type === 'rest';
      const classes = [
        'workout-item',
        today ? 'is-today' : '',
        done ? 'is-done' : '',
        rest ? 'is-rest' : '',
      ].filter(Boolean).join(' ');

      return `
        <button type="button" class="${classes}" data-week="${week}" data-day="${w.day_of_week}"
          ${rest ? 'disabled aria-disabled="true"' : `aria-pressed="${done}"`}>
          <span class="workout-check">${done ? icon('check', { size: 14 }) : ''}</span>
          <span class="workout-body">
            <span class="workout-title">
              ${dayLabel(w.day_of_week)} · ${escapeHtml(w.title)}
              ${today ? `<span class="badge badge-brand">Hari ini</span>` : ''}
            </span>
            <span class="workout-desc">${escapeHtml(w.description || '')}</span>
          </span>
          <span class="workout-meta">${icon('clock', { size: 14 })} ${w.duration_minutes} mnt · ${typeLabel(w.type)}</span>
        </button>`;
    })
    .join('');
}

function bindWorkoutList(root, plan) {
  const list = root.querySelector('#workout-list');
  if (!list) return;
  list.addEventListener('click', (e) => {
    const item = e.target.closest('.workout-item');
    if (!item || item.disabled) return;

    const week = Number(item.dataset.week);
    const day = Number(item.dataset.day);
    toggleWorkout(week, day);

    const { scheduled, done } = completedCount(plan);
    const donePct = scheduled > 0 ? Math.round((done / scheduled) * 100) : 0;

    item.classList.toggle('is-done', getWorkoutStatus(week, day)?.completed === true);
    item.setAttribute('aria-pressed', String(getWorkoutStatus(week, day)?.completed === true));
    item.querySelector('.workout-check').innerHTML = getWorkoutStatus(week, day)?.completed ? icon('check', { size: 14 }) : '';

    root.querySelectorAll('.plan-progress .progress-fill').forEach((fill) => {
      fill.style.width = `${donePct}%`;
    });
    root.querySelectorAll('.plan-progress .progress-value').forEach((el) => {
      el.textContent = `${done}/${scheduled} selesai`;
    });
    root.querySelectorAll('#workout-list ~ .plan-side .badge.badge-success, .card-header .badge.badge-success').forEach((b) => {
      b.textContent = `${done}/${scheduled}`;
    });

    if (done === scheduled) {
      toast('Latihan minggu ini selesai! Siap check-in.', 'success');
    }
  });
}
