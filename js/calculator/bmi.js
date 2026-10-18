/**
 * bmi.js — indeks massa tubuh.
 *   BMI = weight / (height/100)^2
 */

export const BMI_LABELS = [
  { min: 0, max: 18.5, label: 'Berat badan kurang', tone: 'info' },
  { min: 18.5, max: 25, label: 'Normal', tone: 'success' },
  { min: 25, max: 30, label: 'Berat badan berlebih', tone: 'warning' },
  { min: 30, max: Infinity, label: 'Obesitas', tone: 'danger' },
];

export function calculateBmi(weight, heightCm) {
  if (!Number.isFinite(weight) || !Number.isFinite(heightCm) || weight <= 0 || heightCm <= 0) {
    throw new RangeError('Berat dan tinggi badan harus berupa angka positif.');
  }
  // Keep full precision for category boundaries; only round for display.
  return weight / Math.pow(heightCm / 100, 2);
}

export function bmiLabel(bmi) {
  if (bmi < 18.5) return BMI_LABELS[0].label;
  if (bmi < 25) return BMI_LABELS[1].label;
  if (bmi < 30) return BMI_LABELS[2].label;
  return BMI_LABELS[3].label;
}

export function bmiTone(bmi) {
  if (bmi < 18.5) return 'info';
  if (bmi < 25) return 'success';
  if (bmi < 30) return 'warning';
  return 'danger';
}

export function bmiDescription(bmi) {
  if (bmi < 18.5) {
    return 'Berat badan Anda berada di bawah rentang ideal. Fokus pada penambahan berat yang sehat dengan surplus kalori terkontrol.';
  }
  if (bmi < 25) {
    return 'Berat badan Anda berada dalam rentang ideal. Pertahankan pola makan seimbang dan rutinitas olahraga.';
  }
  if (bmi < 30) {
    return 'Berat badan Anda sedikit di atas ideal. Defisit kalori ringan dan aktivitas teratur dapat membantu.';
  }
  return 'Berat badan Anda termasuk kategori obesitas. Konsultasikan dengan tenaga kesehatan untuk pendekatan yang aman.';
}

/**
 * Posisi marker pada scale BMI (0–100%) dengan domain 10–40.
 */
export function bmiMarkerPercent(bmi) {
  const clamp = Math.min(40, Math.max(10, bmi));
  return ((clamp - 10) / (40 - 10)) * 100;
}
