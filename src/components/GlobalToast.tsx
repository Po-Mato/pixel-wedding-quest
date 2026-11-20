import React, { useEffect, useState } from 'react';
import { Check, Info } from 'lucide-react';
import { subscribeToast, ToastPayload } from '../utils/toast';

export const GlobalToast: React.FC = () => {
  const [toast, setToast] = useState<ToastPayload | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    const unsubscribe = subscribeToast((payload) => {
      setToast(payload);
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setToast((prev) => (prev?.id === payload.id ? null : prev));
      }, payload.durationMs);
    });
    return () => {
      unsubscribe();
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (!toast) return null;

  const toneClasses =
    toast.tone === 'info'
      ? 'bg-[#2d221e]/95 text-[#fffdf9] border-[#c59b6d]'
      : toast.tone === 'default'
      ? 'bg-[#3b2f2f]/95 text-[#fffdf9] border-[#d4b48c]'
      : 'bg-[#284b36]/95 text-[#fffdf9] border-[#7fb08d]';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[70] flex justify-center pointer-events-none font-sans"
    >
      <div
        key={toast.id}
        className={`max-w-[440px] px-4 py-2.5 rounded-full border shadow-xl backdrop-blur-sm flex items-center gap-2 text-xs sm:text-[13px] font-bold tracking-tight animate-fadeIn ${toneClasses}`}
      >
        {toast.tone === 'info' ? (
          <Info className="w-4 h-4 text-[#f0d29c] shrink-0" />
        ) : (
          <Check className="w-4 h-4 text-[#9fe0b0] shrink-0" />
        )}
        <span className="leading-snug break-keep">{toast.message}</span>
      </div>
    </div>
  );
};
