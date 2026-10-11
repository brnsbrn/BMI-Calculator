/**
 * body-fat.js
 * Kalkulasi body fat sebagai service terpisah agar mudah diganti/dikoreksi.
 *
 * - Pria  : US Navy / Hodgdon–Beckett
 * - Wanita: RFM (Relative Fat Mass, Woolcott & Bergman 2018)
 */

export const BODY_FAT_VERSION = '1.2';

export const LIMITS = {
  age: { min: 18, max: 80 },
  weight: { min: 30, max: 300 },
  height: { min: 120, max: 250 },
  neck: { min: 20, max: 80 },
  waist: { min: 40, max: 200 },
  hip: { min: 40, max: 200 },
};

export const MAX_BODY_FAT = 60;
export const MIN_BODY_FAT = 1;

/**
 * US Navy / Hodgdon–Beckett untuk pria.
 * @returns {number} body fat dalam persen
 */
export function navyMale(heightCm, neckCm, waistCm) {
  // NHRC report 84-11 density coefficients require centimetres, not inches.
  const log1 = Math.log10(waistCm - neckCm);
  const log2 = Math.log10(heightCm);

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
 * Fallback estimasi saat data lingkar tidak lengkap.
 * Rumus Deurenberg: BF% = 1.2×BMI + 0.23×umur − 10.8×sex − 5.4.
 */
export function bmiAgeEstimate({ gender, age, weight, height }) {
  const sex = gender === 'male' ? 1 : 0;
  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);
  return (1.2 * bmi) + (0.23 * age) - (10.8 * sex) - 5.4;
}

/**
 * Hitung body fat dengan pembulatan; estimasi pria di luar domain ditolak.
 * @param {'male'|'female'} gender
 * @returns {number} persen body fat (1 angka desimal, dibatasi 1–60)
 */
export function calculateBodyFat(input) {
  const { gender, height, neck, waist } = input;
  const hasWaist = typeof waist === 'number' && Number.isFinite(waist);
  const hasNeck = typeof neck === 'number' && Number.isFinite(neck);
  const bodyFat = gender === 'male' && hasWaist && hasNeck
    ? navyMale(height, neck, waist)
    : gender === 'female' && hasWaist
      ? rfmFemale(height, waist)
      : bmiAgeEstimate(input);

  if (gender === 'male' && (!Number.isFinite(bodyFat) || bodyFat < MIN_BODY_FAT || bodyFat > MAX_BODY_FAT)) {
    const measured = hasWaist && hasNeck;
    const error = new RangeError(measured
      ? 'Ukuran leher dan pinggang menghasilkan estimasi di luar rentang rumus. Periksa kembali pengukuran, atau kosongkan data lingkar untuk memakai estimasi BMI dan umur.'
      : 'Data tubuh menghasilkan estimasi di luar rentang rumus. Periksa kembali umur, berat, dan tinggi badan.');
    error.field = measured ? 'waist' : null;
    throw error;
  }
  return round1(clamp(bodyFat, MIN_BODY_FAT, MAX_BODY_FAT));
}

export function bodyFatFormula({ gender, neck, waist }) {
  if (gender === 'male' && Number.isFinite(neck) && Number.isFinite(waist)) {
    return 'US Navy (Hodgdon–Beckett)';
  }
  if (gender === 'female' && Number.isFinite(waist)) {
    return 'RFM (Woolcott & Bergman 2018)';
  }
  return 'Deurenberg (BMI, umur, dan jenis kelamin)';
}

export function assertInputs({ gender = 'male', age, weight, height, neck, waist, hip }) {
  if (gender !== 'male' && gender !== 'female') throw new RangeError('Pilih jenis kelamin.');
  assertRange('age', age);
  assertRange('weight', weight);
  assertRange('height', height);
  if (!Number.isInteger(age)) throw new RangeError('Umur harus berupa tahun bulat.');

  if (waist !== null && waist !== undefined) {
    assertRange('waist', waist);
  }

  if (neck !== null && neck !== undefined) {
    assertRange('neck', neck);
  }
  if (hip !== null && hip !== undefined) assertRange('hip', hip);

  if (gender === 'male' && waist !== null && waist !== undefined && neck !== null && neck !== undefined && waist <= neck) {
    throw new RangeError('Lingkar pinggang harus lebih besar dari lingkar leher.');
  }
}

function assertRange(field, value) {
  const { min, max } = LIMITS[field];
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${field} harus berada di rentang ${min}–${max}.`);
  }
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function round1(value) {
  return Math.round(value * 10) / 10;
}
