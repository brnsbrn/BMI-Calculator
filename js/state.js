/**
 * state.js — state management frontend (single source of state).
 * Memegang appState in-memory + menulis ke localStorage pada setiap mutasi.
 */

import { createInitialState, loadState, saveState, clearState } from './storage.js';
import { uid, todayISO } from './format.js';

const loaded = loadState();
let state = loaded.state;
export const storageOk = loaded.stored;
export const storageCorrupt = loaded.corrupt === true;

export function getState() {
  return state;
}

/**
 * Reload state in-memory dari localStorage (dipakai setelah import backup).
 */
export function reloadState() {
  const loadedNow = loadState();
  state = loadedNow.state;
  return state;
}

function commit() {
  const result = saveState(state);
  return result.ok;
}

/* ---------------- Assessment & recommendation ---------------- */

export function setAssessment(assessment) {
  state.assessment = assessment;
  commit();
}

export function setRecommendation(recommendation) {
  state.recommendation = recommendation;
  commit();
}

/* ---------------- Plan ---------------- */

export function hasPlan() {
  return state.plan !== null;
}

export function getPlan() {
  return state.plan;
}

export function getCurrentWeek() {
  return state.plan?.currentWeek ?? 1;
}

/**
 * Menyusun objek Plan dari assessment + recommendation.
 */
export function createPlanFromRecommendation(assessment, recommendation) {
  const plan = {
    id: uid('plan'),
    createdAt: new Date().toISOString(),
    assessmentId: assessment.id,
    currentWeek: 1,
    targetBodyFat: assessment.targetBodyFat ?? recommendation.rule.target_body_fat_min ?? null,
    targetWeight: assessment.targetWeight,
    timeline: assessment.timeline,
    startedAt: todayISO(),
    nutrition: {
      strategy: recommendation.calorieStrategy,
      calorieTarget: recommendation.calorieTarget,
      calorieTargetMin: recommendation.calorieTargetMin,
      calorieTargetMax: recommendation.calorieTargetMax,
      proteinTarget: recommendation.proteinTarget,
      proteinTargetMin: recommendation.proteinTargetMin,
      proteinTargetMax: recommendation.proteinTargetMax,
      carbTarget: recommendation.carbTarget,
      fatTarget: recommendation.fatTarget,
      guidance: `${recommendation.what} ${recommendation.how}`.trim(),
    },
    mealPlan: recommendation.mealPlan,
    workouts: recommendation.weeklySchedule.map((d) => ({
      day_of_week: d.day_of_week,
      title: d.title,
      description: d.description ?? '',
      type: d.type,
      duration_minutes: d.duration_minutes ?? 0,
    })),
    workoutFocus: recommendation.workoutFocus,
    cardioGuidance: recommendation.cardioGuidance,
    progressFocus: recommendation.progressFocus,
  };

  const baselineLog = {
    date: todayISO(),
    weight: assessment.weight,
    waist: assessment.waist,
    bodyFat: assessment.bodyFat,
    energy: null,
    week: 0,
    source: 'assessment',
  };

  return { plan, baselineLog };
}

export function savePlan(plan, baselineLog) {
  state.plan = plan;
  // baseline baru menggantikan baseline lama, riwayat check-in tetap dipertahankan
  state.progress = state.progress.filter((p) => p.source !== 'assessment');
  state.progress.push(baselineLog);
  commit();
}

export function updatePlan(patch) {
  if (!state.plan) return;
  state.plan = { ...state.plan, ...patch };
  commit();
}

export function incrementWeek() {
  if (!state.plan) return;
  state.plan.currentWeek += 1;
  commit();
}

/* ---------------- Progress & check-ins ---------------- */

export function getProgress() {
  return [...state.progress].sort((a, b) => a.date.localeCompare(b.date));
}

export function addCheckin(checkin) {
  state.checkins.push(checkin);
  state.progress.push({
    date: checkin.date,
    weight: checkin.weight,
    waist: checkin.waist,
    bodyFat: checkin.bodyFat,
    energy: checkin.energy,
    week: checkin.week,
    source: 'checkin',
  });
  commit();
}

export function hasCheckinForWeek(week) {
  return state.checkins.some((c) => c.week === week);
}

/**
 * Perhitungan perubahan dari log sebelumnya.
 */
export function computeChange(weightNow, waistNow) {
  const logs = getProgress();
  const prev = logs[logs.length - 1];
  return {
    weightChange: prev ? round2(weightNow - prev.weight) : null,
    waistChange: prev && waistNow !== null && waistNow !== undefined && prev.waist !== null
      ? round2(waistNow - prev.waist)
      : null,
  };
}

/* ---------------- Workout status ---------------- */

export function workoutKey(week, dayOfWeek) {
  return `${week}_${dayOfWeek}`;
}

export function getWorkoutStatus(week, dayOfWeek) {
  return state.workoutStatus[workoutKey(week, dayOfWeek)] ?? null;
}

export function toggleWorkout(week, dayOfWeek) {
  const key = workoutKey(week, dayOfWeek);
  const current = state.workoutStatus[key];
  if (current?.completed) {
    delete state.workoutStatus[key];
  } else {
    state.workoutStatus[key] = {
      completed: true,
      completedAt: new Date().toISOString(),
    };
  }
  commit();
}

export function completedCount(plan) {
  const week = plan?.currentWeek ?? 1;
  const rest = plan?.workouts?.filter((w) => w.type === 'rest').length ?? 0;
  const scheduled = (plan?.workouts?.length ?? 0) - rest;
  let done = 0;
  for (const w of plan?.workouts ?? []) {
    if (w.type === 'rest') continue;
    if (state.workoutStatus[workoutKey(week, w.day_of_week)]?.completed) done++;
  }
  return { scheduled, done };
}

/* ---------------- Reset ---------------- */

export function resetState() {
  clearState();
  state = createInitialState();
}

/* ---------------- Tools ---------------- */

function round2(value) {
  return Math.round(value * 100) / 100;
}