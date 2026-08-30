/**
 * stub-localstorage.mjs — polyfill localStorage untuk test Node.
 * Wajib di-import SEBELUM modul yang membaca localStorage.
 */
const store = new Map();

globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
  get length() {
    return store.size;
  },
  key: (i) => [...store.keys()][i] ?? null,
};