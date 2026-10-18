import './js/tests/stub-localstorage.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { calculateBmi, bmiLabel } from './js/calculator/bmi.js?v=calculator-only-14';
import { rfm, calculateBodyFat } from './js/calculator/body-fat.js?v=calculator-only-14';
import { calculateBmr } from './js/calculator/bmr.js';
import { buildAssessment } from './js/calculator/assessment.js?v=calculator-only-14';
import { healthyWeightRange, calculateTargetWeight } from './js/calculator/target-weight.js?v=calculator-only-14';
import { validateCalculatorForm } from './js/validation.js?v=calculator-only-14';
import { normalizeState, createInitialState, saveState, loadState, clearState, exportJson, STORAGE_KEY } from './js/storage.js?v=calculator-only-14';
import { validateBackup, parseImportFile, applyImport } from './js/export-import.js?v=calculator-only-14';
import { getState, setAssessment, resetState } from './js/state.js?v=calculator-only-14';

const base = { gender: 'male', age: 30, weight: 70, height: 175, waist: 85, hip: 100 };
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

test('BMI converts centimetres to metres before squaring: 70 / 1.75²', () => {
  near(calculateBmi(70, 175), 22.857142857142858);
  near(calculateBmi(85, 180), 26.234567901234566);
});

for (const [bmi, label] of [
  [18.499, 'Berat badan kurang'], [18.5, 'Normal'], [24.999, 'Normal'],
  [25, 'Berat badan berlebih'], [29.999, 'Berat badan berlebih'], [30, 'Obesitas'],
]) {
  test(`category uses unrounded BMI ${bmi}`, () => {
    const a = buildAssessment({ ...base, height: 200, weight: bmi * 4 });
    near(a.bmi, bmi);
    assert.equal(a.bmiLabel, label);
  });
}

for (const [weight, height] of [[0, 175], [-1, 175], [70, 0], [70, NaN], [Infinity, 175]]) {
  test(`invalid BMI inputs rejected (${weight}, ${height})`, () => assert.throws(() => calculateBmi(weight, height), RangeError));
}

test('gender, age, waist, hip and target do not change BMI', () => {
  const a = buildAssessment(base);
  const b = buildAssessment({ ...base, gender: 'female', age: 60, waist: 95, hip: 110, targetWeight: 65 });
  assert.equal(a.bmi, b.bmi);
  assert.notEqual(a.bodyFat, b.bodyFat);
  assert.notEqual(a.bmr, b.bmr);
  assert.notEqual(a.waistHipRatio, b.waistHipRatio);
});

test('RFM uses no neck measurement: male 170/85 = 24%, female = 36%', () => {
  assert.equal(rfm('male', 170, 85), 24);
  assert.equal(rfm('female', 170, 85), 36);
  assert.equal(calculateBodyFat({ ...base, height: 170, waist: 85 }), 24);
});

for (const [gender, bodyFat] of [['male', 19.4], ['female', 30.2]]) {
  test(`${gender}: no circumferences uses Deurenberg and still calculates BMI`, () => {
    const a = buildAssessment({ ...base, gender, weight: 65, height: 165, waist: null, hip: null });
    assert.equal(a.bodyFat, bodyFat);
    assert.match(a.formula, /Deurenberg/);
    assert.equal(a.waistHipRatio, null);
    assert.ok(Number.isFinite(a.bmi));
  });
}

test('out-of-range body fat does not block or clamp BMI results', () => {
  const a = buildAssessment({ ...base, height: 180, waist: 40 });
  assert.equal(a.bodyFat, null);
  near(a.bmi, 70 / 1.8 ** 2);
  assert.equal(a.warnings.length, 1);
});

test('BMR remains Mifflin–St Jeor and no activity multiplier is assumed', () => {
  assert.equal(calculateBmr({ gender: 'male', age: 28, weight: 72, height: 170 }), 1648);
  assert.equal(calculateBmr({ gender: 'female', age: 30, weight: 65, height: 165 }), 1370);
  assert.ok(!('tdee' in buildAssessment(base)));
});

test('hip is used in waist/hip ratio only when both are available', () => {
  assert.equal(buildAssessment(base).waistHipRatio, 0.85);
  assert.equal(buildAssessment({ ...base, hip: null }).waistHipRatio, null);
  assert.equal(buildAssessment({ ...base, waist: null }).waistHipRatio, null);
});

test('automatic target increases underweight, maintains normal, reduces overweight', () => {
  assert.equal(calculateTargetWeight(42, 167), 51.6);
  assert.equal(calculateTargetWeight(70, 175), 70);
  assert.equal(calculateTargetWeight(90, 175), 76.5);
  near(buildAssessment({ ...base, weight: 42, height: 167 }).targetBmi, 51.6 / 1.67 ** 2);
});

test('normal weight bounds and automatic targets remain within BMI 18.5 to <25 across allowed heights', () => {
  for (let mm = 1200; mm <= 2500; mm++) {
    const height = mm / 10;
    const range = healthyWeightRange(height);
    for (const weight of [range.min, range.max]) {
      const bmi = calculateBmi(weight, height);
      assert.ok(bmi >= 18.5 && bmi < 25, `${height}cm, ${weight}kg => ${bmi}`);
    }
  }
});

test('manual target is preserved and does not alter current BMI', () => {
  const a = buildAssessment({ ...base, targetWeight: 65 });
  assert.equal(a.targetWeight, 65);
  assert.equal(a.targetWeightManual, true);
  near(a.bmi, 70 / 1.75 ** 2);
  near(a.targetBmi, 65 / 1.75 ** 2);
});

test('manual weight loss is rejected while underweight', () => {
  assert.throws(() => buildAssessment({ ...base, weight: 42, height: 167, targetWeight: 40 }), (error) => error.field === 'targetWeight');
});

test('manual target outside normal BMI is clearly flagged', () => {
  assert.match(buildAssessment({ ...base, targetWeight: 90 }).warnings[0].message, /di luar rentang BMI normal/);
});

test('form accepts the requested fields without neck or activity', () => {
  const result = validateCalculatorForm({ gender: 'female', age: '30', weight: '65.5', height: '165', waist: '80', hip: '95', targetWeight: '60' });
  assert.equal(result.ok, true);
  assert.equal(result.values.weight, 65.5);
  assert.ok(!('neck' in result.values) && !('activityLevel' in result.values));
});

test('empty optional inputs do not prevent BMI calculation', () => {
  const result = validateCalculatorForm({ ...base, waist: '', hip: '', targetWeight: '' });
  assert.equal(result.ok, true);
  assert.equal(result.values.waist, null);
  assert.equal(result.values.targetWeightManual, false);
  assert.ok(Number.isFinite(buildAssessment(result.values).bmi));
});

for (const [field, value] of [
  ['gender', ''], ['age', '17'], ['age', '25.5'], ['age', '81'], ['weight', ''],
  ['weight', 'Infinity'], ['height', '0'], ['height', 'bad'], ['waist', 'bad'],
  ['waist', '39'], ['hip', '201'], ['targetWeight', 'bad'], ['targetWeight', '29'],
]) {
  test(`invalid ${field}=${value} is rejected with a field error`, () => {
    const result = validateCalculatorForm({ ...base, [field]: value });
    assert.equal(result.ok, false);
    assert.ok(result.errors[field]);
  });
}

test('legacy inputs cannot reintroduce neck or planning state', () => {
  const result = validateCalculatorForm({ ...base, neck: -100, activityLevel: 'active', plan: {} });
  assert.equal(result.ok, true);
  assert.ok(!('neck' in result.values) && !('plan' in result.values));
});

test('legacy backup is migrated, recalculated, and exports calculator data only', () => {
  const old = { app: 'bodyfit', state: { version: 1, assessment: { ...base, neck: 40, activityLevel: 'active', bmi: 999, bodyFat: 999 }, plan: {}, progress: [{}], checkins: [{}], workoutStatus: {} } };
  const result = validateBackup(old);
  assert.equal(result.ok, true);
  assert.equal(result.data.version, 2);
  assert.deepEqual(Object.keys(result.data).sort(), ['assessment', 'version']);
  near(result.data.assessment.bmi, 70 / 1.75 ** 2);
  for (const field of ['neck', 'plan', 'progress', 'checkins', 'activityLevel']) assert.ok(!exportJson(result.data).includes(`"${field}"`));
});

test('backups reject bad measurement data and unsupported structure', () => {
  for (const backup of [{}, { app: 'other' }, { app: 'bodyfit', state: { version: 9 } }, { app: 'bodyfit', state: { version: 2, assessment: { ...base, height: 0 } } }]) {
    assert.equal(validateBackup(backup).ok, false);
  }
  assert.equal(validateBackup({ app: 'bodyfit', state: createInitialState() }).ok, true);
});

test('file import reports invalid JSON and restores a valid calculator result', async () => {
  assert.equal((await parseImportFile({ text: async () => '{bad' })).ok, false);
  const parsed = await parseImportFile({ text: async () => exportJson({ version: 2, assessment: buildAssessment(base) }) });
  assert.equal(parsed.ok, true);
  near(parsed.preview.bmi, 70 / 1.75 ** 2);
  assert.equal(applyImport(parsed.data).ok, true);
  assert.equal(getState().assessment.weight, 70);
  assert.equal(applyImport({ version: 99 }).ok, false);
});

test('latest result persists and reset clears it', () => {
  setAssessment(buildAssessment(base));
  assert.equal(loadState().state.assessment.weight, 70);
  setAssessment(buildAssessment({ ...base, weight: 80 }));
  assert.equal(getState().assessment.weight, 80);
  resetState();
  assert.equal(getState().assessment, null);
  assert.equal(localStorage.getItem(STORAGE_KEY), null);
});

test('corrupt saved data starts with an empty calculator', () => {
  localStorage.setItem(STORAGE_KEY, '{broken');
  assert.equal(loadState().corrupt, true);
  clearState();
});

test('calculator works when localStorage writes fail, without restoring stale values', () => {
  saveState({ version: 2, assessment: buildAssessment(base) });
  const original = localStorage.setItem;
  localStorage.setItem = () => { throw new Error('quota'); };
  try {
    saveState({ version: 2, assessment: buildAssessment({ ...base, weight: 85 }) });
    assert.equal(loadState().state.assessment.weight, 85);
    assert.equal(applyImport({ version: 2, assessment: buildAssessment({ ...base, weight: 95 }) }).ok, true);
    assert.equal(getState().assessment.weight, 95);
    clearState();
    assert.equal(loadState().state.assessment, null);
  } finally { localStorage.setItem = original; }
});

test('only the calculator is routed and old URLs redirect', () => {
  const app = readFileSync('js/app.js', 'utf8');
  assert.ok(!/plan-ui|progress-ui|checkin-ui/.test(app));
  const html = readFileSync('index.html', 'utf8');
  assert.ok(!/id="neck"|id="activityLevel"|css\/(plan|progress|check-in)\.css/.test(html));
  for (const path of ['plan.html', 'progress.html', 'check-in.html']) {
    const source = readFileSync(path, 'utf8');
    assert.match(source, /window.location.replace/);
    assert.ok(!/data-page=/.test(source));
  }
  for (const path of ['js/ui/plan-ui.js', 'js/ui/progress-ui.js', 'js/ui/checkin-ui.js']) assert.equal(existsSync(path), false);
});

test('all calculator modules parse and local imports exist after feature removal', () => {
  for (const entry of readdirSync('js', { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
    const file = resolve(entry.parentPath ?? entry.path, entry.name);
    const checked = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    assert.equal(checked.status, 0, checked.stderr);
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/from ['"]([^'"]+)['"]/g)) {
      if (!match[1].startsWith('.')) continue;
      assert.ok(existsSync(resolve(dirname(file), match[1].split('?')[0])), `${file}: missing ${match[1]}`);
    }
  }
});

test('calculator HTML assets exist and browser test script parses', () => {
  const html = readFileSync('index.html', 'utf8');
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^(?:https?:|#)/.test(match[1])) continue;
    assert.ok(existsSync(match[1].split('?')[0]), `missing asset ${match[1]}`);
  }
  const browserTests = readFileSync('tests.html', 'utf8').match(/<script type="module">([\s\S]*?)<\/script>/)[1];
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  assert.doesNotThrow(() => new AsyncFunction(browserTests.replace(/^\s*import .+;$/gm, '')));
});
