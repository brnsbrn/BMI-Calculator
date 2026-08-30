/**
 * body-fat.js
 * Kalkulasi body fat sebagai service terpisah agar mudah diganti/dikoreksi.
 *
 * - Pria  : US Navy / Hodgdon–Beckett
 * - Wanita: RFM (Relative Fat Mass, Woolcott & Bergman 2018)
 */

export const BODY_FAT_VERSION = '1.0';

export const LIMITS = {
  age: { min: 18, max: 80 },
  weight: { min: 30, max: 300 },
  height: { min: 120, max: 250 },
  neck: { min: 20, max: 80 },
  waist: { min: 40, max: 200 },
};

export const MAX_BODY_FAT = 60;
export const MIN_BODY_FAT = 1;

/**
 * US Navy / Hodgdon–Beckett untuk pria.
 * @returns {number} body fat dalam persen
 */
export function navyMale(heightCm, neckCm, waistCm) {
  const heightIn = heightCm / 2.54;
  const neckIn = neckCm / 2.54;
  const waistIn = waistCm / 2.54;

  const log1 = Math.log10(waistIn - neckIn);
  const log2 = Math.log10(heightIn);

  const density = 1.0324 - 0.19077 * log1 + 0.15456 * log2;

  return (495 / density) - 450;
}

/**
 * RFM (Woolcott & Bergman 2018) untuk wanita (tanpa input hip).
 * @returns {number} body fat dalam persen
 */
export function rfmFemale(heightCm, waistCm) {
  const ratio = heightCm / waistCm;
  return 64 - (20 * ratio) + 12;
}

/**
 * Hitung body fat dengan clamp + pembulatan.
 * @param {'male'|'female'} gender
 * @returns {number} persen body fat (1 angka desimal, dibatasi 1–60)
 */
export function calculateBodyFat({ gender, height, neck, waist }) {
  const bodyFat = gender === 'male'
    ? navyMale(height, neck, waist)
    : rfmFemale(height, waist);

  return round1(clamp(bodyFat, MIN_BODY_FAT, MAX_BODY_FAT));
}

export function assertInputs({ age, weight, height, neck, waist }) {
  assertRange('age', age);
  assertRange('weight', weight);
  assertRange('height', height);
  assertRange('neck', neck);
  assertRange('waist', waist);

  if (waist <= neck) {
    throw new RangeError('Lingkar pinggang harus lebih besar dari lingkar leher.');
  }
}

function assertRange(field, value) {
  const { min, max } = LIMITS[field];
  if (typeof value !== 'number' || Number.isNaN(value) || value < min || value > max) {
    throw new RangeError(`${field} harus berada di rentang ${min}–${max}.`);
  }
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function round1(value) {
  return Math.round(value * 10) / 10;
}