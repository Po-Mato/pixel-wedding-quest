/**
 * High-Resolution 144x144 Pixel Art Character & Pavilion Generator
 * Plots true 144x144 pixel-grid illustrations with warm sel-out outlines,
 * multi-tone cel shading, dithering, hair highlights, eye catchlights,
 * bridal veil lace, and bouquet details.
 */

import { AvatarClassId } from '../data/weddingConfig';

type RGBA = [number, number, number, number];

function hexToRgba(hex: string, alpha = 255): RGBA {
  const clean = hex.replace('#', '');
  const num = parseInt(
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean,
    16
  );
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255, alpha];
}

function shiftColor(hex: string, amt: number, alpha = 255): RGBA {
  const [r, g, b] = hexToRgba(hex, alpha);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return [clamp(r + amt), clamp(g + amt), clamp(b + amt), alpha];
}

class PixelBuffer144 {
  public width: number;
  public height: number;
  public data: Uint8ClampedArray;

  constructor(width = 144, height = 144) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  public setPixel(x: number, y: number, color: RGBA) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || ix >= this.width || iy < 0 || iy >= this.height) return;
    const idx = (iy * this.width + ix) * 4;
    const srcA = color[3] / 255;
    if (srcA >= 0.99) {
      this.data[idx] = color[0];
      this.data[idx + 1] = color[1];
      this.data[idx + 2] = color[2];
      this.data[idx + 3] = 255;
    } else if (srcA > 0) {
      const dstA = this.data[idx + 3] / 255;
      const outA = srcA + dstA * (1 - srcA);
      if (outA > 0) {
        this.data[idx] = Math.round(
          (color[0] * srcA + this.data[idx] * dstA * (1 - srcA)) / outA
        );
        this.data[idx + 1] = Math.round(
          (color[1] * srcA + this.data[idx + 1] * dstA * (1 - srcA)) / outA
        );
        this.data[idx + 2] = Math.round(
          (color[2] * srcA + this.data[idx + 2] * dstA * (1 - srcA)) / outA
        );
        this.data[idx + 3] = Math.round(outA * 255);
      }
    }
  }

  public fillRect(x: number, y: number, w: number, h: number, color: RGBA) {
    for (let py = Math.round(y); py < Math.round(y + h); py++) {
      for (let px = Math.round(x); px < Math.round(x + w); px++) {
        this.setPixel(px, py, color);
      }
    }
  }

  public fillEllipse(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    color: RGBA,
    outlineColor?: RGBA
  ) {
    const minX = Math.floor(cx - rx - 1);
    const maxX = Math.ceil(cx + rx + 1);
    const minY = Math.floor(cy - ry - 1);
    const maxY = Math.ceil(cy + ry + 1);

    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        const dx = (px - cx) / rx;
        const dy = (py - cy) / ry;
        const dist = dx * dx + dy * dy;
        if (dist <= 1.0) {
          if (outlineColor && dist > 0.84) {
            this.setPixel(px, py, outlineColor);
          } else {
            this.setPixel(px, py, color);
          }
        }
      }
    }
  }

  public fillDitheredEllipse(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    color: RGBA
  ) {
    const minX = Math.floor(cx - rx);
    const maxX = Math.ceil(cx + rx);
    const minY = Math.floor(cy - ry);
    const maxY = Math.ceil(cy + ry);
    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        const dx = (px - cx) / rx;
        const dy = (py - cy) / ry;
        const dist = dx * dx + dy * dy;
        if (dist <= 1.0 && (px + py) % 2 === 0) {
          this.setPixel(px, py, color);
        }
      }
    }
  }

  public fillRoundedBox(
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fill: RGBA,
    outline?: RGBA
  ) {
    const x0 = Math.round(x);
    const y0 = Math.round(y);
    const x1 = Math.round(x + w - 1);
    const y1 = Math.round(y + h - 1);

    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        let dx = 0;
        let dy = 0;
        if (px < x0 + r) dx = x0 + r - px;
        else if (px > x1 - r) dx = px - (x1 - r);
        if (py < y0 + r) dy = y0 + r - py;
        else if (py > y1 - r) dy = py - (y1 - r);

        const dist = Math.hypot(dx, dy);
        if (dist <= r + 0.4) {
          const isEdge =
            px === x0 ||
            px === x1 ||
            py === y0 ||
            py === y1 ||
            (dx > 0 && dy > 0 && dist >= r - 0.8);
          if (outline && isEdge) {
            this.setPixel(px, py, outline);
          } else {
            this.setPixel(px, py, fill);
          }
        }
      }
    }
  }

  public drawLine(x0: number, y0: number, x1: number, y1: number, color: RGBA, thickness = 1) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i++) {
      const px = Math.round(x0 + ((x1 - x0) * i) / steps);
      const py = Math.round(y0 + ((y1 - y0) * i) / steps);
      for (let ty = -Math.floor(thickness / 2); ty <= Math.floor(thickness / 2); ty++) {
        for (let tx = -Math.floor(thickness / 2); tx <= Math.floor(thickness / 2); tx++) {
          this.setPixel(px + tx, py + ty, color);
        }
      }
    }
  }

  public toCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const imgData = new ImageData(this.data, this.width, this.height);
      ctx.putImageData(imgData, 0, 0);
    }
    return canvas;
  }

  public toDataUrl(): string {
    return this.toCanvas().toDataURL('image/png');
  }
}

const spriteCache = new Map<string, HTMLCanvasElement>();
const dataUrlCache = new Map<string, string>();

/**
 * Draws detailed 144x144 anime/indie-RPG expressive face & eyes
 */
function drawDetailedFace144(
  buf: PixelBuffer144,
  cx: number,
  cy: number,
  isFemale: boolean
) {
  const outline = hexToRgba('#4a3028');
  const skinBase = hexToRgba(isFemale ? '#fff0e5' : '#ffeadb');
  const skinShadow = hexToRgba(isFemale ? '#f5d5c3' : '#f0cbb6');
  const skinHighlight = hexToRgba('#fff9f5');
  const blush = hexToRgba('#f4979e', 190);

  // Ears
  buf.fillEllipse(cx - 24, cy + 3, 5, 7, skinBase, outline);
  buf.fillEllipse(cx + 24, cy + 3, 5, 7, skinBase, outline);
  buf.fillEllipse(cx - 24, cy + 3, 2, 3, skinShadow);
  buf.fillEllipse(cx + 24, cy + 3, 2, 3, skinShadow);

  // Neck & Collarbone shadow
  buf.fillRoundedBox(cx - 8, cy + 20, 16, 12, 3, skinShadow, outline);
  buf.fillRoundedBox(cx - 6, cy + 19, 12, 8, 2, skinBase);

  // Head / Face Oval (width ~46px, height ~44px on 144x144 grid)
  buf.fillEllipse(cx, cy, 24, 22, skinBase, outline);

  // Chin & temple soft pixel shading
  for (let py = cy + 8; py <= cy + 20; py++) {
    for (let px = cx - 20; px <= cx + 20; px++) {
      const dx = (px - cx) / 23;
      const dy = (py - cy) / 21;
      if (dx * dx + dy * dy <= 0.83 && dy > 0.55) {
        buf.setPixel(px, py, skinShadow);
      }
    }
  }

  // Forehead highlight
  buf.fillEllipse(cx, cy - 9, 12, 4, skinHighlight);

  // Rosy Dithered Cheeks
  buf.fillDitheredEllipse(cx - 14, cy + 7, 6, 3.5, blush);
  buf.fillDitheredEllipse(cx + 14, cy + 7, 6, 3.5, blush);

  // Detailed Eyes (9x10 pixels each with iris gradient & dual white catchlights!)
  const eyeOffsets = [-11, 11];
  const eyeY = cy + 1;

  eyeOffsets.forEach((ox) => {
    const ex = cx + ox;
    // Sclera (white of eye)
    buf.fillRoundedBox(ex - 5, eyeY - 4, 10, 9, 3, hexToRgba('#ffffff'));
    // Iris base
    buf.fillRoundedBox(ex - 4, eyeY - 3, 8, 8, 2, hexToRgba('#3b2824'));
    // Lower warm iris rim
    buf.fillRect(ex - 3, eyeY + 2, 6, 2, hexToRgba(isFemale ? '#7a4b42' : '#5e3c35'));
    // Pupil center
    buf.fillRect(ex - 2, eyeY - 1, 4, 3, hexToRgba('#1f1412'));
    // Upper thick eyelash line
    buf.drawLine(ex - 5, eyeY - 4, ex + 5, eyeY - 4, hexToRgba('#2b1a17'), 2);
    if (isFemale) {
      // Delicate outer eyelash wing
      buf.setPixel(ex + (ox < 0 ? -6 : 6), eyeY - 5, hexToRgba('#2b1a17'));
      buf.setPixel(ex + (ox < 0 ? -6 : 6), eyeY - 4, hexToRgba('#2b1a17'));
    }
    // Primary large catchlight (top-left of iris)
    buf.fillRect(ex - 3, eyeY - 3, 2, 2, hexToRgba('#ffffff'));
    // Secondary sparkle catchlight (bottom-right of iris)
    buf.setPixel(ex + 2, eyeY + 2, hexToRgba('#ffffff'));

    // Eyebrows
    buf.drawLine(
      ex - 5,
      eyeY - 8,
      ex + 4,
      eyeY - (isFemale ? 9 : 8),
      hexToRgba('#4a3028'),
      isFemale ? 1 : 2
    );
  });

  // Cute Nose highlight & shadow
  buf.setPixel(cx, cy + 5, skinHighlight);
  buf.setPixel(cx, cy + 6, hexToRgba('#d9a996'));
  buf.setPixel(cx + 1, cy + 6, hexToRgba('#d9a996'));

  // Warm Happy Smile
  buf.drawLine(cx - 4, cy + 11, cx - 2, cy + 12, hexToRgba('#c96970'), 1);
  buf.drawLine(cx - 2, cy + 12, cx + 2, cy + 12, hexToRgba('#c96970'), 1);
  buf.drawLine(cx + 2, cy + 12, cx + 4, cy + 11, hexToRgba('#c96970'), 1);
  if (isFemale) {
    // Soft lower lip gloss
    buf.drawLine(cx - 2, cy + 13, cx + 2, cy + 13, hexToRgba('#f4a2a8', 180), 1);
  }
}

/**
 * Generates a 144x144 High-Resolution Pixel Art GROOM Sprite
 */
export function getHighResGroomCanvas(
  suitColor = '#34495e',
  hairColor = '#2c1e18',
  walkFrame = 0
): HTMLCanvasElement {
  const key = `groom-144-${suitColor}-${hairColor}-${walkFrame % 4}`;
  if (spriteCache.has(key)) return spriteCache.get(key)!;

  const buf = new PixelBuffer144(144, 144);
  const cx = 72;
  const bob = walkFrame % 2 === 1 ? -2 : 0;
  const headY = 46 + bob;

  const outline = hexToRgba('#2b1e1a');
  const suitBase = hexToRgba(suitColor);
  const suitDark = shiftColor(suitColor, -28);
  const suitLight = shiftColor(suitColor, 26);
  const hairBase = hexToRgba(hairColor);
  const hairDark = shiftColor(hairColor, -24);
  const hairLight = shiftColor(hairColor, 38);

  // 1. Ground Soft Shadow
  buf.fillEllipse(cx, 134, 26, 6, [74, 58, 42, 55]);
  buf.fillEllipse(cx, 134, 18, 4, [74, 58, 42, 85]);

  // 2. Back Hair layer
  buf.fillEllipse(cx, headY - 4, 26, 23, hairDark, outline);

  // 3. Legs & Tailored Trousers + Glossy Dress Shoes
  const leftLegOffset = walkFrame % 4 === 1 ? -3 : walkFrame % 4 === 3 ? 2 : 0;
  const rightLegOffset = walkFrame % 4 === 1 ? 2 : walkFrame % 4 === 3 ? -3 : 0;

  // Left Leg
  buf.fillRoundedBox(cx - 15, 104 + bob, 13, 22 + leftLegOffset, 3, suitDark, outline);
  buf.fillRect(cx - 12, 106 + bob, 5, 16 + leftLegOffset, suitBase);
  // Right Leg
  buf.fillRoundedBox(cx + 2, 104 + bob, 13, 22 + rightLegOffset, 3, suitDark, outline);
  buf.fillRect(cx + 5, 106 + bob, 5, 16 + rightLegOffset, suitBase);

  // Polished Oxford Shoes with specular shine
  buf.fillRoundedBox(
    cx - 17,
    123 + bob + leftLegOffset,
    15,
    8,
    3,
    hexToRgba('#241915'),
    outline
  );
  buf.fillRect(cx - 14, 125 + bob + leftLegOffset, 5, 2, hexToRgba('#6e554b'));

  buf.fillRoundedBox(
    cx + 2,
    123 + bob + rightLegOffset,
    15,
    8,
    3,
    hexToRgba('#241915'),
    outline
  );
  buf.fillRect(cx + 5, 125 + bob + rightLegOffset, 5, 2, hexToRgba('#6e554b'));

  // 4. Torso: Tailored Tuxedo Jacket
  buf.fillRoundedBox(cx - 22, 68 + bob, 44, 40, 8, suitBase, outline);
  // Jacket side shading
  buf.fillRect(cx - 20, 74 + bob, 6, 30, suitDark);
  buf.fillRect(cx + 14, 74 + bob, 6, 30, suitDark);
  // Jacket shoulder highlights
  buf.fillRect(cx - 17, 70 + bob, 10, 3, suitLight);
  buf.fillRect(cx + 7, 70 + bob, 10, 3, suitLight);

  // Crisp White Pleated Dress Shirt V-Shape
  for (let py = 69 + bob; py <= 98 + bob; py++) {
    const halfW = Math.max(1, Math.round((99 + bob - py) * 0.42));
    buf.fillRect(cx - halfW, py, halfW * 2, 1, hexToRgba('#ffffff'));
    // Satin Tuxedo Lapels flanking the shirt
    buf.fillRect(cx - halfW - 5, py, 5, 1, suitDark);
    buf.fillRect(cx + halfW, py, 5, 1, suitDark);
    buf.setPixel(cx - halfW - 1, py, suitLight);
    buf.setPixel(cx + halfW + 1, py, suitLight);
  }

  // Shirt gold/pearl studs
  buf.fillRect(cx - 1, 80 + bob, 2, 2, hexToRgba('#d4af7a'));
  buf.fillRect(cx - 1, 86 + bob, 2, 2, hexToRgba('#d4af7a'));
  buf.fillRect(cx - 1, 92 + bob, 2, 2, hexToRgba('#d4af7a'));

  // Champagne Gold / Burgundy Silk Bowtie
  buf.fillRoundedBox(cx - 8, 70 + bob, 7, 6, 2, hexToRgba('#c59b6d'), outline);
  buf.fillRoundedBox(cx + 1, 70 + bob, 7, 6, 2, hexToRgba('#c59b6d'), outline);
  buf.fillRect(cx - 2, 71 + bob, 4, 4, hexToRgba('#e6d5b8'));

  // Rose Boutonniere on Left Lapel + White Pocket Square
  buf.fillEllipse(cx - 11, 80 + bob, 4, 4, hexToRgba('#e899a0'), outline);
  buf.fillEllipse(cx - 11, 80 + bob, 2, 2, hexToRgba('#d97b84'));
  buf.fillRect(cx - 12, 84 + bob, 2, 3, hexToRgba('#6b9071'));
  // Pocket square
  buf.fillRect(cx + 10, 82 + bob, 6, 3, hexToRgba('#fffdf9'));

  // Arms & Hands
  const armSwing = walkFrame % 2 === 1 ? 2 : 0;
  buf.fillRoundedBox(cx - 28, 72 + bob - armSwing, 9, 26, 4, suitBase, outline);
  buf.fillRoundedBox(cx + 19, 72 + bob + armSwing, 9, 26, 4, suitBase, outline);
  // White shirt cuffs
  buf.fillRect(cx - 27, 94 + bob - armSwing, 7, 2, hexToRgba('#ffffff'));
  buf.fillRect(cx + 20, 94 + bob + armSwing, 7, 2, hexToRgba('#ffffff'));
  // Hands
  buf.fillEllipse(cx - 24, 99 + bob - armSwing, 4, 4, hexToRgba('#ffeadb'), outline);
  buf.fillEllipse(cx + 24, 99 + bob + armSwing, 4, 4, hexToRgba('#ffeadb'), outline);

  // 5. Detailed Face
  drawDetailedFace144(buf, cx, headY, false);

  // 6. Front Layered Hair with Parted Bangs & Crown Shine
  // Top hair volume
  buf.fillEllipse(cx, headY - 14, 25, 11, hairBase, outline);
  // Side locks framing temples
  buf.fillRoundedBox(cx - 25, headY - 14, 8, 16, 3, hairBase, outline);
  buf.fillRoundedBox(cx + 17, headY - 14, 8, 16, 3, hairBase, outline);
  // Comma / Parted Bangs across forehead
  buf.fillEllipse(cx - 8, headY - 9, 12, 7, hairBase);
  buf.fillEllipse(cx + 10, headY - 10, 10, 6, hairBase);
  buf.drawLine(cx - 18, headY - 4, cx - 2, headY - 6, outline, 1);
  buf.drawLine(cx + 4, headY - 8, cx + 18, headY - 4, outline, 1);

  // Hair Specular Highlights (pixel clusters)
  buf.fillRoundedBox(cx - 14, headY - 17, 10, 3, 1, hairLight);
  buf.fillRoundedBox(cx + 5, headY - 16, 8, 3, 1, hairLight);
  buf.fillRect(cx - 10, headY - 12, 6, 2, hairLight);

  const canvas = buf.toCanvas();
  spriteCache.set(key, canvas);
  return canvas;
}

/**
 * Generates a 144x144 High-Resolution Pixel Art BRIDE Sprite
 */
export function getHighResBrideCanvas(
  dressColor = '#ffffff',
  hairColor = '#3b2314',
  walkFrame = 0
): HTMLCanvasElement {
  const key = `bride-144-${dressColor}-${hairColor}-${walkFrame % 4}`;
  if (spriteCache.has(key)) return spriteCache.get(key)!;

  const buf = new PixelBuffer144(144, 144);
  const cx = 72;
  const bob = walkFrame % 2 === 1 ? -2 : 0;
  const headY = 47 + bob;

  const outline = hexToRgba('#3a2620');
  const hairBase = hexToRgba(hairColor);
  const hairDark = shiftColor(hairColor, -24);
  const hairLight = shiftColor(hairColor, 42);
  const dressBase = hexToRgba(dressColor);
  const dressShadow = hexToRgba('#f2e8dc');
  const dressDeepShadow = hexToRgba('#dfd0c0');

  // 1. Ground Soft Shadow
  buf.fillEllipse(cx, 134, 32, 7, [74, 58, 42, 55]);

  // 2. Flowing Cathedral Veil (Translucent with Lace Border)
  buf.fillEllipse(cx, 76 + bob, 38, 46, [255, 253, 250, 155], hexToRgba('#e6d5b8', 210));
  buf.fillDitheredEllipse(cx, 76 + bob, 35, 43, [255, 255, 255, 110]);

  // 3. Long Wavy Back Hair cascading over shoulders
  buf.fillEllipse(cx, headY + 6, 27, 28, hairDark, outline);
  buf.fillEllipse(cx - 20, headY + 20, 8, 14, hairBase, outline);
  buf.fillEllipse(cx + 20, headY + 20, 8, 14, hairBase, outline);

  // 4. Voluminous Bell-Shaped Bridal Gown Skirt
  for (let py = 84 + bob; py <= 131 + bob; py++) {
    const t = (py - (84 + bob)) / 47;
    const halfW = Math.round(16 + t * 22 + Math.sin(t * Math.PI) * 3);
    for (let px = cx - halfW; px <= cx + halfW; px++) {
      const distRatio = Math.abs(px - cx) / halfW;
      // Pleat folds every ~9 pixels
      const foldWave = Math.sin(((px - cx) / halfW) * Math.PI * 3.5);
      if (px === cx - halfW || px === cx + halfW || py === 131 + bob) {
        buf.setPixel(px, py, hexToRgba('#b89f8a'));
      } else if (py >= 127 + bob) {
        // Pearl & Lace Scalloped Hem
        buf.setPixel(
          px,
          py,
          (px + py) % 2 === 0 ? hexToRgba('#fffdf9') : dressShadow
        );
      } else if (distRatio > 0.78 || foldWave < -0.55) {
        buf.setPixel(px, py, dressShadow);
      } else if (foldWave < -0.82) {
        buf.setPixel(px, py, dressDeepShadow);
      } else {
        buf.setPixel(px, py, dressBase);
      }
    }
  }

  // 5. Sweetheart Off-Shoulder Bodice & Satin Waist Sash
  buf.fillEllipse(cx, 72 + bob, 15, 7, hexToRgba('#ffefe0'), outline);
  // Pearl Necklace
  for (let nx = cx - 7; nx <= cx + 7; nx += 2) {
    buf.setPixel(nx, 68 + bob + Math.round(Math.cos((nx - cx) * 0.2) * 1.5), hexToRgba('#fffdf9'));
    buf.setPixel(nx, 69 + bob + Math.round(Math.cos((nx - cx) * 0.2) * 1.5), hexToRgba('#d4af7a'));
  }

  // Bodice Corset
  buf.fillRoundedBox(cx - 16, 73 + bob, 32, 16, 5, dressBase, hexToRgba('#b89f8a'));
  // Off-shoulder lace sleeves
  buf.fillRoundedBox(cx - 23, 73 + bob, 8, 10, 3, dressBase, hexToRgba('#b89f8a'));
  buf.fillRoundedBox(cx + 15, 73 + bob, 8, 10, 3, dressBase, hexToRgba('#b89f8a'));
  // Champagne Gold & Blush Waist Ribbon Sash
  buf.fillRect(cx - 15, 85 + bob, 30, 3, hexToRgba('#e6d5b8'));
  buf.fillRect(cx - 15, 87 + bob, 30, 1, hexToRgba('#c59b6d'));

  // Forearms & Hands holding the Bouquet in Center
  buf.fillEllipse(cx - 12, 89 + bob, 6, 4, hexToRgba('#ffefe0'), outline);
  buf.fillEllipse(cx + 12, 89 + bob, 6, 4, hexToRgba('#ffefe0'), outline);

  // 6. Lush High-Res Bridal Bouquet (Roses, Peonies, Eucalyptus & Trailing Ribbon)
  const bqY = 91 + bob;
  // Eucalyptus Greenery Base
  buf.fillEllipse(cx, bqY, 15, 10, hexToRgba('#6b9071'), outline);
  buf.fillEllipse(cx - 9, bqY - 2, 7, 5, hexToRgba('#84a98c'));
  buf.fillEllipse(cx + 9, bqY - 2, 7, 5, hexToRgba('#84a98c'));
  // Blush Pink Roses & White Peonies
  buf.fillEllipse(cx - 5, bqY - 2, 5, 5, hexToRgba('#e899a0'), outline);
  buf.fillEllipse(cx - 5, bqY - 2, 2.5, 2.5, hexToRgba('#d97b84'));
  buf.fillEllipse(cx + 5, bqY - 1, 5, 5, hexToRgba('#fffdf9'), outline);
  buf.fillEllipse(cx + 5, bqY - 1, 2, 2, hexToRgba('#f5ebe0'));
  buf.fillEllipse(cx, bqY + 2, 5, 5, hexToRgba('#f4acb7'), outline);
  buf.fillEllipse(cx, bqY + 2, 2, 2, hexToRgba('#d97b84'));
  buf.fillEllipse(cx, bqY - 5, 4, 4, hexToRgba('#f3d59b'), outline);
  // Trailing Silk Ribbon
  buf.drawLine(cx - 2, bqY + 7, cx - 6, bqY + 18, hexToRgba('#d97b84'), 2);
  buf.drawLine(cx + 2, bqY + 7, cx + 6, bqY + 17, hexToRgba('#d97b84'), 2);

  // 7. Detailed Face
  drawDetailedFace144(buf, cx, headY, true);

  // 8. Front Wavy Hair & Sparkling Pearl-Gold Tiara
  buf.fillEllipse(cx, headY - 14, 25, 10, hairBase, outline);
  buf.fillRoundedBox(cx - 25, headY - 13, 8, 22, 4, hairBase, outline);
  buf.fillRoundedBox(cx + 17, headY - 13, 8, 22, 4, hairBase, outline);
  // Soft Airy Bangs
  buf.fillEllipse(cx - 9, headY - 10, 11, 6, hairBase);
  buf.fillEllipse(cx + 9, headY - 10, 11, 6, hairBase);
  // Hair Highlights
  buf.fillRoundedBox(cx - 14, headY - 16, 9, 3, 1, hairLight);
  buf.fillRoundedBox(cx + 5, headY - 16, 9, 3, 1, hairLight);

  // Royal Pearl & Champagne Gold Tiara
  buf.fillRoundedBox(cx - 12, headY - 24, 24, 5, 2, hexToRgba('#d4af7a'), outline);
  buf.fillRoundedBox(cx - 6, headY - 28, 12, 5, 2, hexToRgba('#e6d5b8'), outline);
  buf.fillEllipse(cx, headY - 26, 2.5, 2.5, hexToRgba('#d97b84'));
  buf.setPixel(cx - 8, headY - 22, hexToRgba('#ffffff'));
  buf.setPixel(cx - 4, headY - 22, hexToRgba('#ffffff'));
  buf.setPixel(cx + 4, headY - 22, hexToRgba('#ffffff'));
  buf.setPixel(cx + 8, headY - 22, hexToRgba('#ffffff'));

  const canvas = buf.toCanvas();
  spriteCache.set(key, canvas);
  return canvas;
}

/**
 * Generates a 144x144 High-Resolution Pixel Art Pet Cat ('모찌')
 */
export function getHighResCatCanvas(walkFrame = 0): HTMLCanvasElement {
  const key = `cat-144-${walkFrame % 4}`;
  if (spriteCache.has(key)) return spriteCache.get(key)!;

  const buf = new PixelBuffer144(144, 144);
  const cx = 72;
  const bob = walkFrame % 2 === 1 ? -2 : 0;
  const cy = 84 + bob;

  const outline = hexToRgba('#4a3022');
  const furBase = hexToRgba('#f7c58e');
  const furStripe = hexToRgba('#e09145');
  const furCream = hexToRgba('#fff7eb');
  const earPink = hexToRgba('#f4a2a8');

  // Shadow
  buf.fillEllipse(cx, 126, 24, 6, [74, 58, 42, 55]);

  // Wagging Tail
  const tailShift = walkFrame % 2 === 1 ? 3 : -2;
  buf.drawLine(cx + 16, cy + 18, cx + 32, cy + 2 + tailShift, outline, 8);
  buf.drawLine(cx + 16, cy + 18, cx + 32, cy + 2 + tailShift, furBase, 5);
  buf.fillEllipse(cx + 32, cy + 2 + tailShift, 4, 4, furStripe, outline);

  // Plump Body
  buf.fillEllipse(cx, cy + 18, 20, 18, furBase, outline);
  buf.fillEllipse(cx, cy + 20, 13, 13, furCream);

  // Cute Paws
  buf.fillEllipse(cx - 10, cy + 33, 6, 4, furCream, outline);
  buf.fillEllipse(cx + 10, cy + 33, 6, 4, furCream, outline);

  // Ears
  for (let py = 0; py < 16; py++) {
    const w = Math.round((py / 16) * 12);
    buf.fillRect(cx - 21, cy - 28 + py, w, 1, furStripe);
    buf.fillRect(cx + 21 - w, cy - 28 + py, w, 1, furStripe);
    if (py > 4) {
      const pw = Math.max(1, w - 4);
      buf.fillRect(cx - 19, cy - 28 + py, pw, 1, earPink);
      buf.fillRect(cx + 19 - pw, cy - 28 + py, pw, 1, earPink);
    }
  }

  // Head
  buf.fillEllipse(cx, cy - 6, 24, 19, furBase, outline);
  buf.fillEllipse(cx, cy, 18, 11, furCream);

  // Forehead Tabby Stripes
  buf.fillRoundedBox(cx - 2, cy - 22, 4, 8, 1, furStripe);
  buf.fillRoundedBox(cx - 9, cy - 20, 3, 6, 1, furStripe);
  buf.fillRoundedBox(cx + 6, cy - 20, 3, 6, 1, furStripe);

  // Big Sparkling Cat Eyes
  [-10, 10].forEach((ox) => {
    buf.fillEllipse(cx + ox, cy - 6, 4.5, 5, hexToRgba('#2b1c17'));
    buf.fillRect(cx + ox - 2, cy - 9, 2, 2, hexToRgba('#ffffff'));
    buf.setPixel(cx + ox + 2, cy - 4, hexToRgba('#ffffff'));
  });

  // Pink Nose & 'ω' Mouth
  buf.fillEllipse(cx, cy - 1, 2.5, 2, hexToRgba('#e88d96'));
  buf.drawLine(cx - 4, cy + 2, cx, cy + 1, outline, 1);
  buf.drawLine(cx, cy + 1, cx + 4, cy + 2, outline, 1);

  // Rosy Cheeks & Whiskers
  buf.fillDitheredEllipse(cx - 16, cy - 2, 4, 2.5, earPink);
  buf.fillDitheredEllipse(cx + 16, cy - 2, 4, 2.5, earPink);
  buf.drawLine(cx - 26, cy - 3, cx - 19, cy - 2, outline, 1);
  buf.drawLine(cx - 26, cy + 1, cx - 19, cy, outline, 1);
  buf.drawLine(cx + 19, cy - 2, cx + 26, cy - 3, outline, 1);
  buf.drawLine(cx + 19, cy, cx + 26, cy + 1, outline, 1);

  // Blush Ribbon Collar & Gold Bell
  buf.fillRoundedBox(cx - 14, cy + 8, 28, 4, 2, hexToRgba('#d97b84'), outline);
  buf.fillEllipse(cx, cy + 11, 4, 4, hexToRgba('#e6c27a'), outline);
  buf.setPixel(cx - 1, cy + 10, hexToRgba('#ffffff'));

  const canvas = buf.toCanvas();
  spriteCache.set(key, canvas);
  return canvas;
}

/**
 * Generates a 144x144 High-Resolution Guest Avatar Sprite
 */
export function getHighResGuestCanvas(
  avatar: AvatarClassId,
  walkFrame = 0
): HTMLCanvasElement {
  if (avatar === 'cat') return getHighResCatCanvas(walkFrame);

  const key = `guest-144-${avatar}-${walkFrame % 4}`;
  if (spriteCache.has(key)) return spriteCache.get(key)!;

  const palettes: Record<
    Exclude<AvatarClassId, 'cat'>,
    { outfit: string; hair: string; isFemale: boolean; accent: string }
  > = {
    knight: { outfit: '#5b7db1', hair: '#3b2820', isFemale: false, accent: '#84a98c' },
    mage: { outfit: '#e28d96', hair: '#4a2f24', isFemale: true, accent: '#fffdf9' },
    archer: { outfit: '#6b9071', hair: '#2e211b', isFemale: false, accent: '#d4af7a' },
    bard: { outfit: '#d4a373', hair: '#523628', isFemale: true, accent: '#e899a0' },
    healer: { outfit: '#b5838d', hair: '#38241c', isFemale: true, accent: '#f4acb7' },
  };

  const p = palettes[avatar];
  const canvas = p.isFemale
    ? getHighResBrideCanvas(p.outfit, p.hair, walkFrame)
    : getHighResGroomCanvas(p.outfit, p.hair, walkFrame);

  spriteCache.set(key, canvas);
  return canvas;
}

export function getHighResDataUrl(
  type: 'groom' | 'bride' | 'cat' | 'guest',
  options?: {
    primaryColor?: string;
    hairColor?: string;
    avatar?: AvatarClassId;
  }
): string {
  const key = `${type}-${options?.primaryColor || ''}-${options?.hairColor || ''}-${
    options?.avatar || ''
  }`;
  if (dataUrlCache.has(key)) return dataUrlCache.get(key)!;

  let canvas: HTMLCanvasElement;
  if (type === 'groom') {
    canvas = getHighResGroomCanvas(options?.primaryColor, options?.hairColor, 0);
  } else if (type === 'bride') {
    canvas = getHighResBrideCanvas(options?.primaryColor, options?.hairColor, 0);
  } else if (type === 'cat') {
    canvas = getHighResCatCanvas(0);
  } else {
    canvas = getHighResGuestCanvas(options?.avatar || 'knight', 0);
  }

  const url = canvas.toDataURL('image/png');
  dataUrlCache.set(key, url);
  return url;
}
