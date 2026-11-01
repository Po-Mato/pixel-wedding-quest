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

  const isUp = isActive && thumbOffset.y < -5;
  const isDown = isActive && thumbOffset.y > 5;
  const isLeft = isActive && thumbOffset.x < -5;
  const isRight = isActive && thumbOffset.x > 5;

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
      className={`relative w-[80px] h-[80px] sm:w-[84px] sm:h-[84px] select-none touch-none grid place-items-center cursor-grab active:cursor-grabbing transition-transform duration-150 ${
        isActive ? 'scale-[1.04]' : 'hover:scale-[1.02]'
      }`}
      style={{
        filter: isActive
          ? 'drop-shadow(0 3px 10px rgba(217, 123, 132, 0.38))'
          : 'drop-shadow(0 2px 5px rgba(197, 155, 109, 0.25))',
      }}
    >
      {/* Pastel Wedding Ivory & Champagne Joystick Base */}
      <img
        src={PIXEL_ASSETS.joystickBase}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
      />

      {/* Interactive Cardinal Direction Highlights when tilting */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute top-[6px] text-[8px] leading-none transition-all duration-100 ${
          isUp
            ? 'text-[#d97b84] scale-125 drop-shadow-[0_0_4px_rgba(217,123,132,0.65)]'
            : 'text-transparent'
        }`}
      >
        ▲
      </span>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-[6px] text-[8px] leading-none transition-all duration-100 ${
          isDown
            ? 'text-[#d97b84] scale-125 drop-shadow-[0_0_4px_rgba(217,123,132,0.65)]'
            : 'text-transparent'
        }`}
      >
        ▼
      </span>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-[6px] text-[8px] leading-none transition-all duration-100 ${
          isLeft
            ? 'text-[#d97b84] scale-125 drop-shadow-[0_0_4px_rgba(217,123,132,0.65)]'
            : 'text-transparent'
        }`}
      >
        ◀
      </span>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute right-[6px] text-[8px] leading-none transition-all duration-100 ${
          isRight
            ? 'text-[#d97b84] scale-125 drop-shadow-[0_0_4px_rgba(217,123,132,0.65)]'
            : 'text-transparent'
        }`}
      >
        ▶
      </span>

      {/* Soft Blush-Rose Active Socket Glow */}
      {isActive && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute w-[36px] h-[36px] rounded-full bg-[#d97b84]/15 border border-[#d97b84]/35 animate-pulse"
        />
      )}

      {/* Blush-Rose Pixel Heart Thumb Knob */}
      <img
        src={PIXEL_ASSETS.joystickThumb}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          transform: `translate(${thumbOffset.x.toFixed(1)}px, ${thumbOffset.y.toFixed(
            1
          )}px)`,
          filter: isActive
            ? 'drop-shadow(0 3px 6px rgba(158, 71, 82, 0.45))'
            : 'drop-shadow(0 2px 3px rgba(158, 71, 82, 0.3))',
        }}
        className="relative z-10 w-[36px] h-[36px] sm:w-[38px] sm:h-[38px] object-contain pointer-events-none select-none transition-transform duration-40 ease-out"
      />
    </div>
  );
};
