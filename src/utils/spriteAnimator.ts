export type SpriteFacing = 'down' | 'up' | 'left' | 'right';

export type CharacterActionKind = 'wave' | 'cheer' | 'pose' | 'spin' | 'jump';

export interface CharacterActionState {
  kind: CharacterActionKind;
  startedAt: number;
  durationMs: number;
}

export const SPRITE_SHEET_COLS = 3;
export const SPRITE_SHEET_ROWS = 4;

const WALK_CYCLE_COLS: readonly (0 | 1 | 2)[] = [0, 1, 0, 2];
const SPIN_FACINGS: readonly SpriteFacing[] = ['down', 'right', 'up', 'left', 'down'];

/**
 * Determine 4-way facing direction from a movement vector (dx, dy).
 * Keeps previous facing when movement is below deadzone.
 */
export function resolveFacingFromDelta(
  dx: number,
  dy: number,
  fallback: SpriteFacing = 'down',
  deadzone = 0.018
): SpriteFacing {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax < deadzone && ay < deadzone) return fallback;
  if (ax >= ay * 0.92) {
    return dx < 0 ? 'left' : 'right';
  }
  return dy < 0 ? 'up' : 'down';
}

/**
 * Determine which 4-way direction an actor at (fromX, fromY) should face
 * in order to look toward (toX, toY).
 */
export function resolveFacingToward(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  fallback: SpriteFacing = 'down'
): SpriteFacing {
  return resolveFacingFromDelta(toX - fromX, toY - fromY, fallback, 0.5);
}

/**
 * Convert accumulated walkPhase into 4-beat RPG walk cycle column (idle -> stepL -> idle -> stepR).
 */
export function getWalkFrameCol(walkPhase: number, isMoving: boolean): 0 | 1 | 2 {
  if (!isMoving) return 0;
  const idx = Math.abs(Math.floor(walkPhase)) % WALK_CYCLE_COLS.length;
  return WALK_CYCLE_COLS[idx];
}

/**
 * Helper to create a timed character action state.
 */
export function createCharacterAction(
  kind: CharacterActionKind,
  nowMs: number,
  delayMs = 0
): CharacterActionState {
  const durationByKind: Record<CharacterActionKind, number> = {
    wave: 820,
    cheer: 900,
    pose: 880,
    spin: 760,
    jump: 540,
  };
  return {
    kind,
    startedAt: nowMs + delayMs,
    durationMs: durationByKind[kind],
  };
}

/**
 * Map a wedding reaction emoji to a matching character animation action.
 */
export function getActionForReactionEmoji(emoji: string): CharacterActionKind {
  switch (emoji) {
    case '👏':
      return 'wave';
    case '🥂':
      return 'cheer';
    case '✨':
      return 'spin';
    case '💐':
    case '❤️':
      return 'pose';
    default:
      return 'wave';
  }
}

export interface DrawCharacterSpriteOptions {
  sheetImg: HTMLImageElement | null | undefined;
  fallbackImg: HTMLImageElement | null | undefined;
  footX: number;
  footY: number;
  targetH: number;
  facing: SpriteFacing;
  walkCol: 0 | 1 | 2;
  isMoving: boolean;
  action?: CharacterActionState | null;
  nowMs: number;
  tick: number;
  phaseOffset?: number;
}

function getRowAndFlip(facing: SpriteFacing): { row: 0 | 1 | 2; flipX: 1 | -1 } {
  switch (facing) {
    case 'up':
      return { row: 1, flipX: 1 };
    case 'right':
      return { row: 2, flipX: 1 };
    case 'left':
      return { row: 2, flipX: -1 };
    case 'down':
    default:
      return { row: 0, flipX: 1 };
  }
}

/**
 * Draw an animated 4-direction character sprite (from a 3x4 sheet) anchored at (footX, footY).
 * Falls back gracefully to the single static sprite PNG while the sheet is loading.
 */
export function drawCharacterSprite(
  ctx: CanvasRenderingContext2D,
  opts: DrawCharacterSpriteOptions
): { drawTopY: number; jumpLift: number } {
  const {
    sheetImg,
    fallbackImg,
    footX,
    footY,
    targetH,
    facing,
    walkCol,
    isMoving,
    action,
    nowMs,
    tick,
    phaseOffset = 0,
  } = opts;

  let { row, flipX } = getRowAndFlip(facing);
  let col: 0 | 1 | 2 = walkCol;
  let useActionRow = false;
  let jumpLift = 0;
  let scaleX = 1;
  let scaleY = 1;
  let tilt = 0;

  // Check active action choreography
  const isActionActive =
    Boolean(action) &&
    nowMs >= (action as CharacterActionState).startedAt &&
    nowMs <= (action as CharacterActionState).startedAt + (action as CharacterActionState).durationMs;

  if (isActionActive && action) {
    const p = Math.max(0, Math.min(1, (nowMs - action.startedAt) / action.durationMs));
    if (action.kind === 'wave') {
      useActionRow = true;
      col = 0;
      flipX = 1;
      jumpLift = Math.sin(p * Math.PI) * 5;
      tilt = Math.sin(p * Math.PI * 4) * 0.055;
      scaleY = 1 + Math.sin(p * Math.PI) * 0.04;
      scaleX = 1 - Math.sin(p * Math.PI) * 0.025;
    } else if (action.kind === 'cheer') {
      useActionRow = true;
      col = 1;
      flipX = 1;
      // Double happy hop with squash-and-stretch landing
      if (p < 0.14) {
        const sq = Math.sin((p / 0.14) * Math.PI);
        scaleX = 1 + sq * 0.1;
        scaleY = 1 - sq * 0.1;
      } else if (p < 0.86) {
        const air = (p - 0.14) / 0.72;
        jumpLift = Math.sin(air * Math.PI) * 18;
        scaleX = 1 - Math.sin(air * Math.PI) * 0.06;
        scaleY = 1 + Math.sin(air * Math.PI) * 0.07;
      } else {
        const land = (p - 0.86) / 0.14;
        const sq = Math.sin(land * Math.PI);
        scaleX = 1 + sq * 0.12;
        scaleY = 1 - sq * 0.1;
      }
    } else if (action.kind === 'pose') {
      useActionRow = true;
      col = 2;
      flipX = 1;
      jumpLift = Math.sin(p * Math.PI) * 7;
      const pulse = Math.sin(p * Math.PI * 2) * 0.04;
      scaleX = 1 + pulse;
      scaleY = 1 + Math.abs(pulse) * 0.8;
    } else if (action.kind === 'spin') {
      const spinIdx = Math.min(
        SPIN_FACINGS.length - 1,
        Math.floor(p * SPIN_FACINGS.length)
      );
      const rf = getRowAndFlip(SPIN_FACINGS[spinIdx]);
      row = rf.row;
      flipX = rf.flipX;
      col = p > 0.82 ? 0 : 1;
      jumpLift = Math.sin(p * Math.PI) * 14;
      scaleY = 1 + Math.sin(p * Math.PI) * 0.06;
    } else if (action.kind === 'jump') {
      useActionRow = true;
      col = 1;
      flipX = 1;
      jumpLift = Math.sin(p * Math.PI) * 15;
      scaleX = 1 - Math.sin(p * Math.PI) * 0.05;
      scaleY = 1 + Math.sin(p * Math.PI) * 0.07;
    }
  } else if (isMoving) {
    // Crisp RPG step bounce synced to foot lift columns (1 & 2)
    jumpLift = col === 0 ? 0 : 2.6;
    tilt = col === 1 ? -0.025 : col === 2 ? 0.025 : 0;
  } else {
    // Gentle idle breathing anchored at feet
    const breath = Math.sin(tick * 0.07 + phaseOffset);
    scaleY = 1 + breath * 0.016;
    scaleX = 1 - breath * 0.01;
  }

  const hasSheet =
    Boolean(sheetImg) &&
    (sheetImg as HTMLImageElement).complete &&
    (sheetImg as HTMLImageElement).naturalWidth > 0 &&
    (sheetImg as HTMLImageElement).naturalHeight > 0;

  if (hasSheet && sheetImg) {
    const cellW = sheetImg.naturalWidth / SPRITE_SHEET_COLS;
    const cellH = sheetImg.naturalHeight / SPRITE_SHEET_ROWS;
    const drawRow = useActionRow ? 3 : row;
    const drawH = targetH;
    const drawW = Math.round((drawH * cellW) / cellH);

    ctx.save();
    ctx.translate(Math.round(footX), Math.round(footY - jumpLift));
    ctx.scale(flipX * scaleX, scaleY);
    if (tilt !== 0) ctx.rotate(tilt);
    ctx.drawImage(
      sheetImg,
      Math.round(col * cellW),
      Math.round(drawRow * cellH),
      Math.round(cellW),
      Math.round(cellH),
      Math.round(-drawW / 2),
      Math.round(-drawH),
      drawW,
      drawH
    );
    ctx.restore();
    return { drawTopY: footY - drawH - jumpLift, jumpLift };
  }

  // Graceful fallback to static single sprite while sheet loads
  if (
    fallbackImg &&
    fallbackImg.complete &&
    fallbackImg.naturalWidth > 0 &&
    fallbackImg.naturalHeight > 0
  ) {
    const drawH = targetH;
    const drawW = Math.round((drawH * fallbackImg.naturalWidth) / fallbackImg.naturalHeight);
    ctx.save();
    ctx.translate(Math.round(footX), Math.round(footY - jumpLift));
    ctx.scale(flipX * scaleX, scaleY);
    if (tilt !== 0) ctx.rotate(tilt);
    ctx.drawImage(
      fallbackImg,
      Math.round(-drawW / 2),
      Math.round(-drawH),
      drawW,
      drawH
    );
    ctx.restore();
    return { drawTopY: footY - drawH - jumpLift, jumpLift };
  }

  return { drawTopY: footY - targetH - jumpLift, jumpLift };
}
