/**
 * bmr.js — Mifflin-St Jeor.
 *
 *   Pria  : 10w + 6.25h − 5a + 5
 *   Wanita: 10w + 6.25h − 5a − 161
 */

export function calculateBmr({ gender, weight, height, age }) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === 'male' ? Math.round(base + 5) : Math.round(base - 161);
}