import React, { useMemo } from 'react';
import { AvatarClassId } from '../data/weddingConfig';
import { getHighResDataUrl } from '../utils/highResPixelArt';

interface CharacterSpriteProps {
  size?: number;
  className?: string;
  primaryColor?: string;
  hairColor?: string;
  bounce?: boolean;
}

/**
 * 144x144 High-Resolution Pixel Art Groom (고해상도 144px 픽셀 신랑)
 */
export const GroomSprite: React.FC<CharacterSpriteProps> = ({
  size = 84,
  className = '',
  primaryColor = '#34495e',
  hairColor = '#2c1e18',
  bounce = false,
}) => {
  const src = useMemo(
    () => getHighResDataUrl('groom', { primaryColor, hairColor }),
    [primaryColor, hairColor]
  );

  return (
    <img
      src={src}
      alt="신랑 픽셀 캐릭터 (144x144)"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`pixelated select-none object-contain ${
        bounce ? 'animate-floatSlow' : ''
      } ${className}`}
    />
  );
};

/**
 * 144x144 High-Resolution Pixel Art Bride (고해상도 144px 픽셀 신부)
 */
export const BrideSprite: React.FC<CharacterSpriteProps> = ({
  size = 84,
  className = '',
  primaryColor = '#ffffff',
  hairColor = '#3b2314',
  bounce = false,
}) => {
  const src = useMemo(
    () => getHighResDataUrl('bride', { primaryColor, hairColor }),
    [primaryColor, hairColor]
  );

  return (
    <img
      src={src}
      alt="신부 픽셀 캐릭터 (144x144)"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`pixelated select-none object-contain ${
        bounce ? 'animate-floatSlow' : ''
      } ${className}`}
    />
  );
};

/**
 * 144x144 High-Resolution Pixel Art Pet Cat ('모찌' 반려묘)
 */
export const PetCatSprite: React.FC<{ size?: number; className?: string }> = ({
  size = 56,
  className = '',
}) => {
  const src = useMemo(() => getHighResDataUrl('cat'), []);

  return (
    <img
      src={src}
      alt="반려묘 모찌 (144x144)"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`pixelated select-none object-contain ${className}`}
    />
  );
};

/**
 * 144x144 High-Resolution Guest Avatar Sprites
 */
export const GuestAvatarSprite: React.FC<{
  avatar: AvatarClassId;
  size?: number;
  className?: string;
}> = ({ avatar, size = 56, className = '' }) => {
  const src = useMemo(() => getHighResDataUrl('guest', { avatar }), [avatar]);

  return (
    <img
      src={src}
      alt={`${avatar} 하객 캐릭터 (144x144)`}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`pixelated select-none object-contain ${className}`}
    />
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
    {/* Sparkle */}
    <rect x="11" y="1" width="2" height="2" fill="#ffffff" />
    {/* Faceted Diamond */}
    <rect x="8" y="3" width="8" height="2" fill="#e8f4f8" />
    <rect x="6" y="5" width="12" height="3" fill="#bde0fe" />
    <rect x="8" y="5" width="4" height="2" fill="#ffffff" />
    <rect x="8" y="8" width="8" height="2" fill="#90dbf4" />
    {/* Gold Ring Setting & Band */}
    <rect x="7" y="10" width="10" height="2" fill="#d4af7a" />
    <rect x="5" y="12" width="3" height="7" fill="#d4af7a" />
    <rect x="16" y="12" width="3" height="7" fill="#d4af7a" />
    <rect x="7" y="19" width="10" height="3" fill="#c59b6d" />
    <rect x="8" y="18" width="8" height="2" fill="#e6d5b8" />
  </svg>
);

/**
 * High-Resolution Pixel Art Scene Banner for Gallery (with 144x144 Couple!)
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
  const palettes = {
    cherry_blossom: {
      skyTop: '#fceef0',
      skyBot: '#f9dcc4',
      lawn: '#a8c69f',
      arch: '#fffdf9',
      accent: '#f4a2a8',
    },
    sunset_beach: {
      skyTop: '#f9dcc4',
      skyBot: '#f4a261',
      lawn: '#8ecae6',
      arch: '#fffdf9',
      accent: '#e9c46a',
    },
    starry_camp: {
      skyTop: '#2b3a55',
      skyBot: '#4a5775',
      lawn: '#6b9071',
      arch: '#f3d59b',
      accent: '#f3d59b',
    },
    royal_castle: {
      skyTop: '#eaf2f8',
      skyBot: '#fdfefe',
      lawn: '#cce3de',
      arch: '#fffdf9',
      accent: '#d97b84',
    },
    autumn_cafe: {
      skyTop: '#faedcd',
      skyBot: '#e9edc9',
      lawn: '#ccd5ae',
      arch: '#fffdf9',
      accent: '#d4a373',
    },
    snow_village: {
      skyTop: '#e2eafc',
      skyBot: '#edf2fb',
      lawn: '#ffffff',
      arch: '#fffdf9',
      accent: '#e899a0',
    },
  };
  const p = palettes[theme];

  return (
    <div
      className={`relative w-full h-full overflow-hidden flex items-end justify-center ${className}`}
      style={{
        background: `linear-gradient(180deg, ${p.skyTop} 0%, ${p.skyBot} 68%, ${p.lawn} 68%, ${p.lawn} 100%)`,
      }}
    >
      {/* Detailed Pixel Background Scenery SVG (192x120 grid) */}
      <svg
        viewBox="0 0 192 120"
        shapeRendering="crispEdges"
        className="absolute inset-0 w-full h-full pixelated"
      >
        {/* Soft Pixel Clouds */}
        <rect x="20" y="18" width="28" height="6" fill="#ffffff" opacity="0.75" />
        <rect x="26" y="14" width="16" height="4" fill="#ffffff" opacity="0.75" />
        <rect x="134" y="22" width="32" height="6" fill="#ffffff" opacity="0.75" />
        <rect x="142" y="18" width="18" height="4" fill="#ffffff" opacity="0.75" />

        {/* Floral Wedding Gazebo Arch */}
        <rect x="64" y="28" width="64" height="54" fill={p.arch} opacity="0.85" />
        <rect x="70" y="34" width="52" height="48" fill={p.skyBot} />
        <rect x="62" y="24" width="68" height="6" fill={p.accent} />
        <rect x="68" y="20" width="56" height="4" fill={p.arch} />

        {/* Floating Petals / Stars */}
        <rect x="36" y="36" width="3" height="3" fill={p.accent} />
        <rect x="52" y="48" width="2" height="2" fill="#ffffff" />
        <rect x="148" y="42" width="3" height="3" fill={p.accent} />
        <rect x="128" y="52" width="2" height="2" fill="#ffffff" />

        {/* Stone Path */}
        <rect x="56" y="82" width="80" height="38" fill="#f5ebe0" />
        <rect x="60" y="82" width="72" height="2" fill="#d4b48c" />
      </svg>

      {/* 144x144 High-Res Groom, Bride, and Cat in Foreground */}
      <div className="relative z-10 flex items-end justify-center gap-1 pb-2">
        <GroomSprite size={92} bounce />
        <PixelHeart size={18} color="#d97b84" className="mb-10" />
        <BrideSprite size={92} bounce />
        <PetCatSprite size={54} className="mb-1 -ml-1" />
      </div>
    </div>
  );
};
