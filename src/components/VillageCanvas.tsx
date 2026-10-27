import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  GARDEN_MAPS,
  GARDEN_MAP_ORDER,
  GardenMapId,
  MapLandmark,
  MapPortal,
  QuestBuildingId,
  WeddingConfig,
  GuestbookEntry,
  AvatarClassId,
} from '../data/weddingConfig';
import { PIXEL_ASSETS, GUEST_SPRITES } from './PixelSprites';
import { soundEngine } from '../utils/soundEngine';

interface VillageCanvasProps {
  config: WeddingConfig;
  visitedQuests: Record<QuestBuildingId, boolean>;
  guestbook: GuestbookEntry[];
  onOpenQuest: (id: QuestBuildingId) => void;
  onUnlockTitle?: (title: string) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  phase: number;
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
  onUnlockTitle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [currentMapId, setCurrentMapId] = useState<GardenMapId>('garden');
  const currentMapRef = useRef<GardenMapId>('garden');
  const [visitedMaps, setVisitedMaps] = useState<Record<GardenMapId, boolean>>({
    garden: true,
    chapel: false,
    memory: false,
    reception: false,
  });
  const [visitedMemories, setVisitedMemories] = useState<Record<string, boolean>>({});
  const [mapTransitionFade, setMapTransitionFade] = useState<boolean>(false);
  const [activeStoryToast, setActiveStoryToast] = useState<{
    badge: string;
    title: string;
    text: string;
  } | null>(null);

  // Couple position & movement state
  const posRef = useRef<{ x: number; y: number }>({ x: 50, y: 72 });
  const targetPosRef = useRef<{ x: number; y: number } | null>(null);
  const pendingLandmarkRef = useRef<MapLandmark | null>(null);
  const pendingPortalRef = useRef<MapPortal | null>(null);
  const portalCooldownRef = useRef<number>(0);

  const trailRef = useRef<TrailPoint[]>(
    Array.from({ length: 28 }, () => ({ x: 50, y: 72 }))
  );
  const keysRef = useRef<Record<string, boolean>>({});
  const dpadDirRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const stepSoundCooldownRef = useRef<number>(0);

  const [nearbyLandmark, setNearbyLandmark] = useState<MapLandmark | null>(null);
  const [nearbyPortal, setNearbyPortal] = useState<MapPortal | null>(null);
  const [npcBubbleIndex, setNpcBubbleIndex] = useState<number>(0);

  // Preload all 4 Map Backgrounds + Chibi Character Sprites
  const assetsRef = useRef<{
    maps: Partial<Record<GardenMapId, HTMLImageElement>>;
    groom: HTMLImageElement | null;
    bride: HTMLImageElement | null;
    cat: HTMLImageElement | null;
    guests: Partial<Record<AvatarClassId, HTMLImageElement>>;
  }>({
    maps: {},
    groom: null,
    bride: null,
    cat: null,
    guests: {},
  });

  useEffect(() => {
    const loadImg = (src: string, onLoad: (img: HTMLImageElement) => void) => {
      const img = new Image();
      img.src = src;
      img.onload = () => onLoad(img);
    };
    loadImg(PIXEL_ASSETS.weddingGardenMap, (img) => (assetsRef.current.maps.garden = img));
    loadImg(PIXEL_ASSETS.weddingChapelMap, (img) => (assetsRef.current.maps.chapel = img));
    loadImg(PIXEL_ASSETS.weddingMemoryMap, (img) => (assetsRef.current.maps.memory = img));
    loadImg(
      PIXEL_ASSETS.weddingReceptionMap,
      (img) => (assetsRef.current.maps.reception = img)
    );
    loadImg(PIXEL_ASSETS.groomSprite, (img) => (assetsRef.current.groom = img));
    loadImg(PIXEL_ASSETS.brideSprite, (img) => (assetsRef.current.bride = img));
    loadImg(PIXEL_ASSETS.catSprite, (img) => (assetsRef.current.cat = img));
    (Object.keys(GUEST_SPRITES) as AvatarClassId[]).forEach((id) =>
      loadImg(GUEST_SPRITES[id].sprite, (img) => (assetsRef.current.guests[id] = img))
    );
  }, []);

  // Switch map helper (used by both portals and the top World Map Tab Bar)
  const travelToMap = useCallback(
    (targetMap: GardenMapId, spawnX?: number, spawnY?: number) => {
      const destConfig = GARDEN_MAPS[targetMap];
      const sx = spawnX ?? destConfig.defaultSpawn.x;
      const sy = spawnY ?? destConfig.defaultSpawn.y;

      soundEngine.playSelect();
      setMapTransitionFade(true);
      window.setTimeout(() => {
        setMapTransitionFade(false);
      }, 280);

      currentMapRef.current = targetMap;
      setCurrentMapId(targetMap);
      setVisitedMaps((prev) => ({ ...prev, [targetMap]: true }));
      posRef.current = { x: sx, y: sy };
      trailRef.current = Array.from({ length: 28 }, () => ({ x: sx, y: sy }));
      targetPosRef.current = null;
      pendingLandmarkRef.current = null;
      pendingPortalRef.current = null;
      portalCooldownRef.current = 45;
      setNearbyLandmark(null);
      setNearbyPortal(null);
      setActiveStoryToast(null);
    },
    []
  );

  // Trigger a landmark's special interaction or open its linked invitation modal
  const activateLandmark = useCallback(
    (landmark: MapLandmark) => {
      if (landmark.storySnippet) {
        setActiveStoryToast({
          badge: landmark.badge,
          title: landmark.name,
          text: landmark.storySnippet,
        });
      }

      if (landmark.specialAction) {
        if (
          landmark.specialAction === 'memory_spring' ||
          landmark.specialAction === 'memory_autumn' ||
          landmark.specialAction === 'memory_winter'
        ) {
          soundEngine.playCoin();
          setVisitedMemories((prev) => {
            const next = { ...prev, [landmark.id]: true };
            const count = Object.keys(next).length;
            if (count >= 3 && onUnlockTitle) {
              onUnlockTitle('🎗️ 사계절의 증인');
              try {
                confetti({
                  particleCount: 45,
                  spread: 65,
                  origin: { y: 0.6 },
                  colors: ['#e899a0', '#d4af7a', '#84a98c'],
                });
              } catch {
                // ignore
              }
            }
            return next;
          });
        } else if (
          landmark.specialAction === 'virgin_road' ||
          landmark.specialAction === 'cake_toast'
        ) {
          soundEngine.playFanfare();
          if (onUnlockTitle && landmark.specialAction === 'cake_toast') {
            onUnlockTitle('🥂 별빛 피로연의 주인공');
          }
          try {
            confetti({
              particleCount: 50,
              spread: 70,
              origin: { y: 0.58 },
              colors: ['#e899a0', '#d4af7a', '#fffdf9'],
            });
          } catch {
            // ignore
          }
        } else if (landmark.specialAction === 'piano_melody') {
          soundEngine.playFanfare();
        }
      }

      if (landmark.questId) {
        soundEngine.playSelect();
        onOpenQuest(landmark.questId);
      }
    },
    [onOpenQuest, onUnlockTitle]
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNpcBubbleIndex((prev) => prev + 1);
    }, 3600);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      keysRef.current[e.key] = true;
      if (e.key === ' ' || e.key === 'Enter') {
        if (nearbyPortal) {
          e.preventDefault();
          travelToMap(nearbyPortal.targetMap, nearbyPortal.spawnX, nearbyPortal.spawnY);
        } else if (nearbyLandmark) {
          e.preventDefault();
          activateLandmark(nearbyLandmark);
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
  }, [nearbyLandmark, nearbyPortal, activateLandmark, travelToMap]);

  const walkToLandmark = useCallback((lm: MapLandmark) => {
    soundEngine.playBlip(700);
    targetPosRef.current = { x: lm.x, y: Math.min(91, lm.y + 6) };
    pendingLandmarkRef.current = lm;
    pendingPortalRef.current = null;
  }, []);

  const walkToPortal = useCallback((portal: MapPortal) => {
    soundEngine.playBlip(760);
    targetPosRef.current = { x: portal.x, y: portal.y };
    pendingPortalRef.current = portal;
    pendingLandmarkRef.current = null;
  }, []);

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    const mapConfig = GARDEN_MAPS[currentMapRef.current];

    // 1. Check if user tapped a Portal Gate
    const tappedPortal = mapConfig.portals.find((p) => {
      const dist = Math.hypot(clickX - p.x, clickY - p.y);
      return dist < 11.5;
    });
    if (tappedPortal) {
      const distFromPlayer = Math.hypot(
        posRef.current.x - tappedPortal.x,
        posRef.current.y - tappedPortal.y
      );
      if (distFromPlayer < 16) {
        travelToMap(tappedPortal.targetMap, tappedPortal.spawnX, tappedPortal.spawnY);
      } else {
        walkToPortal(tappedPortal);
      }
      return;
    }

    // 2. Check if user tapped a Landmark
    const tappedLandmark = mapConfig.landmarks.find((lm) => {
      const dist = Math.hypot(clickX - lm.x, clickY - lm.y);
      return dist < 13.5;
    });

    if (tappedLandmark) {
      const distFromPlayer = Math.hypot(
        posRef.current.x - tappedLandmark.x,
        posRef.current.y - tappedLandmark.y
      );
      if (distFromPlayer < 16) {
        activateLandmark(tappedLandmark);
      } else {
        walkToLandmark(tappedLandmark);
      }
    } else {
      soundEngine.playBlip(560);
      targetPosRef.current = {
        x: Math.max(8, Math.min(92, clickX)),
        y: Math.max(14, Math.min(93, clickY)),
      };
      pendingLandmarkRef.current = null;
      pendingPortalRef.current = null;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 760;
    const H = 760;
    canvas.width = W;
    canvas.height = H;
    ctx.imageSmoothingEnabled = false;

    const particles: Particle[] = Array.from({ length: 34 }, (_, i) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: -0.28 - Math.random() * 0.35,
      vy: 0.4 + Math.random() * 0.55,
      size: Math.random() > 0.45 ? 5 : 4,
      color: Math.random() > 0.35 ? '#ffd6e0' : '#fffdf9',
      phase: i * 0.7,
    }));

    let animId: number;
    let tick = 0;

    const drawLandmarkBadge = (
      lm: MapLandmark,
      bx: number,
      by: number,
      isVisited: boolean,
      isNear: boolean
    ) => {
      const x = Math.round(bx);
      const y = Math.round(by);

      if (isNear) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 253, 249, 0.28)';
        ctx.beginPath();
        ctx.arc(x, y, 52, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d97b84';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(x, y, 52 + Math.sin(tick * 0.08) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      const floatY = Math.sin(tick * 0.07 + lm.x) * 3.5;
      const badgeW = 30;
      const badgeH = 24;
      const badgeY = y - 56 + floatY;

      ctx.fillStyle = isVisited ? '#6b9071' : '#fffdf9';
      ctx.fillRect(x - badgeW / 2, badgeY, badgeW, badgeH);
      ctx.strokeStyle = isVisited ? '#fffdf9' : '#c59b6d';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - badgeW / 2, badgeY, badgeW, badgeH);

      ctx.fillStyle = isVisited ? '#fffdf9' : '#d97b84';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isVisited ? '✓' : '♥', x, badgeY + 17);

      const label = lm.shortName;
      ctx.font = 'bold 16px "Gowun Batang", "Pretendard", sans-serif';
      const textWidth = ctx.measureText(label).width + 20;
      const labelY = lm.y > 84 ? y + 18 : y + 28;

      ctx.fillStyle = isNear ? '#d97b84' : 'rgba(255, 253, 249, 0.94)';
      ctx.fillRect(x - textWidth / 2, labelY, textWidth, 25);
      ctx.strokeStyle = isNear ? '#fffdf9' : '#c59b6d';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - textWidth / 2, labelY, textWidth, 25);

      ctx.fillStyle = isNear ? '#fffdf9' : '#3b2f2f';
      ctx.fillText(label, x, labelY + 17);
    };

    const drawPortalGate = (portal: MapPortal, isNear: boolean) => {
      const px = Math.round((portal.x / 100) * W);
      const py = Math.round((portal.y / 100) * H);
      const pulse = Math.sin(tick * 0.1) * 3;

      // Glowing golden-rose ground portal ring
      ctx.save();
      ctx.fillStyle = isNear ? 'rgba(217, 123, 132, 0.36)' : 'rgba(255, 245, 225, 0.34)';
      ctx.beginPath();
      ctx.ellipse(px, py + 6, 32 + pulse, 15 + pulse * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isNear ? '#fffdf9' : '#d97b84';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(px, py + 6, 32 + pulse, 15 + pulse * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      const arrow =
        portal.direction === 'north'
          ? '▲ '
          : portal.direction === 'south'
          ? '▼ '
          : portal.direction === 'west'
          ? '◀ '
          : '';
      const suffix = portal.direction === 'east' ? ' ▶' : '';
      const text = `${arrow}${portal.label}${suffix}`;

      ctx.font = 'bold 15px "Pretendard", sans-serif';
      const pillW = ctx.measureText(text).width + 22;
      const pillH = 26;
      const clampedX = Math.max(pillW / 2 + 8, Math.min(W - pillW / 2 - 8, px));
      const pillY = Math.round(py - 28 + Math.sin(tick * 0.08) * 2.5);

      ctx.fillStyle = isNear ? '#3b2f2f' : '#d97b84';
      ctx.fillRect(clampedX - pillW / 2, pillY, pillW, pillH);
      ctx.strokeStyle = '#fffdf9';
      ctx.lineWidth = 2;
      ctx.strokeRect(clampedX - pillW / 2, pillY, pillW, pillH);

      ctx.fillStyle = '#fffdf9';
      ctx.textAlign = 'center';
      ctx.fillText(text, clampedX, pillY + 18);
    };

    const render = () => {
      tick++;
      if (portalCooldownRef.current > 0) {
        portalCooldownRef.current--;
      }

      const activeMapId = currentMapRef.current;
      const mapConfig = GARDEN_MAPS[activeMapId];

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
        pendingLandmarkRef.current = null;
        pendingPortalRef.current = null;
        const len = Math.hypot(dx, dy) || 1;
        posRef.current.x = Math.max(8, Math.min(92, posRef.current.x + (dx / len) * speed));
        posRef.current.y = Math.max(14, Math.min(93, posRef.current.y + (dy / len) * speed));
        isMoving = true;
      } else if (targetPosRef.current) {
        const tx = targetPosRef.current.x;
        const ty = targetPosRef.current.y;
        const dist = Math.hypot(tx - posRef.current.x, ty - posRef.current.y);
        if (dist > 1.2) {
          posRef.current.x += ((tx - posRef.current.x) / dist) * (speed * 1.28);
          posRef.current.y += ((ty - posRef.current.y) / dist) * (speed * 1.28);
          isMoving = true;
        } else {
          targetPosRef.current = null;
          if (pendingPortalRef.current) {
            const p = pendingPortalRef.current;
            pendingPortalRef.current = null;
            travelToMap(p.targetMap, p.spawnX, p.spawnY);
          } else if (pendingLandmarkRef.current) {
            const lm = pendingLandmarkRef.current;
            pendingLandmarkRef.current = null;
            activateLandmark(lm);
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

      // Check proximity to Portals
      let closestPortal: MapPortal | null = null;
      let minPortalDist = 11.5;
      for (const p of mapConfig.portals) {
        const d = Math.hypot(posRef.current.x - p.x, posRef.current.y - p.y);
        if (d < minPortalDist) {
          minPortalDist = d;
          closestPortal = p;
        }
      }
      setNearbyPortal((prev) => (prev?.id !== closestPortal?.id ? closestPortal : prev));

      // Auto-warp if player walks directly into the center of a portal with keyboard/D-pad
      if (
        closestPortal &&
        minPortalDist < 5.2 &&
        portalCooldownRef.current === 0 &&
        (dx !== 0 || dy !== 0)
      ) {
        travelToMap(
          closestPortal.targetMap,
          closestPortal.spawnX,
          closestPortal.spawnY
        );
      }

      // Check proximity to Landmarks
      let closestLandmark: MapLandmark | null = null;
      let minLmDist = 14.5;
      for (const lm of mapConfig.landmarks) {
        const d = Math.hypot(posRef.current.x - lm.x, posRef.current.y - (lm.y + 4));
        if (d < minLmDist) {
          minLmDist = d;
          closestLandmark = lm;
        }
      }
      setNearbyLandmark((prev) => {
        if (prev?.id !== closestLandmark?.id) {
          if (closestLandmark?.storySnippet) {
            setActiveStoryToast({
              badge: closestLandmark.badge,
              title: closestLandmark.name,
              text: closestLandmark.storySnippet,
            });
          }
          return closestLandmark;
        }
        return prev;
      });

      // 2. Draw Current Map Background
      const bgImg = assetsRef.current.maps[activeMapId] || assetsRef.current.maps.garden;
      if (bgImg) {
        ctx.drawImage(bgImg, 0, 0, W, H);
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

      // 4. Draw Landmarks & Portals
      mapConfig.landmarks.forEach((lm) => {
        const bx = (lm.x / 100) * W;
        const by = (lm.y / 100) * H;
        const done = lm.questId
          ? !!visitedQuests[lm.questId]
          : !!visitedMemories[lm.id];
        drawLandmarkBadge(lm, bx, by, done, closestLandmark?.id === lm.id);
      });

      mapConfig.portals.forEach((p) => {
        drawPortalGate(p, closestPortal?.id === p.id);
      });

      // 5. Draw Map-Specific Guest NPCs & Interactive Ambience
      const GUEST_H = 66;
      const guestHeads: { x: number; y: number; name: string; msg: string }[] = [];

      if (activeMapId === 'chapel') {
        // In the Chapel: guests stand along the left & right pews cheering the couple's Virgin Road march!
        const pewSpots: { x: number; y: number; avatar: AvatarClassId; cheer: string }[] = [
          { x: 33, y: 49, avatar: 'knight', cheer: '결혼을 진심으로 축하해요! 👏' },
          { x: 67, y: 49, avatar: 'mage', cheer: '세상에서 제일 아름다운 신부! 🌸' },
          { x: 33, y: 63, avatar: 'bard', cheer: '두 사람의 앞날에 축복을! 🎶' },
          { x: 67, y: 63, avatar: 'healer', cheer: '늘 오늘처럼 행복하세요 ♥' },
          { x: 33, y: 76, avatar: 'archer', cheer: '버진로드 행진 너무 멋져요! 📸' },
          { x: 67, y: 76, avatar: 'cat', cheer: '야옹~ 행복하게 잘 살아요! 🐾' },
        ];
        const onVirginRoad =
          posRef.current.x > 36 && posRef.current.x < 64 && posRef.current.y < 82;

        pewSpots.forEach((spot, idx) => {
          const fx = (spot.x / 100) * W;
          const fy = (spot.y / 100) * H;
          const img = assetsRef.current.guests[spot.avatar];
          const h = spot.avatar === 'cat' ? 40 : GUEST_H;
          const cheerJump = onVirginRoad
            ? Math.abs(Math.sin(tick * 0.18 + idx)) * 6
            : Math.max(0, Math.sin(tick * 0.08 + idx * 1.5)) * 2.5;

          ctx.fillStyle = 'rgba(59, 47, 47, 0.18)';
          ctx.beginPath();
          ctx.ellipse(fx, fy, 14, 5, 0, 0, Math.PI * 2);
          ctx.fill();

          if (img) {
            const w = Math.round((h * img.naturalWidth) / img.naturalHeight);
            ctx.save();
            if (spot.x > 50) {
              ctx.translate(fx, 0);
              ctx.scale(-1, 1);
              ctx.translate(-fx, 0);
            }
            ctx.drawImage(img, Math.round(fx - w / 2), Math.round(fy - h - cheerJump), w, h);
            ctx.restore();
          }

          if (onVirginRoad && idx % 2 === Math.floor(tick / 30) % 2) {
            ctx.fillStyle = '#d97b84';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('♥', fx, fy - h - cheerJump - 6);
          }

          guestHeads.push({
            x: fx,
            y: fy - h - cheerJump,
            name: guestbook[idx]?.name || '하객',
            msg: guestbook[idx]?.message || spot.cheer,
          });
        });
      } else if (activeMapId === 'garden' || activeMapId === 'reception') {
        const npcSpots =
          activeMapId === 'garden'
            ? [
                { x: 36, y: 47 },
                { x: 64, y: 47 },
                { x: 37, y: 61 },
                { x: 63, y: 61 },
              ]
            : [
                { x: 25, y: 34 },
                { x: 75, y: 34 },
                { x: 36, y: 56 },
                { x: 64, y: 56 },
              ];
        const recentGuests = guestbook.slice(0, npcSpots.length);
        recentGuests.forEach((g, idx) => {
          const spot = npcSpots[idx];
          const fx = (spot.x / 100) * W;
          const fy = (spot.y / 100) * H;
          const img =
            assetsRef.current.guests[g.avatar] || assetsRef.current.guests.knight;
          const h = g.avatar === 'cat' ? 40 : GUEST_H;
          const bob = Math.max(0, Math.sin(tick * 0.08 + idx * 1.7)) * 2.5;
          ctx.fillStyle = 'rgba(59, 47, 47, 0.2)';
          ctx.beginPath();
          ctx.ellipse(fx, fy, 15, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          if (img) {
            const w = Math.round((h * img.naturalWidth) / img.naturalHeight);
            ctx.save();
            if (spot.x > 50) {
              ctx.translate(fx, 0);
              ctx.scale(-1, 1);
              ctx.translate(-fx, 0);
            }
            ctx.drawImage(img, Math.round(fx - w / 2), Math.round(fy - h - bob), w, h);
            ctx.restore();
          }
          guestHeads.push({
            x: fx,
            y: fy - h - bob,
            name: g.name,
            msg: g.message,
          });
        });
      }

      // 6. Draw 3-Head-Tall Chibi Couple & Kitten Walking Together!
      const walkBob = isMoving
        ? Math.abs(Math.sin(tick * 0.24)) * 5
        : Math.sin(tick * 0.06) * 1.5;

      const groomFootX = (posRef.current.x / 100) * W;
      const groomFootY = (posRef.current.y / 100) * H;

      const brideTrail =
        trailRef.current[Math.min(7, trailRef.current.length - 1)] || posRef.current;
      const catTrail =
        trailRef.current[Math.min(16, trailRef.current.length - 1)] || posRef.current;

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

      // Draw Kitten '모찌'
      if (assetsRef.current.cat) {
        const catH = 48;
        const catW = Math.round(
          (catH * assetsRef.current.cat.naturalWidth) /
            assetsRef.current.cat.naturalHeight
        );
        ctx.drawImage(
          assetsRef.current.cat,
          Math.round(catFootX - catW / 2),
          Math.round(catFootY - catH - walkBob * 0.8),
          catW,
          catH
        );
      }

      const CHIBI_H = 96;
      const drawChibi = (
        img: HTMLImageElement,
        footX: number,
        footY: number,
        bob: number
      ) => {
        const w = Math.round((CHIBI_H * img.naturalWidth) / img.naturalHeight);
        ctx.drawImage(
          img,
          Math.round(footX - w / 2),
          Math.round(footY - CHIBI_H - bob),
          w,
          CHIBI_H
        );
      };

      if (assetsRef.current.groom) {
        drawChibi(assetsRef.current.groom, groomFootX - 6, groomFootY, walkBob);
      }
      if (assetsRef.current.bride) {
        drawChibi(assetsRef.current.bride, brideFootX, brideFootY, walkBob * 0.9);
      }

      // Floating Heart between Groom & Bride
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

      // 7. Speech bubble above the active speaker NPC
      if (guestHeads.length > 0) {
        const activeIdx = npcBubbleIndex % guestHeads.length;
        const speaker = guestHeads[activeIdx];
        const snippet =
          speaker.msg.length > 16 ? speaker.msg.slice(0, 16) + '…' : speaker.msg;
        const bubbleText = `${speaker.name}: "${snippet}"`;
        ctx.font = 'bold 14px "Pretendard", sans-serif';
        const bw = Math.min(420, ctx.measureText(bubbleText).width + 24);
        const bx = Math.max(bw / 2 + 8, Math.min(W - bw / 2 - 8, speaker.x));
        const by = speaker.y - 12;

        ctx.fillStyle = 'rgba(255, 253, 249, 0.96)';
        ctx.fillRect(bx - bw / 2, by - 26, bw, 26);
        ctx.strokeStyle = '#c59b6d';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx - bw / 2, by - 26, bw, 26);
        ctx.fillStyle = 'rgba(255, 253, 249, 0.96)';
        ctx.beginPath();
        ctx.moveTo(speaker.x - 6, by - 1);
        ctx.lineTo(speaker.x + 6, by - 1);
        ctx.lineTo(speaker.x, by + 8);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(speaker.x - 6, by);
        ctx.lineTo(speaker.x, by + 8);
        ctx.lineTo(speaker.x + 6, by);
        ctx.stroke();

        ctx.fillStyle = '#3b2f2f';
        ctx.textAlign = 'center';
        ctx.fillText(bubbleText, bx, by - 8);
      }

      // 8. Map-Specific Ambient Particles (Petals / Sunbeams / Seasonal / Fireflies)
      particles.forEach((p) => {
        if (mapConfig.particleType === 'fireflies') {
          p.x += Math.sin(tick * 0.03 + p.phase) * 0.45;
          p.y += Math.cos(tick * 0.025 + p.phase) * 0.35;
          if (p.x < 0) p.x = W;
          if (p.x > W) p.x = 0;
          if (p.y < 0) p.y = H;
          if (p.y > H) p.y = 0;
          const alpha = 0.45 + 0.5 * Math.sin(tick * 0.08 + p.phase);
          ctx.fillStyle = `rgba(255, 232, 163, ${alpha.toFixed(2)})`;
          ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size + 1, p.size + 1);
        } else if (mapConfig.particleType === 'sunbeams') {
          p.y -= 0.3;
          p.x += Math.sin(tick * 0.04 + p.phase) * 0.25;
          if (p.y < 0) p.y = H;
          ctx.fillStyle = 'rgba(255, 248, 220, 0.78)';
          ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
        } else {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y > H) p.y = -6;
          if (p.x < 0) p.x = W + 6;
          ctx.fillStyle =
            mapConfig.particleType === 'seasons' && p.x > W * 0.5
              ? '#ffffff'
              : p.color;
          ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
        }
      });

      animId = window.requestAnimationFrame(render);
    };

    animId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(animId);
  }, [
    config,
    visitedQuests,
    visitedMemories,
    guestbook,
    npcBubbleIndex,
    activateLandmark,
    travelToMap,
  ]);

  const setDpad = (dx: number, dy: number) => {
    dpadDirRef.current = { dx, dy };
  };

  const activeMapConfig = GARDEN_MAPS[currentMapId];
  const exploredMapCount = Object.values(visitedMaps).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Top World Map Switcher Bar (4 Connected Maps) */}
      <div className="pixel-card p-2.5 bg-[#fffdf9] space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#3b2f2f]">
              🗺️ 웨딩 월드맵 이동 ({exploredMapCount}/4 맵 탐방)
            </span>
          </div>
          <span className="text-[11px] text-[#8c7a70] font-sans">
            포털로 걸어가거나 탭을 터치하세요
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 font-sans">
          {GARDEN_MAP_ORDER.map((mapId) => {
            const m = GARDEN_MAPS[mapId];
            const isActive = currentMapId === mapId;
            const isVisited = visitedMaps[mapId];
            return (
              <button
                key={mapId}
                onClick={() => {
                  if (currentMapId !== mapId) {
                    travelToMap(mapId);
                  }
                }}
                className={`py-2 px-1.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                  isActive
                    ? 'bg-[#d97b84] text-white border-[#b85d67] font-bold shadow-xs scale-[1.02]'
                    : isVisited
                    ? 'bg-[#faf5ec] text-[#3b2f2f] border-[#c59b6d] hover:bg-[#f3e9d8] font-semibold'
                    : 'bg-[#fcfaf5] text-[#7d6e65] border-[#e2d4c0] hover:border-[#c59b6d]'
                }`}
              >
                <span className="text-sm leading-none">{m.icon}</span>
                <span className="text-[11px] truncate w-full">{m.tabLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Pixel World Canvas Frame */}
      <div className="relative pixel-card overflow-hidden bg-[#bdd2b6]">
        {/* Top Map Banner Pill */}
        <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
          <div className="bg-[#fffdf9]/92 backdrop-blur-xs border border-[#d4b48c] px-3 py-1 rounded-full text-[11px] text-[#5c4d47] flex items-center gap-1.5 shadow-xs truncate">
            <span className="inline-block w-2 h-2 rounded-full bg-[#d97b84] animate-pulse shrink-0" />
            <strong className="text-[#3b2f2f] shrink-0">
              {activeMapConfig.icon} {activeMapConfig.tabLabel}
            </strong>
            <span className="text-[#8c7a70] truncate hidden xs:inline">
              · {activeMapConfig.subtitle}
            </span>
          </div>
        </div>

        {/* Story / Memory Toast Overlay when visiting special spots */}
        {activeStoryToast && !nearbyLandmark && !nearbyPortal && (
          <div className="absolute top-11 left-3 right-3 z-10 bg-[#fffdf9]/95 border border-[#d97b84] rounded-xl px-3.5 py-2.5 shadow-md flex items-center justify-between gap-2 animate-fadeIn">
            <div className="min-w-0">
              <div className="text-[10px] font-sans font-bold text-[#d97b84] tracking-wider">
                {activeStoryToast.badge} · {activeStoryToast.title}
              </div>
              <div className="text-xs text-[#3b2f2f] font-medium mt-0.5 break-keep">
                {activeStoryToast.text}
              </div>
            </div>
            <button
              onClick={() => setActiveStoryToast(null)}
              className="text-[11px] font-sans text-[#8c7a70] hover:text-[#3b2f2f] px-2 py-1 shrink-0"
            >
              닫기 ✕
            </button>
          </div>
        )}

        <canvas
          ref={canvasRef}
          onPointerDown={handleCanvasPointerDown}
          className={`w-full aspect-square block cursor-pointer pixelated touch-none transition-opacity duration-200 ${
            mapTransitionFade ? 'opacity-40' : 'opacity-100'
          }`}
        />

        {/* Nearby Portal Prompt */}
        {nearbyPortal && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 bg-[#3b2f2f]/95 text-[#fffdf9] border border-[#c59b6d] rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-md animate-fadeIn">
            <div className="min-w-0">
              <div className="text-[10px] text-[#e6d5b8] font-sans font-semibold tracking-wider">
                MAP PORTAL · 다음 장소로 이동
              </div>
              <div className="text-xs font-bold truncate">
                {nearbyPortal.label} ({GARDEN_MAPS[nearbyPortal.targetMap].title})
              </div>
            </div>
            <button
              onClick={() =>
                travelToMap(
                  nearbyPortal.targetMap,
                  nearbyPortal.spawnX,
                  nearbyPortal.spawnY
                )
              }
              className="pixel-btn bg-[#d97b84] text-white border-[#b85d67] text-xs font-bold px-3.5 py-1.5 shrink-0"
            >
              이동하기 ▶
            </button>
          </div>
        )}

        {/* Nearby Landmark Prompt */}
        {!nearbyPortal && nearbyLandmark && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 bg-[#fffdf9]/95 border border-[#c59b6d] rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-md animate-fadeIn">
            <div className="min-w-0">
              <div className="text-[10px] text-[#c59b6d] font-sans font-semibold tracking-wider">
                {nearbyLandmark.badge} · {nearbyLandmark.npcName}
              </div>
              <div className="text-xs font-bold text-[#3b2f2f] truncate">
                {nearbyLandmark.name}
              </div>
              {nearbyLandmark.storySnippet && (
                <div className="text-[11px] text-[#6e5d53] truncate mt-0.5">
                  {nearbyLandmark.storySnippet}
                </div>
              )}
            </div>
            <button
              onClick={() => activateLandmark(nearbyLandmark)}
              className="pixel-btn bg-[#d97b84] text-white border-[#b85d67] text-xs font-bold px-3.5 py-1.5 shrink-0"
            >
              {nearbyLandmark.questId ? '열어보기 ▶' : '감상하기 ✨'}
            </button>
          </div>
        )}
      </div>

      {/* Current Map Landmarks & Connected Portals Quick Menu */}
      <div className="pixel-card p-3 bg-[#fffdf9] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#5c4d47] font-bold">
            {activeMapConfig.icon} [{activeMapConfig.tabLabel}] 주요 스팟 바로가기
          </span>
          <span className="text-[11px] text-[#9c897e] font-sans">
            터치 시 산책 또는 열람
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {activeMapConfig.landmarks.map((lm) => {
            const done = lm.questId
              ? !!visitedQuests[lm.questId]
              : !!visitedMemories[lm.id];
            return (
              <button
                key={lm.id}
                onClick={() => activateLandmark(lm)}
                className={`px-2.5 py-2 rounded-md border text-[11px] font-medium flex items-center gap-1.5 transition-all text-left ${
                  done
                    ? 'bg-[#edf3ee] text-[#4d6b53] border-[#a3bfa8]'
                    : 'bg-[#faf5ec] text-[#4a3b32] border-[#e2d4c0] hover:border-[#c59b6d]'
                }`}
              >
                <span className="text-sm shrink-0">{lm.name.split(' ')[0]}</span>
                <span className="truncate text-[11px] font-sans font-semibold">
                  {lm.shortName}
                </span>
              </button>
            );
          })}

          {activeMapConfig.portals.map((p) => (
            <button
              key={p.id}
              onClick={() => travelToMap(p.targetMap, p.spawnX, p.spawnY)}
              className="px-2.5 py-2 rounded-md border border-[#d97b84] bg-[#fcf3f3] hover:bg-[#f9e5e7] text-[#3b2f2f] text-[11px] font-sans font-bold flex items-center justify-between gap-1 transition-all"
            >
              <span className="truncate">{p.label}</span>
              <span className="text-[#d97b84] shrink-0">이동 ▶</span>
            </button>
          ))}
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
            <span className="text-[#3b2f2f] font-bold">
              🌸 4개 테마 맵 산책 안내
            </span>
            <span>• 포털(문·아치)로 걸어가면 다른 맵으로 이동합니다</span>
            <span>• 상단 월드맵 탭으로도 언제든 이동할 수 있어요</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (nearbyPortal) {
                travelToMap(
                  nearbyPortal.targetMap,
                  nearbyPortal.spawnX,
                  nearbyPortal.spawnY
                );
              } else if (nearbyLandmark) {
                activateLandmark(nearbyLandmark);
              } else {
                soundEngine.playSelect();
                onOpenQuest('story');
              }
            }}
            className="pixel-btn bg-[#d97b84] text-white border-[#b85d67] px-3.5 py-2 text-xs font-bold"
          >
            {nearbyPortal
              ? `${GARDEN_MAPS[nearbyPortal.targetMap].tabLabel} 이동`
              : nearbyLandmark
              ? `${nearbyLandmark.shortName} 열기`
              : '초대장 열기'}
          </button>
        </div>
      </div>
    </div>
  );
};
