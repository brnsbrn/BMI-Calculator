/** Numeric form validation and accessible field errors. */
import { LIMITS } from './calculator/body-fat.js?v=calculator-only-14';
export { LIMITS };

export function parseNum(value) {
  if (value == null || String(value).trim() === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function validateCalculatorForm(values) {
  const errors = {};
  // Only calculator inputs may enter the result or browser storage.
  const v = { gender: values.gender };
  if (v.gender !== 'male' && v.gender !== 'female') errors.gender = 'Pilih jenis kelamin.';
  for (const field of ['age', 'weight', 'height', 'waist', 'hip', 'targetWeight']) {
    const optional = ['waist', 'hip', 'targetWeight'].includes(field);
    const raw = values[field];
    const empty = raw == null || String(raw).trim() === '';
    v[field] = parseNum(raw);
    if (optional && empty) continue;
    const label = LABELS[field];
    const { min, max } = LIMITS[field === 'targetWeight' ? 'weight' : field];
    if (v[field] === null) errors[field] = `${label} ${empty ? 'wajib diisi' : 'harus berupa angka yang valid'}.`;
    else if (v[field] < min || v[field] > max) errors[field] = `${label} harus antara ${min}–${max}.`;
  }
  if (!errors.age && !Number.isInteger(v.age)) errors.age = 'Umur harus berupa tahun bulat.';
  v.targetWeightManual = v.targetWeight !== null;
  return { ok: Object.keys(errors).length === 0, errors, values: v };
}

const LABELS = {
  age: 'Umur', weight: 'Berat badan', height: 'Tinggi badan',
  waist: 'Lingkar pinggang', hip: 'Lingkar panggul', targetWeight: 'Target berat',
};

export function showFieldError(input, message) {
  if (!input) return;
  const errorEl = document.getElementById(`${input.id}-error`);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.hidden = false;
    errorEl.setAttribute('role', 'alert');
    input.setAttribute('aria-describedby', [...new Set([...(input.getAttribute('aria-describedby') || '').split(' ').filter(Boolean), errorEl.id])].join(' '));
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
      const describedBy = (input.getAttribute('aria-describedby') || '').split(' ').filter((value) => value && value !== `${id}-error`).join(' ');
      if (describedBy) input.setAttribute('aria-describedby', describedBy);
      else input.removeAttribute('aria-describedby');
    }
    const errorEl = document.getElementById(`${id}-error`);
    if (errorEl) errorEl.hidden = true;
  });
}
