/**
 * app.js — entry point. Bootstrap shell + router per halaman.
 */

import { initShell } from './ui/shell.js?v=kaltim-sidebar-5';
import { hydrateIcons } from './ui/icons.js?v=kaltim-assets-4';
import { closeModal } from './ui/modal.js';

const PAGE = document.body.dataset.page || 'calculator';

function showInitError(error) {
  console.error('[BodyFit] Gagal memuat aplikasi:', error);
  window.BodyFitRuntime?.show('page-init');
}

function boot() {
  try {
    initShell();
    const modules = {
      calculator: './ui/calculator-ui.js?v=kaltim-assets-4',
      plan: './ui/plan-ui.js?v=kaltim-assets-4',
      progress: './ui/progress-ui.js?v=kaltim-assets-4',
      checkin: './ui/checkin-ui.js?v=kaltim-assets-4',
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
      .then((mod) => {
        mod[initNames[PAGE]]();
        hydrateIcons();
      })
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
