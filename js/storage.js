/**
 * storage.js — persistence ke localStorage.
 * Semua data disimpan sebagai satu root state dalam satu key.
 */

export const STORAGE_KEY = 'bodyfit_state';

/**
 * Tes ketersediaan localStorage (bisa diblokir oleh kebijakan privasi).
 * Jika tidak tersedia, fallback in-memory — aplikasi tetap berfungsi
 * untuk sesi berjalan (tanpa persistence antar-kunjungan).
 */
let available = true;
let checked = false;

function localStorageReady() {
  if (!checked) {
    checked = true;
    try {
      const probe = '__bodyfit_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
    } catch {
      available = false;
    }
  }
  return available;
}

const memory = new Map();

function safeGetItem(key) {
  if (!localStorageReady()) return memory.get(key) ?? null;
  try {
    return localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function safeSetItem(key, value) {
  if (!localStorageReady()) {
    memory.set(key, value);
    return true;
  }
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    memory.set(key, value);
    return true;
  }
}

function safeRemoveItem(key) {
  if (!localStorageReady()) {
    memory.delete(key);
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch {
    memory.delete(key);
  }
}

export function isPersistent() {
  return localStorageReady();
}

export function createInitialState() {
  return {
    version: 1,
    assessment: null,
    recommendation: null,
    plan: null,
    progress: [],
    checkins: [],
    workoutStatus: {},
    preferences: {
      unit: 'metric',
    },
  };
}

export function saveState(state) {
  safeSetItem(STORAGE_KEY, JSON.stringify(state));
  return { ok: true };
}

export function loadState() {
  const raw = safeGetItem(STORAGE_KEY);
  if (!raw) {
    return { state: createInitialState(), stored: false };
  }
  try {
    const parsed = JSON.parse(raw);
    return { state: normalize(parsed), stored: true };
  } catch {
    return { state: createInitialState(), stored: false, corrupt: true };
  }
}

export function clearState() {
  safeRemoveItem(STORAGE_KEY);
}

export function exportJson(state) {
  return JSON.stringify(
    {
      app: 'bodyfit',
      exportedAt: new Date().toISOString(),
      state,
    },
    null,
    2,
  );
}

/**
 * Normalisasi state dari localStorage (melengkapi field yang hilang
 * dengan nilai default tanpa menghapus data valid).
 */
function normalize(raw) {
  const initial = createInitialState();
  const base = { ...initial, ...raw };

  base.preferences = { ...initial.preferences, ...(raw.preferences ?? {}) };

  if (!Array.isArray(base.progress)) base.progress = [];
  if (!Array.isArray(base.checkins)) base.checkins = [];
  if (!base.workoutStatus || typeof base.workoutStatus !== 'object') base.workoutStatus = {};
  if (base.plan && typeof base.plan === 'object') {
    base.plan.currentWeek = Number(base.plan.currentWeek) || 1;
  }

  return base;
}