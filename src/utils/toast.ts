export type ToastTone = 'default' | 'success' | 'info';

export interface ToastPayload {
  id: number;
  message: string;
  tone: ToastTone;
  durationMs: number;
}

type ToastListener = (payload: ToastPayload) => void;

const listeners = new Set<ToastListener>();
let toastSeq = 0;

export function showToast(
  message: string,
  tone: ToastTone = 'success',
  durationMs = 2600
): void {
  const payload: ToastPayload = {
    id: ++toastSeq,
    message,
    tone,
    durationMs,
  };
  listeners.forEach((listener) => listener(payload));
}

export function subscribeToast(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
