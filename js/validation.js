/**
 * validation.js — validasi form & relasi antar-field dengan pesan Indonesia.
 * Menandai error per-field pada elemen .field-error di samping input.
 */

import { LIMITS } from './calculator/body-fat.js';

export function parseNum(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

// Re-export untuk konfigurasi range yang dipakai bersama
export { LIMITS };

/**
 * Validasi form kalkulator. `needsNeck` = true untuk gender male.
 * @returns {{ok:boolean, errors:Record<string,string>, values:object}}
 */
export function validateCalculatorForm(values) {
  const errors = {};
  const v = { ...values };

  // gender
  if (v.gender !== 'male' && v.gender !== 'female') {
    errors.gender = 'Pilih jenis kelamin.';
  }

  const needsNeck = v.gender === 'male';

  const numberFields = ['age', 'weight', 'height', 'neck', 'waist'];
  for (const field of numberFields) {
    const msg = validateNumber(v[field], field);
    if (msg) {
      errors[field] = msg;
    }
    v[field] = parseNum(v[field]);
  }

  // relasi waist > neck (khusus male)
  if (needsNeck && !errors.waist && !errors.neck && v.waist !== null && v.neck !== null && v.waist <= v.neck) {
    errors.waist = 'Lingkar pinggang harus lebih besar dari lingkar leher.';
  }

  // target berat opsional
  if (parseNum(v.targetWeight) !== null) {
    const msg = validateNumber(v.targetWeight, 'weight');
    if (msg) errors.targetWeight = 'Target berat harus 30–300 kg.';
    v.targetWeight = parseNum(v.targetWeight);
    v.targetWeightManual = true;
  } else {
    v.targetWeight = null;
    v.targetWeightManual = false;
  }

  return { ok: Object.keys(errors).length === 0, errors, values: v };
}

/**
 * Validasi form check-in.
 * @returns {{ok:boolean, errors:Record<string,string>, values:object}}
 */
export function validateCheckinForm(values) {
  const errors = {};
  const v = { ...values };

  const weightMsg = validateNumber(v.weight, 'weight');
  if (weightMsg) errors.weight = 'Berat harus 30–300 kg.';

  // waist opsional, tapi wajib > minimal
  if (parseNum(v.waist) !== null) {
    const msg = validateNumber(v.waist, 'waist');
    if (msg) errors.waist = 'Lingkar pinggang harus 40–200 cm.';
    else v.waist = parseNum(v.waist);
  } else {
    v.waist = null;
  }

  // bodyFat opsional
  if (parseNum(v.bodyFat) !== null) {
    const bf = parseNum(v.bodyFat);
    if (bf < 1 || bf > 60 || !Number.isFinite(bf)) {
      errors.bodyFat = 'Body fat harus 1–60%.';
    } else {
      v.bodyFat = bf;
    }
  } else {
    v.bodyFat = null;
  }

  // workoutsCompleted integer 0..30
  const wc = parseNum(v.workoutsCompleted);
  if (wc === null || wc < 0 || wc > 30 || !Number.isInteger(Number(v.workoutsCompleted))) {
    errors.workoutsCompleted = 'Jumlah latihan harus berupa angka 0–30.';
  } else {
    v.workoutsCompleted = wc;
  }

  // energy & difficulty 1..5
  for (const field of ['energy', 'difficulty']) {
    const val = parseNum(v[field]);
    if (val === null || val < 1 || val > 5) {
      errors[field] = `${field === 'energy' ? 'Tingkat energi' : 'Kesulitan'} 1–5.`;
    } else {
      v[field] = val;
    }
  }

  // feedback ≤ 1000 char
  const fb = v.feedback == null ? '' : String(v.feedback);
  if (fb.length > 1000) {
    errors.feedback = 'Catatan maksimal 1000 karakter.';
  }
  v.feedback = fb;

  return { ok: Object.keys(errors).length === 0, errors, values: v };
}

function validateNumber(value, field) {
  if (value === undefined || parseNum(value) === null) {
    return `${LABELS[field]} wajib diisi.`;
  }
  const { min, max } = LIMITS[field];
  if (value < min || value > max) {
    return `${LABELS[field]} harus antara ${min}–${max}.`;
  }
  return '';
}

const LABELS = {
  age: 'Umur',
  weight: 'Berat badan',
  height: 'Tinggi badan',
  neck: 'Lingkar leher',
  waist: 'Lingkar pinggang',
};

/* ---------------- DOM helpers ---------------- */

export function showFieldError(input, message) {
  if (!input) return;
  const errorEl = document.getElementById(`${input.id}-error`);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.hidden = false;
    errorEl.setAttribute('role', 'alert');
  }
  input.setAttribute('aria-invalid', 'true');
  input.classList.add('invalid');
}

export function clearFieldErrors(form, fieldIds) {
  (fieldIds || []).forEach((id) => {
    const input = form?.querySelector(`#${id}`);
    if (input) {
      input.removeAttribute('aria-invalid');
      input.classList.remove('invalid');
    }
    const errorEl = document.getElementById(`${id}-error`);
    if (errorEl) errorEl.hidden = true;
  });
}