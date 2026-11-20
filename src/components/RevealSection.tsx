import React, { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../utils/motion';

interface RevealSectionProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
}

export const RevealSection: React.FC<RevealSectionProps> = ({
  id,
  className = '',
  children,
}) => {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState<boolean>(
    () => typeof IntersectionObserver === 'undefined' || prefersReducedMotion()
  );

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.06, rootMargin: '0px 0px -24px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <section
      ref={ref}
      id={id}
      className={`transition-all duration-500 ease-out will-change-transform ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      } ${className}`}
    >
      {children}
    </section>
  );
};
