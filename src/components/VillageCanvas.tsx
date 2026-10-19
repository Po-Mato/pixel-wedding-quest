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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNpcBubbleIndex((prev) => prev + 1);
    }, 3800);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  const walkToBuilding = useCallback((buildingId: QuestBuildingId) => {
    const b = QUEST_BUILDINGS.find((item) => item.id === buildingId);
    if (!b) return;
    soundEngine.playBlip(700);
    targetPosRef.current = { x: b.x, y: Math.min(91, b.y + 8) };
    pendingQuestRef.current = b.id;
  }, []);

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    const tappedBuilding = QUEST_BUILDINGS.find((b) => {
      const dist = Math.hypot(clickX - b.x, clickY - b.y);
      return dist < 13.5;
    });

    if (tappedBuilding) {
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
      soundEngine.playBlip(560);
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

    // Soft floating cherry blossom petals & sunlight dust
    const petals: Petal[] = Array.from({ length: 28 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: -0.2 - Math.random() * 0.3,
      vy: 0.28 + Math.random() * 0.38,
      size: Math.random() > 0.5 ? 3 : 2,
      color: Math.random() > 0.35 ? '#ffd6e0' : '#fffdf9',
    }));

    let animId: number;
    let tick = 0;

    const drawPixelSpriteChar = (
      cx: number,
      cy: number,
      role: 'groom' | 'bride' | 'cat' | 'npc',
      walkFrame: number,
      npcColor = '#84a98c'
    ) => {
      const bob = walkFrame % 2 === 1 ? -1.5 : 0;
      const x = Math.round(cx);
      const y = Math.round(cy + bob);

      // Soft warm shadow
      ctx.fillStyle = 'rgba(74, 58, 42, 0.2)';
      ctx.fillRect(x - 6, Math.round(cy) + 8, 12, 3);

      if (role === 'cat') {
        ctx.fillStyle = '#e6a15c';
        ctx.fillRect(x - 4, y - 2, 8, 6);
        ctx.fillRect(x - 4, y - 4, 2, 2);
        ctx.fillRect(x + 2, y - 4, 2, 2);
        ctx.fillStyle = '#3b2f2f';
        ctx.fillRect(x - 3, y, 1, 1);
        ctx.fillRect(x + 2, y, 1, 1);
        ctx.fillStyle = '#d97b84';
        ctx.fillRect(x - 2, y + 3, 4, 1);
        ctx.fillStyle = '#fff8ee';
        ctx.fillRect(x - 3, y + 4, 6, 4);
        return;
      }

      if (role === 'groom') {
        // Hair
        ctx.fillStyle = config.groom.hairColor || '#2c1e18';
        ctx.fillRect(x - 5, y - 10, 10, 3);
        // Face
        ctx.fillStyle = '#ffead6';
        ctx.fillRect(x - 4, y - 7, 8, 5);
        // Eyes
        ctx.fillStyle = '#3b2f2f';
        ctx.fillRect(x - 3, y - 5, 1.5, 2);
        ctx.fillRect(x + 1.5, y - 5, 1.5, 2);
        // Tuxedo
        ctx.fillStyle = config.groom.suitColor || '#34495e';
        ctx.fillRect(x - 5, y - 2, 10, 7);
        // Shirt & Champagne Bowtie
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 2, y - 2, 4, 4);
        ctx.fillStyle = '#c59b6d';
        ctx.fillRect(x - 1, y - 2, 2, 1.5);
        // Rose Boutonniere
        ctx.fillStyle = '#e899a0';
        ctx.fillRect(x - 4, y - 1, 1.5, 1.5);
        // Shoes
        ctx.fillStyle = '#2b211e';
        ctx.fillRect(x - 4, y + 5 + (walkFrame % 2), 3, 2);
        ctx.fillRect(x + 1, y + 5 + ((walkFrame + 1) % 2), 3, 2);
      } else if (role === 'bride') {
        // Flowing White Veil
        ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
        ctx.fillRect(x - 7, y - 9, 14, 12);
        // Pearl & Champagne Tiara
        ctx.fillStyle = '#d4af7a';
        ctx.fillRect(x - 3, y - 12, 6, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 1, y - 13, 2, 1);
        // Hair
        ctx.fillStyle = config.bride.hairColor || '#3b2314';
        ctx.fillRect(x - 5, y - 10, 10, 3);
        // Face
        ctx.fillStyle = '#ffefe0';
        ctx.fillRect(x - 4, y - 7, 8, 5);
        // Eyes
        ctx.fillStyle = '#3b2f2f';
        ctx.fillRect(x - 3, y - 5, 1.5, 2);
        ctx.fillRect(x + 1.5, y - 5, 1.5, 2);
        // White Silk Gown
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 5, y - 2, 10, 4);
        ctx.fillRect(x - 7, y + 2, 14, 5);
        // Pastel Rose Bouquet
        ctx.fillStyle = '#84a98c';
        ctx.fillRect(x - 2, y, 4, 3);
        ctx.fillStyle = '#e899a0';
        ctx.fillRect(x - 2, y, 2, 2);
        ctx.fillStyle = '#fffdf9';
        ctx.fillRect(x, y + 1, 2, 2);
      } else {
        // Pastel Guest NPC
        ctx.fillStyle = '#4a3525';
        ctx.fillRect(x - 4, y - 10, 8, 3);
        ctx.fillStyle = '#ffead6';
        ctx.fillRect(x - 4, y - 7, 8, 5);
        ctx.fillStyle = '#3b2f2f';
        ctx.fillRect(x - 2, y - 5, 1, 2);
        ctx.fillRect(x + 1, y - 5, 1, 2);
        ctx.fillStyle = npcColor;
        ctx.fillRect(x - 4, y - 2, 8, 7);
      }
    };

    const drawGardenPavilion = (
      b: (typeof QUEST_BUILDINGS)[0],
      bx: number,
      by: number,
      isVisited: boolean,
      isNear: boolean
    ) => {
      const x = Math.round(bx);
      const y = Math.round(by);

      // Soft warm glow when near
      if (isNear) {
        ctx.fillStyle = 'rgba(255, 253, 249, 0.55)';
        ctx.beginPath();
        ctx.arc(x, y + 2, 34, 0, Math.PI * 2);
        ctx.fill();
      }

      if (b.id === 'ceremony') {
        // White Glasshouse Wedding Chapel with Floral Arch
        ctx.fillStyle = 'rgba(92, 72, 56, 0.14)';
        ctx.fillRect(x - 34, y + 12, 68, 4);

        // Cream & Glass Walls
        ctx.fillStyle = '#fffdf9';
        ctx.fillRect(x - 32, y - 18, 64, 32);
        ctx.fillStyle = '#f5ebe0';
        ctx.fillRect(x - 36, y - 24, 12, 38);
        ctx.fillRect(x + 24, y - 24, 12, 38);

        // Champagne Rose Roof
        ctx.fillStyle = '#d97b84';
        ctx.beginPath();
        ctx.moveTo(x - 28, y - 18);
        ctx.lineTo(x, y - 37);
        ctx.lineTo(x + 28, y - 18);
        ctx.fill();
        ctx.fillStyle = '#c59b6d';
        ctx.fillRect(x - 38, y - 29, 16, 5);
        ctx.fillRect(x + 22, y - 29, 16, 5);

        // Gold Wedding Bell / Cross
        ctx.fillStyle = '#c59b6d';
        ctx.fillRect(x - 1, y - 43, 2, 6);
        ctx.fillRect(x - 3, y - 41, 6, 2);

        // Glass Arch Window
        ctx.fillStyle = '#d8e8f2';
        ctx.fillRect(x - 7, y - 13, 14, 10);
        // Floral Arch Entrance
        ctx.fillStyle = '#84a98c';
        ctx.fillRect(x - 9, y, 18, 14);
        ctx.fillStyle = '#f7ebe8';
        ctx.fillRect(x - 6, y + 3, 12, 11);
        ctx.fillStyle = '#e899a0';
        ctx.fillRect(x - 8, y, 3, 3);
        ctx.fillRect(x + 5, y, 3, 3);
      } else if (b.id === 'minigame') {
        // White Marble Swan Fountain
        ctx.fillStyle = '#f5ebe0';
        ctx.fillRect(x - 23, y - 12, 46, 24);
        ctx.fillStyle = '#a8dadc';
        ctx.fillRect(x - 19, y - 8, 38, 16);
        // Gentle water ripple
        ctx.fillStyle = tick % 24 < 12 ? '#dff3f5' : '#bce6e8';
        ctx.fillRect(x - 6, y - 13, 12, 10);
        ctx.fillRect(x - 13, y - 3, 5, 3);
        ctx.fillRect(x + 8, y - 2, 5, 3);
        // White Floral Centerpiece
        ctx.fillStyle = '#fffdf9';
        ctx.fillRect(x - 4, y - 18, 8, 8);
        ctx.fillStyle = '#d97b84';
        ctx.fillRect(x - 3, y - 21, 6, 4);
      } else {
        // Sunlit Pastel Garden Pavilions
        ctx.fillStyle = 'rgba(92, 72, 56, 0.14)';
        ctx.fillRect(x - 24, y + 12, 48, 4);
        // Ivory Cottage Walls
        ctx.fillStyle = '#fffdf9';
        ctx.fillRect(x - 21, y - 8, 42, 21);
        // Champagne Trim
        ctx.fillStyle = '#d4b48c';
        ctx.fillRect(x - 21, y - 8, 2, 21);
        ctx.fillRect(x + 19, y - 8, 2, 21);
        // Pastel Roof
        ctx.fillStyle = b.color;
        ctx.fillRect(x - 25, y - 15, 50, 8);
        ctx.fillRect(x - 20, y - 20, 40, 5);
        ctx.fillRect(x - 14, y - 23, 28, 3);
        // Sunlit Windows with Flower Boxes
        ctx.fillStyle = '#d8e8f2';
        ctx.fillRect(x - 15, y - 4, 6, 5);
        ctx.fillRect(x + 9, y - 4, 6, 5);
        ctx.fillStyle = '#e899a0';
        ctx.fillRect(x - 15, y + 1, 6, 2);
        ctx.fillRect(x + 9, y + 1, 6, 2);
        // Warm Wood Door
        ctx.fillStyle = '#9c7a5b';
        ctx.fillRect(x - 5, y + 2, 10, 11);
      }

      // Delicate Floating Stamp Marker
      const floatY = Math.sin(tick * 0.06 + b.x) * 2;
      const badgeW = 16;
      const badgeH = 13;
      const badgeY = b.id === 'ceremony' ? y - 52 + floatY : y - 36 + floatY;

      ctx.fillStyle = isVisited ? '#6b9071' : '#fffdf9';
      ctx.fillRect(x - badgeW / 2, badgeY, badgeW, badgeH);
      ctx.strokeStyle = isVisited ? '#fffdf9' : '#c59b6d';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - badgeW / 2, badgeY, badgeW, badgeH);

      ctx.fillStyle = isVisited ? '#fffdf9' : '#d97b84';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isVisited ? '✓' : '♥', x, badgeY + 10);

      // Elegant Ivory Label Tag
      const label = b.shortName;
      ctx.font = 'bold 10px "Gowun Batang", "Pretendard", sans-serif';
      const textWidth = ctx.measureText(label).width + 12;
      ctx.fillStyle = isNear ? '#d97b84' : 'rgba(255, 253, 249, 0.94)';
      ctx.fillRect(x - textWidth / 2, y + 16, textWidth, 15);
      ctx.strokeStyle = isNear ? '#fffdf9' : '#c59b6d';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x - textWidth / 2, y + 16, textWidth, 15);

      ctx.fillStyle = isNear ? '#fffdf9' : '#3b2f2f';
      ctx.fillText(label, x, y + 27);
    };

    const render = () => {
      tick++;

      // 1. Update Movement
      let dx = dpadDirRef.current.dx;
      let dy = dpadDirRef.current.dy;

      if (keysRef.current['ArrowLeft'] || keysRef.current['a'] || keysRef.current['A']) dx -= 1;
      if (keysRef.current['ArrowRight'] || keysRef.current['d'] || keysRef.current['D']) dx += 1;
      if (keysRef.current['ArrowUp'] || keysRef.current['w'] || keysRef.current['W']) dy -= 1;
      if (keysRef.current['ArrowDown'] || keysRef.current['s'] || keysRef.current['S']) dy += 1;

      const speed = 0.52;
      let isMoving = false;

      if (dx !== 0 || dy !== 0) {
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
        if (tick - stepSoundCooldownRef.current > 15) {
          soundEngine.playStep();
          stepSoundCooldownRef.current = tick;
        }
      }

      // Check proximity
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

      // 2. Draw Sunlit Sage Garden Lawn
      ctx.fillStyle = '#bdd2b6';
      ctx.fillRect(0, 0, W, H);

      // Subtle grass & tiny white/pink wildflowers
      for (let gx = 0; gx < W; gx += 28) {
        for (let gy = 0; gy < H; gy += 28) {
          ctx.fillStyle = '#b0c9a8';
          if ((gx + gy) % 56 === 0) {
            ctx.fillRect(gx + 6, gy + 6, 6, 3);
            ctx.fillStyle = '#fffdf9';
            ctx.fillRect(gx + 8, gy + 4, 2, 2);
          } else {
            ctx.fillStyle = '#f9dbe0';
            ctx.fillRect(gx + 12, gy + 10, 2, 2);
          }
        }
      }

      // 3. Draw Warm Ivory Stone Garden Paths
      ctx.fillStyle = '#f5ebe0';
      ctx.fillRect(W * 0.44, H * 0.16, W * 0.12, H * 0.72);
      ctx.fillRect(W * 0.18, H * 0.45, W * 0.64, H * 0.1);
      ctx.fillRect(W * 0.2, H * 0.28, W * 0.06, H * 0.48);
      ctx.fillRect(W * 0.74, H * 0.28, W * 0.06, H * 0.48);
      ctx.fillRect(W * 0.36, H * 0.38, W * 0.28, H * 0.24);

      // Blush Rose & White Virgin Road leading to Chapel
      ctx.fillStyle = '#fffdf9';
      ctx.fillRect(W * 0.465, H * 0.18, W * 0.07, H * 0.22);
      ctx.fillStyle = '#e899a0';
      ctx.fillRect(W * 0.465, H * 0.18, 2, H * 0.22);
      ctx.fillRect(W * 0.535 - 2, H * 0.18, 2, H * 0.22);

      // 4. Pastel Cherry Blossom & Rose Trees
      const treePositions = [
        { x: 26, y: 42 },
        { x: 354, y: 42 },
        { x: 28, y: 175 },
        { x: 352, y: 175 },
        { x: 28, y: 325 },
        { x: 352, y: 325 },
        { x: 132, y: 48 },
        { x: 248, y: 48 },
      ];
      treePositions.forEach((t) => {
        ctx.fillStyle = '#8c6d53';
        ctx.fillRect(t.x - 3, t.y, 6, 10);
        ctx.fillStyle = '#f4acb7';
        ctx.fillRect(t.x - 12, t.y - 12, 24, 14);
        ctx.fillStyle = '#ffcad4';
        ctx.fillRect(t.x - 9, t.y - 16, 18, 12);
        ctx.fillStyle = '#fffdf9';
        ctx.fillRect(t.x - 4, t.y - 14, 6, 4);
      });

      // 5. Target Marker if walking via tap
      if (targetPosRef.current) {
        const tx = (targetPosRef.current.x / 100) * W;
        const ty = (targetPosRef.current.y / 100) * H;
        ctx.strokeStyle = '#d97b84';
        ctx.lineWidth = 1.5;
        const r = 4 + (tick % 12) * 0.35;
        ctx.strokeRect(tx - r, ty - r, r * 2, r * 2);
      }

      // 6. Draw 7 Garden Pavilions
      QUEST_BUILDINGS.forEach((b) => {
        const bx = (b.x / 100) * W;
        const by = (b.y / 100) * H;
        drawGardenPavilion(b, bx, by, !!visitedQuests[b.id], closest?.id === b.id);
      });

      // 7. Draw Guestbook NPCs around the Fountain
      const npcSpots = [
        { x: 38, y: 43, color: '#749bc2' },
        { x: 63, y: 43, color: '#e5989b' },
        { x: 37, y: 58, color: '#84a98c' },
        { x: 64, y: 58, color: '#d4a373' },
      ];
      const recentGuests = guestbook.slice(0, 4);
      recentGuests.forEach((g, idx) => {
        const spot = npcSpots[idx % npcSpots.length];
        const nx = (spot.x / 100) * W;
        const ny = (spot.y / 100) * H;
        drawPixelSpriteChar(nx, ny, 'npc', Math.floor(tick / 28) + idx, spot.color);
      });

      // 8. Draw Couple & Cat
      const walkFrame = isMoving ? Math.floor(tick / 6) : Math.floor(tick / 30);
      const groomPx = (posRef.current.x / 100) * W;
      const groomPy = (posRef.current.y / 100) * H;

      const brideTrail = trailRef.current[Math.min(9, trailRef.current.length - 1)] || posRef.current;
      const catTrail = trailRef.current[Math.min(18, trailRef.current.length - 1)] || posRef.current;

      drawPixelSpriteChar(
        (catTrail.x / 100) * W + 10,
        (catTrail.y / 100) * H + 4,
        'cat',
        walkFrame
      );
      drawPixelSpriteChar(
        (brideTrail.x / 100) * W - 7,
        (brideTrail.y / 100) * H + 2,
        'bride',
        walkFrame
      );
      drawPixelSpriteChar(groomPx + 5, groomPy, 'groom', walkFrame);

      // Couple Name Tag
      ctx.fillStyle = 'rgba(255, 253, 249, 0.92)';
      ctx.fillRect(groomPx - 28, groomPy - 26, 56, 12);
      ctx.strokeStyle = '#d97b84';
      ctx.lineWidth = 1;
      ctx.strokeRect(groomPx - 28, groomPy - 26, 56, 12);
      ctx.fillStyle = '#3b2f2f';
      ctx.font = 'bold 8px "Gowun Batang", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${config.groom.name} ♥ ${config.bride.name}`, groomPx, groomPy - 17);

      // 9. Guestbook Speech Bubble
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
        ctx.font = '9px "Pretendard", sans-serif';
        const bw = Math.min(210, ctx.measureText(bubbleText).width + 14);
        const clampedX = Math.max(bw / 2 + 6, Math.min(W - bw / 2 - 6, bx));

        ctx.fillStyle = 'rgba(255, 253, 249, 0.96)';
        ctx.fillRect(clampedX - bw / 2, by - 14, bw, 16);
        ctx.strokeStyle = '#c59b6d';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(clampedX - bw / 2, by - 14, bw, 16);

        ctx.fillStyle = '#3b2f2f';
        ctx.textAlign = 'center';
        ctx.fillText(bubbleText, clampedX, by - 3);
      }

      // 10. Floating Petals
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

  const setDpad = (dx: number, dy: number) => {
    dpadDirRef.current = { dx, dy };
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Garden Canvas Frame */}
      <div className="relative pixel-card overflow-hidden bg-[#bdd2b6]">
        {/* Subtle Top Guide Pill */}
        <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
          <div className="bg-[#fffdf9]/90 backdrop-blur-sm border border-[#d4b48c] px-3 py-1 rounded-full text-[11px] text-[#5c4d47] flex items-center gap-1.5 shadow-sm">
            <span className="inline-block w-2 h-2 rounded-full bg-[#d97b84] animate-pulse" />
            <span>정원의 파빌리온을 터치하거나 산책해 보세요</span>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          onPointerDown={handleCanvasPointerDown}
          className="w-full aspect-[380/360] block cursor-pointer pixelated touch-none"
        />

        {/* Contextual Prompt when near a pavilion */}
        {nearbyBuilding && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 bg-[#fffdf9]/95 border border-[#c59b6d] rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-md animate-fadeIn">
            <div className="min-w-0">
              <div className="text-[10px] text-[#c59b6d] font-sans font-semibold tracking-wider">
                {nearbyBuilding.badge} · {nearbyBuilding.npcName}
              </div>
              <div className="text-xs font-bold text-[#3b2f2f] truncate">
                {nearbyBuilding.name}
              </div>
            </div>
            <button
              onClick={() => {
                soundEngine.playSelect();
                onOpenQuest(nearbyBuilding.id);
              }}
              className="pixel-btn bg-[#d97b84] text-white border-[#b85d67] text-xs font-bold px-3.5 py-1.5 shrink-0"
            >
              열어보기 ▶
            </button>
          </div>
        )}
      </div>

      {/* Quick Garden Map Menu (1-Tap Open Any Section) */}
      <div className="pixel-card p-3 bg-[#fffdf9]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#5c4d47] font-bold">
            🌿 웨딩 가든 바로가기 (원하는 카드를 터치하세요)
          </span>
          <span className="text-[11px] text-[#9c897e] font-sans">즉시 열람</span>
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
                className={`px-1.5 py-2 rounded-md border text-[11px] font-medium flex flex-col items-center justify-center gap-0.5 transition-all ${
                  done
                    ? 'bg-[#edf3ee] text-[#4d6b53] border-[#a3bfa8]'
                    : 'bg-[#faf5ec] text-[#4a3b32] border-[#e2d4c0] hover:border-[#c59b6d]'
                }`}
              >
                <span className="text-sm">{b.name.split(' ')[0]}</span>
                <span className="truncate w-full text-center text-[10px] font-sans">
                  {b.shortName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Soft Ivory Stroll Pad (Optional D-Pad + Action Buttons) */}
      <div className="pixel-card px-4 py-3 bg-[#faf5ec] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-20 h-20 select-none">
            <button
              onPointerDown={() => setDpad(0, -1)}
              onPointerUp={() => setDpad(0, 0)}
              onPointerLeave={() => setDpad(0, 0)}
              aria-label="위로 산책"
              className="absolute top-0 left-7 w-6 h-6 rounded-t bg-[#fffdf9] active:bg-[#d97b84] active:text-white border border-[#c59b6d] flex items-center justify-center text-[10px] text-[#5c4d47]"
            >
              ▲
            </button>
            <button
              onPointerDown={() => setDpad(0, 1)}
              onPointerUp={() => setDpad(0, 0)}
              onPointerLeave={() => setDpad(0, 0)}
              aria-label="아래로 산책"
              className="absolute bottom-0 left-7 w-6 h-6 rounded-b bg-[#fffdf9] active:bg-[#d97b84] active:text-white border border-[#c59b6d] flex items-center justify-center text-[10px] text-[#5c4d47]"
            >
              ▼
            </button>
            <button
              onPointerDown={() => setDpad(-1, 0)}
              onPointerUp={() => setDpad(0, 0)}
              onPointerLeave={() => setDpad(0, 0)}
              aria-label="왼쪽으로 산책"
              className="absolute top-7 left-0 w-6 h-6 rounded-l bg-[#fffdf9] active:bg-[#d97b84] active:text-white border border-[#c59b6d] flex items-center justify-center text-[10px] text-[#5c4d47]"
            >
              ◀
            </button>
            <button
              onPointerDown={() => setDpad(1, 0)}
              onPointerUp={() => setDpad(0, 0)}
              onPointerLeave={() => setDpad(0, 0)}
              aria-label="오른쪽으로 산책"
              className="absolute top-7 right-0 w-6 h-6 rounded-r bg-[#fffdf9] active:bg-[#d97b84] active:text-white border border-[#c59b6d] flex items-center justify-center text-[10px] text-[#5c4d47]"
            >
              ▶
            </button>
            <div className="absolute top-7 left-7 w-6 h-6 bg-[#f3ede2] border border-[#d4b48c] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#c59b6d]" />
            </div>
          </div>

          <div className="flex flex-col text-[11px] text-[#6e5d53] leading-relaxed">
            <span className="text-[#3b2f2f] font-bold">🌸 가든 산책 안내</span>
            <span>• 정원 위 원하는 건물을 터치해 보세요</span>
            <span>• 방향키로도 신랑·신부가 산책합니다</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              soundEngine.playSelect();
              if (nearbyBuilding) {
                onOpenQuest(nearbyBuilding.id);
              } else {
                onOpenQuest('story');
              }
            }}
            className="pixel-btn bg-[#d97b84] text-white border-[#b85d67] px-3.5 py-2 text-xs font-bold"
          >
            {nearbyBuilding ? `${nearbyBuilding.shortName} 열기` : '초대장 열기'}
          </button>
        </div>
      </div>
    </div>
  );
};
