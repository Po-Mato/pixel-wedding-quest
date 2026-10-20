import React from 'react';
import { AvatarClassId } from '../data/weddingConfig';

const BASE_URL =
  (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ||
  '/';
const PIXEL_ASSET_BASE = `${BASE_URL}assets/pixel`;

export const PIXEL_ASSETS = {
  groomSprite: `${PIXEL_ASSET_BASE}/groom-sprite.png`,
  groomPortrait: `${PIXEL_ASSET_BASE}/groom-portrait.png`,
  brideSprite: `${PIXEL_ASSET_BASE}/bride-sprite.png`,
  bridePortrait: `${PIXEL_ASSET_BASE}/bride-portrait.png`,
  catSprite: `${PIXEL_ASSET_BASE}/cat-sprite.png`,
  weddingCover: `${PIXEL_ASSET_BASE}/wedding-cover-pixel.jpg`,
  weddingGardenMap: `${PIXEL_ASSET_BASE}/wedding-garden-map.jpg`,
};

interface CharacterSpriteProps {
  size?: number;
  className?: string;
  primaryColor?: string;
  hairColor?: string;
  bounce?: boolean;
  variant?: 'portrait' | 'full';
}

/**
 * Artist-Grade High-Resolution Pixel Art Groom (고해상도 일러스트형 픽셀 신랑)
 */
export const GroomSprite: React.FC<CharacterSpriteProps> = ({
  size = 88,
  className = '',
  bounce = false,
  variant = 'portrait',
}) => {
  const src =
    variant === 'full' ? PIXEL_ASSETS.groomSprite : PIXEL_ASSETS.groomPortrait;

  return (
    <img
      src={src}
      alt="신랑 픽셀 캐릭터"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`pixelated select-none object-contain drop-shadow-[0_2px_4px_rgba(59,47,47,0.12)] ${
        bounce ? 'animate-floatSlow' : ''
      } ${className}`}
    />
  );
};

/**
 * Artist-Grade High-Resolution Pixel Art Bride (고해상도 일러스트형 픽셀 신부)
 */
export const BrideSprite: React.FC<CharacterSpriteProps> = ({
  size = 88,
  className = '',
  bounce = false,
  variant = 'portrait',
}) => {
  const src =
    variant === 'full' ? PIXEL_ASSETS.brideSprite : PIXEL_ASSETS.bridePortrait;

  return (
    <img
      src={src}
      alt="신부 픽셀 캐릭터"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`pixelated select-none object-contain drop-shadow-[0_2px_4px_rgba(59,47,47,0.12)] ${
        bounce ? 'animate-floatSlow' : ''
      } ${className}`}
    />
  );
};

/**
 * Artist-Grade High-Resolution Pixel Art Pet Cat ('모찌' 반려묘)
 */
export const PetCatSprite: React.FC<{ size?: number; className?: string }> = ({
  size = 56,
  className = '',
}) => {
  return (
    <img
      src={PIXEL_ASSETS.catSprite}
      alt="반려묘 모찌"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`pixelated select-none object-contain drop-shadow-[0_2px_3px_rgba(59,47,47,0.12)] ${className}`}
    />
  );
};

/**
 * Elegant High-Resolution Guest Avatar Sprites for RSVP & Guestbook
 */
export const GuestAvatarSprite: React.FC<{
  avatar: AvatarClassId;
  size?: number;
  className?: string;
}> = ({ avatar, size = 48, className = '' }) => {
  const metaMap: Record<
    AvatarClassId,
    { src: string; badge: string; bg: string; border: string }
  > = {
    knight: {
      src: PIXEL_ASSETS.groomPortrait,
      badge: '🥂',
      bg: '#eef4f8',
      border: '#b8cde0',
    },
    mage: {
      src: PIXEL_ASSETS.bridePortrait,
      badge: '💐',
      bg: '#fcf0f2',
      border: '#e8b4bc',
    },
    archer: {
      src: PIXEL_ASSETS.catSprite,
      badge: '📸',
      bg: '#fdf6ec',
      border: '#dfc49b',
    },
    bard: {
      src: PIXEL_ASSETS.groomPortrait,
      badge: '🎵',
      bg: '#f3f0fa',
      border: '#c7b8e0',
    },
    healer: {
      src: PIXEL_ASSETS.bridePortrait,
      badge: '🌿',
      bg: '#eef6f0',
      border: '#a8cbb1',
    },
    cat: {
      src: PIXEL_ASSETS.catSprite,
      badge: '🐾',
      bg: '#fbf5e6',
      border: '#d9bc7a',
    },
  };

  const meta = metaMap[avatar] || metaMap.knight;

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: meta.bg,
        borderColor: meta.border,
      }}
      className={`relative rounded-full border flex items-center justify-center overflow-visible select-none ${className}`}
    >
      <img
        src={meta.src}
        alt={`${avatar} 하객 캐릭터`}
        className="w-[88%] h-[88%] rounded-full object-cover object-top pixelated"
      />
      <span className="absolute -bottom-1 -right-1 text-[11px] leading-none bg-[#fffdf9] rounded-full px-1 py-0.5 border border-[#e2d4c0] shadow-2xs">
        {meta.badge}
      </span>
    </div>
  );
};

/**
 * 32x32 Detailed Pixel Art Heart Icon
 */
export const PixelHeart: React.FC<{
  size?: number;
  className?: string;
  color?: string;
}> = ({ size = 18, className = '', color = '#d97b84' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    shapeRendering="crispEdges"
    className={`pixelated inline-block ${className}`}
  >
    <rect x="4" y="4" width="6" height="2" fill="#4a3028" />
    <rect x="14" y="4" width="6" height="2" fill="#4a3028" />
    <rect x="2" y="6" width="2" height="6" fill="#4a3028" />
    <rect x="20" y="6" width="2" height="6" fill="#4a3028" />
    <rect x="4" y="6" width="6" height="2" fill={color} />
    <rect x="14" y="6" width="6" height="2" fill={color} />
    <rect x="10" y="6" width="4" height="2" fill="#4a3028" />
    <rect x="4" y="8" width="16" height="4" fill={color} />
    <rect x="4" y="12" width="16" height="2" fill={color} />
    <rect x="6" y="14" width="12" height="2" fill={color} />
    <rect x="8" y="16" width="8" height="2" fill={color} />
    <rect x="10" y="18" width="4" height="2" fill={color} />
    <rect x="5" y="7" width="3" height="2" fill="#ffffff" />
    <rect x="4" y="9" width="2" height="2" fill="#ffffff" />
  </svg>
);

/**
 * 32x32 Detailed Pixel Art Diamond Ring Icon
 */
export const PixelRing: React.FC<{ size?: number; className?: string }> = ({
  size = 24,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    shapeRendering="crispEdges"
    className={`pixelated inline-block ${className}`}
  >
    <rect x="11" y="1" width="2" height="2" fill="#ffffff" />
    <rect x="8" y="3" width="8" height="2" fill="#e8f4f8" />
    <rect x="6" y="5" width="12" height="3" fill="#bde0fe" />
    <rect x="8" y="5" width="4" height="2" fill="#ffffff" />
    <rect x="8" y="8" width="8" height="2" fill="#90dbf4" />
    <rect x="7" y="10" width="10" height="2" fill="#d4af7a" />
    <rect x="5" y="12" width="3" height="7" fill="#d4af7a" />
    <rect x="16" y="12" width="3" height="7" fill="#d4af7a" />
    <rect x="7" y="19" width="10" height="3" fill="#c59b6d" />
    <rect x="8" y="18" width="8" height="2" fill="#e6d5b8" />
  </svg>
);

/**
 * High-Resolution Pixel Art Scene Banner for Gallery
 */
export const PixelSceneBanner: React.FC<{
  theme:
    | 'cherry_blossom'
    | 'starry_camp'
    | 'sunset_beach'
    | 'royal_castle'
    | 'autumn_cafe'
    | 'snow_village';
  className?: string;
}> = ({ theme, className = '' }) => {
  const filterByTheme: Record<string, string> = {
    cherry_blossom: 'brightness(1.02) saturate(1.05)',
    sunset_beach: 'sepia(0.18) saturate(1.2) hue-rotate(-8deg)',
    starry_camp: 'brightness(0.82) contrast(1.1) hue-rotate(190deg) saturate(0.85)',
    royal_castle: 'brightness(1.04) contrast(1.02)',
    autumn_cafe: 'sepia(0.25) saturate(1.15) brightness(0.98)',
    snow_village: 'brightness(1.08) saturate(0.82) hue-rotate(10deg)',
  };

  const useGardenBg =
    theme === 'royal_castle' || theme === 'autumn_cafe' || theme === 'starry_camp';

  return (
    <div
      className={`relative w-full h-full overflow-hidden flex items-end justify-center ${className}`}
    >
      <img
        src={
          useGardenBg
            ? PIXEL_ASSETS.weddingGardenMap
            : PIXEL_ASSETS.weddingCover
        }
        alt="웨딩 픽셀 일러스트"
        style={{ filter: filterByTheme[theme] || 'none' }}
        className="absolute inset-0 w-full h-full object-cover object-center pixelated"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#2b211e]/35 via-transparent to-transparent" />

      {useGardenBg && (
        <div className="relative z-10 flex items-end justify-center gap-1 pb-2">
          <GroomSprite size={92} variant="full" bounce />
          <PixelHeart size={16} color="#d97b84" className="mb-10" />
          <BrideSprite size={92} variant="full" bounce />
          <PetCatSprite size={46} className="mb-1 -ml-2" />
        </div>
      )}
    </div>
  );
};
