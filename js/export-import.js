/**
 * export-import.js — backup JSON: export, import, validasi schema.
 */

import { getState, reloadState } from './state.js';
import { exportJson, saveState } from './storage.js';
import { createInitialState } from './storage.js';
import { todayISO } from './format.js';

export function download() {
  const blob = new Blob([exportJson(getState())], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bodyfit-backup-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * @param {File} file
 * @returns {{ok:boolean, error?:string, preview?:object, data?:object}}
 */
export function parseImportFile(file) {
  return file.text()
    .then((text) => {
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        return { ok: false, error: 'File backup tidak valid (bukan JSON yang benar).' };
      }

      const validation = validateBackup(parsed);
      if (!validation.ok) {
        return { ok: false, error: validation.error };
      }

      const importedState = parsed.state;
      const preview = buildPreview(importedState);

      return { ok: true, preview, data: importedState };
    })
    .catch(() => ({ ok: false, error: 'Gagal membaca file backup.' }));
}

/**
 * Validasi schema backup JSON sebelum dimasukkan ke state.
 * Mencegah data rusak/berbahaya menggantikan state yang valid.
 */
export function validateBackup(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'File backup tidak valid.' };
  }
  if (parsed.app !== 'bodyfit') {
    return { ok: false, error: 'Bukan file backup BodyFit.' };
  }
  const s = parsed.state;
  if (!s || typeof s !== 'object') {
    return { ok: false, error: 'Struktur state backup tidak ditemukan.' };
  }
  if (s.version !== 1) {
    return { ok: false, error: 'Versi backup tidak didukung.' };
  }
  if (s.assessment !== null && (typeof s.assessment !== 'object' || typeof s.assessment.bodyFat !== 'number')) {
    return { ok: false, error: 'Data assessment pada backup tidak valid.' };
  }
  if (s.checkins !== undefined && !Array.isArray(s.checkins)) {
    return { ok: false, error: 'Data check-in pada backup tidak valid.' };
  }
  if (s.progress !== undefined && !Array.isArray(s.progress)) {
    return { ok: false, error: 'Data progres pada backup tidak valid.' };
  }
  if (s.workoutStatus !== undefined && (typeof s.workoutStatus !== 'object' || s.workoutStatus === null)) {
    return { ok: false, error: 'Data status latihan pada backup tidak valid.' };
  }
  return { ok: true };
}

function buildPreview(importedState) {
  const a = importedState.assessment;
  const c = importedState.checkins ?? [];
  const last = c[c.length - 1];

  return {
    hasAssessment: !!a,
    hasPlan: !!importedState.plan,
    gender: a ? (a.gender === 'male' ? 'Pria' : 'Wanita') : null,
    bodyFat: a ? a.bodyFat : null,
    targetWeight: a ? a.targetWeight : null,
    checkinCount: c.length,
    currentWeek: importedState.plan?.currentWeek ?? 1,
    lastCheckin: last ? last.date : null,
    lastWeight: last ? last.weight : a?.weight ?? null,
    progressCount: importedState.progress?.length ?? 0,
  };
}

export function applyImport(importedState) {
  const base = createInitialState();
  const merged = {
    ...base,
    ...importedState,
    preferences: { ...base.preferences, ...(importedState.preferences ?? {}) },
  };
  const result = saveState(merged);
  if (!result.ok) {
    return { ok: false, error: 'Gagal menyimpan data ke browser.' };
  }
  reloadState();
  return { ok: true };
}