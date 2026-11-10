// Small delights built on open-source libraries:
// canvas-confetti (ISC) for wins, @formkit/auto-animate (MIT) for list motion, Screen Wake Lock API for workouts.
import confetti from 'canvas-confetti';
import autoAnimate from '@formkit/auto-animate';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const accent = () => getComputedStyle(document.documentElement).getPropertyValue('--em').trim() || '#10b981';

export function celebrate(kind = 'win') {
  if (reduced()) return;
  const colors = [accent(), '#ffffff', '#f59e0b'];
  try {
    if (kind === 'pr') {
      confetti({ particleCount: 90, spread: 70, startVelocity: 45, origin: { y: 0.75 }, colors, disableForReducedMotion: true });
    } else if (kind === 'big') {
      const end = Date.now() + 900;
      (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.8 }, colors, disableForReducedMotion: true });
        confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.8 }, colors, disableForReducedMotion: true });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    } else {
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 }, colors, disableForReducedMotion: true });
    }
  } catch {}
  try { navigator.vibrate?.(40); } catch {}
}

// Fire once per key per day (e.g. protein floor hit).
export function celebrateOnce(key, kind) {
  const k = 'scaley:cel:' + key;
  try { if (localStorage.getItem(k)) return; localStorage.setItem(k, '1'); } catch {}
  celebrate(kind);
}

// ref callback: <div ref={aa}>
export function aa(el) { if (el && !el.__aa) { el.__aa = true; try { autoAnimate(el, { duration: 180 }); } catch {} } }

// ---------- wake lock while a workout is open ----------
let lock = null, want = false;
async function acquire() {
  if (!want || lock || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
  try { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } catch {}
}
document.addEventListener('visibilitychange', acquire);
export function keepAwake(on) {
  want = on;
  if (on) acquire(); else if (lock) { lock.release().catch(() => {}); lock = null; }
}

// Epley estimated 1RM, used for PR detection.
export const e1rm = (kg, reps) => (kg && reps ? kg * (1 + Math.min(reps, 12) / 30) : 0);
