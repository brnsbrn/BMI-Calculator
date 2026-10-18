import { calculateBmi } from './bmi.js?v=calculator-only-14';

/** Normal BMI is 18.5 inclusive to 25 exclusive. Round bounds inward to 0.1 kg. */
export function healthyWeightRange(heightCm) {
  const heightSquared = (heightCm / 100) ** 2;
  return {
    min: Math.ceil(18.5 * heightSquared * 10) / 10,
    max: (Math.ceil(25 * heightSquared * 10) - 1) / 10,
  };
}

export function calculateTargetWeight(weight, heightCm) {
  const bmi = calculateBmi(weight, heightCm);
  const { min, max } = healthyWeightRange(heightCm);
  if (bmi < 18.5) return min;
  if (bmi >= 25) return max;
  return weight;
}
