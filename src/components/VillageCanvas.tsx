import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  QUEST_BUILDINGS,
  QuestBuildingId,
  WeddingConfig,
  GuestbookEntry,
} from '../data/weddingConfig';
import { PIXEL_ASSETS } from './PixelSprites';
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

  // Start the couple in the sunlit plaza just south of the central fountain
  const posRef = useRef<{ x: number; y: number }>({ x: 50, y: 66 });
  const targetPosRef = useRef<{ x: number; y: number } | null>(null);
  const pendingQuestRef = useRef<QuestBuildingId | null>(null);
  const trailRef = useRef<TrailPoint[]>(
    Array.from({ length: 28 }, () => ({ x: 50, y: 66 }))
  );
  const keysRef = useRef<Record<string, boolean>>({});
  const dpadDirRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const stepSoundCooldownRef = useRef<number>(0);

  const [nearbyBuilding, setNearbyBuilding] = useState<(typeof QUEST_BUILDINGS)[0] | null>(
    null
  );
  const [npcBubbleIndex, setNpcBubbleIndex] = useState<number>(0);

  // Preload Artist-Grade Pixel Art Images
  const assetsRef = useRef<{
    map: HTMLImageElement | null;
    groom: HTMLImageElement | null;
    bride: HTMLImageElement | null;
    cat: HTMLImageElement | null;
  }>({
    map: null,
    groom: null,
    bride: null,
    cat: null,
  });

  useEffect(() => {
    const loadImg = (src: string, key: keyof typeof assetsRef.current) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        assetsRef.current[key] = img;
      };
    };
    loadImg(PIXEL_ASSETS.weddingGardenMap, 'map');
    loadImg(PIXEL_ASSETS.groomSprite, 'groom');
    loadImg(PIXEL_ASSETS.brideSprite, 'bride');
    loadImg(PIXEL_ASSETS.catSprite, 'cat');
  }, []);

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
    targetPosRef.current = { x: b.x, y: Math.min(92, b.y + 6) };
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
        y: Math.max(14, Math.min(93, clickY)),
      };
      pendingQuestRef.current = null;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 760x760 square canvas matching the 1024x1024 top-down botanical wedding garden map
    const W = 760;
    const H = 760;
    canvas.width = W;
    canvas.height = H;
    ctx.imageSmoothingEnabled = false;

    const petals: Petal[] = Array.from({ length: 32 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: -0.3 - Math.random() * 0.4,
      vy: 0.45 + Math.random() * 0.6,
      size: Math.random() > 0.45 ? 5 : 4,
      color: Math.random() > 0.35 ? '#ffd6e0' : '#fffdf9',
    }));

    let animId: number;
    let tick = 0;

    const drawPavilionBadge = (
      b: (typeof QUEST_BUILDINGS)[0],
      bx: number,
      by: number,
      isVisited: boolean,
      isNear: boolean
    ) => {
      const x = Math.round(bx);
      const y = Math.round(by);

      // Soft warm glow ring when player is near a pavilion
      if (isNear) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 253, 249, 0.28)';
        ctx.beginPath();
        ctx.arc(x, y, 54, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d97b84';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(x, y, 54 + Math.sin(tick * 0.08) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Floating Stamp Marker above each garden pavilion
      const floatY = Math.sin(tick * 0.07 + b.x) * 3.5;
      const badgeW = 30;
      const badgeH = 24;
      const badgeY =
        b.id === 'ceremony'
          ? y - 78 + floatY
          : b.id === 'minigame'
          ? y - 56 + floatY
          : y - 58 + floatY;

      ctx.fillStyle = isVisited ? '#6b9071' : '#fffdf9';
      ctx.fillRect(x - badgeW / 2, badgeY, badgeW, badgeH);
      ctx.strokeStyle = isVisited ? '#fffdf9' : '#c59b6d';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - badgeW / 2, badgeY, badgeW, badgeH);

      ctx.fillStyle = isVisited ? '#fffdf9' : '#d97b84';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isVisited ? '✓' : '♥', x, badgeY + 17);

      // Elegant Ivory Label Pill below each pavilion
      const label = b.shortName;
      ctx.font = 'bold 17px "Gowun Batang", "Pretendard", sans-serif';
      const textWidth = ctx.measureText(label).width + 22;
      const labelY = b.id === 'rsvp' ? y + 20 : y + 30;

      ctx.fillStyle = isNear ? '#d97b84' : 'rgba(255, 253, 249, 0.94)';
      ctx.fillRect(x - textWidth / 2, labelY, textWidth, 26);
      ctx.strokeStyle = isNear ? '#fffdf9' : '#c59b6d';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - textWidth / 2, labelY, textWidth, 26);

      ctx.fillStyle = isNear ? '#fffdf9' : '#3b2f2f';
      ctx.fillText(label, x, labelY + 18);
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

      const speed = 0.5;
      let isMoving = false;

      if (dx !== 0 || dy !== 0) {
        targetPosRef.current = null;
        pendingQuestRef.current = null;
        const len = Math.hypot(dx, dy) || 1;
        posRef.current.x = Math.max(10, Math.min(90, posRef.current.x + (dx / len) * speed));
        posRef.current.y = Math.max(15, Math.min(92, posRef.current.y + (dy / len) * speed));
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
        if (trailRef.current.length > 28) trailRef.current.pop();
        if (tick - stepSoundCooldownRef.current > 15) {
          soundEngine.playStep();
          stepSoundCooldownRef.current = tick;
        }
      }

      // Check proximity to the 7 garden pavilions
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

      // 2. Draw Artist-Crafted Botanical Wedding Garden Map Background
      if (assetsRef.current.map) {
        ctx.drawImage(assetsRef.current.map, 0, 0, W, H);
      } else {
        ctx.fillStyle = '#bdd2b6';
        ctx.fillRect(0, 0, W, H);
      }

      // 3. Target Destination Ripple Marker
      if (targetPosRef.current) {
        const tx = (targetPosRef.current.x / 100) * W;
        const ty = (targetPosRef.current.y / 100) * H;
        ctx.strokeStyle = '#d97b84';
        ctx.lineWidth = 2.5;
        const r = 7 + (tick % 14) * 0.7;
        ctx.beginPath();
        ctx.arc(tx, ty, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4. Draw Pavilion Badges & Labels on top of the garden map
      QUEST_BUILDINGS.forEach((b) => {
        const bx = (b.x / 100) * W;
        const by = (b.y / 100) * H;
        drawPavilionBadge(b, bx, by, !!visitedQuests[b.id], closest?.id === b.id);
      });

      // 5. Draw Couple & Kitten Walking Together with Natural Aspect Ratio!
      const walkBob = isMoving
        ? Math.abs(Math.sin(tick * 0.24)) * 5
        : Math.sin(tick * 0.06) * 1.5;

      const groomFootX = (posRef.current.x / 100) * W;
      const groomFootY = (posRef.current.y / 100) * H;

      const brideTrail =
        trailRef.current[Math.min(7, trailRef.current.length - 1)] || posRef.current;
      const catTrail =
        trailRef.current[Math.min(16, trailRef.current.length - 1)] || posRef.current;

      // Offset Bride slightly to the right of Groom so they stroll side-by-side
      const brideFootX = (brideTrail.x / 100) * W + 42;
      const brideFootY = (brideTrail.y / 100) * H + 2;

      const catFootX = (catTrail.x / 100) * W - 40;
      const catFootY = (catTrail.y / 100) * H + 6;

      // Ground Shadows
      ctx.fillStyle = 'rgba(59, 47, 47, 0.22)';
      ctx.beginPath();
      ctx.ellipse(catFootX, catFootY, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(groomFootX - 6, groomFootY, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(brideFootX, brideFootY, 24, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw Kitten '모찌' (178x220 natural ratio -> 36x45)
      if (assetsRef.current.cat) {
        const catW = 36;
        const catH = 45;
        ctx.drawImage(
          assetsRef.current.cat,
          Math.round(catFootX - catW / 2),
          Math.round(catFootY - catH - walkBob * 0.8),
          catW,
          catH
        );
      }

      // 3-head-tall chibi couple: fixed display height, width from each sprite's natural ratio
      const CHIBI_H = 96;
      const drawChibi = (img: HTMLImageElement, footX: number, footY: number, bob: number) => {
        const w = Math.round((CHIBI_H * img.naturalWidth) / img.naturalHeight);
        ctx.drawImage(
          img,
          Math.round(footX - w / 2),
          Math.round(footY - CHIBI_H - bob),
          w,
          CHIBI_H
        );
      };

      // Draw Groom
      if (assetsRef.current.groom) {
        drawChibi(assetsRef.current.groom, groomFootX - 6, groomFootY, walkBob);
      }

      // Draw Bride
      if (assetsRef.current.bride) {
        drawChibi(assetsRef.current.bride, brideFootX, brideFootY, walkBob * 0.9);
      }

      // Floating Heart between Groom & Bride (at head height)
      ctx.fillStyle = '#d97b84';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        '♥',
        Math.round((groomFootX - 6 + brideFootX) / 2),
        Math.round(groomFootY - CHIBI_H - 4 - walkBob + Math.sin(tick * 0.1) * 2)
      );

      // Couple Overhead Name Tag
      const centerCoupleX = (groomFootX + brideFootX) / 2;
      const tagY = groomFootY - CHIBI_H - 34 - walkBob;
      ctx.fillStyle = 'rgba(255, 253, 249, 0.94)';
      ctx.fillRect(centerCoupleX - 58, tagY, 116, 23);
      ctx.strokeStyle = '#d97b84';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(centerCoupleX - 58, tagY, 116, 23);
      ctx.fillStyle = '#3b2f2f';
      ctx.font = 'bold 14px "Gowun Batang", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${config.groom.name} ♥ ${config.bride.name}`,
        centerCoupleX,
        tagY + 16
      );

      // 6. Floating Guestbook Blessing Toast near Plaza Fountain
      const recentGuests = guestbook.slice(0, 5);
      if (recentGuests.length > 0) {
        const activeIdx = npcBubbleIndex % recentGuests.length;
        const activeGuest = recentGuests[activeIdx];
        const snippet =
          activeGuest.message.length > 18
            ? activeGuest.message.slice(0, 18) + '…'
            : activeGuest.message;
        const bubbleText = `💬 ${activeGuest.name}: "${snippet}"`;
        ctx.font = 'bold 14px "Pretendard", sans-serif';
        const bw = Math.min(440, ctx.measureText(bubbleText).width + 26);
        const bx = W / 2;
        const by = H * 0.39;

        ctx.fillStyle = 'rgba(255, 253, 249, 0.94)';
        ctx.fillRect(bx - bw / 2, by - 14, bw, 26);
        ctx.strokeStyle = '#c59b6d';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx - bw / 2, by - 14, bw, 26);

        ctx.fillStyle = '#3b2f2f';
        ctx.textAlign = 'center';
        ctx.fillText(bubbleText, bx, by + 4);
      }

      // 7. Drifting Spring Cherry Blossom Petals
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
          <div className="bg-[#fffdf9]/92 backdrop-blur-xs border border-[#d4b48c] px-3 py-1 rounded-full text-[11px] text-[#5c4d47] flex items-center gap-1.5 shadow-xs">
            <span className="inline-block w-2 h-2 rounded-full bg-[#d97b84] animate-pulse" />
            <span>보타닉 웨딩 정원의 원하는 건물을 터치하거나 산책해 보세요</span>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          onPointerDown={handleCanvasPointerDown}
          className="w-full aspect-square block cursor-pointer pixelated touch-none"
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
