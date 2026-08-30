/**
 * tdee.js — total daily energy expenditure.
 */

export const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS = {
  sedentary: 'Jarang Berolahraga',
  light: 'Ringan (1–2x / minggu)',
  moderate: 'Sedang (3–4x / minggu)',
  active: 'Aktif (5–6x / minggu)',
  very_active: 'Sangat Aktif (hampir setiap hari)',
};

export function calculateTdee(bmr, activityLevel) {
  const factor = ACTIVITY_FACTORS[activityLevel] ?? ACTIVITY_FACTORS.sedentary;
  return Math.round(bmr * factor);
}