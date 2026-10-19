import React from 'react';
import { AvatarClassId } from '../data/weddingConfig';

interface CharacterSpriteProps {
  size?: number;
  className?: string;
  primaryColor?: string;
  hairColor?: string;
  bounce?: boolean;
}

/**
 * 16x16 Crisp SVG Pixel Art Groom (턱시도 성기사 신랑)
 */
export const GroomSprite: React.FC<CharacterSpriteProps> = ({
  size = 64,
  className = '',
  primaryColor = '#2b3a67',
  hairColor = '#2c1e18',
  bounce = false,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className={`pixelated ${bounce ? 'animate-floatSlow' : ''} ${className}`}
    >
      {/* Shadow */}
      <rect x="4" y="15" width="8" height="1" fill="rgba(0,0,0,0.35)" />
      {/* Crown / Gold Hair Pin */}
      <rect x="6" y="1" width="4" height="1" fill="#ffd541" />
      {/* Hair */}
      <rect x="4" y="2" width="8" height="2" fill={hairColor} />
      <rect x="3" y="3" width="2" height="3" fill={hairColor} />
      <rect x="11" y="3" width="2" height="3" fill={hairColor} />
      {/* Face */}
      <rect x="4" y="4" width="8" height="5" fill="#ffe0bd" />
      {/* Eyes */}
      <rect x="5" y="6" width="1" height="2" fill="#1a132b" />
      <rect x="10" y="6" width="1" height="2" fill="#1a132b" />
      {/* Blush */}
      <rect x="4" y="7" width="1" height="1" fill="#ff8787" />
      <rect x="11" y="7" width="1" height="1" fill="#ff8787" />
      {/* Smile */}
      <rect x="7" y="8" width="2" height="1" fill="#d96b6b" />
      {/* Tuxedo Suit */}
      <rect x="4" y="9" width="8" height="5" fill={primaryColor} />
      <rect x="3" y="9" width="1" height="4" fill={primaryColor} />
      <rect x="12" y="9" width="1" height="4" fill={primaryColor} />
      {/* White Shirt & Red Bowtie */}
      <rect x="6" y="9" width="4" height="4" fill="#ffffff" />
      <rect x="7" y="9" width="2" height="1" fill="#ff5277" />
      {/* Boutonniere Flower */}
      <rect x="5" y="10" width="1" height="1" fill="#ff5277" />
      {/* Hands */}
      <rect x="3" y="13" width="1" height="1" fill="#ffe0bd" />
      <rect x="12" y="13" width="1" height="1" fill="#ffe0bd" />
      {/* Shoes */}
      <rect x="5" y="14" width="2" height="1" fill="#1b1b1b" />
      <rect x="9" y="14" width="2" height="1" fill="#1b1b1b" />
    </svg>
  );
};

/**
 * 16x16 Crisp SVG Pixel Art Bride (티아라 & 부케 아크메이지 신부)
 */
export const BrideSprite: React.FC<CharacterSpriteProps> = ({
  size = 64,
  className = '',
  primaryColor = '#ffffff',
  hairColor = '#3b2314',
  bounce = false,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className={`pixelated ${bounce ? 'animate-floatSlow' : ''} ${className}`}
    >
      {/* Shadow */}
      <rect x="3" y="15" width="10" height="1" fill="rgba(0,0,0,0.35)" />
      {/* Veil background */}
      <rect x="2" y="3" width="12" height="9" fill="rgba(255,255,255,0.45)" />
      {/* Tiara */}
      <rect x="6" y="1" width="4" height="1" fill="#ffd541" />
      <rect x="7" y="0" width="2" height="1" fill="#ff5277" />
      {/* Hair */}
      <rect x="4" y="2" width="8" height="2" fill={hairColor} />
      <rect x="3" y="3" width="2" height="6" fill={hairColor} />
      <rect x="11" y="3" width="2" height="6" fill={hairColor} />
      {/* Face */}
      <rect x="4" y="4" width="8" height="5" fill="#ffe4c8" />
      {/* Eyes */}
      <rect x="5" y="6" width="1" height="2" fill="#1a132b" />
      <rect x="10" y="6" width="1" height="2" fill="#1a132b" />
      {/* Blush */}
      <rect x="4" y="7" width="1" height="1" fill="#ff7597" />
      <rect x="11" y="7" width="1" height="1" fill="#ff7597" />
      {/* Smile */}
      <rect x="7" y="8" width="2" height="1" fill="#e8647c" />
      {/* Wedding Dress */}
      <rect x="4" y="9" width="8" height="2" fill={primaryColor} />
      <rect x="3" y="11" width="10" height="4" fill={primaryColor} />
      <rect x="4" y="13" width="8" height="1" fill="#e9ecf5" />
      {/* Bouquet (Pink & Mint flowers) */}
      <rect x="6" y="10" width="4" height="2" fill="#38d9a9" />
      <rect x="6" y="10" width="1" height="1" fill="#ff5277" />
      <rect x="8" y="10" width="1" height="1" fill="#ffd541" />
      <rect x="7" y="11" width="2" height="1" fill="#ff8787" />
    </svg>
  );
};

/**
 * 16x16 Crisp SVG Pixel Art Pet Cat ('모찌' 링 베어러 치즈냥이)
 */
export const PetCatSprite: React.FC<{ size?: number; className?: string }> = ({
  size = 44,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    shapeRendering="crispEdges"
    className={`pixelated ${className}`}
  >
    <rect x="4" y="14" width="8" height="1" fill="rgba(0,0,0,0.3)" />
    {/* Ears */}
    <rect x="4" y="4" width="2" height="2" fill="#ffa94d" />
    <rect x="10" y="4" width="2" height="2" fill="#ffa94d" />
    {/* Head */}
    <rect x="4" y="6" width="8" height="5" fill="#ffc078" />
    <rect x="7" y="6" width="2" height="1" fill="#f76707" />
    {/* Eyes */}
    <rect x="5" y="8" width="1" height="1" fill="#1a132b" />
    <rect x="10" y="8" width="1" height="1" fill="#1a132b" />
    {/* Pink Nose */}
    <rect x="7" y="9" width="2" height="1" fill="#ff8787" />
    {/* Red Ribbon */}
    <rect x="6" y="11" width="4" height="1" fill="#ff5277" />
    <rect x="7" y="11" width="2" height="1" fill="#ffd541" />
    {/* Body */}
    <rect x="5" y="12" width="6" height="2" fill="#ffe8cc" />
    {/* Tail */}
    <rect x="11" y="10" width="2" height="3" fill="#ffa94d" />
  </svg>
);

/**
 * 16x16 Guest Avatar Class Sprites (6 Classes)
 */
export const GuestAvatarSprite: React.FC<{
  avatar: AvatarClassId;
  size?: number;
  className?: string;
}> = ({ avatar, size = 44, className = '' }) => {
  if (avatar === 'cat') {
    return <PetCatSprite size={size} className={className} />;
  }

  const config: Record<
    Exclude<AvatarClassId, 'cat'>,
    { hat: string; body: string; accent: string; weapon: string }
  > = {
    knight: { hat: '#4dabf7', body: '#339af0', accent: '#ffd541', weapon: '#dee2e6' },
    mage: { hat: '#ae3ec9', body: '#862e9c', accent: '#ffd541', weapon: '#ff5277' },
    archer: { hat: '#2f9e44', body: '#40c057', accent: '#ffd541', weapon: '#a9e34b' },
    bard: { hat: '#f59f00', body: '#ffd43b', accent: '#ff5277', weapon: '#ffa94d' },
    healer: { hat: '#ff8787', body: '#fff0f6', accent: '#ff5277', weapon: '#ffd541' },
  };

  const c = config[avatar];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className={`pixelated ${className}`}
    >
      <rect x="4" y="15" width="8" height="1" fill="rgba(0,0,0,0.35)" />
      {/* Hat / Helmet */}
      <rect x="5" y="1" width="6" height="2" fill={c.hat} />
      <rect x="4" y="3" width="8" height="2" fill={c.hat} />
      <rect x="7" y="2" width="2" height="1" fill={c.accent} />
      {/* Face */}
      <rect x="4" y="5" width="8" height="4" fill="#ffe0bd" />
      <rect x="5" y="6" width="1" height="2" fill="#1a132b" />
      <rect x="10" y="6" width="1" height="2" fill="#1a132b" />
      <rect x="4" y="7" width="1" height="1" fill="#ff8787" />
      <rect x="11" y="7" width="1" height="1" fill="#ff8787" />
      {/* Outfit */}
      <rect x="4" y="9" width="8" height="5" fill={c.body} />
      <rect x="6" y="9" width="4" height="3" fill={c.accent} />
      {/* Class Weapon / Prop */}
      <rect x="12" y="7" width="2" height="6" fill={c.weapon} />
      {/* Boots */}
      <rect x="5" y="14" width="2" height="1" fill="#2b1e16" />
      <rect x="9" y="14" width="2" height="1" fill="#2b1e16" />
    </svg>
  );
};

/**
 * Pixel Art Heart Icon
 */
export const PixelHeart: React.FC<{ size?: number; className?: string; color?: string }> = ({
  size = 20,
  className = '',
  color = '#ff5277',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 12 12"
    shapeRendering="crispEdges"
    className={`pixelated inline-block ${className}`}
  >
    <rect x="2" y="2" width="3" height="2" fill={color} />
    <rect x="7" y="2" width="3" height="2" fill={color} />
    <rect x="1" y="4" width="10" height="3" fill={color} />
    <rect x="2" y="7" width="8" height="1" fill={color} />
    <rect x="3" y="8" width="6" height="1" fill={color} />
    <rect x="4" y="9" width="4" height="1" fill={color} />
    <rect x="5" y="10" width="2" height="1" fill={color} />
    <rect x="2" y="3" width="1" height="1" fill="#ffffff" />
  </svg>
);

/**
 * Pixel Art Diamond Ring Icon
 */
export const PixelRing: React.FC<{ size?: number; className?: string }> = ({
  size = 24,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 12 12"
    shapeRendering="crispEdges"
    className={`pixelated inline-block ${className}`}
  >
    {/* Diamond */}
    <rect x="5" y="1" width="2" height="1" fill="#e3fafc" />
    <rect x="4" y="2" width="4" height="2" fill="#66d9e8" />
    <rect x="5" y="2" width="1" height="1" fill="#ffffff" />
    {/* Gold Band */}
    <rect x="3" y="4" width="6" height="1" fill="#ffd541" />
    <rect x="2" y="5" width="2" height="4" fill="#ffd541" />
    <rect x="8" y="5" width="2" height="4" fill="#ffd541" />
    <rect x="3" y="9" width="6" height="2" fill="#ffd541" />
  </svg>
);

/**
 * Custom Pixel Art Scene Banner Renderer for Gallery items (when in 8-Bit Art mode)
 */
export const PixelSceneBanner: React.FC<{
  theme: 'cherry_blossom' | 'starry_camp' | 'sunset_beach' | 'royal_castle' | 'autumn_cafe' | 'snow_village';
  className?: string;
}> = ({ theme, className = '' }) => {
  const palettes = {
    cherry_blossom: { sky1: '#3b2454', sky2: '#ff87ab', ground: '#40916c', accent: '#ffb3c6' },
    sunset_beach: { sky1: '#3d1e4d', sky2: '#ff7b54', ground: '#4dabf7', accent: '#ffd541' },
    starry_camp: { sky1: '#0f0c24', sky2: '#241b4d', ground: '#2d6a4f', accent: '#ffd541' },
    royal_castle: { sky1: '#1d2d50', sky2: '#4361ee', ground: '#e9ecef', accent: '#ff5277' },
    autumn_cafe: { sky1: '#4a2511', sky2: '#d96b27', ground: '#8c4a27', accent: '#ffd541' },
    snow_village: { sky1: '#1a2a4a', sky2: '#48cae4', ground: '#f8f9fa', accent: '#ff5277' },
  };
  const p = palettes[theme];

  return (
    <svg
      viewBox="0 0 64 40"
      shapeRendering="crispEdges"
      className={`w-full h-full pixelated ${className}`}
    >
      {/* Sky gradient blocks */}
      <rect x="0" y="0" width="64" height="14" fill={p.sky1} />
      <rect x="0" y="14" width="64" height="14" fill={p.sky2} />
      {/* Stars / Petals */}
      <rect x="8" y="4" width="1" height="1" fill="#ffffff" />
      <rect x="18" y="8" width="1" height="1" fill={p.accent} />
      <rect x="48" y="5" width="2" height="2" fill={p.accent} />
      <rect x="54" y="10" width="1" height="1" fill="#ffffff" />
      <rect x="28" y="3" width="1" height="1" fill="#ffffff" />
      {/* Moon / Sun */}
      <rect x="42" y="6" width="6" height="6" fill="#ffd541" />
      {/* Distant Castle / Mountains */}
      <rect x="10" y="20" width="12" height="8" fill="#221b36" />
      <rect x="14" y="16" width="4" height="4" fill="#221b36" />
      <rect x="44" y="22" width="14" height="6" fill="#221b36" />
      {/* Ground */}
      <rect x="0" y="28" width="64" height="12" fill={p.ground} />
      <rect x="0" y="28" width="64" height="2" fill={p.accent} opacity="0.6" />
      {/* Groom & Bride Mini Silhouette in Center */}
      {/* Groom */}
      <rect x="26" y="21" width="4" height="3" fill="#ffe0bd" />
      <rect x="26" y="20" width="4" height="1" fill="#2c1e18" />
      <rect x="26" y="24" width="4" height="5" fill="#2b3a67" />
      {/* Heart between them */}
      <rect x="31" y="18" width="2" height="2" fill="#ff5277" />
      {/* Bride */}
      <rect x="34" y="21" width="4" height="3" fill="#ffe0bd" />
      <rect x="34" y="20" width="4" height="1" fill="#ffd541" />
      <rect x="33" y="24" width="6" height="5" fill="#ffffff" />
    </svg>
  );
};
