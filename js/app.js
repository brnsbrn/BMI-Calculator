/**
 * app.js — entry point. Bootstrap shell + router per halaman.
 */

import { initShell } from './ui/shell.js';
import { hydrateIcons } from './ui/icons.js';
import { closeModal } from './ui/modal.js';

const PAGE = document.body.dataset.page || 'calculator';

function showInitError(error) {
  console.error('[BodyFit] Gagal memuat aplikasi:', error);
  window.BodyFitRuntime?.show('page-init');
}

function boot() {
  try {
    initShell();
    hydrateIcons();
    const modules = {
      calculator: './ui/calculator-ui.js',
      plan: './ui/plan-ui.js',
      progress: './ui/progress-ui.js',
      checkin: './ui/checkin-ui.js',
    };
    const initNames = {
      calculator: 'initCalculator',
      plan: 'initPlan',
      progress: 'initProgress',
      checkin: 'initCheckin',
    };
    const modulePath = modules[PAGE];
    if (!modulePath) return;
    import(modulePath)
      .then((mod) => mod[initNames[PAGE]]())
      .catch(showInitError);
  } catch (error) {
    showInitError(error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
window.addEventListener('beforeunload', closeModal);
