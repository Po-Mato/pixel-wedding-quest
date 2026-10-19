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
 * 16x16 Crisp SVG Pixel Art Groom (클래식 턱시도 신랑)
 */
export const GroomSprite: React.FC<CharacterSpriteProps> = ({
  size = 64,
  className = '',
  primaryColor = '#34495e',
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
      {/* Soft Shadow */}
      <rect x="4" y="15" width="8" height="1" fill="rgba(92,72,56,0.22)" />
      {/* Hair */}
      <rect x="4" y="2" width="8" height="2" fill={hairColor} />
      <rect x="3" y="3" width="2" height="3" fill={hairColor} />
      <rect x="11" y="3" width="2" height="3" fill={hairColor} />
      {/* Face */}
      <rect x="4" y="4" width="8" height="5" fill="#ffead6" />
      {/* Eyes */}
      <rect x="5" y="6" width="1" height="2" fill="#3b2f2f" />
      <rect x="10" y="6" width="1" height="2" fill="#3b2f2f" />
      {/* Soft Blush */}
      <rect x="4" y="7" width="1" height="1" fill="#f4a2a8" />
      <rect x="11" y="7" width="1" height="1" fill="#f4a2a8" />
      {/* Gentle Smile */}
      <rect x="7" y="8" width="2" height="1" fill="#d97b84" />
      {/* Tuxedo Suit */}
      <rect x="4" y="9" width="8" height="5" fill={primaryColor} />
      <rect x="3" y="9" width="1" height="4" fill={primaryColor} />
      <rect x="12" y="9" width="1" height="4" fill={primaryColor} />
      {/* Crisp White Shirt & Champagne Bowtie */}
      <rect x="6" y="9" width="4" height="4" fill="#ffffff" />
      <rect x="7" y="9" width="2" height="1" fill="#c59b6d" />
      {/* Rose Boutonniere */}
      <rect x="5" y="10" width="1" height="1" fill="#e899a0" />
      {/* Hands */}
      <rect x="3" y="13" width="1" height="1" fill="#ffead6" />
      <rect x="12" y="13" width="1" height="1" fill="#ffead6" />
      {/* Dress Shoes */}
      <rect x="5" y="14" width="2" height="1" fill="#2c221e" />
      <rect x="9" y="14" width="2" height="1" fill="#2c221e" />
    </svg>
  );
};

/**
 * 16x16 Crisp SVG Pixel Art Bride (순백의 베일 & 부케 신부)
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
      {/* Soft Shadow */}
      <rect x="3" y="15" width="10" height="1" fill="rgba(92,72,56,0.22)" />
      {/* Sheer Veil */}
      <rect x="2" y="3" width="12" height="9" fill="rgba(255,255,255,0.65)" />
      {/* Pearl & Gold Tiara */}
      <rect x="6" y="1" width="4" height="1" fill="#d4af7a" />
      <rect x="7" y="0" width="2" height="1" fill="#fffdf9" />
      {/* Hair */}
      <rect x="4" y="2" width="8" height="2" fill={hairColor} />
      <rect x="3" y="3" width="2" height="6" fill={hairColor} />
      <rect x="11" y="3" width="2" height="6" fill={hairColor} />
      {/* Face */}
      <rect x="4" y="4" width="8" height="5" fill="#ffefe0" />
      {/* Eyes */}
      <rect x="5" y="6" width="1" height="2" fill="#3b2f2f" />
      <rect x="10" y="6" width="1" height="2" fill="#3b2f2f" />
      {/* Blush */}
      <rect x="4" y="7" width="1" height="1" fill="#f4a2a8" />
      <rect x="11" y="7" width="1" height="1" fill="#f4a2a8" />
      {/* Smile */}
      <rect x="7" y="8" width="2" height="1" fill="#d97b84" />
      {/* Silk Wedding Gown */}
      <rect x="4" y="9" width="8" height="2" fill={primaryColor} />
      <rect x="3" y="11" width="10" height="4" fill={primaryColor} />
      <rect x="4" y="13" width="8" height="1" fill="#f5ebe1" />
      {/* Pastel Rose & Eucalyptus Bouquet */}
      <rect x="6" y="10" width="4" height="2" fill="#84a98c" />
      <rect x="6" y="10" width="1" height="1" fill="#e899a0" />
      <rect x="8" y="10" width="1" height="1" fill="#fffdf9" />
      <rect x="7" y="11" width="2" height="1" fill="#f4a2a8" />
    </svg>
  );
};

/**
 * 16x16 Crisp SVG Pixel Art Pet Cat ('모찌' 반려묘)
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
    <rect x="4" y="14" width="8" height="1" fill="rgba(92,72,56,0.2)" />
    {/* Ears */}
    <rect x="4" y="4" width="2" height="2" fill="#e6a15c" />
    <rect x="10" y="4" width="2" height="2" fill="#e6a15c" />
    {/* Head */}
    <rect x="4" y="6" width="8" height="5" fill="#f7c58e" />
    <rect x="7" y="6" width="2" height="1" fill="#d98a3c" />
    {/* Eyes */}
    <rect x="5" y="8" width="1" height="1" fill="#3b2f2f" />
    <rect x="10" y="8" width="1" height="1" fill="#3b2f2f" />
    {/* Pink Nose */}
    <rect x="7" y="9" width="2" height="1" fill="#e899a0" />
    {/* Blush Ribbon */}
    <rect x="6" y="11" width="4" height="1" fill="#d97b84" />
    <rect x="7" y="11" width="2" height="1" fill="#e6d5b8" />
    {/* Body */}
    <rect x="5" y="12" width="6" height="2" fill="#fff3e0" />
    {/* Tail */}
    <rect x="11" y="10" width="2" height="3" fill="#e6a15c" />
  </svg>
);

/**
 * 16x16 Guest Avatar Class Sprites (Soft Pastel Garden Guests)
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
    { hat: string; body: string; accent: string; prop: string }
  > = {
    knight: { hat: '#5c4033', body: '#6c8ebf', accent: '#f5ebe1', prop: '#84a98c' },
    mage: { hat: '#4a3525', body: '#e5989b', accent: '#fffdf9', prop: '#ffb5a7' },
    archer: { hat: '#3d2b1f', body: '#84a98c', accent: '#f5ebe1', prop: '#d4af7a' },
    bard: { hat: '#5c3c24', body: '#d4a373', accent: '#fffdf9', prop: '#e899a0' },
    healer: { hat: '#4a3222', body: '#b5838d', accent: '#fffdf9', prop: '#f4a2a8' },
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
      <rect x="4" y="15" width="8" height="1" fill="rgba(92,72,56,0.2)" />
      {/* Hair / Hat */}
      <rect x="5" y="2" width="6" height="1" fill={c.hat} />
      <rect x="4" y="3" width="8" height="2" fill={c.hat} />
      {/* Face */}
      <rect x="4" y="5" width="8" height="4" fill="#ffead6" />
      <rect x="5" y="6" width="1" height="2" fill="#3b2f2f" />
      <rect x="10" y="6" width="1" height="2" fill="#3b2f2f" />
      <rect x="4" y="7" width="1" height="1" fill="#f4a2a8" />
      <rect x="11" y="7" width="1" height="1" fill="#f4a2a8" />
      {/* Pastel Guest Outfit */}
      <rect x="4" y="9" width="8" height="5" fill={c.body} />
      <rect x="6" y="9" width="4" height="3" fill={c.accent} />
      {/* Small Flower / Camera / Music Note Prop */}
      <rect x="12" y="9" width="2" height="3" fill={c.prop} />
      {/* Shoes */}
      <rect x="5" y="14" width="2" height="1" fill="#4a3728" />
      <rect x="9" y="14" width="2" height="1" fill="#4a3728" />
    </svg>
  );
};

/**
 * Pixel Art Heart Icon (Soft Bridal Rose)
 */
export const PixelHeart: React.FC<{ size?: number; className?: string; color?: string }> = ({
  size = 18,
  className = '',
  color = '#d97b84',
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
 * Pixel Art Diamond Ring Icon (Champagne Gold & Pearl)
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
    <rect x="5" y="1" width="2" height="1" fill="#ffffff" />
    <rect x="4" y="2" width="4" height="2" fill="#dbe9f4" />
    <rect x="5" y="2" width="1" height="1" fill="#ffffff" />
    <rect x="3" y="4" width="6" height="1" fill="#d4af7a" />
    <rect x="2" y="5" width="2" height="4" fill="#d4af7a" />
    <rect x="8" y="5" width="2" height="4" fill="#d4af7a" />
    <rect x="3" y="9" width="6" height="2" fill="#d4af7a" />
  </svg>
);

/**
 * Pastel Watercolor-like Pixel Scene Banner for Gallery
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
    cherry_blossom: { sky1: '#fceef0', sky2: '#f9dcc4', ground: '#a3b18a', accent: '#f4a2a8' },
    sunset_beach: { sky1: '#f9dcc4', sky2: '#f4a261', ground: '#90bede', accent: '#e9c46a' },
    starry_camp: { sky1: '#2b3a55', sky2: '#4a5775', ground: '#6b9071', accent: '#f3d59b' },
    royal_castle: { sky1: '#eaf2f8', sky2: '#fdfefe', ground: '#d5e2d8', accent: '#d97b84' },
    autumn_cafe: { sky1: '#faedcd', sky2: '#e9edc9', ground: '#ccd5ae', accent: '#d4a373' },
    snow_village: { sky1: '#e2eafc', sky2: '#edf2fb', ground: '#ffffff', accent: '#e899a0' },
  };
  const p = palettes[theme];

  return (
    <svg
      viewBox="0 0 64 40"
      shapeRendering="crispEdges"
      className={`w-full h-full pixelated ${className}`}
    >
      <rect x="0" y="0" width="64" height="16" fill={p.sky1} />
      <rect x="0" y="16" width="64" height="12" fill={p.sky2} />
      {/* Soft clouds / petals */}
      <rect x="8" y="6" width="8" height="2" fill="#ffffff" opacity="0.8" />
      <rect x="10" y="4" width="4" height="2" fill="#ffffff" opacity="0.8" />
      <rect x="44" y="7" width="10" height="2" fill="#ffffff" opacity="0.8" />
      <rect x="18" y="10" width="1" height="1" fill={p.accent} />
      <rect x="48" y="12" width="1" height="1" fill={p.accent} />
      {/* White Garden Arch */}
      <rect x="23" y="14" width="18" height="14" fill="rgba(255,255,255,0.7)" />
      <rect x="25" y="16" width="14" height="12" fill={p.sky2} />
      <rect x="23" y="13" width="18" height="2" fill={p.accent} />
      {/* Ground */}
      <rect x="0" y="28" width="64" height="12" fill={p.ground} />
      <rect x="0" y="28" width="64" height="1" fill="#ffffff" opacity="0.6" />
      {/* Couple Silhouette under Arch */}
      <rect x="27" y="21" width="3" height="3" fill="#ffead6" />
      <rect x="27" y="20" width="3" height="1" fill="#2c1e18" />
      <rect x="27" y="24" width="3" height="5" fill="#34495e" />
      <rect x="31" y="19" width="2" height="2" fill="#d97b84" />
      <rect x="34" y="21" width="3" height="3" fill="#ffefe0" />
      <rect x="34" y="20" width="3" height="1" fill="#3b2314" />
      <rect x="33" y="24" width="5" height="5" fill="#ffffff" />
    </svg>
  );
};
