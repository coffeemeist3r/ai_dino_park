/**
 * PWA auto-update — keeps an installed phone/home-screen copy current with main.
 *
 * Policy:
 *  - Update found within the first seconds of launch → apply silently (reload).
 *    The player hasn't done anything yet, so a reload costs nothing.
 *  - Update found mid-session → show a toast; the player taps to restart so we
 *    never yank the canvas out from under them.
 *  - While running, re-check the server every CHECK_INTERVAL_MS so a phone left
 *    open still notices new studio commits.
 *
 * This module is the only place that touches the service-worker runtime; it is
 * imported once from main.ts and must stay out of the unit-test import graph
 * (the `virtual:pwa-register` module only exists under Vite).
 */
import { registerSW } from 'virtual:pwa-register';

/** Updates discovered this soon after launch reload silently. */
const AUTO_APPLY_WINDOW_MS = 15_000;
/** How often a running session asks the server if a new build exists. */
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

export function setupPwaUpdates(): void {
  // Service workers need a secure context; skip cleanly on plain-http LAN use.
  if (!('serviceWorker' in navigator)) return;

  const launchedAt = Date.now();
  const updateSW = registerSW({
    onNeedRefresh() {
      if (Date.now() - launchedAt < AUTO_APPLY_WINDOW_MS) {
        void updateSW(true);
        return;
      }
      showUpdateToast(() => void updateSW(true));
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      setInterval(() => void registration.update(), CHECK_INTERVAL_MS);
    },
  });
}

function showUpdateToast(apply: () => void): void {
  if (document.getElementById('pwa-update-toast')) return;

  const toast = document.createElement('div');
  toast.id = 'pwa-update-toast';
  toast.setAttribute('role', 'status');
  toast.style.cssText = [
    'position:fixed',
    'left:50%',
    'bottom:16px',
    'transform:translateX(-50%)',
    'background:#1a3a1a',
    'color:#e8e8d6',
    'border:1px solid #8fd14f',
    'border-radius:6px',
    'padding:10px 14px',
    'font-family:ui-monospace,"Courier New",monospace',
    'font-size:14px',
    'z-index:10000',
    'display:flex',
    'gap:12px',
    'align-items:center',
    'box-shadow:0 2px 8px rgba(0,0,0,0.6)',
  ].join(';');

  const label = document.createElement('span');
  label.textContent = '🦕 New park build available';

  const reload = document.createElement('button');
  reload.textContent = 'Update';
  reload.style.cssText =
    'background:#8fd14f;color:#0a0a0a;border:0;border-radius:4px;padding:6px 10px;font:inherit;cursor:pointer';
  reload.addEventListener('click', apply);

  const dismiss = document.createElement('button');
  dismiss.textContent = 'Later';
  dismiss.style.cssText =
    'background:transparent;color:#e8e8d6;border:1px solid #555;border-radius:4px;padding:6px 10px;font:inherit;cursor:pointer';
  dismiss.addEventListener('click', () => toast.remove());

  toast.append(label, reload, dismiss);
  document.body.appendChild(toast);
}
