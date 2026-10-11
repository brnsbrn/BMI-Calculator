/**
 * safety-guard.js — safety warning berbasis rule kesehatan.
 */

export const HEALTHY_MIN = {
  male: 6,
  female: 14,
};

/**
 * @returns {Array<{code:string, message:string, tone:string}>}
 */
export function buildWarnings({ gender, bodyFat, age, weight, height, bmi }) {
  const warnings = [];

  if (bmi < 18.5) {
    warnings.push({
      code: 'bmi_underweight',
      message: 'BMI menunjukkan berat badan kurang. Target penurunan berat badan dan defisit kalori otomatis dinonaktifkan. Periksa kembali ukuran lingkar dan konsultasikan kebutuhan nutrisi dengan tenaga kesehatan.',
      tone: 'warning',
    });
  }

  if (age < 18) {
    warnings.push({
      code: 'age_below_min',
      message: 'Kalkulator ini ditujukan untuk orang dewasa (18 tahun ke atas).',
      tone: 'warning',
    });
  }

  if (bmi >= 40) {
    warnings.push({
      code: 'bmi_high',
      message:
        'Indeks massa tubuh Anda berada dalam rentang tinggi. Pertimbangkan konsultasi dengan tenaga kesehatan sebelum memulai program latihan atau nutrisi baru.',
      tone: 'warning',
    });
  }

  const minHealthy = HEALTHY_MIN[gender];
  if (bodyFat < minHealthy) {
    warnings.push({
      code: 'body_fat_low',
      message:
        'Persentase body fat Anda berada di bawah rentang yang umumnya disarankan. Prioritas kesehatan adalah menjaga energi dan fungsi tubuh — pertimbangkan berkonsultasi dengan tenaga kesehatan.',
      tone: 'warning',
    });
  }

  return warnings;
}
