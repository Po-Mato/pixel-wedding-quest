import React, { useRef, useState } from 'react';
import { PIXEL_ASSETS } from './PixelSprites';

interface InGameVirtualJoystickProps {
  onVectorChange: (dx: number, dy: number) => void;
}

export const InGameVirtualJoystick: React.FC<InGameVirtualJoystickProps> = ({
  onVectorChange,
}) => {
  const activePointerIdRef = useRef<number | null>(null);
  const baseRef = useRef<HTMLDivElement | null>(null);
  const [thumbOffset, setThumbOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isActive, setIsActive] = useState(false);

  const MAX_TRAVEL = 23;

  const updateFromClientPoint = (clientX: number, clientY: number) => {
    const el = baseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rawDx = clientX - centerX;
    const rawDy = clientY - centerY;
    const dist = Math.hypot(rawDx, rawDy);

    if (dist < 3.5) {
      setThumbOffset({ x: 0, y: 0 });
      onVectorChange(0, 0);
      return;
    }

    const clampedDist = Math.min(MAX_TRAVEL, dist);
    const nx = rawDx / dist;
    const ny = rawDy / dist;

    setThumbOffset({
      x: nx * clampedDist,
      y: ny * clampedDist,
    });

    // Full speed reached quickly at 55% travel so thumb movement feels immediate and responsive
    const strength = Math.min(1, dist / (MAX_TRAVEL * 0.55));
    onVectorChange(nx * strength, ny * strength);
  };

  const resetJoystick = (pointerId?: number) => {
    if (
      pointerId !== undefined &&
      activePointerIdRef.current !== null &&
      activePointerIdRef.current !== pointerId
    ) {
      return;
    }
    activePointerIdRef.current = null;
    setIsActive(false);
    setThumbOffset({ x: 0, y: 0 });
    onVectorChange(0, 0);
  };

  return (
    <div
      ref={baseRef}
      role="application"
      aria-label="인게임 가상 조이스틱"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        activePointerIdRef.current = e.pointerId;
        setIsActive(true);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        updateFromClientPoint(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (activePointerIdRef.current !== e.pointerId) return;
        e.stopPropagation();
        updateFromClientPoint(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
        } catch {
          // ignore
        }
        resetJoystick(e.pointerId);
      }}
      onPointerCancel={(e) => {
        e.stopPropagation();
        resetJoystick(e.pointerId);
      }}
      onLostPointerCapture={(e) => {
        resetJoystick(e.pointerId);
      }}
      className={`relative w-[80px] h-[80px] sm:w-[86px] sm:h-[86px] select-none touch-none grid place-items-center cursor-grab active:cursor-grabbing transition-transform ${
        isActive ? 'scale-[1.05]' : 'opacity-95 hover:opacity-100'
      }`}
      style={{
        filter: isActive
          ? 'drop-shadow(0 0 10px rgba(217, 123, 132, 0.55))'
          : 'drop-shadow(0 3px 6px rgba(42, 30, 28, 0.35))',
      }}
    >
      {/* Wedding Compass Filigree Base */}
      <img
        src={PIXEL_ASSETS.joystickBase}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none pixelated"
      />

      {/* Rose-Quartz Gem Thumb Knob */}
      <img
        src={PIXEL_ASSETS.joystickThumb}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          transform: `translate(${thumbOffset.x.toFixed(1)}px, ${thumbOffset.y.toFixed(
            1
          )}px)`,
          filter:
            'saturate(1.15) contrast(1.06) drop-shadow(0 2px 0 #743e52) drop-shadow(0 0 4px rgba(255, 248, 218, 0.92))',
        }}
        className="relative z-10 w-[34px] h-[34px] sm:w-[36px] sm:h-[36px] object-contain pointer-events-none select-none pixelated transition-transform duration-40 ease-out"
      />
    </div>
  );
};
