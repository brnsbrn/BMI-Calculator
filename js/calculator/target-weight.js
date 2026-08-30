/**
 * target-weight.js — estimasi target berat berbasis lean body mass.
 *   leanMass = weight * (1 − bodyFat/100)
 *   target   = leanMass / (1 − targetBodyFat/100)
 */

export function leanMass(weight, bodyFat) {
  return round1(weight * (1 - bodyFat / 100));
}

export function calculateTargetWeight(weight, bodyFat, targetBodyFat) {
  if (targetBodyFat === null || targetBodyFat === undefined || targetBodyFat <= 0 || targetBodyFat >= 100) {
    return null;
  }
  const lean = weight * (1 - bodyFat / 100);
  return round1(lean / (1 - targetBodyFat / 100));
}

function round1(value) {
  return Math.round(value * 10) / 10;
}