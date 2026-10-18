/** Calculator results; no plans, history, or activity assumptions. */
import { assertInputs, calculateBodyFat, bodyFatFormula, round1 } from './body-fat.js?v=calculator-only-14';
import { calculateBmi, bmiLabel, bmiTone, bmiDescription } from './bmi.js?v=calculator-only-14';
import { calculateBmr } from './bmr.js';
import { calculateTargetWeight, healthyWeightRange } from './target-weight.js?v=calculator-only-14';

export function buildAssessment(input) {
  assertInputs(input);
  const bmi = calculateBmi(input.weight, input.height);
  const bodyFat = calculateBodyFat(input);
  const targetWeightManual = input.targetWeight != null && input.targetWeightManual !== false;
  const targetWeight = targetWeightManual
    ? input.targetWeight
    : calculateTargetWeight(input.weight, input.height);
  if (!Number.isFinite(targetWeight) || targetWeight < 30 || targetWeight > 300) {
    const error = new RangeError('Target berat harus 30–300 kg.');
    error.field = 'targetWeight';
    throw error;
  }
  if (bmi < 18.5 && targetWeight < input.weight) {
    const error = new RangeError('BMI menunjukkan berat badan kurang. Target berat tidak boleh lebih rendah dari berat saat ini.');
    error.field = 'targetWeight';
    throw error;
  }
  const targetBmi = calculateBmi(targetWeight, input.height);
  const warnings = [];
  if (targetWeightManual && (targetBmi < 18.5 || targetBmi >= 25)) {
    warnings.push({ message: 'Target berat yang Anda isi berada di luar rentang BMI normal. Tinjau kembali target bersama tenaga kesehatan.' });
  }
  if (bodyFat === null) {
    warnings.push({ message: 'Estimasi lemak tubuh tidak tersedia karena data berada di luar rentang estimasi 1–60%. Periksa pengukuran. Hasil BMI tetap dihitung dari berat dan tinggi badan.' });
  }
  return {
    gender: input.gender,
    age: input.age,
    weight: input.weight,
    height: input.height,
    waist: input.waist ?? null,
    hip: input.hip ?? null,
    targetWeightManual,
    targetWeight,
    targetBmi,
    healthyWeight: healthyWeightRange(input.height),
    weightDiff: round1(input.weight - targetWeight),
    bmi,
    bmiLabel: bmiLabel(bmi),
    bmiTone: bmiTone(bmi),
    bmiDescription: bmiDescription(bmi),
    bodyFat,
    formula: bodyFatFormula(input),
    bmr: calculateBmr(input),
    waistHipRatio: input.waist != null && input.hip != null ? input.waist / input.hip : null,
    warnings,
    calculationVersion: 'calculator-only-2.0',
  };
}
