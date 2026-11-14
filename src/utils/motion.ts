import confetti from 'canvas-confetti';

/**
 * Checks whether the user has enabled 'Reduce Motion' in their OS/browser accessibility settings.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Fires canvas-confetti only when reduced-motion is NOT enabled.
 */
export function fireCelebrationConfetti(options?: confetti.Options): void {
  if (prefersReducedMotion()) return;
  try {
    confetti({
      particleCount: 36,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#e899a0', '#d4af7a', '#84a98c'],
      ...options,
    });
  } catch {
    // ignore
  }
}
