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

export const MAP_OBSTACLES: Record<GardenMapId, MapObstacleConfig> = {
  garden: {
    circles: [
      { x: 50, y: 49.5, r: 8.8, label: '중앙 백조의 분수대' },
      { x: 15, y: 14.5, r: 5.8, label: '북서 로즈 파빌리온' },
      { x: 85, y: 14.5, r: 5.8, label: '북동 갤러리 파빌리온' },
      { x: 15, y: 74.5, r: 5.8, label: '남서 스테이션 파빌리온' },
      { x: 85, y: 74.5, r: 5.8, label: '남동 축복 파빌리온' },
    ],
    rects: [],
  },
  chapel: {
    circles: [
      { x: 23, y: 21, r: 5.5, label: '화이트 그랜드 피아노' },
    ],
    rects: [
      { minX: 16, maxX: 37, minY: 42, maxY: 81, label: '채플 좌측 하객석' },
      { minX: 63, maxX: 84, minY: 42, maxY: 81, label: '채플 우측 하객석' },
      { minX: 37, maxX: 63, minY: 8, maxY: 19.5, label: '본식 로즈 단상' },
    ],
  },
  memory: {
    circles: [
      { x: 19, y: 21, r: 5.8, label: '봄날 창가 카페 테이블' },
      { x: 78, y: 21, r: 5.8, label: '겨울 별빛 트리' },
    ],
    rects: [
      // Clear brook running north-south, leaving y: 43..58 open as the central wooden footbridge!
      { minX: 45.5, maxX: 54.5, minY: 6, maxY: 43, label: '사계절 시냇물 (북측)' },
      { minX: 45.5, maxX: 54.5, minY: 58, maxY: 95, label: '사계절 시냇물 (남측)' },
    ],
  },
  reception: {
    circles: [
      { x: 50, y: 18.5, r: 7.2, label: '축복의 소원나무' },
      { x: 50, y: 50, r: 8.2, label: '웨딩 케이크 & 샴페인 타워' },
      { x: 20, y: 35, r: 6.4, label: '좌측 북단 만찬 테이블' },
      { x: 80, y: 35, r: 6.4, label: '우측 북단 만찬 테이블' },
      { x: 20, y: 66, r: 6.4, label: '좌측 남단 만찬 테이블' },
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

export function isPointBlocked(
  x: number,
  y: number,
  mapId: GardenMapId,
  padding = 0.6
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

/**
 * Resolves continuous movement collision against circular and rectangular obstacles,
 * smoothly sliding along walls/fountains when using keyboard, D-Pad, or virtual joystick.
 */
export function resolveObstacleCollision(
  prevX: number,
  prevY: number,
  nextX: number,
  nextY: number,
  mapId: GardenMapId
): { x: number; y: number } {
  const clamped = clampToWorldBounds(nextX, nextY);
  let x = clamped.x;
  let y = clamped.y;
  const obs = MAP_OBSTACLES[mapId];
  const pad = 0.7;

  // Push out of circular obstacles radially
  for (const c of obs.circles) {
    const dx = x - c.x;
    const dy = y - c.y;
    const dist = Math.hypot(dx, dy);
    const minDist = c.r + pad;
    if (dist < minDist) {
      const safeDist = dist < 0.001 ? 1 : dist;
      const nx = dist < 0.001 ? 0 : dx / safeDist;
      const ny = dist < 0.001 ? 1 : dy / safeDist;
      x = c.x + nx * minDist;
      y = c.y + ny * minDist;
    }
  }

  // Slide along rectangular obstacles using axis separation
  for (const r of obs.rects) {
    const left = r.minX - pad;
    const right = r.maxX + pad;
    const top = r.minY - pad;
    const bottom = r.maxY + pad;

    if (x > left && x < right && y > top && y < bottom) {
      // Try keeping X movement only or Y movement only first for smooth wall sliding
      const canMoveXOnly = !(prevY > top && prevY < bottom && x > left && x < right);
      const canMoveYOnly = !(prevX > left && prevX < right && y > top && y < bottom);

      if (canMoveXOnly && Math.abs(x - prevX) > 0.01) {
        y = prevY;
      } else if (canMoveYOnly && Math.abs(y - prevY) > 0.01) {
        x = prevX;
      } else {
        // Push out to nearest edge
        const dLeft = Math.abs(x - left);
        const dRight = Math.abs(right - x);
        const dTop = Math.abs(y - top);
        const dBottom = Math.abs(bottom - y);
        const minEdge = Math.min(dLeft, dRight, dTop, dBottom);
        if (minEdge === dLeft) x = left;
        else if (minEdge === dRight) x = right;
        else if (minEdge === dTop) y = top;
        else y = bottom;
      }
    }
  }

  return clampToWorldBounds(x, y);
}

/**
 * If a clicked destination lies inside an obstacle (e.g., tapping directly on the fountain
 * or wedding cake), project it onto the nearest walkable point outside the obstacle.
 */
export function findNearestWalkablePoint(
  targetX: number,
  targetY: number,
  mapId: GardenMapId
): { x: number; y: number } {
  const clamped = clampToWorldBounds(targetX, targetY);
  let x = clamped.x;
  let y = clamped.y;

  if (!isPointBlocked(x, y, mapId, 1.0)) {
    return { x, y };
  }

  const obs = MAP_OBSTACLES[mapId];
  for (const c of obs.circles) {
    const dx = x - c.x;
    const dy = y - c.y;
    const dist = Math.hypot(dx, dy);
    if (dist < c.r + 1.4) {
      if (dist < 0.1) {
        // Default to south of the circular feature (facing the landmark)
        x = c.x;
        y = c.y + c.r + 1.8;
      } else {
        x = c.x + (dx / dist) * (c.r + 1.6);
        y = c.y + (dy / dist) * (c.r + 1.6);
      }
    }
  }

  for (const r of obs.rects) {
    const pad = 1.4;
    if (
      x >= r.minX - pad &&
      x <= r.maxX + pad &&
      y >= r.minY - pad &&
      y <= r.maxY + pad
    ) {
      const dLeft = Math.abs(x - (r.minX - pad));
      const dRight = Math.abs(r.maxX + pad - x);
      const dTop = Math.abs(y - (r.minY - pad));
      const dBottom = Math.abs(r.maxY + pad - y);
      const m = Math.min(dLeft, dRight, dTop, dBottom);
      if (m === dLeft) x = r.minX - pad;
      else if (m === dRight) x = r.maxX + pad;
      else if (m === dTop) y = r.minY - pad;
      else y = r.maxY + pad;
    }
  }

  return clampToWorldBounds(x, y);
}

function hasLineOfSight(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  mapId: GardenMapId
): boolean {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(2, Math.ceil(dist / 1.2));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const px = x1 + (x2 - x1) * t;
    const py = y1 + (y2 - y1) * t;
    if (isPointBlocked(px, py, mapId, 0.55)) {
      return false;
    }
  }
  return true;
}

/**
 * Computes a smooth, obstacle-aware waypoint path from (startX, startY) to (goalX, goalY)
 * using 8-directional A* search followed by line-of-sight string-pulling.
 */
export function findWalkablePath(
  startX: number,
  startY: number,
  rawGoalX: number,
  rawGoalY: number,
  mapId: GardenMapId
): { x: number; y: number }[] {
  const goal = findNearestWalkablePoint(rawGoalX, rawGoalY, mapId);

  // Fast path: direct line-of-sight is clear
  if (hasLineOfSight(startX, startY, goal.x, goal.y, mapId)) {
    return [goal];
  }

  const GRID_SIZE = 44;
  const toGridX = (wx: number) =>
    Math.max(0, Math.min(GRID_SIZE - 1, Math.round(((wx - MIN_X) / (MAX_X - MIN_X)) * (GRID_SIZE - 1))));
  const toGridY = (wy: number) =>
    Math.max(0, Math.min(GRID_SIZE - 1, Math.round(((wy - MIN_Y) / (MAX_Y - MIN_Y)) * (GRID_SIZE - 1))));
  const toWorldX = (gx: number) => MIN_X + (gx / (GRID_SIZE - 1)) * (MAX_X - MIN_X);
  const toWorldY = (gy: number) => MIN_Y + (gy / (GRID_SIZE - 1)) * (MAX_Y - MIN_Y);

  const sx = toGridX(startX);
  const sy = toGridY(startY);
  const gx = toGridX(goal.x);
  const gy = toGridY(goal.y);

  const key = (x: number, y: number) => y * GRID_SIZE + x;
  const gScore = new Float32Array(GRID_SIZE * GRID_SIZE).fill(Infinity);
  const fScore = new Float32Array(GRID_SIZE * GRID_SIZE).fill(Infinity);
  const cameFrom = new Int32Array(GRID_SIZE * GRID_SIZE).fill(-1);
  const closed = new Uint8Array(GRID_SIZE * GRID_SIZE);

  const startKey = key(sx, sy);
  const goalKey = key(gx, gy);
  gScore[startKey] = 0;
  fScore[startKey] = Math.hypot(gx - sx, gy - sy);

  const open: number[] = [startKey];

  const dirs = [
    [0, -1, 1],
    [1, 0, 1],
    [0, 1, 1],
    [-1, 0, 1],
    [-1, -1, 1.414],
    [1, -1, 1.414],
    [-1, 1, 1.414],
    [1, 1, 1.414],
  ];

  let bestNode = startKey;
  let bestHeuristic = fScore[startKey];

  while (open.length > 0) {
    // Pop node with lowest fScore
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

    const cx = current % GRID_SIZE;
    const cy = Math.floor(current / GRID_SIZE);

    for (const [dx, dy, cost] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;

      const nKey = key(nx, ny);
      if (closed[nKey]) continue;

      const wx = toWorldX(nx);
      const wy = toWorldY(ny);
      if (nKey !== goalKey && isPointBlocked(wx, wy, mapId, 0.65)) continue;

      const tentativeG = gScore[current] + cost;
      if (tentativeG < gScore[nKey]) {
        cameFrom[nKey] = current;
        gScore[nKey] = tentativeG;
        const h = Math.hypot(gx - nx, gy - ny);
        fScore[nKey] = tentativeG + h;
        if (h < bestHeuristic) {
          bestHeuristic = h;
          bestNode = nKey;
        }
        if (!open.includes(nKey)) {
          open.push(nKey);
        }
      }
    }
  }

  // Reconstruct raw grid path
  const rawWaypoints: { x: number; y: number }[] = [];
  let curr = bestNode;
  while (curr !== -1 && curr !== startKey) {
    const cx = curr % GRID_SIZE;
    const cy = Math.floor(curr / GRID_SIZE);
    rawWaypoints.unshift({ x: toWorldX(cx), y: toWorldY(cy) });
    curr = cameFrom[curr];
  }
  if (rawWaypoints.length === 0) {
    return [goal];
  }
  rawWaypoints[rawWaypoints.length - 1] = goal;

  // Smooth waypoints with line-of-sight string pulling
  const smoothed: { x: number; y: number }[] = [];
  let anchorX = startX;
  let anchorY = startY;
  let idx = 0;

  while (idx < rawWaypoints.length) {
    let furthest = idx;
    for (let probe = rawWaypoints.length - 1; probe > idx; probe--) {
      if (
        hasLineOfSight(
          anchorX,
          anchorY,
          rawWaypoints[probe].x,
          rawWaypoints[probe].y,
          mapId
        )
      ) {
        furthest = probe;
        break;
      }
    }
    smoothed.push(rawWaypoints[furthest]);
    anchorX = rawWaypoints[furthest].x;
    anchorY = rawWaypoints[furthest].y;
    idx = furthest + 1;
  }

  return smoothed;
}
