/**
 * workout.js — jadwal latihan mingguan dari template.
 */

import { WORKOUT_TEMPLATES, WORKOUT_TYPE_LABELS, WORKOUT_DAY_LABELS, WORKOUT_DAY_SHORT } from '../data/workouts.js';

export function weeklySchedule(templateKey) {
  const template = WORKOUT_TEMPLATES[templateKey] ?? null;
  return template?.days ?? [];
}

export function templateName(templateKey) {
  return WORKOUT_TEMPLATES[templateKey]?.name ?? 'Jadwal Latihan';
}

export function typeLabel(type) {
  return WORKOUT_TYPE_LABELS[type] ?? 'Latihan';
}

export function dayLabel(dayOfWeek) {
  return WORKOUT_DAY_LABELS[dayOfWeek] ?? dayOfWeek;
}

export function dayShort(dayOfWeek) {
  return WORKOUT_DAY_SHORT[dayOfWeek] ?? dayOfWeek;
}

/**
 * JS getDay(): 0 = Minggu ... 6 = Sabtu → day_of_week 7 = Minggu, 1 = Senin.
 */
export function isToday(dayOfWeek) {
  const jsDay = new Date().getDay(); // 0=Min
  const mapped = jsDay === 0 ? 7 : jsDay;
  return mapped === dayOfWeek;
}

export function scheduledCount(days) {
  return days.filter((d) => d.type !== 'rest').length;
}

export function typeOrder(type) {
  const order = { strength: 0, cardio: 1, recovery: 2, light: 3, rest: 4 };
  return order[type] ?? 5;
}