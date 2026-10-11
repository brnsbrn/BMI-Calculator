/**
 * assessment.js — orchestrator kalkulasi → AssessmentResult.
 * Merekap body fat, kategori, BMI, BMR, TDEE, target, timeline, warning.
 */

import { assertInputs, calculateBodyFat, bodyFatFormula, round1, BODY_FAT_VERSION } from './body-fat.js?v=male-fix-12';
import { classifyBodyFat, categoryLabel, categoryColor } from './body-fat-classifier.js';
import { calculateBmi, bmiLabel, bmiTone, bmiDescription } from './bmi.js';
import { calculateBmr } from './bmr.js';
import { calculateTdee } from './tdee.js';
import { calculateTargetWeight, leanMass } from './target-weight.js';
import { buildWarnings } from './safety-guard.js?v=bmi-safety-13';
import { resolveRule } from '../recommendation/engine.js?v=bmi-safety-13';
import { CALCULATION_VERSION } from '../data/recommendation-rules.js';

/**
 * @param {object} input
 *   { gender, age, weight, height, neck, waist, activityLevel,
 *     targetWeight: number|null, targetWeightManual: boolean }
 * @returns {object} AssessmentResult
 */
export function buildAssessment(input) {
  assertInputs(input);

  const bodyFat = calculateBodyFat(input);
  const category = classifyBodyFat(bodyFat);
  const bmi = calculateBmi(input.weight, input.height);
  const bmr = calculateBmr(input);
  const tdee = calculateTdee(bmr, input.activityLevel);

  const rule = resolveRule(input.gender, category, bmi);
  const targetBodyFat = rule?.target_body_fat ?? rule?.target_body_fat_min ?? null;
  const timeline = rule?.timeline_label ?? '—';

  const targetWeightManual = input.targetWeightManual === true
    && input.targetWeight !== null
    && input.targetWeight !== undefined;

  let targetWeight;
  if (targetWeightManual) {
    targetWeight = round1(Number(input.targetWeight));
    if (bmi < 18.5 && targetWeight < input.weight) {
      const error = new RangeError('BMI menunjukkan berat badan kurang. Target penurunan berat badan tidak dapat digunakan; konsultasikan target dengan tenaga kesehatan.');
      error.field = 'targetWeight';
      throw error;
    }
  } else {
    targetWeight = category === 'moderate'
      ? round1(input.weight)
      : calculateTargetWeight(input.weight, bodyFat, targetBodyFat);
  }

  const fatMass = round1((input.weight * bodyFat) / 100);
  const fatMassCalc = round1(input.weight - fatMass);

  const warnings = buildWarnings({
    gender: input.gender,
    bodyFat,
    age: input.age,
    weight: input.weight,
    height: input.height,
    bmi,
  });

  return {
    id: `assessment_${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    gender: input.gender,
    age: input.age,
    weight: input.weight,
    height: input.height,
    neck: input.neck,
    waist: input.waist,
    hip: input.hip ?? null,
    activityLevel: input.activityLevel,
    targetWeight: input.targetWeight ?? null,
    targetWeightManual,
    bodyFat,
    category,
    categoryLabel: categoryLabel(category),
    categoryColor: categoryColor(category),
    targetBodyFat,
    targetWeight,
    timeline,
    bmi,
    bmiLabel: bmiLabel(bmi),
    bmiTone: bmiTone(bmi),
    bmiDescription: bmiDescription(bmi),
    bmr,
    tdee,
    fatMass,
    leanMass: fatMassCalc,
    weightDiff: targetWeight !== null ? round1(input.weight - targetWeight) : null,
    formula: bodyFatFormula(input),
    warnings,
    calculationVersion: `${BODY_FAT_VERSION}-${CALCULATION_VERSION}`,
  };
}
