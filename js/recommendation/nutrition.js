/**
 * nutrition.js — target kalori & makronutrien berdasarkan rule.
 * Dasar: TDEE + adjustment, dengan safety floor 1200 kkal.
 */

export const CALORIE_FLOOR = 1200;

/**
 * @param {object} assessment hasil assessment (mengandung tdee, weight, ...)
 * @param {object} rule rule rekomendasi
 * @param {number|null} adjustmentOverride override dari target berat manual
 */
export function calculateNutrition(assessment, rule, adjustmentOverride = null) {
  const safeAdjustment = value => assessment.bmi < 18.5 ? Math.max(0, value) : value;
  const adjustment = safeAdjustment(adjustmentOverride ?? Math.round(((rule.calorie_adjustment_min ?? 0) + (rule.calorie_adjustment_max ?? 0)) / 2));
  const adjustmentMin = safeAdjustment(adjustmentOverride ?? rule.calorie_adjustment_min ?? 0);
  const adjustmentMax = safeAdjustment(adjustmentOverride ?? rule.calorie_adjustment_max ?? 0);

  const calorieTarget = Math.max(CALORIE_FLOOR, assessment.tdee + adjustment);
  const calorieTargetMin = Math.max(CALORIE_FLOOR, assessment.tdee + adjustmentMin);
  const calorieTargetMax = Math.max(CALORIE_FLOOR, assessment.tdee + adjustmentMax);

  const proteinMin = (rule.protein_per_kg ?? 0) * assessment.weight;
  const proteinMax = (rule.protein_per_kg_max ?? 0) * assessment.weight;
  const proteinTarget = round1((proteinMin + proteinMax) / 2);

  const proteinCalories = proteinTarget * 4;

  const fatTarget = round1(((rule.macro_fat ?? 30) / 100) * calorieTarget / 9);
  const fatCalories = fatTarget * 9;

  const carbCalories = Math.max(0, calorieTarget - proteinCalories - fatCalories);
  const carbTarget = round1(carbCalories / 4);

  return {
    calorie_target: calorieTarget,
    calorie_target_min: calorieTargetMin,
    calorie_target_max: calorieTargetMax,
    protein_target: proteinTarget,
    protein_target_min: round1(proteinMin),
    protein_target_max: round1(proteinMax),
    carb_target: carbTarget,
    fat_target: fatTarget,
    adjustment,
  };
}

function round1(value) {
  return Math.round(value * 10) / 10;
}
