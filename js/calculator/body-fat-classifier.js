/**
 * body-fat-classifier.js
 * Kategori body fat beserta label & warna.
 *
 *   < 6        very_low   Sangat Rendah
 *   6 – <14    low        Rendah
 *   14 – <18   moderate   Sedang
 *   18 – <25   high       Tinggi
 *   >= 25      very_high  Sangat Tinggi
 */

export const CATEGORY_LABELS = {
  very_low: 'Sangat Rendah',
  low: 'Rendah',
  moderate: 'Sedang',
  high: 'Tinggi',
  very_high: 'Sangat Tinggi',
};

export const CATEGORY_COLORS = {
  very_low: '#14b8a6',
  low: '#14b8a6',
  moderate: '#f59e0b',
  high: '#f97316',
  very_high: '#dc2626',
};

export const BOUNDARIES = [
  { min: 0, max: 6, category: 'very_low' },
  { min: 6, max: 14, category: 'low' },
  { min: 14, max: 18, category: 'moderate' },
  { min: 18, max: 25, category: 'high' },
  { min: 25, max: 60, category: 'very_high' },
];

export function classifyBodyFat(bodyFat) {
  if (bodyFat >= 25) return 'very_high';
  if (bodyFat >= 18) return 'high';
  if (bodyFat >= 14) return 'moderate';
  if (bodyFat >= 6) return 'low';
  return 'very_low';
}

export function categoryLabel(category) {
  return CATEGORY_LABELS[category] ?? category;
}

export function categoryColor(category) {
  return CATEGORY_COLORS[category] ?? '#94a3b8';
}

export function categoryBadgeClass(category) {
  switch (category) {
    case 'very_low':
    case 'low':
      return 'badge-bf-low';
    case 'moderate':
      return 'badge-bf-moderate';
    case 'high':
      return 'badge-bf-high';
    case 'very_high':
      return 'badge-bf-very-high';
    default:
      return 'badge-neutral';
  }
}