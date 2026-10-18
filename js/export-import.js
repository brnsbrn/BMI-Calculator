/** Calculator-only JSON backup; all imported results are recalculated. */
import { getState, reloadState } from './state.js?v=calculator-only-14';
import { exportJson, saveState, normalizeState } from './storage.js?v=calculator-only-14';
import { todayISO } from './format.js';

export function download() {
  const url = URL.createObjectURL(new Blob([exportJson(getState())], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `bodyfit-kalkulator-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function validateBackup(parsed) {
  if (!parsed || parsed.app !== 'bodyfit') return { ok: false, error: 'Bukan file backup BodyFit.' };
  try { return { ok: true, data: normalizeState(parsed.state) }; }
  catch (error) { return { ok: false, error: error.message }; }
}

export async function parseImportFile(file) {
  let parsed;
  try { parsed = JSON.parse(await file.text()); }
  catch { return { ok: false, error: 'File backup bukan JSON yang valid atau tidak dapat dibaca.' }; }
  const result = validateBackup(parsed);
  if (!result.ok) return result;
  const a = result.data.assessment;
  return {
    ...result,
    preview: {
      hasAssessment: !!a,
      gender: a ? (a.gender === 'male' ? 'Pria' : 'Wanita') : null,
      bmi: a?.bmi ?? null,
      bodyFat: a?.bodyFat ?? null,
      targetWeight: a?.targetWeight ?? null,
      weight: a?.weight ?? null,
    },
  };
}

export function applyImport(importedState) {
  try {
    saveState(normalizeState(importedState));
    reloadState();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
