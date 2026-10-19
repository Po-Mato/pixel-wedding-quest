import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  QUEST_BUILDINGS,
  QuestBuildingId,
  WeddingConfig,
  GuestbookEntry,
  AvatarClassId,
} from '../data/weddingConfig';
import {
  getHighResGroomCanvas,
  getHighResBrideCanvas,
  getHighResCatCanvas,
  getHighResGuestCanvas,
} from '../utils/highResPixelArt';
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

    // High-Resolution 760x720 Canvas so 144x144 pixel sprites render with full crisp detail!
    const W = 760;
    const H = 720;
    canvas.width = W;
    canvas.height = H;
    ctx.imageSmoothingEnabled = false;

    const petals: Petal[] = Array.from({ length: 34 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: -0.35 - Math.random() * 0.45,
      vy: 0.45 + Math.random() * 0.65,
      size: Math.random() > 0.4 ? 5 : 4,
      color: Math.random() > 0.35 ? '#ffd6e0' : '#fffdf9',
    }));

    let animId: number;
    let tick = 0;

    const drawGardenPavilion = (
      b: (typeof QUEST_BUILDINGS)[0],
      bx: number,
      by: number,
      isVisited: boolean,
      isNear: boolean
    ) => {
      const x = Math.round(bx);
      const y = Math.round(by);

      if (isNear) {
        ctx.fillStyle = 'rgba(255, 253, 249, 0.55)';
        ctx.beginPath();
        ctx.arc(x, y + 4, 68, 0, Math.PI * 2);
        ctx.fill();
      }

      if (b.id === 'ceremony') {
        // High-Detail Glasshouse Wedding Chapel
        ctx.fillStyle = 'rgba(92, 72, 56, 0.16)';
        ctx.fillRect(x - 68, y + 24, 136, 8);

        // Side Wings
        ctx.fillStyle = '#f5ebe0';
        ctx.fillRect(x - 72, y - 48, 28, 76);
        ctx.fillRect(x + 44, y - 48, 28, 76);
        // Main Sanctuary
        ctx.fillStyle = '#fffdf9';
        ctx.fillRect(x - 56, y - 42, 112, 70);

        // Architectural Pilasters
        ctx.fillStyle = '#e6d5b8';
        for (let px = x - 52; px <= x + 48; px += 24) {
          ctx.fillRect(px, y - 38, 4, 64);
        }

        // Gabled Pastel Rose Roof with Shingle Lines
        ctx.fillStyle = '#d97b84';
        ctx.beginPath();
        ctx.moveTo(x - 62, y - 40);
        ctx.lineTo(x, y - 82);
        ctx.lineTo(x + 62, y - 40);
        ctx.fill();
        ctx.strokeStyle = '#b85d67';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Side Wing Roofs
        ctx.fillStyle = '#c59b6d';
        ctx.fillRect(x - 76, y - 58, 34, 10);
        ctx.fillRect(x + 42, y - 58, 34, 10);

        // Golden Spire & Bell
        ctx.fillStyle = '#c59b6d';
        ctx.fillRect(x - 2, y - 96, 4, 16);
        ctx.fillRect(x - 7, y - 90, 14, 4);

        // Arched Rose Stained Glass Window
        ctx.fillStyle = '#d8e8f2';
        ctx.fillRect(x - 16, y - 32, 32, 22);
        ctx.strokeStyle = '#c59b6d';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 16, y - 32, 32, 22);
        ctx.fillStyle = '#f4acb7';
        ctx.fillRect(x - 6, y - 26, 12, 10);

        // Floral Garland Entrance Arch
        ctx.fillStyle = '#6b9071';
        ctx.fillRect(x - 20, y - 2, 40, 30);
        ctx.fillStyle = '#f7ebe8';
        ctx.fillRect(x - 14, y + 4, 28, 24);
        // Rose blossoms along the arch
        ctx.fillStyle = '#e899a0';
        ctx.fillRect(x - 18, y, 5, 5);
        ctx.fillRect(x - 8, y - 2, 5, 5);
        ctx.fillRect(x + 4, y - 2, 5, 5);
        ctx.fillRect(x + 13, y, 5, 5);
      } else if (b.id === 'minigame') {
        // High-Detail Tiered Marble Swan Fountain
        ctx.fillStyle = '#e6dfd5';
        ctx.fillRect(x - 48, y - 22, 96, 48);
        ctx.fillStyle = '#fffdf9';
        ctx.fillRect(x - 44, y - 20, 88, 42);
        ctx.fillStyle = '#a8dadc';
        ctx.fillRect(x - 38, y - 14, 76, 30);

        // Animated Water Ripples
        ctx.fillStyle = tick % 24 < 12 ? '#e0f7fa' : '#bce6e8';
        ctx.fillRect(x - 14, y - 26, 28, 22);
        ctx.fillRect(x - 28, y - 6, 12, 5);
        ctx.fillRect(x + 16, y - 4, 12, 5);

        // Center Floral Pedestal
        ctx.fillStyle = '#fffdf9';
        ctx.fillRect(x - 10, y - 36, 20, 18);
        ctx.fillStyle = '#d97b84';
        ctx.fillRect(x - 7, y - 42, 14, 8);
      } else {
        // High-Detail Sunlit Garden Pavilions
        ctx.fillStyle = 'rgba(92, 72, 56, 0.15)';
        ctx.fillRect(x - 48, y + 24, 96, 8);

        // Ivory Walls & Wainscoting
        ctx.fillStyle = '#fffdf9';
        ctx.fillRect(x - 44, y - 18, 88, 44);
        ctx.fillStyle = '#f5ebe0';
        ctx.fillRect(x - 44, y + 12, 88, 14);

        // Champagne Trim Pillars
        ctx.fillStyle = '#d4b48c';
        ctx.fillRect(x - 44, y - 18, 5, 44);
        ctx.fillRect(x + 39, y - 18, 5, 44);

        // Layered Pastel Roof with Scalloped Shingles
        ctx.fillStyle = b.color;
        ctx.fillRect(x - 50, y - 32, 100, 16);
        ctx.fillRect(x - 42, y - 42, 84, 10);
        ctx.fillRect(x - 30, y - 50, 60, 8);
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.fillRect(x - 46, y - 30, 92, 3);

        // Mullioned Windows with Flower Boxes
        [-28, 16].forEach((wx) => {
          ctx.fillStyle = '#d8e8f2';
          ctx.fillRect(x + wx, y - 10, 14, 12);
          ctx.strokeStyle = '#c59b6d';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + wx, y - 10, 14, 12);
          // Flower Box
          ctx.fillStyle = '#6b9071';
          ctx.fillRect(x + wx - 2, y + 2, 18, 4);
          ctx.fillStyle = '#e899a0';
          ctx.fillRect(x + wx, y, 4, 3);
          ctx.fillRect(x + wx + 8, y, 4, 3);
        });

        // Arched Wooden Door
        ctx.fillStyle = '#9c7a5b';
        ctx.fillRect(x - 10, y + 2, 20, 24);
        ctx.fillStyle = '#e6d5b8';
        ctx.fillRect(x + 5, y + 13, 3, 3);
      }

      // Floating Stamp Marker
      const floatY = Math.sin(tick * 0.06 + b.x) * 4;
      const badgeW = 32;
      const badgeH = 26;
      const badgeY = b.id === 'ceremony' ? y - 110 + floatY : y - 76 + floatY;

      ctx.fillStyle = isVisited ? '#6b9071' : '#fffdf9';
      ctx.fillRect(x - badgeW / 2, badgeY, badgeW, badgeH);
      ctx.strokeStyle = isVisited ? '#fffdf9' : '#c59b6d';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x - badgeW / 2, badgeY, badgeW, badgeH);

      ctx.fillStyle = isVisited ? '#fffdf9' : '#d97b84';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isVisited ? '✓' : '♥', x, badgeY + 19);

      // Elegant Ivory Label Tag
      const label = b.shortName;
      ctx.font = 'bold 19px "Gowun Batang", "Pretendard", sans-serif';
      const textWidth = ctx.measureText(label).width + 24;
      ctx.fillStyle = isNear ? '#d97b84' : 'rgba(255, 253, 249, 0.95)';
      ctx.fillRect(x - textWidth / 2, y + 32, textWidth, 28);
      ctx.strokeStyle = isNear ? '#fffdf9' : '#c59b6d';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - textWidth / 2, y + 32, textWidth, 28);

      ctx.fillStyle = isNear ? '#fffdf9' : '#3b2f2f';
      ctx.fillText(label, x, y + 52);
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

      for (let gx = 0; gx < W; gx += 56) {
        for (let gy = 0; gy < H; gy += 56) {
          ctx.fillStyle = '#b0c9a8';
          if ((gx + gy) % 112 === 0) {
            ctx.fillRect(gx + 12, gy + 12, 12, 5);
            ctx.fillStyle = '#fffdf9';
            ctx.fillRect(gx + 16, gy + 8, 5, 5);
          } else {
            ctx.fillStyle = '#f9dbe0';
            ctx.fillRect(gx + 24, gy + 20, 5, 5);
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

      // Virgin Road Carpet leading to Chapel
      ctx.fillStyle = '#fffdf9';
      ctx.fillRect(W * 0.465, H * 0.18, W * 0.07, H * 0.22);
      ctx.fillStyle = '#e899a0';
      ctx.fillRect(W * 0.465, H * 0.18, 4, H * 0.22);
      ctx.fillRect(W * 0.535 - 4, H * 0.18, 4, H * 0.22);

      // 4. High-Detail Cherry Blossom Trees
      const treePositions = [
        { x: 52, y: 84 },
        { x: 708, y: 84 },
        { x: 56, y: 350 },
        { x: 704, y: 350 },
        { x: 56, y: 650 },
        { x: 704, y: 650 },
        { x: 264, y: 96 },
        { x: 496, y: 96 },
      ];
      treePositions.forEach((t) => {
        ctx.fillStyle = 'rgba(74, 58, 42, 0.18)';
        ctx.fillRect(t.x - 22, t.y + 14, 44, 8);
        ctx.fillStyle = '#8c6d53';
        ctx.fillRect(t.x - 6, t.y - 2, 12, 22);
        ctx.fillStyle = '#f4acb7';
        ctx.fillRect(t.x - 26, t.y - 26, 52, 28);
        ctx.fillStyle = '#ffcad4';
        ctx.fillRect(t.x - 20, t.y - 36, 40, 24);
        ctx.fillStyle = '#fffdf9';
        ctx.fillRect(t.x - 10, t.y - 30, 14, 8);
      });

      // 5. Target Marker
      if (targetPosRef.current) {
        const tx = (targetPosRef.current.x / 100) * W;
        const ty = (targetPosRef.current.y / 100) * H;
        ctx.strokeStyle = '#d97b84';
        ctx.lineWidth = 3;
        const r = 8 + (tick % 12) * 0.7;
        ctx.strokeRect(tx - r, ty - r, r * 2, r * 2);
      }

      // 6. Draw 7 Garden Pavilions
      QUEST_BUILDINGS.forEach((b) => {
        const bx = (b.x / 100) * W;
        const by = (b.y / 100) * H;
        drawGardenPavilion(b, bx, by, !!visitedQuests[b.id], closest?.id === b.id);
      });

      // 7. Draw 144x144 Guestbook NPCs around the Fountain
      const npcSpots: { x: number; y: number; avatar: AvatarClassId }[] = [
        { x: 37, y: 42, avatar: 'knight' },
        { x: 64, y: 42, avatar: 'mage' },
        { x: 36, y: 58, avatar: 'bard' },
        { x: 65, y: 58, avatar: 'healer' },
      ];
      const recentGuests = guestbook.slice(0, 4);
      recentGuests.forEach((g, idx) => {
        const spot = npcSpots[idx % npcSpots.length];
        const nx = (spot.x / 100) * W;
        const ny = (spot.y / 100) * H;
        const guestCanvas = getHighResGuestCanvas(
          g.avatar || spot.avatar,
          Math.floor(tick / 24) + idx
        );
        ctx.drawImage(guestCanvas, Math.round(nx - 34), Math.round(ny - 52), 68, 68);
      });

      // 8. Draw 144x144 Couple & Cat Party!
      const walkFrame = isMoving ? Math.floor(tick / 6) % 4 : 0;
      const groomPx = (posRef.current.x / 100) * W;
      const groomPy = (posRef.current.y / 100) * H;

      const brideTrail =
        trailRef.current[Math.min(9, trailRef.current.length - 1)] || posRef.current;
      const catTrail =
        trailRef.current[Math.min(18, trailRef.current.length - 1)] || posRef.current;

      const catSprite = getHighResCatCanvas(walkFrame);
      const brideSprite = getHighResBrideCanvas(
        config.bride.dressColor,
        config.bride.hairColor,
        walkFrame
      );
      const groomSprite = getHighResGroomCanvas(
        config.groom.suitColor,
        config.groom.hairColor,
        walkFrame
      );

      // Draw Cat (56x56 display of 144x144 sprite)
      ctx.drawImage(
        catSprite,
        Math.round((catTrail.x / 100) * W - 6),
        Math.round((catTrail.y / 100) * H - 36),
        56,
        56
      );

      // Draw Bride (86x86 display of 144x144 sprite)
      ctx.drawImage(
        brideSprite,
        Math.round((brideTrail.x / 100) * W - 64),
        Math.round((brideTrail.y / 100) * H - 64),
        86,
        86
      );

      // Draw Groom (86x86 display of 144x144 sprite)
      ctx.drawImage(
        groomSprite,
        Math.round(groomPx - 28),
        Math.round(groomPy - 66),
        86,
        86
      );

      // Couple Overhead Name Tag
      ctx.fillStyle = 'rgba(255, 253, 249, 0.94)';
      ctx.fillRect(groomPx - 58, groomPy - 78, 116, 24);
      ctx.strokeStyle = '#d97b84';
      ctx.lineWidth = 2;
      ctx.strokeRect(groomPx - 58, groomPy - 78, 116, 24);
      ctx.fillStyle = '#3b2f2f';
      ctx.font = 'bold 15px "Gowun Batang", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${config.groom.name} ♥ ${config.bride.name}`,
        groomPx,
        groomPy - 61
      );

      // 9. Guestbook Speech Bubble
      if (recentGuests.length > 0) {
        const activeIdx = npcBubbleIndex % recentGuests.length;
        const activeGuest = recentGuests[activeIdx];
        const spot = npcSpots[activeIdx % npcSpots.length];
        const bx = (spot.x / 100) * W;
        const by = (spot.y / 100) * H - 56;

        const snippet =
          activeGuest.message.length > 16
            ? activeGuest.message.slice(0, 16) + '…'
            : activeGuest.message;
        const bubbleText = `${activeGuest.name}: "${snippet}"`;
        ctx.font = 'bold 16px "Pretendard", sans-serif';
        const bw = Math.min(420, ctx.measureText(bubbleText).width + 26);
        const clampedX = Math.max(bw / 2 + 12, Math.min(W - bw / 2 - 12, bx));

        ctx.fillStyle = 'rgba(255, 253, 249, 0.96)';
        ctx.fillRect(clampedX - bw / 2, by - 28, bw, 30);
        ctx.strokeStyle = '#c59b6d';
        ctx.lineWidth = 2;
        ctx.strokeRect(clampedX - bw / 2, by - 28, bw, 30);

        ctx.fillStyle = '#3b2f2f';
        ctx.textAlign = 'center';
        ctx.fillText(bubbleText, clampedX, by - 8);
      }

      // 10. Floating Petals
      petals.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y > H) p.y = -6;
        if (p.x < 0) p.x = W + 6;
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
        <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
          <div className="bg-[#fffdf9]/90 backdrop-blur-sm border border-[#d4b48c] px-3 py-1 rounded-full text-[11px] text-[#5c4d47] flex items-center gap-1.5 shadow-sm">
            <span className="inline-block w-2 h-2 rounded-full bg-[#d97b84] animate-pulse" />
            <span>정원의 파빌리온을 터치하거나 산책해 보세요 (144px HD Pixel)</span>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          onPointerDown={handleCanvasPointerDown}
          className="w-full aspect-[760/720] block cursor-pointer pixelated touch-none"
        />

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

      {/* Quick Garden Map Menu */}
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

      {/* Soft Ivory Stroll Pad */}
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
