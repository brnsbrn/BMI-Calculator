/**
 * meal-plan.js — generator contoh menu harian (deterministik per profil).
 *
 * 5 sesi makan: Sarapan 20%, Snack 10%, Makan Siang 30%, Snack Sore 10%, Makan Malam 30%.
 * Makan utama = protein + karbohidrat + sayur (diskalakan ke target makro sesi).
 * Snack = item snack yang diskalakan ke target kalori sesi.
 */

import { MEAL_FOODS, MEAL_SPLITS } from '../data/meals.js';

export function generateMealPlan({ calorieTarget, proteinTarget, carbTarget, fatTarget }, seed = 0) {
  const meals = [];
  let mainIndex = 0;
  let snackIndex = 0;

  for (const split of MEAL_SPLITS) {
    const mealCalories = Math.round(calorieTarget * split.share);
    const mealProtein = round1(proteinTarget * split.share);
    const mealCarb = round1(carbTarget * split.share);
    const mealFat = round1(fatTarget * split.share);

    const foods = split.kind === 'snack'
      ? snackFoods(mealCalories, snackIndex++, seed)
      : mainMealFoods(mealProtein, mealCarb, mainIndex++, seed);

    meals.push({
      meal: split.meal,
      foods,
      calories: Math.round(sum(foods.map((f) => f.calories))),
      protein: round1(sum(foods.map((f) => f.protein))),
      carbs: round1(sum(foods.map((f) => f.carbs))),
      fat: round1(sum(foods.map((f) => f.fat))),
    });
  }

  return meals;
}

function mainMealFoods(proteinGrams, carbGrams, index, seed) {
  const proteinItem = pick('protein', seed + index);
  const carbItem = pick('carb', seed + index * 2 + 1);
  const vegItem = pick('veg', seed + index * 3 + 2);

  return [
    scaledItem(proteinItem, safeDiv(proteinGrams, proteinItem.protein)),
    scaledItem(carbItem, safeDiv(carbGrams, carbItem.carbs)),
    scaledItem(vegItem, 1),
  ];
}

function snackFoods(calories, index, seed) {
  const item = pick('snack', seed + index * 5 + 7);
  const factor = Math.max(1, safeDiv(calories, item.calories));
  return [scaledItem(item, factor)];
}

function pick(category, salt) {
  const items = MEAL_FOODS[category] ?? [];
  if (items.length === 0) {
    return { name: 'Makanan sehat', serving: '1 porsi', calories: 150, protein: 10, carbs: 20, fat: 5 };
  }
  const idx = mod(hash(salt), items.length);
  return items[idx];
}

function scaledItem(item, factor) {
  const scale = round2(Math.max(0.25, factor));

  return {
    name: item.name,
    serving: scaledServing(item.serving, scale),
    calories: Math.round((item.calories ?? 0) * scale),
    protein: round1((item.protein ?? 0) * scale),
    carbs: round1((item.carbs ?? 0) * scale),
    fat: round1((item.fat ?? 0) * scale),
  };
}

function scaledServing(serving, factor) {
  const match = /^([\d.]+)\s*(.*)$/.exec(serving);
  if (!match) return serving;

  let value = parseFloat(match[1]) * factor;
  value = (value - Math.floor(value)) > 0.0001 ? Math.round(value * 10) / 10 : Math.round(value);

  const valueStr = String(value);
  if (Number.isInteger(value)) {
    return `${valueStr} ${match[2]}`;
  }
  return `${valueStr} ${match[2]}`;
}

function safeDiv(a, b) {
  return b > 0 ? a / b : 1;
}

function sum(values) {
  return values.reduce((acc, v) => acc + (Number(v) || 0), 0);
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

/**
 * Hash string sederhana-CRC32 (deterministik, seed tetap per profil).
 */
export function hashCrc32(str) {
  let crc = 0 ^ -1;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    crc = crc ^ code;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function hash(n) {
  let value = n >>> 0;
  value = ((value >>> 16) ^ value) * 0x45d9f3b;
  value = ((value >>> 16) ^ value) * 0x45d9f3b;
  value = (value >>> 16) ^ value;
  return value;
}