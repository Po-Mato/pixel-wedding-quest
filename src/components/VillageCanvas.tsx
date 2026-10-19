import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  QUEST_BUILDINGS,
  QuestBuildingId,
  WeddingConfig,
  GuestbookEntry,
} from '../data/weddingConfig';
import { soundEngine } from '../utils/soundEngine';

interface VillageCanvasProps {
  config: WeddingConfig;
  visitedQuests: Record<QuestBuildingId, boolean>;
  guestbook: GuestbookEntry[];
  onOpenQuest: (id: QuestBuildingId) => void;
}

interface Petal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

interface TrailPoint {
  x: number;
  y: number;
}

export const VillageCanvas: React.FC<VillageCanvasProps> = ({
  config,
  visitedQuests,
  guestbook,
  onOpenQuest,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Player position in normalized map coordinates (0..100)
  const posRef = useRef<{ x: number; y: number }>({ x: 50, y: 63 });
  const targetPosRef = useRef<{ x: number; y: number } | null>(null);
  const pendingQuestRef = useRef<QuestBuildingId | null>(null);
  const trailRef = useRef<TrailPoint[]>(
    Array.from({ length: 24 }, () => ({ x: 50, y: 65 }))
  );
  const keysRef = useRef<Record<string, boolean>>({});
  const dpadDirRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const stepSoundCooldownRef = useRef<number>(0);

  const [nearbyBuilding, setNearbyBuilding] = useState<(typeof QUEST_BUILDINGS)[0] | null>(
    null
  );
  const [npcBubbleIndex, setNpcBubbleIndex] = useState<number>(0);

  // Cycle guestbook speech bubbles every 3.5 seconds
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNpcBubbleIndex((prev) => prev + 1);
    }, 3500);
    return () => window.clearInterval(timer);
  }, []);

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      keysRef.current[e.key] = true;
      if (e.key === ' ' || e.key === 'Enter') {
        if (nearbyBuilding) {
          e.preventDefault();
          soundEngine.playSelect();
          onOpenQuest(nearbyBuilding.id);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [nearbyBuilding, onOpenQuest]);

  // Move to a building and open its modal upon arrival
  const walkToBuilding = useCallback(
    (buildingId: QuestBuildingId) => {
      const b = QUEST_BUILDINGS.find((item) => item.id === buildingId);
      if (!b) return;
      soundEngine.playBlip(740);
      targetPosRef.current = { x: b.x, y: Math.min(92, b.y + 8) };
      pendingQuestRef.current = b.id;
    },
    []
  );

  // Handle tap/click directly on the canvas
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Check if user tapped on or near a building
    const tappedBuilding = QUEST_BUILDINGS.find((b) => {
      const dist = Math.hypot(clickX - b.x, clickY - b.y);
      return dist < 13;
    });

    if (tappedBuilding) {
      // If already very close, open immediately! Otherwise walk there and auto-open
      const distFromPlayer = Math.hypot(
        posRef.current.x - tappedBuilding.x,
        posRef.current.y - tappedBuilding.y
      );
      if (distFromPlayer < 16) {
        soundEngine.playSelect();
        onOpenQuest(tappedBuilding.id);
      } else {
        walkToBuilding(tappedBuilding.id);
      }
    } else {
      // Walk to tapped ground position
      soundEngine.playBlip(520);
      targetPosRef.current = {
        x: Math.max(8, Math.min(92, clickX)),
        y: Math.max(14, Math.min(92, clickY)),
      };
      pendingQuestRef.current = null;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 380;
    const H = 360;
    canvas.width = W;
    canvas.height = H;

    // Initialize floating cherry blossom petals
    const petals: Petal[] = Array.from({ length: 24 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: -0.25 - Math.random() * 0.35,
      vy: 0.35 + Math.random() * 0.45,
      size: Math.random() > 0.5 ? 3 : 2,
      color: Math.random() > 0.3 ? '#ffb3c6' : '#ffe5ec',
    }));

    let animId: number;
    let tick = 0;

    const drawPixelSpriteChar = (
      cx: number,
      cy: number,
      role: 'groom' | 'bride' | 'cat' | 'npc',
      walkFrame: number,
      npcColor = '#4dabf7'
    ) => {
      const bob = walkFrame % 2 === 1 ? -2 : 0;
      const x = Math.round(cx);
      const y = Math.round(cy + bob);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(x - 6, Math.round(cy) + 8, 12, 3);

      if (role === 'cat') {
        // Mochi the Cheese Cat
        ctx.fillStyle = '#ffa94d';
        ctx.fillRect(x - 4, y - 2, 8, 6);
        ctx.fillRect(x - 4, y - 4, 2, 2);
        ctx.fillRect(x + 2, y - 4, 2, 2);
        ctx.fillStyle = '#1a132b';
        ctx.fillRect(x - 3, y, 1, 1);
        ctx.fillRect(x + 2, y, 1, 1);
        ctx.fillStyle = '#ff5277';
        ctx.fillRect(x - 2, y + 3, 4, 1);
        ctx.fillStyle = '#ffe8cc';
        ctx.fillRect(x - 3, y + 4, 6, 4);
        return;
      }

      if (role === 'groom') {
        // Crown
        ctx.fillStyle = '#ffd541';
        ctx.fillRect(x - 3, y - 12, 6, 2);
        // Hair
        ctx.fillStyle = config.groom.hairColor || '#2c1e18';
        ctx.fillRect(x - 5, y - 10, 10, 3);
        // Face
        ctx.fillStyle = '#ffe0bd';
        ctx.fillRect(x - 4, y - 7, 8, 5);
        // Eyes
        ctx.fillStyle = '#1a132b';
        ctx.fillRect(x - 3, y - 5, 2, 2);
        ctx.fillRect(x + 1, y - 5, 2, 2);
        // Suit
        ctx.fillStyle = config.groom.suitColor || '#2b3a67';
        ctx.fillRect(x - 5, y - 2, 10, 7);
        // Shirt & Bowtie
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 2, y - 2, 4, 4);
        ctx.fillStyle = '#ff5277';
        ctx.fillRect(x - 1, y - 2, 2, 2);
        // Feet
        ctx.fillStyle = '#111';
        ctx.fillRect(x - 4, y + 5 + (walkFrame % 2), 3, 2);
        ctx.fillRect(x + 1, y + 5 + ((walkFrame + 1) % 2), 3, 2);
      } else if (role === 'bride') {
        // Veil
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(x - 7, y - 9, 14, 12);
        // Tiara
        ctx.fillStyle = '#ffd541';
        ctx.fillRect(x - 3, y - 12, 6, 2);
        ctx.fillStyle = '#ff5277';
        ctx.fillRect(x - 1, y - 13, 2, 1);
        // Hair
        ctx.fillStyle = config.bride.hairColor || '#3b2314';
        ctx.fillRect(x - 5, y - 10, 10, 3);
        // Face
        ctx.fillStyle = '#ffe4c8';
        ctx.fillRect(x - 4, y - 7, 8, 5);
        // Eyes
        ctx.fillStyle = '#1a132b';
        ctx.fillRect(x - 3, y - 5, 2, 2);
        ctx.fillRect(x + 1, y - 5, 2, 2);
        // Dress
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 5, y - 2, 10, 4);
        ctx.fillRect(x - 7, y + 2, 14, 5);
        // Bouquet
        ctx.fillStyle = '#38d9a9';
        ctx.fillRect(x - 2, y, 4, 3);
        ctx.fillStyle = '#ff5277';
        ctx.fillRect(x - 2, y, 2, 2);
        ctx.fillStyle = '#ffd541';
        ctx.fillRect(x, y + 1, 2, 2);
      } else {
        // Guest NPC
        ctx.fillStyle = npcColor;
        ctx.fillRect(x - 4, y - 10, 8, 3);
        ctx.fillStyle = '#ffe0bd';
        ctx.fillRect(x - 4, y - 7, 8, 5);
        ctx.fillStyle = '#1a132b';
        ctx.fillRect(x - 2, y - 5, 1, 2);
        ctx.fillRect(x + 1, y - 5, 1, 2);
        ctx.fillStyle = npcColor;
        ctx.fillRect(x - 4, y - 2, 8, 7);
      }
    };

    const drawBuildingSprite = (
      b: (typeof QUEST_BUILDINGS)[0],
      bx: number,
      by: number,
      isVisited: boolean,
      isNear: boolean
    ) => {
      const x = Math.round(bx);
      const y = Math.round(by);

      // Highlight aura when near
      if (isNear) {
        ctx.fillStyle = 'rgba(255, 213, 65, 0.28)';
        ctx.beginPath();
        ctx.arc(x, y + 2, 34, 0, Math.PI * 2);
        ctx.fill();
      }

      if (b.id === 'ceremony') {
        // Grand Wedding Cathedral at Top Center
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(x - 32, y - 18, 64, 34);
        // Twin Towers
        ctx.fillStyle = '#e9ecef';
        ctx.fillRect(x - 36, y - 26, 14, 42);
        ctx.fillRect(x + 22, y - 26, 14, 42);
        // Pink / Royal Roofs
        ctx.fillStyle = '#ff5277';
        ctx.beginPath();
        ctx.moveTo(x - 26, y - 18);
        ctx.lineTo(x, y - 38);
        ctx.lineTo(x + 26, y - 18);
        ctx.fill();
        ctx.fillRect(x - 38, y - 32, 18, 6);
        ctx.fillRect(x + 20, y - 32, 18, 6);
        // Cross / Bell on top
        ctx.fillStyle = '#ffd541';
        ctx.fillRect(x - 1, y - 44, 2, 7);
        ctx.fillRect(x - 3, y - 42, 6, 2);
        // Stained Glass Rose Window
        ctx.fillStyle = '#4dabf7';
        ctx.fillRect(x - 6, y - 12, 12, 10);
        ctx.fillStyle = '#ffd541';
        ctx.fillRect(x - 2, y - 10, 4, 6);
        // Red Carpet Door
        ctx.fillStyle = '#5c3c24';
        ctx.fillRect(x - 7, y + 2, 14, 14);
        ctx.fillStyle = '#ff5277';
        ctx.fillRect(x - 5, y + 10, 10, 8);
      } else if (b.id === 'minigame') {
        // Center Blessing Fountain
        ctx.fillStyle = '#adb5bd';
        ctx.fillRect(x - 22, y - 12, 44, 24);
        ctx.fillStyle = '#339af0';
        ctx.fillRect(x - 18, y - 8, 36, 16);
        // Animated water splash
        ctx.fillStyle = tick % 20 < 10 ? '#a5d8ff' : '#74c0fc';
        ctx.fillRect(x - 6, y - 14, 12, 12);
        ctx.fillRect(x - 12, y - 4, 6, 4);
        ctx.fillRect(x + 6, y - 2, 6, 4);
        // Gold Statue / Heart in center
        ctx.fillStyle = '#ffd541';
        ctx.fillRect(x - 4, y - 18, 8, 8);
        ctx.fillStyle = '#ff5277';
        ctx.fillRect(x - 3, y - 22, 6, 5);
      } else {
        // Cozy RPG Town Buildings (Guild, Museum, Station, Bank, Tavern)
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(x - 24, y + 12, 48, 5);
        // Walls
        ctx.fillStyle = '#f3e5ab';
        ctx.fillRect(x - 22, y - 8, 44, 22);
        // Timber framing
        ctx.fillStyle = '#6c462c';
        ctx.fillRect(x - 22, y - 8, 3, 22);
        ctx.fillRect(x + 19, y - 8, 3, 22);
        ctx.fillRect(x - 22, y + 2, 44, 2);
        // Colored Pixel Roof
        ctx.fillStyle = b.color;
        ctx.fillRect(x - 26, y - 16, 52, 9);
        ctx.fillRect(x - 22, y - 21, 44, 5);
        ctx.fillRect(x - 16, y - 25, 32, 4);
        // Windows
        ctx.fillStyle = '#ffd541';
        ctx.fillRect(x - 15, y - 4, 6, 5);
        ctx.fillRect(x + 9, y - 4, 6, 5);
        // Door
        ctx.fillStyle = '#4a3020';
        ctx.fillRect(x - 5, y + 3, 10, 11);
      }

      // Floating Quest Marker [!] or [★]
      const floatY = Math.sin(tick * 0.08 + b.x) * 2.5;
      const badgeW = 16;
      const badgeH = 14;
      const badgeY = b.id === 'ceremony' ? y - 54 + floatY : y - 38 + floatY;

      ctx.fillStyle = isVisited ? '#38d9a9' : '#ffd541';
      ctx.fillRect(x - badgeW / 2, badgeY, badgeW, badgeH);
      ctx.strokeStyle = '#120d1e';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - badgeW / 2, badgeY, badgeW, badgeH);

      ctx.fillStyle = '#120d1e';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isVisited ? '★' : '!', x, badgeY + 11);

      // Building Label Tag
      const label = b.shortName;
      ctx.font = 'bold 10px "Galmuri11", "DungGeunMo", monospace';
      const textWidth = ctx.measureText(label).width + 10;
      ctx.fillStyle = isNear ? '#ffd541' : 'rgba(18, 13, 30, 0.86)';
      ctx.fillRect(x - textWidth / 2, y + 17, textWidth, 15);
      ctx.strokeStyle = isNear ? '#120d1e' : b.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - textWidth / 2, y + 17, textWidth, 15);

      ctx.fillStyle = isNear ? '#120d1e' : '#fff8e7';
      ctx.fillText(label, x, y + 28);
    };

    const render = () => {
      tick++;

      // 1. Update Player Movement
      let dx = dpadDirRef.current.dx;
      let dy = dpadDirRef.current.dy;

      if (keysRef.current['ArrowLeft'] || keysRef.current['a'] || keysRef.current['A']) dx -= 1;
      if (keysRef.current['ArrowRight'] || keysRef.current['d'] || keysRef.current['D']) dx += 1;
      if (keysRef.current['ArrowUp'] || keysRef.current['w'] || keysRef.current['W']) dy -= 1;
      if (keysRef.current['ArrowDown'] || keysRef.current['s'] || keysRef.current['S']) dy += 1;

      const speed = 0.55;
      let isMoving = false;

      if (dx !== 0 || dy !== 0) {
        // Manual control overrides auto-target
        targetPosRef.current = null;
        pendingQuestRef.current = null;
        const len = Math.hypot(dx, dy) || 1;
        posRef.current.x = Math.max(8, Math.min(92, posRef.current.x + (dx / len) * speed));
        posRef.current.y = Math.max(14, Math.min(92, posRef.current.y + (dy / len) * speed));
        isMoving = true;
      } else if (targetPosRef.current) {
        const tx = targetPosRef.current.x;
        const ty = targetPosRef.current.y;
        const dist = Math.hypot(tx - posRef.current.x, ty - posRef.current.y);
        if (dist > 1.2) {
          posRef.current.x += ((tx - posRef.current.x) / dist) * (speed * 1.25);
          posRef.current.y += ((ty - posRef.current.y) / dist) * (speed * 1.25);
          isMoving = true;
        } else {
          targetPosRef.current = null;
          if (pendingQuestRef.current) {
            const qId = pendingQuestRef.current;
            pendingQuestRef.current = null;
            soundEngine.playSelect();
            onOpenQuest(qId);
          }
        }
      }

      if (isMoving) {
        trailRef.current.unshift({ x: posRef.current.x, y: posRef.current.y });
        if (trailRef.current.length > 26) trailRef.current.pop();
        if (tick - stepSoundCooldownRef.current > 14) {
          soundEngine.playStep();
          stepSoundCooldownRef.current = tick;
        }
      }

      // Check proximity to buildings
      let closest: (typeof QUEST_BUILDINGS)[0] | null = null;
      let minDist = 15;
      for (const b of QUEST_BUILDINGS) {
        const d = Math.hypot(posRef.current.x - b.x, posRef.current.y - (b.y + 4));
        if (d < minDist) {
          minDist = d;
          closest = b;
        }
      }
      setNearbyBuilding((prev) => (prev?.id !== closest?.id ? closest : prev));

      // 2. Draw Grass Background
      ctx.fillStyle = '#2d6a4f';
      ctx.fillRect(0, 0, W, H);

      // Checkerboard lush pixel grass patches
      ctx.fillStyle = '#367a5b';
      for (let gx = 0; gx < W; gx += 24) {
        for (let gy = 0; gy < H; gy += 24) {
          if ((gx + gy) % 48 === 0) {
            ctx.fillRect(gx + 4, gy + 4, 8, 4);
            ctx.fillRect(gx + 6, gy + 2, 4, 2);
          }
        }
      }

      // 3. Draw Cobblestone Village Roads & Plaza
      ctx.fillStyle = '#d8c3a5';
      // Central Vertical Road (Cathedral to Tavern)
      ctx.fillRect(W * 0.44, H * 0.16, W * 0.12, H * 0.72);
      // Horizontal Crossroad
      ctx.fillRect(W * 0.18, H * 0.45, W * 0.64, H * 0.1);
      // Diagonal/Branch paths to 4 corner buildings
      ctx.fillRect(W * 0.2, H * 0.26, W * 0.06, H * 0.5);
      ctx.fillRect(W * 0.74, H * 0.26, W * 0.06, H * 0.5);
      // Center Plaza Square
      ctx.fillRect(W * 0.36, H * 0.38, W * 0.28, H * 0.24);

      // Red Wedding Carpet leading to Cathedral
      ctx.fillStyle = '#e03131';
      ctx.fillRect(W * 0.47, H * 0.18, W * 0.06, H * 0.22);
      ctx.fillStyle = '#ffd541';
      ctx.fillRect(W * 0.47, H * 0.18, 2, H * 0.22);
      ctx.fillRect(W * 0.53 - 2, H * 0.18, 2, H * 0.22);

      // 4. Cherry Blossom Trees in Corners & Edges
      const treePositions = [
        { x: 26, y: 40 },
        { x: 354, y: 40 },
        { x: 30, y: 175 },
        { x: 350, y: 175 },
        { x: 28, y: 325 },
        { x: 352, y: 325 },
        { x: 130, y: 52 },
        { x: 250, y: 52 },
      ];
      treePositions.forEach((t) => {
        // Trunk
        ctx.fillStyle = '#5c3c24';
        ctx.fillRect(t.x - 3, t.y, 6, 10);
        // Pink Blossom Canopy
        ctx.fillStyle = '#ff8fab';
        ctx.fillRect(t.x - 12, t.y - 12, 24, 14);
        ctx.fillStyle = '#ffb3c6';
        ctx.fillRect(t.x - 9, t.y - 16, 18, 12);
        ctx.fillStyle = '#ffe5ec';
        ctx.fillRect(t.x - 5, t.y - 14, 6, 4);
      });

      // 5. Draw Target Marker if walking via tap
      if (targetPosRef.current) {
        const tx = (targetPosRef.current.x / 100) * W;
        const ty = (targetPosRef.current.y / 100) * H;
        ctx.strokeStyle = '#ffd541';
        ctx.lineWidth = 2;
        const r = 5 + (tick % 12) * 0.4;
        ctx.strokeRect(tx - r, ty - r, r * 2, r * 2);
      }

      // 6. Draw All 7 Interactive Buildings
      QUEST_BUILDINGS.forEach((b) => {
        const bx = (b.x / 100) * W;
        const by = (b.y / 100) * H;
        drawBuildingSprite(b, bx, by, !!visitedQuests[b.id], closest?.id === b.id);
      });

      // 7. Draw Guestbook NPCs around the Plaza
      const npcSpots = [
        { x: 38, y: 43, color: '#4dabf7' },
        { x: 63, y: 43, color: '#da77f2' },
        { x: 37, y: 58, color: '#69db7c' },
        { x: 64, y: 58, color: '#ffa94d' },
      ];
      const recentGuests = guestbook.slice(0, 4);
      recentGuests.forEach((g, idx) => {
        const spot = npcSpots[idx % npcSpots.length];
        const nx = (spot.x / 100) * W;
        const ny = (spot.y / 100) * H;
        drawPixelSpriteChar(nx, ny, 'npc', Math.floor(tick / 25) + idx, spot.color);
      });

      // 8. Draw Player Party (Cat -> Bride -> Groom)
      const walkFrame = isMoving ? Math.floor(tick / 6) : Math.floor(tick / 30);
      const groomPx = (posRef.current.x / 100) * W;
      const groomPy = (posRef.current.y / 100) * H;

      const brideTrail = trailRef.current[Math.min(9, trailRef.current.length - 1)] || posRef.current;
      const catTrail = trailRef.current[Math.min(18, trailRef.current.length - 1)] || posRef.current;

      // Draw Cat
      drawPixelSpriteChar(
        (catTrail.x / 100) * W + 10,
        (catTrail.y / 100) * H + 4,
        'cat',
        walkFrame
      );
      // Draw Bride
      drawPixelSpriteChar(
        (brideTrail.x / 100) * W - 7,
        (brideTrail.y / 100) * H + 2,
        'bride',
        walkFrame
      );
      // Draw Groom
      drawPixelSpriteChar(groomPx + 5, groomPy, 'groom', walkFrame);

      // Party Overhead Badge
      ctx.fillStyle = 'rgba(22, 17, 36, 0.85)';
      ctx.fillRect(groomPx - 28, groomPy - 27, 56, 12);
      ctx.strokeStyle = '#ff5277';
      ctx.lineWidth = 1;
      ctx.strokeRect(groomPx - 28, groomPy - 27, 56, 12);
      ctx.fillStyle = '#ffd541';
      ctx.font = 'bold 8px "Galmuri11", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`♥ ${config.groom.name}&${config.bride.name}`, groomPx, groomPy - 18);

      // 9. Draw Active Guestbook Speech Bubble in Plaza
      if (recentGuests.length > 0) {
        const activeIdx = npcBubbleIndex % recentGuests.length;
        const activeGuest = recentGuests[activeIdx];
        const spot = npcSpots[activeIdx % npcSpots.length];
        const bx = (spot.x / 100) * W;
        const by = (spot.y / 100) * H - 22;

        const snippet =
          activeGuest.message.length > 16
            ? activeGuest.message.slice(0, 16) + '…'
            : activeGuest.message;
        const bubbleText = `${activeGuest.name}: "${snippet}"`;
        ctx.font = '9px "Galmuri11", monospace';
        const bw = Math.min(210, ctx.measureText(bubbleText).width + 14);
        const clampedX = Math.max(bw / 2 + 6, Math.min(W - bw / 2 - 6, bx));

        ctx.fillStyle = '#fff8e7';
        ctx.fillRect(clampedX - bw / 2, by - 14, bw, 16);
        ctx.strokeStyle = '#2b1e16';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(clampedX - bw / 2, by - 14, bw, 16);

        ctx.fillStyle = '#2b1e16';
        ctx.textAlign = 'center';
        ctx.fillText(bubbleText, clampedX, by - 3);
      }

      // 10. Floating Cherry Blossom Petals
      petals.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y > H) p.y = -4;
        if (p.x < 0) p.x = W + 4;
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      });

      animId = window.requestAnimationFrame(render);
    };

    animId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(animId);
  }, [config, visitedQuests, guestbook, npcBubbleIndex, onOpenQuest]);

  // Helper for D-Pad touch/mouse hold
  const setDpad = (dx: number, dy: number) => {
    dpadDirRef.current = { dx, dy };
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Map Viewport Frame */}
      <div className="relative pixel-box overflow-hidden bg-[#1b4332]">
        {/* Top Floating HUD inside Canvas */}
        <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
          <div className="bg-[#120d1e]/85 border border-[#ffd541] px-2.5 py-1 text-[11px] text-[#ffd541] flex items-center gap-1.5 shadow">
            <span className="inline-block w-2 h-2 bg-[#38d9a9] animate-pulse" />
            <span>웨딩빌리지 · 건물을 터치하거나 걸어가세요!</span>
          </div>
        </div>

        {/* Interactive Pixel Canvas */}
        <canvas
          ref={canvasRef}
          onPointerDown={handleCanvasPointerDown}
          className="w-full aspect-[380/360] block cursor-pointer pixelated touch-none"
        />

        {/* Contextual Action Prompt Banner when near a building */}
        {nearbyBuilding && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 bg-[#161124]/95 border-2 border-[#ffd541] p-2.5 flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
            <div className="min-w-0">
              <div className="text-[10px] text-[#38d9a9] font-bold">
                {nearbyBuilding.badge} · NPC {nearbyBuilding.npcName}
              </div>
              <div className="text-xs font-bold text-[#fff8e7] truncate">
                {nearbyBuilding.name}
              </div>
            </div>
            <button
              onClick={() => {
                soundEngine.playSelect();
                onOpenQuest(nearbyBuilding.id);
              }}
              className="pixel-btn bg-[#ff5277] text-white text-xs font-bold px-3 py-1.5 shrink-0"
            >
              [A] 입장하기 ▶
            </button>
          </div>
        )}
      </div>

      {/* Quick Teleport Bar (1-Tap Warp to Any Building!) */}
      <div className="pixel-box p-2.5 bg-[#1d1630]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-[#ffd541] font-bold">
            ⚡ 순간이동 포탈 (원하는 장소로 바로 이동)
          </span>
          <span className="text-[10px] text-[#a599b8]">터치 시 즉시 열기</span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
          {QUEST_BUILDINGS.map((b) => {
            const done = !!visitedQuests[b.id];
            return (
              <button
                key={b.id}
                onClick={() => {
                  soundEngine.playSelect();
                  onOpenQuest(b.id);
                }}
                className={`pixel-btn px-1.5 py-1.5 text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 ${
                  done
                    ? 'bg-[#2b4c3f] text-[#38d9a9] border-[#38d9a9]'
                    : 'bg-[#2e2448] text-[#fff8e7]'
                }`}
              >
                <span className="text-xs">{b.name.split(' ')[0]}</span>
                <span className="truncate w-full text-center text-[10px]">
                  {b.shortName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Handheld Console Controls (Virtual D-Pad + A/B Buttons) */}
      <div className="pixel-box px-4 py-3 bg-[#241c3b] flex items-center justify-between">
        {/* D-Pad */}
        <div className="flex items-center gap-3">
          <div className="relative w-24 h-24 select-none">
            {/* UP */}
            <button
              onPointerDown={() => setDpad(0, -1)}
              onPointerUp={() => setDpad(0, 0)}
              onPointerLeave={() => setDpad(0, 0)}
              aria-label="위로 이동"
              className="absolute top-0 left-8 w-8 h-8 bg-[#382d59] active:bg-[#ffd541] active:text-[#120d1e] border-2 border-[#120d1e] flex items-center justify-center text-xs font-bold"
            >
              ▲
            </button>
            {/* DOWN */}
            <button
              onPointerDown={() => setDpad(0, 1)}
              onPointerUp={() => setDpad(0, 0)}
              onPointerLeave={() => setDpad(0, 0)}
              aria-label="아래로 이동"
              className="absolute bottom-0 left-8 w-8 h-8 bg-[#382d59] active:bg-[#ffd541] active:text-[#120d1e] border-2 border-[#120d1e] flex items-center justify-center text-xs font-bold"
            >
              ▼
            </button>
            {/* LEFT */}
            <button
              onPointerDown={() => setDpad(-1, 0)}
              onPointerUp={() => setDpad(0, 0)}
              onPointerLeave={() => setDpad(0, 0)}
              aria-label="왼쪽으로 이동"
              className="absolute top-8 left-0 w-8 h-8 bg-[#382d59] active:bg-[#ffd541] active:text-[#120d1e] border-2 border-[#120d1e] flex items-center justify-center text-xs font-bold"
            >
              ◀
            </button>
            {/* RIGHT */}
            <button
              onPointerDown={() => setDpad(1, 0)}
              onPointerUp={() => setDpad(0, 0)}
              onPointerLeave={() => setDpad(0, 0)}
              aria-label="오른쪽으로 이동"
              className="absolute top-8 right-0 w-8 h-8 bg-[#382d59] active:bg-[#ffd541] active:text-[#120d1e] border-2 border-[#120d1e] flex items-center justify-center text-xs font-bold"
            >
              ▶
            </button>
            {/* Center Pivot */}
            <div className="absolute top-8 left-8 w-8 h-8 bg-[#2c2247] border border-[#120d1e] flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#19132b]" />
            </div>
          </div>

          <div className="hidden xs:flex flex-col text-[11px] text-[#c3b8d9] leading-relaxed">
            <span className="text-[#ffd541] font-bold">조작 가이드</span>
            <span>• 맵 건물 직접 터치</span>
            <span>• 방향키 / 십자키 이동</span>
          </div>
        </div>

        {/* Console B & A Action Buttons */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => {
                soundEngine.playSelect();
                onOpenQuest('minigame');
              }}
              className="w-12 h-12 rounded-full bg-[#38d9a9] text-[#120d1e] border-2 border-[#120d1e] shadow-[0_4px_0_#0b0714] active:translate-y-1 font-extrabold text-sm flex items-center justify-center"
            >
              B
            </button>
            <span className="text-[10px] text-[#38d9a9] font-bold">미니게임</span>
          </div>

          <div className="flex flex-col items-center gap-1 -mt-3">
            <button
              onClick={() => {
                soundEngine.playSelect();
                if (nearbyBuilding) {
                  onOpenQuest(nearbyBuilding.id);
                } else {
                  onOpenQuest('story');
                }
              }}
              className="w-12 h-12 rounded-full bg-[#ff5277] text-white border-2 border-[#120d1e] shadow-[0_4px_0_#0b0714] active:translate-y-1 font-extrabold text-sm flex items-center justify-center"
            >
              A
            </button>
            <span className="text-[10px] text-[#ff5277] font-bold">
              {nearbyBuilding ? nearbyBuilding.shortName : '초대장열기'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
