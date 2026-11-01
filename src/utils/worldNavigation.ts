import { GardenMapId } from '../data/weddingConfig';

export interface CircleObstacle {
  x: number;
  y: number;
  r: number;
  label: string;
}

export interface RectObstacle {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  label: string;
}

export interface MapObstacleConfig {
  circles: CircleObstacle[];
  rects: RectObstacle[];
}

export interface TileCoord {
  col: number;
  row: number;
  x: number;
  y: number;
}

export const TILE_GRID_SIZE = 24;

export const MAP_OBSTACLES: Record<GardenMapId, MapObstacleConfig> = {
  garden: {
    circles: [
      { x: 50, y: 49.5, r: 8.2, label: '중앙 백조의 분수대' },
      { x: 15, y: 14.5, r: 5.2, label: '북서 로즈 파빌리온' },
      { x: 85, y: 14.5, r: 5.2, label: '북동 갤러리 파빌리온' },
      { x: 15, y: 74.5, r: 5.2, label: '남서 스테이션 파빌리온' },
      { x: 85, y: 74.5, r: 5.2, label: '남동 축복 파빌리온' },
    ],
    rects: [],
  },
  chapel: {
    circles: [{ x: 23, y: 21, r: 5.0, label: '화이트 그랜드 피아노' }],
    rects: [
      { minX: 16, maxX: 36.5, minY: 42, maxY: 81, label: '채플 좌측 하객석' },
      { minX: 63.5, maxX: 84, minY: 42, maxY: 81, label: '채플 우측 하객석' },
      { minX: 37, maxX: 63, minY: 8, maxY: 19, label: '본식 로즈 단상' },
    ],
  },
  memory: {
    circles: [
      { x: 19, y: 21, r: 5.2, label: '봄날 창가 카페 테이블' },
      { x: 78, y: 21, r: 5.2, label: '겨울 별빛 트리' },
    ],
    rects: [
      // Clear brook running north-south, leaving y: 42..59 open as the central wooden footbridge!
      { minX: 46, maxX: 54, minY: 6, maxY: 42, label: '사계절 시냇물 (북측)' },
      { minX: 46, maxX: 54, minY: 59, maxY: 95, label: '사계절 시냇물 (남측)' },
    ],
  },
  reception: {
    circles: [
      { x: 50, y: 18.5, r: 6.8, label: '축복의 소원나무' },
      { x: 50, y: 50, r: 7.6, label: '웨딩 케이크 & 샴페인 타워' },
      { x: 20, y: 35, r: 5.8, label: '좌측 북단 만찬 테이블' },
      { x: 80, y: 35, r: 5.8, label: '우측 북단 만찬 테이블' },
      { x: 20, y: 66, r: 5.8, label: '좌측 남단 만찬 테이블' },
    ],
    rects: [],
  },
};

const MIN_X = 8;
const MAX_X = 92;
const MIN_Y = 14;
const MAX_Y = 93;

export function clampToWorldBounds(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(MIN_X, Math.min(MAX_X, x)),
    y: Math.max(MIN_Y, Math.min(MAX_Y, y)),
  };
}

/**
 * Converts world percentage coordinates (8..92, 14..93) to discrete 24x24 tile grid indices.
 */
export function worldToTile(x: number, y: number): TileCoord {
  const clamped = clampToWorldBounds(x, y);
  const col = Math.max(
    0,
    Math.min(
      TILE_GRID_SIZE - 1,
      Math.round(((clamped.x - MIN_X) / (MAX_X - MIN_X)) * (TILE_GRID_SIZE - 1))
    )
  );
  const row = Math.max(
    0,
    Math.min(
      TILE_GRID_SIZE - 1,
      Math.round(((clamped.y - MIN_Y) / (MAX_Y - MIN_Y)) * (TILE_GRID_SIZE - 1))
    )
  );
  return tileToWorld(col, row);
}

/**
 * Converts discrete tile (col, row) back to the exact world center of that tile.
 */
export function tileToWorld(col: number, row: number): TileCoord {
  const c = Math.max(0, Math.min(TILE_GRID_SIZE - 1, col));
  const r = Math.max(0, Math.min(TILE_GRID_SIZE - 1, row));
  const x = MIN_X + (c / (TILE_GRID_SIZE - 1)) * (MAX_X - MIN_X);
  const y = MIN_Y + (r / (TILE_GRID_SIZE - 1)) * (MAX_Y - MIN_Y);
  return { col: c, row: r, x, y };
}

export function isPointBlocked(
  x: number,
  y: number,
  mapId: GardenMapId,
  padding = 0.5
): boolean {
  if (x < MIN_X || x > MAX_X || y < MIN_Y || y > MAX_Y) return true;
  const obs = MAP_OBSTACLES[mapId];
  for (const c of obs.circles) {
    const dist = Math.hypot(x - c.x, y - c.y);
    if (dist < c.r + padding) return true;
  }
  for (const r of obs.rects) {
    if (
      x >= r.minX - padding &&
      x <= r.maxX + padding &&
      y >= r.minY - padding &&
      y <= r.maxY + padding
    ) {
      return true;
    }
  }
  return false;
}

export function isTileBlocked(
  col: number,
  row: number,
  mapId: GardenMapId
): boolean {
  if (col < 0 || col >= TILE_GRID_SIZE || row < 0 || row >= TILE_GRID_SIZE) {
    return true;
  }
  const { x, y } = tileToWorld(col, row);
  return isPointBlocked(x, y, mapId, 0.35);
}

/**
 * Finds the nearest walkable tile to any target coordinate.
 */
export function findNearestWalkableTile(
  targetX: number,
  targetY: number,
  mapId: GardenMapId
): TileCoord {
  const base = worldToTile(targetX, targetY);
  if (!isTileBlocked(base.col, base.row, mapId)) {
    return base;
  }

  for (let radius = 1; radius < TILE_GRID_SIZE; radius++) {
    let best: TileCoord | null = null;
    let bestDist = Infinity;
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (Math.abs(dc) !== radius && Math.abs(dr) !== radius) continue;
        const nc = base.col + dc;
        const nr = base.row + dr;
        if (!isTileBlocked(nc, nr, mapId)) {
          const cand = tileToWorld(nc, nr);
          const d = Math.hypot(cand.x - targetX, cand.y - targetY);
          if (d < bestDist) {
            bestDist = d;
            best = cand;
          }
        }
      }
    }
    if (best) return best;
  }

  return base;
}

/**
 * Given a current tile and an input vector (dx, dy) from joystick or keyboard,
 * returns the next adjacent walkable tile to step onto (supporting crisp 4-way
 * cardinal steps first, or sliding along an obstacle if the primary axis is blocked).
 */
export function getNextStepTile(
  currCol: number,
  currRow: number,
  dx: number,
  dy: number,
  mapId: GardenMapId
): TileCoord | null {
  if (Math.hypot(dx, dy) < 0.12) return null;

  const stepC = Math.abs(dx) > 0.28 ? (dx > 0 ? 1 : -1) : 0;
  const stepR = Math.abs(dy) > 0.28 ? (dy > 0 ? 1 : -1) : 0;

  // Prefer dominant axis for classic crisp RPG tile stepping, with secondary axis fallback
  const candidates: [number, number][] = [];
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (stepC !== 0) candidates.push([currCol + stepC, currRow]);
    if (stepR !== 0) candidates.push([currCol, currRow + stepR]);
    if (stepC !== 0 && stepR !== 0) candidates.push([currCol + stepC, currRow + stepR]);
  } else {
    if (stepR !== 0) candidates.push([currCol, currRow + stepR]);
    if (stepC !== 0) candidates.push([currCol + stepC, currRow]);
    if (stepC !== 0 && stepR !== 0) candidates.push([currCol + stepC, currRow + stepR]);
  }

  for (const [nc, nr] of candidates) {
    if (!isTileBlocked(nc, nr, mapId)) {
      return tileToWorld(nc, nr);
    }
  }

  return null;
}

/**
 * Computes a tile-by-tile A* path on the 24x24 grid so the floor highlights
 * each stepping stone tile (`▢ → ▢ → ▢`) and characters walk cleanly along the grid!
 */
export function findWalkablePath(
  startX: number,
  startY: number,
  rawGoalX: number,
  rawGoalY: number,
  mapId: GardenMapId
): TileCoord[] {
  const startTile = findNearestWalkableTile(startX, startY, mapId);
  const goalTile = findNearestWalkableTile(rawGoalX, rawGoalY, mapId);

  if (startTile.col === goalTile.col && startTile.row === goalTile.row) {
    return [goalTile];
  }

  const N = TILE_GRID_SIZE;
  const key = (c: number, r: number) => r * N + c;
  const gScore = new Float32Array(N * N).fill(Infinity);
  const fScore = new Float32Array(N * N).fill(Infinity);
  const cameFrom = new Int32Array(N * N).fill(-1);
  const closed = new Uint8Array(N * N);

  const startKey = key(startTile.col, startTile.row);
  const goalKey = key(goalTile.col, goalTile.row);

  const heuristic = (c: number, r: number) =>
    Math.abs(goalTile.col - c) + Math.abs(goalTile.row - r);

  gScore[startKey] = 0;
  fScore[startKey] = heuristic(startTile.col, startTile.row);

  const open: number[] = [startKey];

  // 4-directional cardinal priority + slight penalty on diagonals for authentic RPG tile paths
  const dirs = [
    [0, -1, 1.0],
    [1, 0, 1.0],
    [0, 1, 1.0],
    [-1, 0, 1.0],
    [-1, -1, 1.48],
    [1, -1, 1.48],
    [-1, 1, 1.48],
    [1, 1, 1.48],
  ];

  let bestNode = startKey;
  let bestH = fScore[startKey];

  while (open.length > 0) {
    let bestIdx = 0;
    for (let i = 1; i < open.length; i++) {
      if (fScore[open[i]] < fScore[open[bestIdx]]) {
        bestIdx = i;
      }
    }
    const current = open[bestIdx];
    open.splice(bestIdx, 1);

    if (current === goalKey) {
      bestNode = goalKey;
      break;
    }

    if (closed[current]) continue;
    closed[current] = 1;

    const cc = current % N;
    const cr = Math.floor(current / N);

    for (const [dc, dr, cost] of dirs) {
      const nc = cc + dc;
      const nr = cr + dr;
      if (nc < 0 || nc >= N || nr < 0 || nr >= N) continue;

      const nKey = key(nc, nr);
      if (closed[nKey]) continue;
      if (nKey !== goalKey && isTileBlocked(nc, nr, mapId)) continue;

      // Prevent diagonal corner cutting across blocked tiles
      if (dc !== 0 && dr !== 0) {
        if (isTileBlocked(cc + dc, cr, mapId) || isTileBlocked(cc, cr + dr, mapId)) {
          continue;
        }
      }

      const tentativeG = gScore[current] + cost;
      if (tentativeG < gScore[nKey]) {
        cameFrom[nKey] = current;
        gScore[nKey] = tentativeG;
        const h = heuristic(nc, nr);
        fScore[nKey] = tentativeG + h;
        if (h < bestH) {
          bestH = h;
          bestNode = nKey;
        }
        if (!open.includes(nKey)) {
          open.push(nKey);
        }
      }
    }
  }

  const path: TileCoord[] = [];
  let curr = bestNode;
  while (curr !== -1 && curr !== startKey) {
    const cc = curr % N;
    const cr = Math.floor(curr / N);
    path.unshift(tileToWorld(cc, cr));
    curr = cameFrom[curr];
  }

  if (path.length === 0) {
    return [goalTile];
  }
  return path;
}

export function resolveObstacleCollision(
  prevX: number,
  prevY: number,
  nextX: number,
  nextY: number,
  mapId: GardenMapId
): { x: number; y: number } {
  const tile = findNearestWalkableTile(nextX, nextY, mapId);
  if (isPointBlocked(nextX, nextY, mapId, 0.4)) {
    return { x: prevX, y: prevY };
  }
  return clampToWorldBounds(tile.x, tile.y);
}
