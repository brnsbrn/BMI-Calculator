/** Latest calculator result with in-memory fallback when storage is blocked. */
import { validateCalculatorForm } from './validation.js?v=calculator-only-14';
import { buildAssessment } from './calculator/assessment.js?v=calculator-only-14';
export const STORAGE_KEY = 'bodyfit_state';
let persistent = true;
let fallback = null;
export function isPersistent() { return persistent; }
export function createInitialState() { return { version: 2, assessment: null }; }

/** Accept old backups, keep only calculator inputs, and recalculate derived values. */
export function normalizeState(raw) {
  if (!raw || typeof raw !== 'object' || ![1, 2].includes(raw.version)) {
    throw new RangeError('Versi atau struktur backup tidak didukung.');
  }
  if (raw.assessment === null) return createInitialState();
  if (!raw.assessment || typeof raw.assessment !== 'object') {
    throw new RangeError('Data kalkulator pada backup tidak valid.');
  }
  const source = raw.assessment;
  const result = validateCalculatorForm({
    ...source,
    targetWeight: source.targetWeightManual === true ? source.targetWeight : null,
  });
  if (!result.ok) throw new RangeError('Data pengukuran pada backup tidak valid.');
  return { version: 2, assessment: buildAssessment(result.values) };
}

export function saveState(state) {
  fallback = JSON.stringify(normalizeState(state));
  try { localStorage.setItem(STORAGE_KEY, fallback); }
  catch { persistent = false; }
  return { ok: true };
}

export function loadState() {
  let raw = fallback;
  try { if (persistent) raw = localStorage.getItem(STORAGE_KEY) ?? fallback; }
  catch { persistent = false; }
  if (!raw) return { state: createInitialState(), stored: false };
  try { return { state: normalizeState(JSON.parse(raw)), stored: true }; }
  catch { return { state: createInitialState(), stored: false, corrupt: true }; }
}

export function clearState() {
  fallback = null;
  try { localStorage.removeItem(STORAGE_KEY); }
  catch { persistent = false; }
}

export function exportJson(state) {
  return JSON.stringify({ app: 'bodyfit', exportedAt: new Date().toISOString(), state: normalizeState(state) }, null, 2);
}
