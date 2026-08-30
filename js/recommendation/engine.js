/**
 * engine.js — recommendation engine.
 * Menggabungkan rule provider, nutrisi, menu, dan jadwal latihan.
 */

import { RULES, RECOMMENDATION_RULES_VERSION } from '../data/recommendation-rules.js';
import { calculateNutrition } from './nutrition.js';
import { generateMealPlan, hashCrc32 } from './meal-plan.js';
import { weeklySchedule } from './workout.js';

export function resolveRule(gender, category) {
  return RULES[gender]?.[category] ?? null;
}

/**
 * Adjustment kalori berbasis target berat manual.
 * Mengembalikan null bila user tidak menetapkan target manual.
 */
export function adjustmentFromTarget(assessment) {
  if (!assessment.targetWeightManual || assessment.targetWeight === null) {
    return null;
  }
  const diff = assessment.weight - assessment.targetWeight;

  if (diff >= 5) return -500;
  if (diff >= 1) return -350;
  if (diff <= -5) return 400;
  if (diff <= -1) return 250;
  return 0;
}

/**
 * Seed stabil menu per profil tubuh.
 * Nilai sama untuk input yang sama → plan dapat dihasilkan ulang identik.
 */
export function mealSeed(assessment) {
  return hashCrc32(
    [assessment.gender, assessment.age, assessment.weight, assessment.height, assessment.neck, assessment.waist].join('|'),
  );
}

export function targetDisplay(rule) {
  const has = (v) => v !== null && v !== undefined;
  if (has(rule.target_body_fat)) {
    return `${Math.round(rule.target_body_fat)}%`;
  }
  if (has(rule.target_body_fat_min) && has(rule.target_body_fat_max)) {
    return `${Math.round(rule.target_body_fat_min)}–${Math.round(rule.target_body_fat_max)}%`;
  }
  return 'Pertahankan';
}

export function buildRecommendation(assessment, rule = null) {
  const resolved = rule ?? resolveRule(assessment.gender, assessment.category);

  if (!resolved) {
    throw new Error(`Tidak ada rule rekomendasi untuk ${assessment.gender}/${assessment.category}.`);
  }

  const adjustment = adjustmentFromTarget(assessment);
  const nutrition = calculateNutrition(assessment, resolved, adjustment);
  const schedule = weeklySchedule(resolved.workout_template);
  const seed = mealSeed(assessment);
  const mealPlan = generateMealPlan(
    {
      calorieTarget: nutrition.calorie_target,
      proteinTarget: nutrition.protein_target,
      carbTarget: nutrition.carb_target,
      fatTarget: nutrition.fat_target,
    },
    seed,
  );

  return {
    rule: resolved,
    targetBodyFatDisplay: targetDisplay(resolved),
    primaryFocus: resolved.primary_focus ?? 'Rekomendasi',
    why: resolved.why ?? '',
    what: resolved.what ?? '',
    how: resolved.how ?? '',
    calorieStrategy: resolved.calorie_strategy ?? 'Sesuaikan dengan kebutuhan',
    calorieTarget: nutrition.calorie_target,
    calorieTargetMin: nutrition.calorie_target_min,
    calorieTargetMax: nutrition.calorie_target_max,
    proteinTarget: nutrition.protein_target,
    proteinTargetMin: nutrition.protein_target_min,
    proteinTargetMax: nutrition.protein_target_max,
    carbTarget: nutrition.carb_target,
    fatTarget: nutrition.fat_target,
    workoutTemplate: resolved.workout_template,
    workoutFocus: resolved.workout_focus,
    cardioGuidance: resolved.cardio_guidance,
    progressFocus: resolved.progress_focus,
    safetyFlag: resolved.safety_flag,
    mealPlan,
    weeklySchedule: schedule,
    recommendationVersion: RECOMMENDATION_RULES_VERSION,
  };
}