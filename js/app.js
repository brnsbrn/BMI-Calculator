/**
 * app.js — entry point. Bootstrap shell + router per halaman.
 */

import { initShell } from './ui/shell.js';
import { hydrateIcons } from './ui/icons.js';
import { closeModal } from './ui/modal.js';

const PAGE = document.body.dataset.page || 'calculator';

function boot() {
  initShell();
  hydrateIcons();

  switch (PAGE) {
    case 'calculator':
      import('./ui/calculator-ui.js').then((m) => m.initCalculator());
      break;
    case 'plan':
      import('./ui/plan-ui.js').then((m) => m.initPlan());
      break;
    case 'progress':
      import('./ui/progress-ui.js').then((m) => m.initProgress());
      break;
    case 'checkin':
      import('./ui/checkin-ui.js').then((m) => m.initCheckin());
      break;
    default:
      break;
  }
}

document.addEventListener('DOMContentLoaded', boot);
window.addEventListener('beforeunload', closeModal);