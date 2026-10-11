/**
 * node-test.mjs — unit test untuk core engine (formula & boundary).
 * Referensi kasus: spesifikasi §73.
 *
 * Jalankan: npm test   atau   node node-test.mjs
 */

import './js/tests/stub-localstorage.mjs';
import { calculateBodyFat, navyMale, rfmFemale, assertInputs, round1 } from './js/calculator/body-fat.js';
import { classifyBodyFat } from './js/calculator/body-fat-classifier.js';
import { calculateBmi, bmiLabel } from './js/calculator/bmi.js';
import { calculateBmr } from './js/calculator/bmr.js';
import { calculateTdee } from './js/calculator/tdee.js';
import { validateCalculatorForm, validateCheckinForm } from './js/validation.js';
import { spectrumPosition } from './js/ui/spectrum.js';
import { BOUNDARIES } from './js/calculator/body-fat-classifier.js';
import { calculateTargetWeight, leanMass } from './js/calculator/target-weight.js';
import { buildAssessment } from './js/calculator/assessment.js';
import { calculateNutrition, CALORIE_FLOOR } from './js/recommendation/nutrition.js';
import { buildRecommendation, resolveRule, adjustmentFromTarget, targetDisplay } from './js/recommendation/engine.js';
import { generateMealPlan } from './js/recommendation/meal-plan.js';
import { weeklySchedule, scheduledCount } from './js/recommendation/workout.js';
import {
  createPlanFromRecommendation, savePlan, getPlan, hasPlan, getCurrentWeek,
  addCheckin, hasCheckinForWeek, computeChange, incrementWeek, resetState,
  toggleWorkout, getWorkoutStatus, completedCount, workoutKey, getState,
} from './js/state.js';

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, message: err.message });
    console.error(`FAIL  ${name}\n      ${err.message}`);
  }
}

function assert(cond, message) {
  if (!cond) throw new Error(message || 'assertion failed');
}

function assertClose(actual, expected, tol = 0.11) {
  if (typeof actual !== 'number' || Math.abs(actual - expected) > tol) {
    throw new Error(`expected ~${expected}, got ${actual}`);
  }
}

console.log('=== Body Fat Calculator ===');

test('male valid: metric NHRC density (170/38/86) → 18.6%', () => {
  assertClose(calculateBodyFat({ gender: 'male', height: 170, neck: 38, waist: 86 }), 18.6);
});

test('male valid: metric NHRC density (178/40/90) → 18.7%', () => {
  assertClose(calculateBodyFat({ gender: 'male', height: 178, neck: 40, waist: 90 }), 18.7);
});

test('male valid: metric NHRC density (175/42/95) → 21.4%', () => {
  assertClose(calculateBodyFat({ gender: 'male', height: 175, neck: 42, waist: 95 }), 21.4);
});

test('male valid: metric NHRC density (165/35/75) → 12.8%', () => {
  assertClose(calculateBodyFat({ gender: 'male', height: 165, neck: 35, waist: 75 }), 12.8);
});

test('female valid: RFM (160/80) → 36.0%', () => {
  assertClose(calculateBodyFat({ gender: 'female', height: 160, waist: 80 }), 36);
});

test('waist <= neck throws', () => {
  let threw = false;
  try {
    assertInputs({ age: 25, weight: 70, height: 170, neck: 40, waist: 38 });
  } catch (e) {
    threw = e instanceof RangeError;
  }
  assert(threw, 'seharusnya membuang RangeError');
});

['age', 'weight', 'height', 'neck', 'waist'].forEach((field) => {
  test(`${field} out of range throws`, () => {
    const base = { age: 25, weight: 70, height: 170, neck: 36, waist: 80 };
    const vals = {
      age: 17,
      weight: 29.9,
      height: 119,
      neck: 19,
      waist: 39,
    };
    let threw = false;
    try {
      assertInputs({ ...base, [field]: vals[field] });
    } catch (e) {
      threw = e instanceof RangeError;
    }
    assert(threw, 'seharusnya membuang RangeError');
  });
});

test('invalid activity level falls back to sedentary', () => {
  const bmr = calculateBmr({ gender: 'male', weight: 70, height: 170, age: 25 });
  assert(calculateTdee(bmr, 'invalid') === Math.round(bmr * 1.2));
});

test('male out-of-domain estimates are rejected, not forced to 1 or 60', () => {
  for (const input of [
    { gender: 'male', height: 180, neck: 32, waist: 60 },
    { gender: 'male', height: 130, neck: 20, waist: 199 },
  ]) {
    let error;
    try { calculateBodyFat(input); } catch (e) { error = e; }
    assert(error instanceof RangeError && error.field === 'waist');
  }
});

test('male reported measurements vary with waist: 55, 65, 80 cm', () => {
  const results = [55, 65, 80].map(waist => calculateBodyFat({ gender: 'male', height: 167, neck: 25, waist }));
  assert(results[0] === 2.4 && results[1] === 12.5 && results[2] === 24.2, results.join(', '));
});

test('female calculation and bounds remain unchanged', () => {
  assert(calculateBodyFat({ gender: 'female', height: 160, waist: 80 }) === 36);
  assert(calculateBodyFat({ gender: 'female', height: 130, waist: 199 }) === 60);
});

test('BMI golden value (85/180) → 26.2', () => {
  assertClose(calculateBmi(85, 180), 26.2);
});

test('BMI golden value (70/175) → 22.9', () => {
  assertClose(calculateBmi(70, 175), 22.9);
});

test('BMR male Mifflin-St Jeor (28,72,170) → 1648', () => {
  assert(calculateBmr({ gender: 'male', weight: 72, height: 170, age: 28 }) === 1648);
});

test('BMR female Mifflin-St Jeor (30,65,165) → 1370', () => {
  assert(calculateBmr({ gender: 'female', weight: 65, height: 165, age: 30 }) === 1370);
});

test('lean mass = weight * (1 - bf%)', () => {
  assert(leanMass(80, 20) === 64);
});

console.log('=== BMI boundaries ===');

[
  [18.4, 'Berat badan kurang'],
  [18.5, 'Normal'],
  [24.9, 'Normal'],
  [25, 'Berat badan berlebih'],
  [29.9, 'Berat badan berlebih'],
  [30, 'Obesitas'],
].forEach(([bmi, label]) => {
  test(`bmi ${bmi} → ${label}`, () => {
    assert(bmiLabel(bmi) === label);
  });
});

console.log('=== Body fat category boundaries ===');

[
  [5.9, 'very_low'],
  [6, 'low'],
  [13.9, 'low'],
  [14, 'moderate'],
  [17.9, 'moderate'],
  [18, 'high'],
  [24.9, 'high'],
  [25, 'very_high'],
].forEach(([bf, category]) => {
  test(`body fat ${bf} → ${category}`, () => {
    assert(classifyBodyFat(bf) === category);
  });
});

console.log('=== Target weight ===');

test('target body fat null → target weight null', () => {
  assert(calculateTargetWeight(80, 20, null) === null);
  assert(calculateTargetWeight(80, 20, 0) === null);
});

test('target body fat valid (80kg, 20%bf, 15% target) → 75.3', () => {
  assertClose(calculateTargetWeight(80, 20, 15), 75.3, 0.05);
});

test('target body fat valid (70kg, 10%bf, 14% target) → 73.3', () => {
  assertClose(calculateTargetWeight(70, 10, 14), 73.3, 0.05);
});

test('manual target weight passed through', () => {
  const a = buildAssessment({
    gender: 'male', age: 25, weight: 80, height: 175, neck: 38, waist: 90,
    activityLevel: 'moderate', targetWeight: 75, targetWeightManual: true,
  });
  assert(a.targetWeight === 75);
  assert(a.targetWeightManual === true);
  assert(a.weightDiff === 5);
});

test('target weight kosong → otomatis dihitung', () => {
  const a = buildAssessment({
    gender: 'male', age: 25, weight: 72, height: 170, neck: 36, waist: 84,
    activityLevel: 'moderate', targetWeight: null, targetWeightManual: false,
  });
  assert(a.targetWeight !== null && a.targetWeight > 0);
  assert(a.targetWeightManual === false);
});

console.log('=== Assessment ===');

test('assessment lengkap male valid', () => {
  const a = buildAssessment({
    gender: 'male', age: 28, weight: 85, height: 180, neck: 40, waist: 95,
    activityLevel: 'active', targetWeight: null, targetWeightManual: false,
  });
  assertClose(a.bmi, 26.2, 0.06);
  assert(a.category === 'high', `kategori ${a.category} (bf ${a.bodyFat})`);
  assert(a.targetBodyFat === 14, `target body fat ${a.targetBodyFat}`);
  assert(a.timeline === '4–6 bulan');
  assert(a.formula === 'US Navy (Hodgdon–Beckett)');
  assert(a.bmr > 1000 && a.tdee > a.bmr);
  assert(a.fatMass > 0 && a.leanMass > 0);
  assert(Array.isArray(a.warnings));
});

test('assessment female valid + warning low bf', () => {
  const a = buildAssessment({
    gender: 'female', age: 30, weight: 60, height: 165, neck: 33, waist: 70,
    activityLevel: 'light', targetWeight: null, targetWeightManual: false,
  });
  assert(a.formula === 'RFM (Woolcott & Bergman 2018)');
  assert(a.targetBodyFat !== null);
});

console.log('=== Nutrition ===');

const fakeRule = {
  calorie_adjustment_min: -300,
  calorie_adjustment_max: -200,
  protein_per_kg: 1.6,
  protein_per_kg_max: 2.0,
  macro_protein: 30,
  macro_carb: 40,
  macro_fat: 30,
};

test('nutrition: tdee 2500 → target 2250, floor respected', () => {
  const n = calculateNutrition({ tdee: 2500, weight: 72 }, fakeRule);
  assert(n.calorie_target === 2250);
  assert(n.calorie_target_min === 2200);
  assert(n.calorie_target_max === 2300);
  assertClose(n.protein_target, 129.6, 0.05);
  assertClose(n.protein_target_min, 115.2, 0.05);
  assertClose(n.protein_target_max, 144, 0.05);
  assertClose(n.fat_target, 75, 0.05);
  assertClose(n.carb_target, 264.2, 0.05);
});

test('nutrition: floor 1200 kkal', () => {
  const n = calculateNutrition({ tdee: 1000, weight: 50 }, fakeRule);
  assert(n.calorie_target === CALORIE_FLOOR);
  assert(n.calorie_target === 1200);
});

test('macros sum to ~100% in calories', () => {
  const n = calculateNutrition({ tdee: 2500, weight: 72 }, fakeRule);
  const total = n.protein_target * 4 + n.carb_target * 4 + n.fat_target * 9;
  assert(Math.abs(total - n.calorie_target) < 2);
});

test('adjustment override from manual target', () => {
  assert(adjustmentFromTarget({ weight: 80, targetWeight: 70, targetWeightManual: true }) === -500);
  assert(adjustmentFromTarget({ weight: 80, targetWeight: 77, targetWeightManual: true }) === -350);
  assert(adjustmentFromTarget({ weight: 80, targetWeight: 90, targetWeightManual: true }) === 400);
  assert(adjustmentFromTarget({ weight: 80, targetWeight: 82, targetWeightManual: true }) === 250);
  assert(adjustmentFromTarget({ weight: 80, targetWeight: 80, targetWeightManual: true }) === 0);
  assert(adjustmentFromTarget({ weight: 80, targetWeight: 75, targetWeightManual: false }) === null);
});

console.log('=== Recommendation engine ===');

test('targetDisplay formats correctly', () => {
  assert(targetDisplay({ target_body_fat: 14 }) === '14%');
  assert(targetDisplay({ target_body_fat: null, target_body_fat_min: 14, target_body_fat_max: 18 }) === '14–18%');
  assert(targetDisplay({ target_body_fat: null }) === 'Pertahankan');
});

test('resolveRule male/high exists', () => {
  const rule = resolveRule('male', 'high');
  assert(rule && rule.primary_focus === 'Penurunan Lemak');
  assert(rule.workout_template === 'upper_lower_cardio');
});

test('buildRecommendation produces full result & deterministic meal plan', () => {
  const a = buildAssessment({
    gender: 'male', age: 28, weight: 85, height: 180, neck: 40, waist: 100,
    activityLevel: 'moderate', targetWeight: 70, targetWeightManual: true,
  });
  const r1 = buildRecommendation(a);
  const r2 = buildRecommendation(a);

  assert(a.category === 'very_high', `kategori ${a.category} (bf ${a.bodyFat})`);
  assert(r1.primaryFocus === 'Penurunan Lemak');
  assert(r1.mealPlan.length === 5);
  assert(JSON.stringify(r1.mealPlan) === JSON.stringify(r2.mealPlan), 'meal plan harus deterministik');
  assert(r1.weeklySchedule.length === 7);
  assert(r1.calorieTarget >= 1200);
  assert(r1.calorieTargetMin <= r1.calorieTarget && r1.calorieTarget <= r1.calorieTargetMax);
  assert(r1.safetyFlag === false);
});

test('workout weekly schedule has 7 days + scheduled count', () => {
  const days = weeklySchedule('upper_lower_cardio');
  assert(days.length === 7);
  assert(days[0].day_of_week === 1);
  assert(scheduledCount(days) === 6); // 1 rest
});

test('female moderate → template full_body_recreational_f', () => {
  const a = buildAssessment({
    gender: 'female', age: 30, weight: 55, height: 168, neck: 34, waist: 56,
    activityLevel: 'light', targetWeight: null, targetWeightManual: false,
  });
  const r = buildRecommendation(a);
  assert(a.category === 'moderate', `kategori ${a.category} (bf ${a.bodyFat})`);
  assert(r.rule.workout_template === 'full_body_recreational_f');
});

test('safety flag for very_low category', () => {
  const a = buildAssessment({
    gender: 'male', age: 25, weight: 65, height: 180, neck: 32, waist: 65,
    activityLevel: 'moderate', targetWeight: null, targetWeightManual: false,
  });
  const r = buildRecommendation(a);
  assert(r.rule.safety_flag === true);
  assert(a.warnings.some((w) => w.code === 'body_fat_low'));
});

test('meal plan seed stable & 5 meals', () => {
  const meal = generateMealPlan({ calorieTarget: 2250, proteinTarget: 129.6, carbTarget: 264.2, fatTarget: 75 }, 12345);
  assert(meal.length === 5);
  assert(meal[0].meal === 'Sarapan');
  const meal2 = generateMealPlan({ calorieTarget: 2250, proteinTarget: 129.6, carbTarget: 264.2, fatTarget: 75 }, 12345);
  assert(JSON.stringify(meal) === JSON.stringify(meal2));
  const total = meal.reduce((s, m) => s + m.calories, 0);
  assert(total > 0);
});

console.log('=== State: plan, check-in, workout ===');

const profile = () => ({
  gender: 'male', age: 32, weight: 88, height: 178, neck: 40, waist: 102,
  activityLevel: 'moderate', targetWeight: null, targetWeightManual: false,
});

test('createPlanFromRecommendation → plan minggu 1 + baseline', () => {
  resetState();
  const a = buildAssessment(profile());
  const r = buildRecommendation(a);
  const { plan, baselineLog } = createPlanFromRecommendation(a, r);

  assert(plan.currentWeek === 1);
  assert(plan.mealPlan.length === 5);
  assert(plan.workouts.length === 7);
  assert(plan.nutrition.calorieTarget >= 1200);
  assert(baselineLog.source === 'assessment');
  assert(baselineLog.weight === 88);

  savePlan(plan, baselineLog);
  assert(hasPlan());
  assert(getPlan().id === plan.id);
  assert(getCurrentWeek() === 1);
});

test('check-in: simpan, duplikat dicegah, minggu maju', () => {
  const week = getCurrentWeek(); // 1
  const changes = computeChange(86.5, 99); // dibandingkan baseline 88 kg / 102 cm
  assert(Math.abs(changes.weightChange - (-1.5)) < 0.001, `weightChange ${changes.weightChange}`);
  assert(Math.abs(changes.waistChange - (-3)) < 0.001, `waistChange ${changes.waistChange}`);

  addCheckin({
    week,
    date: '2026-08-30',
    weight: 86.5,
    waist: 99,
    bodyFat: null,
    workoutsScheduled: 6,
    workoutsCompleted: 5,
    energy: 4,
    difficulty: 3,
    feedback: '',
    weightChange: changes.weightChange,
    waistChange: changes.waistChange,
  });

  assert(hasCheckinForWeek(1) === true, 'minggu 1 harus tercatat');
  assert(hasCheckinForWeek(2) === false);

  incrementWeek();
  assert(getCurrentWeek() === 2);
  assert(hasCheckinForWeek(2) === false);
});

test('computeChange dari log terakhir', () => {
  // posisi: baseline 88/102 → check-in 86.5/99 → hitung ke nilai baru 85/98
  const changes = computeChange(85, 98);
  assert(Math.abs(changes.weightChange - (-1.5)) < 0.001, `weightChange ${changes.weightChange}`);
  assert(Math.abs(changes.waistChange - (-1)) < 0.001, `waistChange ${changes.waistChange}`);
});

test('workout toggle on/off + completedCount', () => {
  const plan = getPlan();
  const before = completedCount(plan);
  assert(before.done === 0);

  const firstWorkout = plan.workouts.find((w) => w.type !== 'rest');
  const day = firstWorkout.day_of_week;
  const week = plan.currentWeek; // sekarang minggu 2

  toggleWorkout(week, day);
  assert(getWorkoutStatus(week, day)?.completed === true);
  assert(completedCount(plan).done === 1);

  toggleWorkout(week, day);
  assert(getWorkoutStatus(week, day) === null);
  assert(completedCount(plan).done === 0);

  assert(workoutKey(2, 3) === '2_3');
});

test('reset menghapus seluruh state', () => {
  resetState();
  assert(!hasPlan());
  assert(getState().checkins.length === 0);
});

console.log('=== Summary ===');
test('reported 42kg / 167cm profile is underweight, with no automatic weight-loss target', () => {
  const a = buildAssessment({ gender: 'male', age: 25, weight: 42, height: 167, neck: 26, waist: 80, hip: 55, activityLevel: 'moderate' });
  const r = buildRecommendation(a);
  assert(a.bmi === 15.1 && a.bmiLabel === 'Berat badan kurang');
  assert(a.bodyFat === 23.5 && a.category === 'high');
  assert(a.targetWeight === null && a.targetBodyFat === null);
  assert(a.warnings.some(w => w.code === 'bmi_underweight'));
  assert(r.calorieTarget >= a.tdee && r.safetyFlag);
  assert(r.primaryFocus === 'Pemulihan Berat Badan');
  assert(r.weeklySchedule.every(day => day.type === 'rest'));
});

test('underweight manual lower-weight target rejected, higher-weight target accepted', () => {
  const input = { gender: 'male', age: 25, weight: 42, height: 167, neck: 26, waist: 80, activityLevel: 'moderate', targetWeightManual: true };
  let error;
  try { buildAssessment({ ...input, targetWeight: 37 }); } catch (e) { error = e; }
  assert(error instanceof RangeError && error.field === 'targetWeight');
  const a = buildAssessment({ ...input, targetWeight: 52 });
  assert(a.targetWeight === 52 && buildRecommendation(a).calorieTarget >= a.tdee);
});

test('nutrition cannot prescribe a deficit for underweight, even with override', () => {
  const n = calculateNutrition({ bmi: 15.1, tdee: 2083, weight: 42 }, { calorie_adjustment_min: -500, calorie_adjustment_max: -300 }, -500);
  assert(n.calorie_target === 2083 && n.calorie_target_min === 2083 && n.calorie_target_max === 2083);
});

test('body fat gauge marker aligns with category bands and boundaries', () => {
  assertClose(spectrumPosition(23.5, BOUNDARIES), 75.7);
  for (const [value, position] of [[0, 0], [6, 20], [14, 40], [18, 60], [25, 80], [60, 100]]) {
    assertClose(spectrumPosition(value, BOUNDARIES), position, 0.001);
  }
});

test('BMI gauge marker aligns with BMI bands', () => {
  const ranges = [{ min: 12, max: 18.5 }, { min: 18.5, max: 25 }, { min: 25, max: 30 }, { min: 30, max: 45 }];
  assert(spectrumPosition(15.1, ranges) < 25);
  assert(spectrumPosition(23.5, ranges) >= 25 && spectrumPosition(23.5, ranges) < 50);
});
test('recalculation changes BMI, body fat, BMR and TDEE', () => {
  const a = buildAssessment({ gender: 'male', age: 25, weight: 70, height: 175, neck: 38, waist: 80, activityLevel: 'light' });
  const b = buildAssessment({ gender: 'male', age: 25, weight: 90, height: 175, neck: 38, waist: 100, activityLevel: 'active' });
  assert(a.bmi === 22.9 && b.bmi === 29.4);
  assert(b.bodyFat > a.bodyFat && b.bmr > a.bmr && b.tdee > a.tdee);
});

for (const gender of ['male', 'female']) {
  test(`${gender}: missing circumferences uses Deurenberg, with correct method label`, () => {
    const a = buildAssessment({ gender, age: 30, weight: 65, height: 165, neck: null, waist: null });
    assertClose(a.bodyFat, gender === 'male' ? 19.4 : 30.2);
    assert(a.formula.startsWith('Deurenberg'));
  });
  test(`${gender}: maintenance category retains current weight`, () => {
    const a = buildAssessment({ gender, age: 25, weight: 60, height: 165, neck: null, waist: null });
    const maintenance = { ...a, category: 'moderate', bodyFat: 16 };
    const r = buildRecommendation(maintenance);
    assert(r.calorieTarget === maintenance.tdee);
    const measured = buildAssessment({ gender, age: 25, weight: 60, height: gender === 'male' ? 165 : 168, neck: gender === 'male' ? 38 : null, waist: gender === 'male' ? 81 : 56 });
    assert(measured.category === 'moderate', measured.category);
    assert(measured.targetWeight === measured.weight);
  });
  test(`${gender}: document category targets and timelines`, () => {
    for (const [category, target, timeline] of [
      ['very_high', 18, '8–12 bulan'], ['high', 14, '4–6 bulan'],
      ['low', gender === 'male' ? 8 : 14, '3–6 bulan'],
      ['very_low', gender === 'male' ? 8 : 14, gender === 'male' ? '1–2 bulan' : '1–3 bulan'],
    ]) {
      const rule = resolveRule(gender, category);
      assert(rule.target_body_fat === target && rule.timeline_label === timeline);
    }
  });
}

test('calculator validation rejects malformed optional values, Infinity and fractional age', () => {
  const base = { gender: 'male', age: '25', weight: '70', height: '175', activityLevel: 'moderate' };
  assert(validateCalculatorForm(base).ok);
  for (const [field, value] of [['neck', 'bad'], ['waist', 'Infinity'], ['hip', '10'], ['targetWeight', 'bad'], ['weight', 'Infinity'], ['age', '25.5'], ['activityLevel', 'bad']]) {
    const result = validateCalculatorForm({ ...base, [field]: value });
    assert(!result.ok && result.errors[field], `${field} must fail`);
  }
});

test('check-in values are numeric after form validation', () => {
  const result = validateCheckinForm({ weight: '70.5', waist: '80', bodyFat: '20', workoutsCompleted: '4', energy: '3', difficulty: '3' });
  assert(result.ok && result.values.weight === 70.5 && result.values.waist === 80);
});

test('recalculation preserves ongoing week and progress history', () => {
  resetState();
  const first = buildAssessment(profile());
  const initial = createPlanFromRecommendation(first, buildRecommendation(first));
  savePlan(initial.plan, initial.baselineLog);
  addCheckin({ week: 1, date: '2026-08-30', weight: 86, waist: 100, bodyFat: 25 });
  incrementWeek();
  const history = JSON.stringify(getState().progress);
  const updated = buildAssessment({ ...profile(), weight: 86, waist: 100 });
  const next = createPlanFromRecommendation(updated, buildRecommendation(updated));
  savePlan(next.plan, next.baselineLog);
  assert(getCurrentWeek() === 2 && !hasCheckinForWeek(2));
  assert(getPlan().id === initial.plan.id);
  assert(JSON.stringify(getState().progress) === history);
  resetState();
});
console.log(`\nPassed: ${passed}  Failed: ${failed}`);
if (failed > 0) {
  console.error('\nFailures:');
  failures.forEach((f) => console.error(` - ${f.name}: ${f.message}`));
  process.exit(1);
}
process.exit(0);
