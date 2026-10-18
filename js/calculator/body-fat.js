/** Optional body-fat estimates, independent of BMI and target weight.
 * RFM: https://pubmed.ncbi.nlm.nih.gov/30030479/
 * Deurenberg: https://pubmed.ncbi.nlm.nih.gov/2043597/
 */
export const LIMITS = {
  age: { min: 18, max: 80 },
  weight: { min: 30, max: 300 },
  height: { min: 120, max: 250 },
  waist: { min: 40, max: 200 },
  hip: { min: 40, max: 200 },
};

export function rfm(gender, heightCm, waistCm) {
  return 64 - 20 * (heightCm / waistCm) + (gender === 'female' ? 12 : 0);
}

export function bmiAgeEstimate({ gender, age, weight, height }) {
  const bmi = weight / (height / 100) ** 2;
  return 1.2 * bmi + 0.23 * age - (gender === 'male' ? 10.8 : 0) - 5.4;
}

export function calculateBodyFat(input) {
  const estimate = Number.isFinite(input.waist)
    ? rfm(input.gender, input.height, input.waist)
    : bmiAgeEstimate(input);
  // An unsupported estimate must not invalidate BMI or become a false percentage.
  return Number.isFinite(estimate) && estimate >= 1 && estimate <= 60 ? round1(estimate) : null;
}

export function bodyFatFormula({ waist }) {
  return Number.isFinite(waist)
    ? 'RFM (Woolcott & Bergman 2018)'
    : 'Deurenberg (BMI, umur, dan jenis kelamin)';
}

export function assertInputs({ gender, age, weight, height, waist, hip }) {
  if (gender !== 'male' && gender !== 'female') throw new RangeError('Pilih jenis kelamin.');
  for (const [field, value] of Object.entries({ age, weight, height, waist, hip })) {
    if ((field === 'waist' || field === 'hip') && value == null) continue;
    const { min, max } = LIMITS[field];
    if (!Number.isFinite(value) || value < min || value > max) {
      const error = new RangeError(`${field} harus berada di rentang ${min}–${max}.`);
      error.field = field;
      throw error;
    }
  }
  if (!Number.isInteger(age)) throw new RangeError('Umur harus berupa tahun bulat.');
}

export function round1(value) {
  return Math.round(value * 10) / 10;
}
