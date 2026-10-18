/** Entry point for the calculator. */
import { initShell } from './ui/shell.js?v=calculator-only-14';
import { initCalculator } from './ui/calculator-ui.js?v=calculator-only-14';
import { hydrateIcons } from './ui/icons.js?v=kaltim-assets-4';
import { closeModal } from './ui/modal.js';

function boot() {
  try {
    initShell();
    initCalculator();
    hydrateIcons();
  } catch (error) {
    console.error('[BodyFit] Gagal memuat aplikasi:', error);
    window.BodyFitRuntime?.show('page-init');
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
window.addEventListener('beforeunload', closeModal);
