/** Only the latest calculator result is persisted. */
import { loadState, saveState, clearState, createInitialState } from './storage.js?v=calculator-only-14';
const loaded = loadState();
let state = loaded.state;
export const storageCorrupt = loaded.corrupt === true;
export function getState() { return state; }
export function reloadState() { state = loadState().state; return state; }
export function setAssessment(assessment) {
  state = { ...createInitialState(), assessment };
  saveState(state);
}
export function resetState() {
  clearState();
  state = createInitialState();
}
