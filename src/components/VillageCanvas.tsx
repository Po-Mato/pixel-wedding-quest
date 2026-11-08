import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Camera, Compass, BookOpen, Sparkles, MessageCircle, Users, User, X } from 'lucide-react';
import {
  GARDEN_MAPS,
  COMMUTE_MAP_ORDER,
  VENUE_MAP_ORDER,
  AVATAR_CLASSES,
  GardenMapId,
  MapLandmark,
  MapPortal,
  QuestBuildingId,
  WeddingConfig,
  GuestbookEntry,
  AvatarClassId,
} from '../data/weddingConfig';
import {
  WORLD_SECRET_PROPS,
  SECRET_AURA_REWARDS,
  SecretPropItem,
  SecretRewardId,
  NPC_DIALOGUE_CHOICES,
  ActiveNpcTarget,
  NpcChoiceId,
  getAffinityStageLabel,
  resolveNpcAffinityReply,
  ZONE_MINI_QUESTS,
  ZoneMiniQuestItem,
} from '../data/worldExtras';
import { PIXEL_ASSETS, GUEST_SPRITES } from './PixelSprites';
import { soundEngine } from '../utils/soundEngine';
import { fillCoupleText } from '../utils/coupleText';
import {
  incrementReactionCounter,
  getConfiguredApiBase,
} from '../utils/weddingCloudSync';
import {
  TILE_GRID_SIZE,
  TileCoord,
  worldToTile,
  findWalkablePath,
  getNextStepTile,
} from '../utils/worldNavigation';
import { PhotoBoothModal } from './sections/PhotoBoothModal';
import { InGameVirtualJoystick } from './InGameVirtualJoystick';

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

interface FootstepPuff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
}

interface FloatingReaction {
  id: number;
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  scale: number;
}

interface TrailPoint {
  x: number;
  y: number;
}

const REACTION_EMOJIS = [
  { emoji: '💐', label: '꽃다발' },
  { emoji: '👏', label: '박수' },
  { emoji: '❤️', label: '하트' },
  { emoji: '🥂', label: '건배' },
  { emoji: '✨', label: '축복' },
];

const STORAGE_SECRETS_KEY = 'pixel_wedding_quest_secrets_v2';
const STORAGE_AURA_KEY = 'pixel_wedding_quest_aura_v2';
const STORAGE_AFFINITY_KEY = 'pixel_wedding_quest_affinity_v2';
const STORAGE_WALK_MODE_KEY = 'pixel_wedding_quest_walk_mode_v1';
const STORAGE_GUEST_AVATAR_KEY = 'pixel_wedding_quest_guest_avatar_v1';
const STORAGE_GUEST_NAME_KEY = 'pixel_wedding_quest_guest_name_v1';

export type WalkMode = 'guest' | 'couple';

export const VillageCanvas: React.FC<VillageCanvasProps> = ({
  config,
  visitedQuests,
  guestbook,
  onOpenQuest,
  onUnlockTitle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Start at 'home' (우리 집) by default so the guest departs from home!
  const [currentMapId, setCurrentMapId] = useState<GardenMapId>('home');
  const currentMapRef = useRef<GardenMapId>('home');
  const [visitedMaps, setVisitedMaps] = useState<Record<GardenMapId, boolean>>({
    home: true,
    neighborhood: false,
    station: false,
    train: false,
    garden: false,
    bridal: false,
    chapel: false,
    memory: false,
    reception: false,
  });
  const [visitedMemories, setVisitedMemories] = useState<Record<string, boolean>>({});
  const [mapTransitionFade, setMapTransitionFade] = useState<boolean>(false);
  const [showPhotoBooth, setShowPhotoBooth] = useState<boolean>(false);
  const [showSecretBook, setShowSecretBook] = useState<boolean>(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState<boolean>(false);
  const [showWorldMapSheet, setShowWorldMapSheet] = useState<boolean>(false);
  const [blessingCount, setBlessingCount] = useState<number>(128);
  const [activeStoryToast, setActiveStoryToast] = useState<{
    badge: string;
    title: string;
    text: string;
  } | null>(null);

  // Walk Mode ('guest' protagonist by default, or 'couple' walk mode)
  const [walkMode, setWalkMode] = useState<WalkMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_WALK_MODE_KEY);
      if (saved === 'guest' || saved === 'couple') return saved;
    } catch {
      // ignore
    }
    return 'guest';
  });
  const walkModeRef = useRef<WalkMode>(walkMode);
  useEffect(() => {
    walkModeRef.current = walkMode;
    try {
      localStorage.setItem(STORAGE_WALK_MODE_KEY, walkMode);
    } catch {
      // ignore
    }
  }, [walkMode]);

  const [guestAvatar, setGuestAvatar] = useState<AvatarClassId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_GUEST_AVATAR_KEY) as AvatarClassId | null;
      if (saved && GUEST_SPRITES[saved]) return saved;
    } catch {
      // ignore
    }
    return 'mage';
  });
  const guestAvatarRef = useRef<AvatarClassId>(guestAvatar);
  useEffect(() => {
    guestAvatarRef.current = guestAvatar;
    try {
      localStorage.setItem(STORAGE_GUEST_AVATAR_KEY, guestAvatar);
    } catch {
      // ignore
    }
  }, [guestAvatar]);

  const [guestNickname, setGuestNickname] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_GUEST_NAME_KEY);
      if (saved && saved.trim()) return saved.trim();
    } catch {
      // ignore
    }
    return '소중한 하객';
  });
  const guestNicknameRef = useRef<string>(guestNickname);
  useEffect(() => {
    guestNicknameRef.current = guestNickname;
    try {
      localStorage.setItem(STORAGE_GUEST_NAME_KEY, guestNickname);
    } catch {
      // ignore
    }
  }, [guestNickname]);

  // Secret Props Collection & Equipped Aura State
  const [discoveredSecrets, setDiscoveredSecrets] = useState<Record<string, boolean>>(
    () => {
      try {
        const saved = localStorage.getItem(STORAGE_SECRETS_KEY);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
      return {};
    }
  );
  const discoveredSecretsRef = useRef<Record<string, boolean>>(discoveredSecrets);
  useEffect(() => {
    discoveredSecretsRef.current = discoveredSecrets;
    try {
      localStorage.setItem(STORAGE_SECRETS_KEY, JSON.stringify(discoveredSecrets));
    } catch {
      // ignore
    }
  }, [discoveredSecrets]);

  const [equippedAura, setEquippedAura] = useState<SecretRewardId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AURA_KEY) as SecretRewardId | null;
      if (saved) return saved;
    } catch {
      // ignore
    }
    return 'none';
  });
  const equippedAuraRef = useRef<SecretRewardId>(equippedAura);
  useEffect(() => {
    equippedAuraRef.current = equippedAura;
    try {
      localStorage.setItem(STORAGE_AURA_KEY, equippedAura);
    } catch {
      // ignore
    }
  }, [equippedAura]);

  // NPC & Pet Cat '모찌' & Groom/Bride Dialogue & Affinity State
  const [npcAffinities, setNpcAffinities] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AFFINITY_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });
  const [talkedToAnyNpc, setTalkedToAnyNpc] = useState<boolean>(false);
  const [activeDialogueNpc, setActiveDialogueNpc] = useState<ActiveNpcTarget | null>(
    null
  );
  const [dialogueReplyText, setDialogueReplyText] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_AFFINITY_KEY, JSON.stringify(npcAffinities));
    } catch {
      // ignore
    }
  }, [npcAffinities]);

  // Player Tile-Grid Position & A* Tile Queue State (Starts in 'home' at 48, 70)
  const initialSpawnTile = worldToTile(48, 70);
  const posRef = useRef<{ x: number; y: number }>({
    x: initialSpawnTile.x,
    y: initialSpawnTile.y,
  });
  const currentTileRef = useRef<TileCoord>(initialSpawnTile);
  const pathQueueRef = useRef<TileCoord[]>([]);
  const facingDirRef = useRef<1 | -1>(1);
  const pendingLandmarkRef = useRef<MapLandmark | null>(null);
  const pendingPortalRef = useRef<MapPortal | null>(null);
  const pendingSecretRef = useRef<SecretPropItem | null>(null);
  const portalCooldownRef = useRef<number>(0);

  const trailRef = useRef<TrailPoint[]>(
    Array.from({ length: 28 }, () => ({
      x: initialSpawnTile.x,
      y: initialSpawnTile.y,
    }))
  );
  const footstepsRef = useRef<FootstepPuff[]>([]);
  const reactionsRef = useRef<FloatingReaction[]>([]);
  const liveNpcsRef = useRef<ActiveNpcTarget[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const dpadDirRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const stepSoundCooldownRef = useRef<number>(0);

  const [nearbyLandmark, setNearbyLandmark] = useState<MapLandmark | null>(null);
  const [nearbyPortal, setNearbyPortal] = useState<MapPortal | null>(null);
  const [nearbySecret, setNearbySecret] = useState<SecretPropItem | null>(null);
  const [npcBubbleIndex, setNpcBubbleIndex] = useState<number>(0);

  // Preload all 9 Map Backgrounds + Chibi Character Sprites + Bichon Dogs (Cream & Kkomi)
  const assetsRef = useRef<{
    maps: Partial<Record<GardenMapId, HTMLImageElement>>;
    groom: HTMLImageElement | null;
    bride: HTMLImageElement | null;
    dogCream: HTMLImageElement | null;
    dogKkomi: HTMLImageElement | null;
    cat: HTMLImageElement | null;
    guests: Partial<Record<AvatarClassId, HTMLImageElement>>;
  }>({
    maps: {},
    groom: null,
    bride: null,
    dogCream: null,
    dogKkomi: null,
    cat: null,
    guests: {},
  });

  useEffect(() => {
    const loadImg = (src: string, onLoad: (img: HTMLImageElement) => void) => {
      const img = new Image();
      img.src = src;
      img.onload = () => onLoad(img);
    };
    loadImg(PIXEL_ASSETS.mapHome, (img) => (assetsRef.current.maps.home = img));
    loadImg(
      PIXEL_ASSETS.mapNeighborhood,
      (img) => (assetsRef.current.maps.neighborhood = img)
    );
    loadImg(PIXEL_ASSETS.mapStation, (img) => (assetsRef.current.maps.station = img));
    loadImg(PIXEL_ASSETS.mapTrain, (img) => (assetsRef.current.maps.train = img));
    loadImg(PIXEL_ASSETS.mapBridal, (img) => (assetsRef.current.maps.bridal = img));
    loadImg(PIXEL_ASSETS.weddingGardenMap, (img) => (assetsRef.current.maps.garden = img));
    loadImg(PIXEL_ASSETS.weddingChapelMap, (img) => (assetsRef.current.maps.chapel = img));
    loadImg(PIXEL_ASSETS.weddingMemoryMap, (img) => (assetsRef.current.maps.memory = img));
    loadImg(
      PIXEL_ASSETS.weddingReceptionMap,
      (img) => (assetsRef.current.maps.reception = img)
    );
    loadImg(PIXEL_ASSETS.groomSprite, (img) => (assetsRef.current.groom = img));
    loadImg(PIXEL_ASSETS.brideSprite, (img) => (assetsRef.current.bride = img));
    loadImg(PIXEL_ASSETS.dogCreamSprite, (img) => (assetsRef.current.dogCream = img));
    loadImg(PIXEL_ASSETS.dogKkomiSprite, (img) => (assetsRef.current.dogKkomi = img));
    loadImg(PIXEL_ASSETS.catSprite, (img) => (assetsRef.current.cat = img));
    (Object.keys(GUEST_SPRITES) as AvatarClassId[]).forEach((id) =>
      loadImg(GUEST_SPRITES[id].sprite, (img) => (assetsRef.current.guests[id] = img))
    );
  }, []);

  // Sync live blessing count from Cloudflare D1 on mount
  useEffect(() => {
    const apiBase = getConfiguredApiBase();
    fetch(`${apiBase}/api/reactions`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { blessingCount?: number } | null) => {
        if (data && typeof data.blessingCount === 'number') {
          setBlessingCount(data.blessingCount);
        }
      })
      .catch(() => {});
  }, []);

  // Spawn floating emoji reactions on the canvas
  const spawnFloatingReaction = useCallback(
    (emoji: string, fromBroadcast = false, customOrigin?: { x: number; y: number }) => {
      if (!fromBroadcast) {
        soundEngine.playCoin();
        incrementReactionCounter('blessing')
          .then((res) => {
            if (res && typeof res.blessingCount === 'number') {
              setBlessingCount(res.blessingCount);
            }
          })
          .catch(() => {});
      }
      setBlessingCount((c) => c + 1);

      const basePx = customOrigin?.x ?? posRef.current.x;
      const basePy = customOrigin?.y ?? posRef.current.y;
      for (let i = 0; i < 4; i++) {
        reactionsRef.current.push({
          id: Date.now() + Math.random(),
          emoji,
          x: basePx + (Math.random() - 0.5) * 24,
          y: basePy - 8 - i * 3,
          vx: (Math.random() - 0.5) * 0.22,
          vy: -0.42 - Math.random() * 0.25,
          alpha: 1,
          scale: 0.95 + Math.random() * 0.35,
        });
      }

      if (!fromBroadcast) {
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel('pixel_wedding_quest_live_channel');
            bc.postMessage({ type: 'EMOJI_REACTION', emoji });
            bc.close();
          }
        } catch {
          // ignore
        }
      }
    },
    []
  );

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('pixel_wedding_quest_live_channel');
      bc.onmessage = (ev) => {
        if (ev.data?.type === 'EMOJI_REACTION' && ev.data?.emoji) {
          spawnFloatingReaction(String(ev.data.emoji), true);
        }
      };
    } catch {
      // ignore
    }
    return () => {
      try {
        bc?.close();
      } catch {
        // ignore
      }
    };
  }, [spawnFloatingReaction]);

  // Discover a Sparkling Secret Prop & Auto-Equip Unlocked Aura
  const activateSecretProp = useCallback(
    (prop: SecretPropItem) => {
      soundEngine.playFanfare();
      setActiveStoryToast({
        badge: `SECRET DISCOVERED · ${prop.icon}`,
        title: prop.title,
        text: fillCoupleText(prop.storyText, config),
      });

      setDiscoveredSecrets((prev) => {
        const isNew = !prev[prop.id];
        const next = { ...prev, [prop.id]: true };
        const count = Object.keys(next).length;

        if (isNew) {
          if (count === 1 && equippedAuraRef.current === 'none') {
            setEquippedAura('petal_aura');
          } else if (count === 3) {
            setEquippedAura('lantern_aura');
          } else if (count >= 5) {
            setEquippedAura('wedding_crown');
          }
          if (onUnlockTitle) {
            onUnlockTitle(
              count >= 5 ? '👑 로얄 가든 아키비스트' : '🔍 웨딩 비밀 탐험가'
            );
          }
          try {
            confetti({
              particleCount: 40,
              spread: 65,
              origin: { y: 0.6 },
              colors: ['#e899a0', '#d4af7a', '#fffdf9'],
            });
          } catch {
            // ignore
          }
        }
        return next;
      });
    },
    [onUnlockTitle]
  );

  // Switch map helper (snaps spawn to tile grid)
  const travelToMap = useCallback(
    (targetMap: GardenMapId, spawnX?: number, spawnY?: number) => {
      const destConfig = GARDEN_MAPS[targetMap];
      const sx = spawnX ?? destConfig.defaultSpawn.x;
      const sy = spawnY ?? destConfig.defaultSpawn.y;
      const snapped = worldToTile(sx, sy);

      soundEngine.playSelect();
      setMapTransitionFade(true);
      window.setTimeout(() => {
        setMapTransitionFade(false);
      }, 260);

      currentMapRef.current = targetMap;
      setCurrentMapId(targetMap);
      setVisitedMaps((prev) => ({ ...prev, [targetMap]: true }));
      posRef.current = { x: snapped.x, y: snapped.y };
      currentTileRef.current = snapped;
      trailRef.current = Array.from({ length: 28 }, () => ({
        x: snapped.x,
        y: snapped.y,
      }));
      pathQueueRef.current = [];
      footstepsRef.current = [];
      pendingLandmarkRef.current = null;
      pendingPortalRef.current = null;
      pendingSecretRef.current = null;
      portalCooldownRef.current = 45;
      setNearbyLandmark(null);
      setNearbyPortal(null);
      setNearbySecret(null);
      setActiveStoryToast(null);
      setActiveDialogueNpc(null);
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
          text: fillCoupleText(landmark.storySnippet, config),
        });
      }

      if (landmark.specialAction) {
        setVisitedMemories((prev) => {
          const next = { ...prev, [landmark.id]: true };
          const count = Object.keys(next).length;
          if (count >= 3 && onUnlockTitle) {
            onUnlockTitle('🎗️ 사계절의 증인');
          }
          return next;
        });

        if (landmark.specialAction === 'avatar_mirror') {
          soundEngine.playSelect();
          setShowAvatarPicker(true);
          return;
        }

        if (landmark.specialAction === 'bridal_photo') {
          soundEngine.playFanfare();
          setShowPhotoBooth(true);
          return;
        }

        if (landmark.specialAction === 'flower_stand') {
          soundEngine.playFanfare();
          spawnFloatingReaction('💐');
          return;
        }

        if (
          landmark.specialAction === 'street_cafe' ||
          landmark.specialAction === 'station_bench'
        ) {
          soundEngine.playCoin();
          spawnFloatingReaction(landmark.specialAction === 'street_cafe' ? '☕' : '🚇');
          if (!landmark.questId) return;
        }

        if (
          landmark.specialAction === 'virgin_road' ||
          landmark.specialAction === 'cake_toast' ||
          landmark.specialAction === 'piano_melody'
        ) {
          soundEngine.playFanfare();
          if (onUnlockTitle && landmark.specialAction === 'cake_toast') {
            onUnlockTitle('🥂 별빛 피로연의 주인공');
          }
          try {
            confetti({
              particleCount: 45,
              spread: 68,
              origin: { y: 0.58 },
              colors: ['#e899a0', '#d4af7a', '#fffdf9'],
            });
          } catch {
            // ignore
          }
        } else {
          soundEngine.playCoin();
        }
      }

      if (landmark.questId) {
        soundEngine.playSelect();
        onOpenQuest(landmark.questId);
      }
    },
    [onOpenQuest, onUnlockTitle, spawnFloatingReaction]
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
        } else if (nearbySecret && !discoveredSecretsRef.current[nearbySecret.id]) {
          e.preventDefault();
          activateSecretProp(nearbySecret);
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
  }, [
    nearbyLandmark,
    nearbyPortal,
    nearbySecret,
    activateLandmark,
    activateSecretProp,
    travelToMap,
  ]);

  const walkToLandmark = useCallback((lm: MapLandmark) => {
    soundEngine.playBlip(700);
    const goalX = lm.x;
    const goalY = Math.min(91, lm.y + 6.5);
    pathQueueRef.current = findWalkablePath(
      posRef.current.x,
      posRef.current.y,
      goalX,
      goalY,
      currentMapRef.current
    );
    pendingLandmarkRef.current = lm;
    pendingPortalRef.current = null;
    pendingSecretRef.current = null;
  }, []);

  const walkToPortal = useCallback((portal: MapPortal) => {
    soundEngine.playBlip(760);
    pathQueueRef.current = findWalkablePath(
      posRef.current.x,
      posRef.current.y,
      portal.x,
      portal.y,
      currentMapRef.current
    );
    pendingPortalRef.current = portal;
    pendingLandmarkRef.current = null;
    pendingSecretRef.current = null;
  }, []);

  const walkToSecretProp = useCallback((prop: SecretPropItem) => {
    soundEngine.playBlip(740);
    pathQueueRef.current = findWalkablePath(
      posRef.current.x,
      posRef.current.y,
      prop.x,
      prop.y,
      currentMapRef.current
    );
    pendingSecretRef.current = prop;
    pendingLandmarkRef.current = null;
    pendingPortalRef.current = null;
  }, []);

  // Open 3-Choice Dialogue Modal with a Guest NPC, Pet Cat '모찌', Groom, or Bride
  const openNpcDialogue = useCallback((npc: ActiveNpcTarget) => {
    soundEngine.playSelect();
    setActiveDialogueNpc(npc);
    setDialogueReplyText(`“${npc.initialMessage}”`);
    setTalkedToAnyNpc(true);
  }, []);

  const handleSelectDialogueChoice = (choiceId: NpcChoiceId) => {
    if (!activeDialogueNpc) return;
    const choiceMeta =
      NPC_DIALOGUE_CHOICES.find((c) => c.id === choiceId) || NPC_DIALOGUE_CHOICES[0];

    const currentPts = npcAffinities[activeDialogueNpc.id] || 0;
    const nextPts = Math.min(3, currentPts + 1);
    setNpcAffinities((prev) => ({
      ...prev,
      [activeDialogueNpc.id]: nextPts,
    }));
    setTalkedToAnyNpc(true);

    const reply = fillCoupleText(
      resolveNpcAffinityReply(activeDialogueNpc, choiceId, nextPts),
      config
    );
    setDialogueReplyText(reply);

    spawnFloatingReaction(choiceMeta.emoji, false, {
      x: activeDialogueNpc.x,
      y: activeDialogueNpc.y,
    });

    if (nextPts >= 3 && onUnlockTitle) {
      onUnlockTitle('💬 하객들의 인기스타');
    }
  };

  // Smart "Next Recommended Course" Auto-Guide Button
  const handleGuideNextSpot = useCallback(() => {
    const mapConfig = GARDEN_MAPS[currentMapRef.current];
    const unvisitedHere = mapConfig.landmarks.find((lm) => {
      if (lm.questId) return !visitedQuests[lm.questId];
      return !visitedMemories[lm.id];
    });

    if (unvisitedHere) {
      walkToLandmark(unvisitedHere);
      return;
    }

    const undiscoveredProp = WORLD_SECRET_PROPS.find(
      (s) => s.mapId === currentMapRef.current && !discoveredSecretsRef.current[s.id]
    );
    if (undiscoveredProp) {
      walkToSecretProp(undiscoveredProp);
      return;
    }

    const unvisitedPortal =
      mapConfig.portals.find((p) => !visitedMaps[p.targetMap]) || mapConfig.portals[0];
    if (unvisitedPortal) {
      walkToPortal(unvisitedPortal);
    } else if (mapConfig.landmarks[0]) {
      walkToLandmark(mapConfig.landmarks[0]);
    }
  }, [
    visitedQuests,
    visitedMemories,
    visitedMaps,
    walkToLandmark,
    walkToPortal,
    walkToSecretProp,
  ]);

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    const mapConfig = GARDEN_MAPS[currentMapRef.current];

    // 1. Check if user tapped a Secret Prop on this map
    const tappedSecret = WORLD_SECRET_PROPS.find(
      (s) =>
        s.mapId === currentMapRef.current &&
        Math.hypot(clickX - s.x, clickY - s.y) < 8.5
    );
    if (tappedSecret) {
      const distFromPlayer = Math.hypot(
        posRef.current.x - tappedSecret.x,
        posRef.current.y - tappedSecret.y
      );
      if (distFromPlayer < 15) {
        activateSecretProp(tappedSecret);
      } else {
        walkToSecretProp(tappedSecret);
      }
      return;
    }

    // 2. Check if user tapped an NPC (Groom, Bride, Guest, or Pet Cat '모찌')
    const tappedNpc = liveNpcsRef.current.find(
      (npc) => Math.hypot(clickX - npc.x, clickY - (npc.y - 4)) < 9.5
    );
    if (tappedNpc) {
      openNpcDialogue(tappedNpc);
      return;
    }

    // 3. Check if user tapped a Portal Gate
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

    // 4. Check if user tapped a Landmark
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
      pathQueueRef.current = findWalkablePath(
        posRef.current.x,
        posRef.current.y,
        clickX,
        clickY,
        currentMapRef.current
      );
      pendingLandmarkRef.current = null;
      pendingPortalRef.current = null;
      pendingSecretRef.current = null;
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

    const TILE_PX_W = ((92 - 8) / (TILE_GRID_SIZE - 1) / 100) * W;
    const TILE_PX_H = ((93 - 14) / (TILE_GRID_SIZE - 1) / 100) * H;

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
      const labelY = lm.y > 84 ? y - 34 : y + 26;
      const badgeY = lm.y > 84 ? labelY - 28 + floatY : y - 56 + floatY;

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

      ctx.fillStyle = isNear ? '#d97b84' : 'rgba(255, 253, 249, 0.95)';
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

    const drawSecretProp = (
      prop: SecretPropItem,
      isFound: boolean,
      isNear: boolean
    ) => {
      const sx = Math.round((prop.x / 100) * W);
      const sy = Math.round((prop.y / 100) * H);
      const bob = Math.sin(tick * 0.09 + prop.x) * 3;

      ctx.save();
      ctx.fillStyle = isFound
        ? 'rgba(107, 144, 113, 0.25)'
        : 'rgba(255, 232, 163, 0.45)';
      ctx.beginPath();
      ctx.arc(sx, sy + 4, isNear ? 24 : 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isFound ? '#6b9071' : '#d4af37';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy + 4, (isNear ? 24 : 18) + Math.sin(tick * 0.12) * 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = isFound ? '#edf3ee' : '#fffdf9';
      ctx.fillRect(sx - 18, sy - 18 + bob, 36, 28);
      ctx.strokeStyle = isFound ? '#6b9071' : '#d4af37';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx - 18, sy - 18 + bob, 36, 28);

      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(prop.icon, sx, sy + 2 + bob);

      if (!isFound) {
        ctx.fillStyle = tick % 24 < 12 ? '#d97b84' : '#d4af37';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('✦', sx + 16, sy - 18 + bob);
      }
      ctx.restore();
    };

    const render = () => {
      tick++;
      if (portalCooldownRef.current > 0) {
        portalCooldownRef.current--;
      }

      const activeMapId = currentMapRef.current;
      const mapConfig = GARDEN_MAPS[activeMapId];

      // 1. Update Smooth Tile-Grid Movement!
      let dx = dpadDirRef.current.dx;
      let dy = dpadDirRef.current.dy;

      if (keysRef.current['ArrowLeft'] || keysRef.current['a'] || keysRef.current['A']) dx -= 1;
      if (keysRef.current['ArrowRight'] || keysRef.current['d'] || keysRef.current['D']) dx += 1;
      if (keysRef.current['ArrowUp'] || keysRef.current['w'] || keysRef.current['W']) dy -= 1;
      if (keysRef.current['ArrowDown'] || keysRef.current['s'] || keysRef.current['S']) dy += 1;

      const tileStepSpeed = 0.48;
      let isMoving = false;

      if (Math.hypot(dx, dy) > 0.14) {
        pendingLandmarkRef.current = null;
        pendingPortalRef.current = null;
        pendingSecretRef.current = null;

        if (pathQueueRef.current.length > 1) {
          pathQueueRef.current = [pathQueueRef.current[0]];
        }

        if (pathQueueRef.current.length === 0) {
          const currTile = worldToTile(posRef.current.x, posRef.current.y);
          const nextTile = getNextStepTile(
            currTile.col,
            currTile.row,
            dx,
            dy,
            activeMapId
          );
          if (nextTile) {
            pathQueueRef.current = [nextTile];
          }
        }
      }

      if (pathQueueRef.current.length > 0) {
        const targetTile = pathQueueRef.current[0];
        const dist = Math.hypot(
          targetTile.x - posRef.current.x,
          targetTile.y - posRef.current.y
        );

        if (dist > tileStepSpeed) {
          const stepX = ((targetTile.x - posRef.current.x) / dist) * tileStepSpeed;
          const stepY = ((targetTile.y - posRef.current.y) / dist) * tileStepSpeed;
          posRef.current = {
            x: posRef.current.x + stepX,
            y: posRef.current.y + stepY,
          };
          if (Math.abs(stepX) > 0.03) {
            facingDirRef.current = stepX < 0 ? -1 : 1;
          }
          isMoving = true;
        } else {
          posRef.current = { x: targetTile.x, y: targetTile.y };
          currentTileRef.current = targetTile;
          pathQueueRef.current.shift();
          isMoving = pathQueueRef.current.length > 0;

          if (tick - stepSoundCooldownRef.current > 8) {
            soundEngine.playStep();
            stepSoundCooldownRef.current = tick;
          }

          const puffColor =
            activeMapId === 'reception' || activeMapId === 'train'
              ? '#ffe8a3'
              : activeMapId === 'chapel' || activeMapId === 'home'
              ? '#fff6dc'
              : '#ffd6e0';
          footstepsRef.current.push({
            x: (targetTile.x / 100) * W,
            y: (targetTile.y / 100) * H + 2,
            vx: (Math.random() - 0.5) * 0.35,
            vy: -0.22,
            alpha: 0.85,
            size: 5,
            color: puffColor,
          });

          if (pathQueueRef.current.length === 0 && Math.hypot(dx, dy) > 0.14) {
            const chained = getNextStepTile(
              targetTile.col,
              targetTile.row,
              dx,
              dy,
              activeMapId
            );
            if (chained) {
              pathQueueRef.current.push(chained);
              isMoving = true;
            }
          }

          if (pathQueueRef.current.length === 0) {
            if (pendingPortalRef.current) {
              const p = pendingPortalRef.current;
              pendingPortalRef.current = null;
              travelToMap(p.targetMap, p.spawnX, p.spawnY);
            } else if (pendingSecretRef.current) {
              const s = pendingSecretRef.current;
              pendingSecretRef.current = null;
              activateSecretProp(s);
            } else if (pendingLandmarkRef.current) {
              const lm = pendingLandmarkRef.current;
              pendingLandmarkRef.current = null;
              activateLandmark(lm);
            }
          }
        }
      }

      if (isMoving) {
        trailRef.current.unshift({ x: posRef.current.x, y: posRef.current.y });
        if (trailRef.current.length > 28) trailRef.current.pop();
      } else {
        currentTileRef.current = worldToTile(posRef.current.x, posRef.current.y);
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

      if (
        closestPortal &&
        minPortalDist < 5.2 &&
        portalCooldownRef.current === 0 &&
        Math.hypot(dx, dy) > 0.14
      ) {
        travelToMap(
          closestPortal.targetMap,
          closestPortal.spawnX,
          closestPortal.spawnY
        );
      }

      // Check proximity to Secret Props on current map
      let closestSecret: SecretPropItem | null = null;
      let minSecretDist = 11.5;
      for (const s of WORLD_SECRET_PROPS) {
        if (s.mapId !== activeMapId) continue;
        const d = Math.hypot(posRef.current.x - s.x, posRef.current.y - s.y);
        if (d < minSecretDist) {
          minSecretDist = d;
          closestSecret = s;
        }
      }
      setNearbySecret((prev) => (prev?.id !== closestSecret?.id ? closestSecret : prev));

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
              text: fillCoupleText(closestLandmark.storySnippet, config),
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

      // 3. Draw Tile-Grid Stepping Stones (`▢ → ▢ → ▢`) & Current Standing Tile Highlight!
      const standTile = currentTileRef.current;
      const stx = (standTile.x / 100) * W;
      const sty = (standTile.y / 100) * H;
      ctx.save();
      ctx.strokeStyle = 'rgba(197, 155, 109, 0.42)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(
        Math.round(stx - TILE_PX_W / 2 + 2),
        Math.round(sty - TILE_PX_H / 2 + 2),
        Math.round(TILE_PX_W - 4),
        Math.round(TILE_PX_H - 4)
      );

      if (pathQueueRef.current.length > 0) {
        pathQueueRef.current.forEach((tile, idx) => {
          const tx = (tile.x / 100) * W;
          const ty = (tile.y / 100) * H;
          const isFinal = idx === pathQueueRef.current.length - 1;

          ctx.fillStyle = isFinal
            ? 'rgba(217, 123, 132, 0.34)'
            : 'rgba(255, 253, 249, 0.38)';
          ctx.fillRect(
            Math.round(tx - TILE_PX_W / 2 + 3),
            Math.round(ty - TILE_PX_H / 2 + 3),
            Math.round(TILE_PX_W - 6),
            Math.round(TILE_PX_H - 6)
          );

          ctx.strokeStyle = isFinal
            ? '#d97b84'
            : 'rgba(217, 123, 132, 0.72)';
          ctx.lineWidth = isFinal ? 2.5 : 1.8;
          ctx.strokeRect(
            Math.round(tx - TILE_PX_W / 2 + 3),
            Math.round(ty - TILE_PX_H / 2 + 3),
            Math.round(TILE_PX_W - 6),
            Math.round(TILE_PX_H - 6)
          );

          ctx.fillStyle = '#d97b84';
          if (isFinal) {
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('♥', Math.round(tx), Math.round(ty + 4));
          } else {
            ctx.fillRect(Math.round(tx - 2), Math.round(ty - 2), 4, 4);
          }
        });
      }
      ctx.restore();

      // 4. Draw Sparkling Secret Props on Current Map
      WORLD_SECRET_PROPS.filter((s) => s.mapId === activeMapId).forEach((prop) => {
        drawSecretProp(
          prop,
          !!discoveredSecretsRef.current[prop.id],
          closestSecret?.id === prop.id
        );
      });

      // 5. Draw Landmarks & Portals
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

      // 6. Draw Footstep Surface Puffs
      for (let i = footstepsRef.current.length - 1; i >= 0; i--) {
        const fp = footstepsRef.current[i];
        fp.x += fp.vx;
        fp.y += fp.vy;
        fp.alpha -= 0.035;
        if (fp.alpha <= 0) {
          footstepsRef.current.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, fp.alpha);
        ctx.fillStyle = fp.color;
        ctx.fillRect(Math.round(fp.x), Math.round(fp.y), fp.size, fp.size);
        ctx.restore();
      }

      // 7. Collect All Actors (Guest NPCs + Groom/Bride Hosts + Pet Cat '모찌' + Player) and Y-Depth Sort!
      const GUEST_H = 66;
      const CHIBI_H = 96;
      const guestHeads: { x: number; y: number; name: string; msg: string }[] = [];
      const currentFrameNpcs: ActiveNpcTarget[] = [];

      interface DepthRenderable {
        footY: number;
        draw: () => void;
      }
      const depthList: DepthRenderable[] = [];

      // Helper to render Groom / Bride / Cream / Kkomi as Host NPCs when player is in Guest Protagonist mode ('guest')
      const addHostSpriteNpc = (
        id: string,
        name: string,
        roleTitle: string,
        avatar: 'groom' | 'bride' | 'cream' | 'kkomi' | 'mochi',
        img: HTMLImageElement | null,
        wx: number,
        wy: number,
        spriteH: number,
        msg: string
      ) => {
        const fx = (wx / 100) * W;
        const fy = (wy / 100) * H;
        const bob = Math.sin(tick * 0.07 + wx) * 2.5;

        currentFrameNpcs.push({
          id,
          name,
          roleTitle,
          avatar,
          initialMessage: msg,
          x: wx,
          y: wy,
        });

        guestHeads.push({
          x: fx,
          y: fy - spriteH - bob,
          name,
          msg,
        });

        depthList.push({
          footY: fy,
          draw: () => {
            ctx.fillStyle = 'rgba(59, 47, 47, 0.22)';
            ctx.beginPath();
            ctx.ellipse(fx, fy, spriteH > 60 ? 18 : 13, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            if (img) {
              const w = Math.round((spriteH * img.naturalWidth) / img.naturalHeight);
              ctx.drawImage(
                img,
                Math.round(fx - w / 2),
                Math.round(fy - spriteH - bob),
                w,
                spriteH
              );
            }

            // Host Crown/Heart Nameplate above Groom & Bride
            if (avatar === 'groom' || avatar === 'bride') {
              const badgeText =
                avatar === 'groom'
                  ? `🤵 신랑 ${config.groom.name}`
                  : `👰 신부 ${config.bride.name}`;
              ctx.font = 'bold 13px "Gowun Batang", sans-serif';
              const tw = ctx.measureText(badgeText).width + 16;
              const ty = Math.round(fy - spriteH - bob - 26);
              ctx.fillStyle = '#fffdf9';
              ctx.fillRect(fx - tw / 2, ty, tw, 21);
              ctx.strokeStyle = '#d97b84';
              ctx.lineWidth = 1.8;
              ctx.strokeRect(fx - tw / 2, ty, tw, 21);
              ctx.fillStyle = '#3b2f2f';
              ctx.textAlign = 'center';
              ctx.fillText(badgeText, fx, ty + 15);
            }
          },
        });
      };

      // When in Guest Protagonist mode, place Groom, Bride, and Dogs (Cream & Kkomi) as welcoming hosts!
      if (walkModeRef.current === 'guest') {
        if (activeMapId === 'home') {
          addHostSpriteNpc(
            'companion-cream-home',
            '크림 (엄마)',
            '든든한 엄마 비숑 · 화동 대장',
            'cream',
            assetsRef.current.dogCream,
            34,
            66,
            48,
            '멍멍! 오늘 결혼식 잘 다녀와요~ 웨딩 가든에서 먼저 기다릴게요! 🐾'
          );
          addHostSpriteNpc(
            'companion-kkomi-home',
            '꼬미 (딸)',
            '애교쟁이 딸 비숑 · 반지 전달수',
            'kkomi',
            assetsRef.current.dogKkomi,
            63,
            66,
            42,
            '앙앙! 엄마랑 같이 예쁜 리본 매고 결혼식장으로 출발해요! 🎀'
          );
        } else if (activeMapId === 'garden') {
          addHostSpriteNpc(
            'host-groom-garden',
            `신랑 ${config.groom.name}`,
            '웨딩 가든 호스트 · 신랑',
            'groom',
            assetsRef.current.groom,
            50,
            61,
            CHIBI_H,
            '어서 오세요! 멀리서부터 귀한 걸음 해주셔서 정말 감사합니다 ♥'
          );
          addHostSpriteNpc(
            'companion-cream',
            '크림 (엄마)',
            '든든한 엄마 비숑 · 화동 대장',
            'cream',
            assetsRef.current.dogCream,
            37,
            62,
            48,
            `멍멍~ ${config.groom.name} 아빠와 ${config.bride.name} 엄마의 결혼식에 오신 걸 환영해요! 🐾`
          );
          addHostSpriteNpc(
            'companion-kkomi',
            '꼬미 (딸)',
            '애교쟁이 딸 비숑 · 반지 전달수',
            'kkomi',
            assetsRef.current.dogKkomi,
            62,
            62,
            42,
            '왕왕! 저랑 엄마 크림이도 오늘 화동으로 출동했어요! 쓰담쓰담 해주세요 ♥'
          );
        } else if (activeMapId === 'bridal') {
          addHostSpriteNpc(
            'host-bride-bridal',
            `신부 ${config.bride.name}`,
            '신부 대기실 주인공 · 신부',
            'bride',
            assetsRef.current.bride,
            50,
            36,
            CHIBI_H,
            '대기실까지 찾아와주셔서 너무 반가워요! 우리 꽃벽 앞에서 사진 찍어요 💐'
          );
        } else if (activeMapId === 'chapel') {
          addHostSpriteNpc(
            'host-groom-chapel',
            `신랑 ${config.groom.name}`,
            '본식 채플 단상 · 신랑',
            'groom',
            assetsRef.current.groom,
            45,
            24,
            CHIBI_H,
            '오늘 이 자리에서 평생의 봄날을 약속합니다 💍'
          );
          addHostSpriteNpc(
            'host-bride-chapel',
            `신부 ${config.bride.name}`,
            '본식 채플 단상 · 신부',
            'bride',
            assetsRef.current.bride,
            55,
            24,
            CHIBI_H,
            '따뜻한 축복 속에서 새로운 시작을 함께해 주셔서 감사해요 🌸'
          );
        } else if (activeMapId === 'reception') {
          addHostSpriteNpc(
            'host-groom-reception',
            `신랑 ${config.groom.name}`,
            '별빛 연회장 · 신랑',
            'groom',
            assetsRef.current.groom,
            45,
            38,
            CHIBI_H,
            '맛있는 식사와 함께 즐거운 저녁 시간 보내세요! 건배! 🥂'
          );
          addHostSpriteNpc(
            'host-bride-reception',
            `신부 ${config.bride.name}`,
            '별빛 연회장 · 신부',
            'bride',
            assetsRef.current.bride,
            55,
            38,
            CHIBI_H,
            '소원나무에 남겨주신 방명록 하나하나 소중히 읽을게요 ♥'
          );
          addHostSpriteNpc(
            'companion-cream-reception',
            '크림 (엄마)',
            '든든한 엄마 비숑 · 화동 대장',
            'cream',
            assetsRef.current.dogCream,
            35,
            40,
            46,
            '멍멍! 연회장 수제 마카롱에서 맛있는 냄새가 나요! 🧁🐾'
          );
          addHostSpriteNpc(
            'companion-kkomi-reception',
            '꼬미 (딸)',
            '애교쟁이 딸 비숑 · 반지 전달수',
            'kkomi',
            assetsRef.current.dogKkomi,
            65,
            40,
            40,
            '앙앙! 별빛 가든에서 엄마 크림이랑 신나게 뛰어놀아요! ✨'
          );
        }
      }

      // Guest NPCs across maps
      if (activeMapId === 'chapel') {
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
          const npcName = guestbook[idx]?.name || `하객 ${idx + 1}`;
          const npcMsg = fillCoupleText(guestbook[idx]?.message || spot.cheer, config);

          currentFrameNpcs.push({
            id: `chapel-npc-${idx}`,
            name: npcName,
            roleTitle: '본식 채플 축복 하객',
            avatar: spot.avatar,
            initialMessage: npcMsg,
            x: spot.x,
            y: spot.y,
          });

          guestHeads.push({
            x: fx,
            y: fy - h - cheerJump,
            name: npcName,
            msg: npcMsg,
          });

          depthList.push({
            footY: fy,
            draw: () => {
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
                ctx.drawImage(
                  img,
                  Math.round(fx - w / 2),
                  Math.round(fy - h - cheerJump),
                  w,
                  h
                );
                ctx.restore();
              }
            },
          });
        });
      } else if (
        activeMapId === 'garden' ||
        activeMapId === 'reception' ||
        activeMapId === 'neighborhood' ||
        activeMapId === 'station' ||
        activeMapId === 'train' ||
        activeMapId === 'bridal'
      ) {
        const npcSpots =
          activeMapId === 'garden'
            ? [
                { x: 36, y: 47 },
                { x: 64, y: 47 },
                { x: 63, y: 61 },
              ]
            : activeMapId === 'reception'
            ? [
                { x: 28, y: 34 },
                { x: 72, y: 34 },
                { x: 35, y: 56 },
                { x: 65, y: 56 },
              ]
            : activeMapId === 'neighborhood'
            ? [
                { x: 24, y: 36 },
                { x: 65, y: 34 },
              ]
            : activeMapId === 'station'
            ? [
                { x: 42, y: 42 },
                { x: 68, y: 42 },
              ]
            : activeMapId === 'train'
            ? [
                { x: 40, y: 48 },
                { x: 60, y: 48 },
              ]
            : [
                { x: 34, y: 58 },
                { x: 66, y: 58 },
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

          currentFrameNpcs.push({
            id: `guest-npc-${activeMapId}-${g.id}`,
            name: g.name,
            roleTitle: g.titleBadge || '결혼식 동행 하객',
            avatar: g.avatar,
            initialMessage: fillCoupleText(g.message, config),
            x: spot.x,
            y: spot.y,
          });

          guestHeads.push({
            x: fx,
            y: fy - h - bob,
            name: g.name,
            msg: fillCoupleText(g.message, config),
          });

          depthList.push({
            footY: fy,
            draw: () => {
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
                ctx.drawImage(
                  img,
                  Math.round(fx - w / 2),
                  Math.round(fy - h - bob),
                  w,
                  h
                );
                ctx.restore();
              }
            },
          });
        });
      }

      // Render Controlled Player Character(s): either Guest Protagonist ('guest') OR Groom & Bride Couple ('couple')
      const walkBob = isMoving
        ? Math.abs(Math.sin(tick * 0.26)) * 5.2
        : Math.sin(tick * 0.06) * 1.5;
      const strideTilt = isMoving ? Math.sin(tick * 0.26) * 0.038 : 0;

      const playerFootX = (posRef.current.x / 100) * W;
      const playerFootY = (posRef.current.y / 100) * H;
      const activeAura = equippedAuraRef.current;

      if (walkModeRef.current === 'guest') {
        liveNpcsRef.current = currentFrameNpcs;

        depthList.push({
          footY: playerFootY,
          draw: () => {
            const avatarId = guestAvatarRef.current;
            const guestImg =
              assetsRef.current.guests[avatarId] || assetsRef.current.guests.mage;
            const playerH = avatarId === 'cat' ? 56 : 82;

            // Ground Aura Layer
            if (activeAura === 'lantern_aura') {
              ctx.save();
              ctx.strokeStyle = 'rgba(212, 175, 55, 0.75)';
              ctx.lineWidth = 2.5;
              ctx.setLineDash([8, 5]);
              ctx.beginPath();
              ctx.ellipse(
                playerFootX,
                playerFootY - 2,
                38 + Math.sin(tick * 0.08) * 3,
                16,
                0,
                0,
                Math.PI * 2
              );
              ctx.stroke();
              ctx.restore();
            }

            ctx.fillStyle = 'rgba(59, 47, 47, 0.24)';
            ctx.beginPath();
            ctx.ellipse(playerFootX, playerFootY, 18, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            if (guestImg) {
              const w = Math.round(
                (playerH * guestImg.naturalWidth) / guestImg.naturalHeight
              );
              ctx.save();
              ctx.translate(playerFootX, playerFootY - playerH / 2 - walkBob);
              ctx.scale(facingDirRef.current, 1);
              ctx.rotate(strideTilt);
              ctx.drawImage(
                guestImg,
                Math.round(-w / 2),
                Math.round(-playerH / 2),
                w,
                playerH
              );
              ctx.restore();
            }

            if (activeAura === 'petal_aura') {
              ctx.save();
              ctx.font = 'bold 14px sans-serif';
              ctx.textAlign = 'center';
              for (let i = 0; i < 4; i++) {
                const ang = tick * 0.06 + (i * Math.PI) / 2;
                const px = playerFootX + Math.cos(ang) * 36;
                const py = playerFootY - 40 + Math.sin(ang) * 18;
                ctx.fillText('🌸', px, py);
              }
              ctx.restore();
            }

            if (activeAura === 'wedding_crown') {
              ctx.save();
              ctx.font = 'bold 15px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('👑', playerFootX, playerFootY - playerH - 6 - walkBob);
              ctx.restore();
            }

            // Guest Protagonist Overhead Nameplate
            const label = `🎒 ${guestNicknameRef.current}`;
            ctx.font = 'bold 13px "Gowun Batang", sans-serif';
            const tagW = Math.max(92, ctx.measureText(label).width + 18);
            const tagY = playerFootY - playerH - 32 - walkBob;
            ctx.fillStyle = 'rgba(255, 253, 249, 0.95)';
            ctx.fillRect(playerFootX - tagW / 2, tagY, tagW, 22);
            ctx.strokeStyle = '#c59b6d';
            ctx.lineWidth = 1.8;
            ctx.strokeRect(playerFootX - tagW / 2, tagY, tagW, 22);
            ctx.fillStyle = '#3b2f2f';
            ctx.textAlign = 'center';
            ctx.fillText(label, playerFootX, tagY + 15);
          },
        });
      } else {
        // Couple Walk Mode ('couple')
        const groomFootX = playerFootX;
        const groomFootY = playerFootY;

        const brideTrail =
          trailRef.current[Math.min(7, trailRef.current.length - 1)] || posRef.current;
        const creamTrail =
          trailRef.current[Math.min(15, trailRef.current.length - 1)] || posRef.current;
        const kkomiTrail =
          trailRef.current[Math.min(22, trailRef.current.length - 1)] || posRef.current;

        const brideFootX = (brideTrail.x / 100) * W + 42;
        const brideFootY = (brideTrail.y / 100) * H + 2;

        const creamFootX = (creamTrail.x / 100) * W - 38;
        const creamFootY = (creamTrail.y / 100) * H + 6;

        const kkomiFootX = (kkomiTrail.x / 100) * W - 74;
        const kkomiFootY = (kkomiTrail.y / 100) * H + 9;

        currentFrameNpcs.push(
          {
            id: 'companion-cream',
            name: '크림 (엄마)',
            roleTitle: '든든한 엄마 비숑 · 화동 대장',
            avatar: 'cream',
            initialMessage: `멍멍~ ${config.groom.name} 아빠와 ${config.bride.name} 엄마의 결혼식에 오신 걸 환영해요! 🐾`,
            x: (creamFootX / W) * 100,
            y: (creamFootY / H) * 100,
          },
          {
            id: 'companion-kkomi',
            name: '꼬미 (딸)',
            roleTitle: '애교쟁이 딸 비숑 · 반지 전달수',
            avatar: 'kkomi',
            initialMessage: '앙앙! 엄마 크림이랑 같이 신랑·신부 뒤를 졸졸 따라가요! 🎀',
            x: (kkomiFootX / W) * 100,
            y: (kkomiFootY / H) * 100,
          }
        );
        liveNpcsRef.current = currentFrameNpcs;

        // Draw Mother Dog '크림'
        depthList.push({
          footY: creamFootY,
          draw: () => {
            ctx.fillStyle = 'rgba(59, 47, 47, 0.22)';
            ctx.beginPath();
            ctx.ellipse(creamFootX, creamFootY, 14, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            const creamImg = assetsRef.current.dogCream || assetsRef.current.cat;
            if (creamImg) {
              const dogH = 48;
              const dogW = Math.round(
                (dogH * creamImg.naturalWidth) / creamImg.naturalHeight
              );
              ctx.save();
              ctx.translate(creamFootX, creamFootY - dogH / 2 - walkBob * 0.8);
              ctx.scale(facingDirRef.current, 1);
              ctx.rotate(strideTilt * 0.8);
              ctx.drawImage(
                creamImg,
                Math.round(-dogW / 2),
                Math.round(-dogH / 2),
                dogW,
                dogH
              );
              ctx.restore();
            }
          },
        });

        // Draw Daughter Dog '꼬미'
        depthList.push({
          footY: kkomiFootY,
          draw: () => {
            ctx.fillStyle = 'rgba(59, 47, 47, 0.2)';
            ctx.beginPath();
            ctx.ellipse(kkomiFootX, kkomiFootY, 12, 4.5, 0, 0, Math.PI * 2);
            ctx.fill();

            const kkomiImg = assetsRef.current.dogKkomi || assetsRef.current.cat;
            if (kkomiImg) {
              const dogH = 42;
              const dogW = Math.round(
                (dogH * kkomiImg.naturalWidth) / kkomiImg.naturalHeight
              );
              ctx.save();
              ctx.translate(kkomiFootX, kkomiFootY - dogH / 2 - walkBob * 0.9);
              ctx.scale(facingDirRef.current, 1);
              ctx.rotate(-strideTilt * 0.85);
              ctx.drawImage(
                kkomiImg,
                Math.round(-dogW / 2),
                Math.round(-dogH / 2),
                dogW,
                dogH
              );
              ctx.restore();
            }
          },
        });

        depthList.push({
          footY: Math.max(groomFootY, brideFootY),
          draw: () => {
            const centerCoupleX = (groomFootX - 6 + brideFootX) / 2;
            const centerCoupleY = (groomFootY + brideFootY) / 2;

            if (activeAura === 'lantern_aura') {
              ctx.save();
              ctx.strokeStyle = 'rgba(212, 175, 55, 0.75)';
              ctx.lineWidth = 2.5;
              ctx.setLineDash([8, 5]);
              ctx.beginPath();
              ctx.ellipse(
                centerCoupleX,
                centerCoupleY - 2,
                54 + Math.sin(tick * 0.08) * 3,
                20,
                0,
                0,
                Math.PI * 2
              );
              ctx.stroke();
              ctx.restore();
            }

            ctx.fillStyle = 'rgba(59, 47, 47, 0.22)';
            ctx.beginPath();
            ctx.ellipse(groomFootX - 6, groomFootY, 16, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(brideFootX, brideFootY, 24, 7, 0, 0, Math.PI * 2);
            ctx.fill();

            const drawChibiDirectional = (
              img: HTMLImageElement,
              footX: number,
              footY: number,
              bob: number,
              tilt: number
            ) => {
              const w = Math.round((CHIBI_H * img.naturalWidth) / img.naturalHeight);
              ctx.save();
              ctx.translate(footX, footY - CHIBI_H / 2 - bob);
              ctx.scale(facingDirRef.current, 1);
              ctx.rotate(tilt);
              ctx.drawImage(
                img,
                Math.round(-w / 2),
                Math.round(-CHIBI_H / 2),
                w,
                CHIBI_H
              );
              ctx.restore();
            };

            if (assetsRef.current.groom) {
              drawChibiDirectional(
                assetsRef.current.groom,
                groomFootX - 6,
                groomFootY,
                walkBob,
                strideTilt
              );
            }
            if (assetsRef.current.bride) {
              drawChibiDirectional(
                assetsRef.current.bride,
                brideFootX,
                brideFootY,
                walkBob * 0.9,
                -strideTilt * 0.85
              );
            }

            if (activeAura === 'petal_aura') {
              ctx.save();
              ctx.font = 'bold 14px sans-serif';
              ctx.textAlign = 'center';
              for (let i = 0; i < 4; i++) {
                const ang = tick * 0.06 + (i * Math.PI) / 2;
                const px = centerCoupleX + Math.cos(ang) * 48;
                const py = centerCoupleY - 46 + Math.sin(ang) * 22;
                ctx.fillText('🌸', px, py);
              }
              ctx.restore();
            }

            if (activeAura === 'wedding_crown') {
              ctx.save();
              ctx.font = 'bold 15px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('👑', groomFootX - 6, groomFootY - CHIBI_H - 6 - walkBob);
              ctx.fillText('👑', brideFootX, brideFootY - CHIBI_H - 6 - walkBob * 0.9);
              ctx.restore();
            }

            ctx.fillStyle = '#d97b84';
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
              '♥',
              Math.round(centerCoupleX),
              Math.round(
                groomFootY - CHIBI_H - 4 - walkBob + Math.sin(tick * 0.1) * 2
              )
            );

            const tagY = groomFootY - CHIBI_H - 36 - walkBob;
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
          },
        });
      }

      depthList.sort((a, b) => a.footY - b.footY);
      depthList.forEach((actor) => actor.draw());

      // 8. Speech bubble above the active speaker NPC
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

      // 9. Live Floating Emoji Reactions
      for (let i = reactionsRef.current.length - 1; i >= 0; i--) {
        const r = reactionsRef.current[i];
        r.x += r.vx;
        r.y += r.vy;
        r.alpha -= 0.016;
        if (r.alpha <= 0) {
          reactionsRef.current.splice(i, 1);
          continue;
        }
        const rx = (r.x / 100) * W;
        const ry = (r.y / 100) * H;
        ctx.save();
        ctx.globalAlpha = Math.max(0, r.alpha);
        ctx.font = `bold ${Math.round(24 * r.scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(r.emoji, rx, ry);
        ctx.restore();
      }

      // 10. Map-Specific Ambient Particles
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
    activateSecretProp,
    travelToMap,
  ]);

  const handleJoystickVectorChange = useCallback((dx: number, dy: number) => {
    dpadDirRef.current = { dx, dy };
  }, []);

  // Evaluate Zone Mini-Quest completion for current map
  const isMiniQuestStepDone = (step: ZoneMiniQuestItem): boolean => {
    if (step.id === 'mq-home-invite') return !!visitedQuests.story;
    if (step.id === 'mq-home-mirror') return !!visitedMemories['home-mirror'];
    if (step.id === 'mq-home-door') return !!visitedMaps.neighborhood;
    if (step.id === 'mq-nb-flower') return !!visitedMemories['neighborhood-flower'];
    if (step.id === 'mq-nb-cafe') return !!visitedMemories['neighborhood-cafe'];
    if (step.id === 'mq-nb-station') return !!visitedMaps.station;
    if (step.id === 'mq-st-route') return !!visitedQuests.location;
    if (step.id === 'mq-st-secret') return !!discoveredSecrets['secret-station-ticket'];
    if (step.id === 'mq-st-board') return !!visitedMaps.train;
    if (step.id === 'mq-tr-view') return !!visitedQuests.gallery;
    if (step.id === 'mq-tr-quiz') return !!visitedQuests.minigame;
    if (step.id === 'mq-tr-arrive') return !!visitedMaps.garden;
    if (step.id === 'mq-garden-groom') return talkedToAnyNpc;
    if (step.id === 'mq-garden-bridal') return !!visitedMaps.bridal;
    if (step.id === 'mq-garden-secret') return !!discoveredSecrets['secret-garden-mailbox'];
    if (step.id === 'mq-bridal-greet') return talkedToAnyNpc;
    if (step.id === 'mq-bridal-photo') return !!visitedMemories['bridal-bride-photo'];
    if (step.id === 'mq-bridal-secret') return !!discoveredSecrets['secret-bridal-tiara'];
    if (step.id === 'mq-chapel-piano') return !!visitedMemories['chapel-piano'];
    if (step.id === 'mq-chapel-altar')
      return !!(visitedQuests.ceremony || visitedMemories['chapel-altar']);
    if (step.id === 'mq-chapel-secret')
      return !!discoveredSecrets['secret-chapel-sheetmusic'];
    if (step.id === 'mq-memory-spring') return !!visitedMemories['memory-spring'];
    if (step.id === 'mq-memory-winter') return !!visitedMemories['memory-winter'];
    if (step.id === 'mq-memory-secret')
      return !!discoveredSecrets['secret-memory-receipt'];
    if (step.id === 'mq-reception-cake') return !!visitedMemories['reception-cake'];
    if (step.id === 'mq-reception-tree') return !!visitedQuests.rsvp;
    if (step.id === 'mq-reception-secret')
      return !!discoveredSecrets['secret-reception-macaron'];
    return false;
  };

  const handleMiniQuestClick = (step: ZoneMiniQuestItem) => {
    soundEngine.playBlip(680);
    pathQueueRef.current = findWalkablePath(
      posRef.current.x,
      posRef.current.y,
      step.targetX,
      step.targetY,
      currentMapRef.current
    );
  };

  const activeMapConfig = GARDEN_MAPS[currentMapId];
  const activeMiniQuest = ZONE_MINI_QUESTS[currentMapId];
  const exploredMapCount = Object.values(visitedMaps).filter(Boolean).length;
  const discoveredCount = Object.keys(discoveredSecrets).length;
  const stageMaps =
    activeMapConfig.stage === 'commute' ? COMMUTE_MAP_ORDER : VENUE_MAP_ORDER;

  const resolveDialoguePortrait = (
    avatar: AvatarClassId | 'cream' | 'kkomi' | 'mochi' | 'groom' | 'bride'
  ): string => {
    if (avatar === 'cream' || avatar === 'mochi') return PIXEL_ASSETS.dogCreamSprite;
    if (avatar === 'kkomi') return PIXEL_ASSETS.dogKkomiSprite;
    if (avatar === 'groom') return PIXEL_ASSETS.groomPortrait;
    if (avatar === 'bride') return PIXEL_ASSETS.bridePortrait;
    return GUEST_SPRITES[avatar].portrait;
  };

  const allMapsOrder: GardenMapId[] = [...COMMUTE_MAP_ORDER, ...VENUE_MAP_ORDER];
  const completedMiniQuestCount = activeMiniQuest.steps.filter((s) =>
    isMiniQuestStepDone(s)
  ).length;

  return (
    <div className="flex flex-col gap-1.5">
      {/* ULTRA-SLIM 1-ROW WORLD HUD BAR: Map Drawer + 9-Map Strip + Utility Icons */}
      <div className="pixel-card px-2 py-1.5 bg-[#fffdf9] flex items-center justify-between gap-1.5 font-sans">
        {/* Left: World Map & Mission Drawer Trigger */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playSelect();
            setShowWorldMapSheet(true);
          }}
          className="px-2.5 py-1 rounded-lg bg-[#3b2f2f] hover:bg-[#2a2020] text-[#fffdf9] text-[11px] font-bold flex items-center gap-1 shrink-0 shadow-xs"
        >
          <span>🗺️ 전체맵</span>
          <span className="text-[#e6d5b8] text-[10px]">{exploredMapCount}/9</span>
        </button>

        {/* Center: 1-Line Horizontal Scrollable 9-Map Quick Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar min-w-0 flex-1 py-0.5">
          {allMapsOrder.map((mapId) => {
            const m = GARDEN_MAPS[mapId];
            const isActive = currentMapId === mapId;
            const isVisited = visitedMaps[mapId];
            return (
              <button
                key={mapId}
                type="button"
                onClick={() => {
                  if (currentMapId !== mapId) {
                    travelToMap(mapId);
                  }
                }}
                className={`px-2 py-1 rounded-full border text-[10px] shrink-0 flex items-center gap-1 transition-all ${
                  isActive
                    ? 'bg-[#d97b84] text-white border-[#b85d67] font-bold shadow-xs'
                    : isVisited
                    ? 'bg-[#faf5ec] text-[#3b2f2f] border-[#c59b6d] font-semibold'
                    : 'bg-[#fcfaf5] text-[#8c7a70] border-[#e2d4c0]'
                }`}
              >
                <span className="leading-none">{m.icon}</span>
                <span>{m.tabLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Compact Character / Secret / Photo Booth Icon Pills */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.playSelect();
              setShowAvatarPicker(true);
            }}
            title="하객 캐릭터 & 산책 모드 변경"
            className="px-2 py-1 rounded-full bg-[#fcf0f1] hover:bg-[#f9dfe2] border border-[#d97b84] text-[#b85d67] text-[10px] font-bold flex items-center gap-0.5"
          >
            <span>🪞</span>
            <span className="hidden sm:inline">캐릭터</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSelect();
              setShowSecretBook(true);
            }}
            title="반짝이는 비밀 소품 도감"
            className="px-2 py-1 rounded-full bg-[#faf5ec] hover:bg-[#f3e9d8] border border-[#c59b6d] text-[#5c4d47] text-[10px] font-bold flex items-center gap-0.5"
          >
            <Sparkles className="w-3 h-3 text-[#d97b84]" />
            <span>{discoveredCount}/9</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSelect();
              setShowPhotoBooth(true);
            }}
            title="웨딩 폴라로이드 포토부스"
            className="px-2 py-1 rounded-full bg-[#fcf0f1] hover:bg-[#f9dfe2] border border-[#e2a3a9] text-[#b85d67] text-[10px] font-bold flex items-center gap-0.5"
          >
            <Camera className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 1:1 EXPANDED GAME CANVAS FRAME (Primary Visual Centerpiece) */}
      <div className="relative pixel-card overflow-hidden bg-[#bdd2b6] shadow-md">
        {/* Top Translucent HUD Overlay: Map Badge + Mission Drawer Trigger + Walk Mode Toggle */}
        <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between gap-1.5 pointer-events-none font-sans">
          <div className="flex items-center gap-1 min-w-0">
            <button
              type="button"
              onClick={() => {
                soundEngine.playSelect();
                setShowWorldMapSheet(true);
              }}
              className="pointer-events-auto bg-[#fffdf9]/90 backdrop-blur-xs hover:bg-[#fffdf9] border border-[#d4b48c] px-2.5 py-1 rounded-full text-[11px] text-[#3b2f2f] font-bold flex items-center gap-1.5 shadow-xs truncate"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-[#d97b84] animate-pulse shrink-0" />
              <span>
                {activeMapConfig.icon} {activeMapConfig.tabLabel}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#faf5ec] text-[#c59b6d] border border-[#e6d5b8]">
                미션 {completedMiniQuestCount}/{activeMiniQuest.steps.length} ▾
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSelect();
              setWalkMode((m) => (m === 'guest' ? 'couple' : 'guest'));
            }}
            className="pointer-events-auto bg-[#fffdf9]/90 backdrop-blur-xs hover:bg-[#fcf0f1] border border-[#d4b48c] px-2.5 py-1 rounded-full text-[10px] font-bold text-[#3b2f2f] shadow-xs shrink-0"
          >
            {walkMode === 'guest' ? '👫 커플 산책' : '🎒 하객 모드'}
          </button>
        </div>

        {/* Story / Secret Toast Overlay when visiting special spots */}
        {activeStoryToast && !activeDialogueNpc && (
          <div className="absolute top-11 left-2.5 right-2.5 z-10 bg-[#fffdf9]/95 backdrop-blur-xs border-2 border-[#d97b84] rounded-xl px-3 py-2 shadow-md flex items-center justify-between gap-2 animate-fadeIn">
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

        {/* Interactive 3-Choice NPC / Groom / Bride / Pet Cat '모찌' Dialogue Overlay */}
        {activeDialogueNpc && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-2.5 bottom-2.5 z-20 bg-[#fffdf9]/95 backdrop-blur-xs border-2 border-[#c59b6d] rounded-2xl p-3 shadow-xl space-y-2 animate-fadeIn font-sans"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={resolveDialoguePortrait(activeDialogueNpc.avatar)}
                  alt={activeDialogueNpc.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#d97b84] bg-[#faf5ec] shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#3b2f2f] truncate">
                      {activeDialogueNpc.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#fcf0f1] text-[#d97b84] font-bold">
                      {
                        getAffinityStageLabel(
                          npcAffinities[activeDialogueNpc.id] || 1
                        ).hearts
                      }{' '}
                      {
                        getAffinityStageLabel(
                          npcAffinities[activeDialogueNpc.id] || 1
                        ).label
                      }
                    </span>
                  </div>
                  <div className="text-[10px] text-[#8c7a70] truncate">
                    {activeDialogueNpc.roleTitle}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {(activeDialogueNpc.avatar === 'bride' ||
                  activeDialogueNpc.avatar === 'groom') && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDialogueNpc(null);
                      setShowPhotoBooth(true);
                    }}
                    className="px-2 py-1 rounded-full bg-[#d97b84] text-white text-[10px] font-bold flex items-center gap-1"
                  >
                    <Camera className="w-3 h-3" />
                    <span>기념촬영</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveDialogueNpc(null)}
                  className="p-1 rounded-full bg-[#faf5ec] hover:bg-[#f3e9d8] text-[#7d6e65]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-[#faf5ec] border border-[#e6d5b8] rounded-xl px-3 py-2 text-xs text-[#3b2f2f] font-serif leading-relaxed">
              {dialogueReplyText}
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {NPC_DIALOGUE_CHOICES.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleSelectDialogueChoice(ch.id)}
                  className="py-1.5 px-2 rounded-lg bg-[#fffdf9] hover:bg-[#fcf0f1] border border-[#d4b48c] hover:border-[#d97b84] text-[11px] font-bold text-[#3b2f2f] truncate active:scale-95 transition-all"
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          onPointerDown={handleCanvasPointerDown}
          className={`w-full aspect-square block cursor-pointer pixelated touch-none transition-opacity duration-200 ${
            mapTransitionFade ? 'opacity-40' : 'opacity-100'
          }`}
        />
      </div>

      {/* COMPACT STICKY CONSOLE DOCK: Joystick + Action CTA + 1-Line Spot Quick-Chips */}
      <div className="sticky bottom-1.5 z-30 pixel-card bg-[#fffdf9] border-2 border-[#c59b6d] px-3 py-2 shadow-lg rounded-2xl space-y-1.5 font-sans">
        <div className="flex items-center justify-between gap-2.5">
          {/* Left: Wedding Compass Virtual Joystick */}
          <div className="flex items-center shrink-0">
            <InGameVirtualJoystick onVectorChange={handleJoystickVectorChange} />
          </div>

          {/* Right: Live Emoji Reactions + Contextual Portal/Secret/Landmark Action Dock */}
          <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
            {/* Upper Row: Live Blessing Emoji Reactions + NPC Talk Button */}
            <div className="flex items-center justify-between gap-1 bg-[#faf5ec] px-2.5 py-1 rounded-full border border-[#e6d5b8]">
              <button
                type="button"
                onClick={() => {
                  const target =
                    liveNpcsRef.current[0] || {
                      id: 'companion-cream',
                      name: '크림 (엄마)',
                      roleTitle: '든든한 엄마 비숑 · 화동 대장',
                      avatar: 'cream' as const,
                      initialMessage:
                        `멍멍~ ${config.groom.name} 아빠와 ${config.bride.name} 엄마의 결혼식에 오신 걸 환영해요! 🐾`,
                      x: posRef.current.x,
                      y: posRef.current.y,
                    };
                  openNpcDialogue(target);
                }}
                className="text-[10px] font-bold text-[#b85d67] hover:text-[#d97b84] flex items-center gap-1 shrink-0"
              >
                <MessageCircle className="w-3 h-3" />
                <span>대화·축복 ♥{blessingCount}</span>
              </button>
              <div className="flex items-center gap-1">
                {REACTION_EMOJIS.map((item) => (
                  <button
                    key={item.emoji}
                    type="button"
                    onClick={() => spawnFloatingReaction(item.emoji)}
                    title={`${item.label} 축복 보내기`}
                    className="w-5.5 h-5.5 rounded-full bg-[#fffdf9] hover:bg-[#fcf0f1] active:scale-90 border border-[#e2d4c0] flex items-center justify-center text-[11px] transition-transform"
                  >
                    {item.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Lower Row: Contextual Portal / Secret Prop / Landmark Prompt OR Recommended Course & Invitation */}
            {nearbyPortal ? (
              <button
                type="button"
                onClick={() =>
                  travelToMap(
                    nearbyPortal.targetMap,
                    nearbyPortal.spawnX,
                    nearbyPortal.spawnY
                  )
                }
                className="w-full bg-[#3b2f2f] hover:bg-[#2a2020] text-[#fffdf9] border border-[#c59b6d] rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 shadow-xs active:scale-95 transition-all"
              >
                <div className="min-w-0 text-left">
                  <div className="text-[9px] text-[#e6d5b8] font-bold tracking-wider">
                    PORTAL · 다음 맵 이동
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    {nearbyPortal.label}
                  </div>
                </div>
                <span className="px-2 py-1 rounded-lg bg-[#d97b84] text-white text-[11px] font-bold shrink-0">
                  입장 ▶
                </span>
              </button>
            ) : nearbySecret && !discoveredSecrets[nearbySecret.id] ? (
              <button
                type="button"
                onClick={() => activateSecretProp(nearbySecret)}
                className="w-full bg-[#fff8e7] hover:bg-[#faefd4] text-[#3b2f2f] border-2 border-[#d4af37] rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 shadow-xs active:scale-95 transition-all"
              >
                <div className="min-w-0 text-left">
                  <div className="text-[9px] text-[#b8860b] font-bold tracking-wider truncate">
                    ✦ 반짝이는 비밀 소품 발견!
                  </div>
                  <div className="text-xs font-bold text-[#3b2f2f] truncate">
                    {nearbySecret.icon} {nearbySecret.title}
                  </div>
                </div>
                <span className="px-2 py-1 rounded-lg bg-[#d4af37] text-white text-[11px] font-bold shrink-0">
                  열기 ✦
                </span>
              </button>
            ) : nearbyLandmark ? (
              <button
                type="button"
                onClick={() => activateLandmark(nearbyLandmark)}
                className="w-full bg-[#fcf0f1] hover:bg-[#f9dfe2] text-[#3b2f2f] border border-[#d97b84] rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 shadow-xs active:scale-95 transition-all"
              >
                <div className="min-w-0 text-left">
                  <div className="text-[9px] text-[#b85d67] font-bold tracking-wider truncate">
                    {nearbyLandmark.badge} · {nearbyLandmark.npcName}
                  </div>
                  <div className="text-xs font-bold text-[#3b2f2f] truncate">
                    {nearbyLandmark.name}
                  </div>
                </div>
                <span className="px-2 py-1 rounded-lg bg-[#d97b84] text-white text-[11px] font-bold shrink-0">
                  {nearbyLandmark.questId ? '열기 ▶' : '체험 ✨'}
                </span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={handleGuideNextSpot}
                  className="py-1.5 px-2 rounded-xl bg-[#faf5ec] hover:bg-[#f3e9d8] border border-[#c59b6d] text-[#3b2f2f] text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
                >
                  <Compass className="w-3.5 h-3.5 text-[#d97b84] shrink-0" />
                  <span className="truncate">추천코스</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playSelect();
                    onOpenQuest('story');
                  }}
                  className="py-1.5 px-2 rounded-xl bg-[#d97b84] hover:bg-[#c56871] border border-[#b85d67] text-white text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform shadow-xs"
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">초대장 열기</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Ultra-Slim 1-Line Spot & Portal Quick-Jump Strip */}
        <div className="pt-1 border-t border-[#efe6d8] flex items-center gap-1 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-[#8c7a70] shrink-0 mr-0.5">
            {activeMapConfig.icon} 스팟:
          </span>
          {activeMapConfig.landmarks.map((lm) => {
            const done = lm.questId
              ? !!visitedQuests[lm.questId]
              : !!visitedMemories[lm.id];
            return (
              <button
                key={lm.id}
                type="button"
                onClick={() => walkToLandmark(lm)}
                className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold shrink-0 flex items-center gap-1 transition-all ${
                  done
                    ? 'bg-[#edf3ee] text-[#4d6b53] border-[#a3bfa8]'
                    : 'bg-[#faf5ec] text-[#4a3b32] border-[#e2d4c0] hover:border-[#c59b6d]'
                }`}
              >
                <span>{lm.name.split(' ')[0]}</span>
                <span>{lm.shortName}</span>
              </button>
            );
          })}
          {activeMapConfig.portals.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => walkToPortal(p)}
              className="px-2 py-0.5 rounded-full border border-[#d97b84] bg-[#fcf3f3] hover:bg-[#f9e5e7] text-[#3b2f2f] text-[10px] font-bold shrink-0 flex items-center gap-1 transition-all"
            >
              <span>{p.label}</span>
              <span className="text-[#d97b84]">▶</span>
            </button>
          ))}
        </div>
      </div>

      {/* WORLD MAP, MISSION & SPOT QUICK-JUMP DRAWER MODAL */}
      {showWorldMapSheet && (
        <div
          onClick={() => setShowWorldMapSheet(false)}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 font-sans"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="pixel-card w-full max-w-[440px] bg-[#fffdf9] overflow-hidden animate-fadeIn"
          >
            <div className="p-3.5 bg-[#faf5ec] border-b border-[#e6d5b8] flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-[#c59b6d] tracking-wider">
                  WEDDING WORLD MAP ({exploredMapCount}/9 MAPS)
                </div>
                <h3 className="text-sm font-bold text-[#3b2f2f] font-serif">
                  🗺️ 웨딩 여정 전체 맵 & 미션 안내
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWorldMapSheet(false)}
                className="px-2.5 py-1 rounded-full bg-[#fffdf9] border border-[#d4b48c] text-xs font-bold text-[#5c4d47]"
              >
                닫기 ✕
              </button>
            </div>

            <div className="p-3.5 space-y-3.5 max-h-[75vh] overflow-y-auto">
              {/* Stage 1: Commute Maps */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-[#3b2f2f] flex items-center justify-between">
                  <span>🏠 1막. 설레는 출발·이동길 (4맵)</span>
                  <span className="text-[10px] text-[#8c7a70] font-normal">
                    터치 시 해당 맵으로 즉시 이동
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {COMMUTE_MAP_ORDER.map((mapId) => {
                    const m = GARDEN_MAPS[mapId];
                    const isActive = currentMapId === mapId;
                    const isVisited = visitedMaps[mapId];
                    return (
                      <button
                        key={mapId}
                        type="button"
                        onClick={() => {
                          setShowWorldMapSheet(false);
                          if (currentMapId !== mapId) travelToMap(mapId);
                        }}
                        className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                          isActive
                            ? 'bg-[#d97b84] text-white border-[#b85d67] font-bold shadow-xs'
                            : isVisited
                            ? 'bg-[#faf5ec] text-[#3b2f2f] border-[#c59b6d] font-semibold'
                            : 'bg-[#fcfaf5] text-[#7d6e65] border-[#e2d4c0]'
                        }`}
                      >
                        <span className="text-base">{m.icon}</span>
                        <span className="text-[11px] truncate w-full">{m.tabLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stage 2: Venue Maps */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-[#3b2f2f]">
                  🏛️ 2막. 웨딩홀 도착·본식·피로연 (5맵)
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {VENUE_MAP_ORDER.map((mapId) => {
                    const m = GARDEN_MAPS[mapId];
                    const isActive = currentMapId === mapId;
                    const isVisited = visitedMaps[mapId];
                    return (
                      <button
                        key={mapId}
                        type="button"
                        onClick={() => {
                          setShowWorldMapSheet(false);
                          if (currentMapId !== mapId) travelToMap(mapId);
                        }}
                        className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                          isActive
                            ? 'bg-[#d97b84] text-white border-[#b85d67] font-bold shadow-xs'
                            : isVisited
                            ? 'bg-[#faf5ec] text-[#3b2f2f] border-[#c59b6d] font-semibold'
                            : 'bg-[#fcfaf5] text-[#7d6e65] border-[#e2d4c0]'
                        }`}
                      >
                        <span className="text-base">{m.icon}</span>
                        <span className="text-[10px] truncate w-full">{m.tabLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current Map Mini-Quest Checklist */}
              <div className="p-3 rounded-xl bg-[#faf5ec] border border-[#e6d5b8] space-y-2">
                <div className="text-xs font-bold text-[#3b2f2f]">
                  🎯 {activeMiniQuest.title} ({completedMiniQuestCount}/
                  {activeMiniQuest.steps.length})
                </div>
                <div className="space-y-1.5">
                  {activeMiniQuest.steps.map((step) => {
                    const done = isMiniQuestStepDone(step);
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => {
                          setShowWorldMapSheet(false);
                          handleMiniQuestClick(step);
                        }}
                        className={`w-full px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all ${
                          done
                            ? 'bg-[#edf3ee] text-[#4d6b53] border-[#a3bfa8]'
                            : 'bg-[#fffdf9] text-[#3b2f2f] border-[#e2d4c0] hover:border-[#c59b6d]'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{done ? '✓' : step.icon}</span>
                          <span>{step.label}</span>
                        </span>
                        <span className="text-[10px] text-[#d97b84] font-bold">
                          {done ? '완료' : '이동하기 ▶'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guest Protagonist Avatar & Walk Mode Selector Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 font-sans">
          <div className="pixel-card w-full max-w-[440px] bg-[#fffdf9] overflow-hidden animate-fadeIn">
            <div className="p-3.5 bg-[#faf5ec] border-b border-[#e6d5b8] flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-[#c59b6d] tracking-wider">
                  CHARACTER & WALK MODE
                </div>
                <h3 className="text-sm font-bold text-[#3b2f2f] font-serif">
                  🪞 하객 캐릭터 스타일링 & 산책 모드 선택
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarPicker(false)}
                className="px-2.5 py-1 rounded-full bg-[#fffdf9] border border-[#d4b48c] text-xs font-bold text-[#5c4d47]"
              >
                닫기 ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Walk Mode Switch */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playSelect();
                    setWalkMode('guest');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    walkMode === 'guest'
                      ? 'bg-[#d97b84] text-white border-[#b85d67] font-bold shadow-xs'
                      : 'bg-[#faf5ec] text-[#3b2f2f] border-[#e2d4c0]'
                  }`}
                >
                  <div className="text-xs font-bold">🎒 하객 주인공 모드 (기본)</div>
                  <div className="text-[10px] opacity-85 mt-0.5">
                    집에서 출발해 웨딩홀의 신랑·신부를 만나러 갑니다
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playSelect();
                    setWalkMode('couple');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    walkMode === 'couple'
                      ? 'bg-[#d97b84] text-white border-[#b85d67] font-bold shadow-xs'
                      : 'bg-[#faf5ec] text-[#3b2f2f] border-[#e2d4c0]'
                  }`}
                >
                  <div className="text-xs font-bold">👫 신랑·신부 & 크림·꼬미 산책</div>
                  <div className="text-[10px] opacity-85 mt-0.5">
                    신랑·신부와 반려견 크림(엄마)·꼬미(딸)가 함께 산책합니다
                  </div>
                </button>
              </div>

              {/* Nickname Input */}
              <div className="bg-[#faf5ec] p-3 rounded-xl border border-[#e6d5b8] space-y-1.5">
                <label className="block text-[11px] font-bold text-[#3b2f2f]">
                  하객 캐릭터 머리 위 닉네임
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={guestNickname}
                  onChange={(e) => setGuestNickname(e.target.value)}
                  placeholder="예: 축복의 하객, 지훈"
                  className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded-lg px-3 py-1.5 text-xs text-[#3b2f2f]"
                />
              </div>

              {/* 6 Chibi Guest Avatars */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-[#3b2f2f]">
                  나만의 하객 캐릭터 아바타 선택 (6종)
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {AVATAR_CLASSES.map((cls) => {
                    const selected = guestAvatar === cls.id;
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playCoin();
                          setGuestAvatar(cls.id);
                          setWalkMode('guest');
                        }}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                          selected
                            ? 'bg-[#fcf0f1] border-2 border-[#d97b84] shadow-xs scale-[1.02]'
                            : 'bg-[#faf5ec] border-[#e2d4c0] hover:border-[#c59b6d]'
                        }`}
                      >
                        <img
                          src={GUEST_SPRITES[cls.id].sprite}
                          alt={cls.name}
                          className="w-12 h-12 object-contain pixelated"
                        />
                        <span className="text-[11px] font-bold text-[#3b2f2f] truncate w-full text-center">
                          {cls.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playFanfare();
                  setVisitedMemories((prev) => ({ ...prev, 'home-mirror': true }));
                  setShowAvatarPicker(false);
                }}
                className="w-full py-2.5 rounded-xl bg-[#3b2f2f] text-white text-xs font-bold shadow-sm"
              >
                이 모습으로 웨딩 여정 출발하기 ✨
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secret Prop Collection Book & Aura Equip Modal */}
      {showSecretBook && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
          <div className="pixel-card w-full max-w-[480px] max-h-[88vh] bg-[#f7f2e9] flex flex-col overflow-hidden animate-fadeIn font-sans">
            <div className="p-3.5 bg-[#fffdf9] border-b border-[#e6d5b8] flex items-center justify-between">
              <div>
                <div className="text-[10px] tracking-widest font-bold text-[#c59b6d]">
                  WORLD SECRET ARCHIVE · {discoveredCount}/9 발견
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#3b2f2f] font-serif">
                  ✨ 웨딩 월드 비밀 소품 도감 & 오라 장착
                </h3>
              </div>
              <button
                onClick={() => setShowSecretBook(false)}
                className="px-2.5 py-1 rounded-full bg-[#faf5ec] border border-[#d4b48c] text-xs font-bold text-[#5c4d47]"
              >
                닫기 ✕
              </button>
            </div>

            <div className="p-3.5 overflow-y-auto flex-1 space-y-4">
              {/* Equipable Aura Rewards */}
              <div className="bg-[#fffdf9] p-3 rounded-xl border border-[#e6d5b8] space-y-2">
                <div className="text-xs font-bold text-[#3b2f2f]">
                  👑 캐릭터 코스메틱 오라 장착 (발견 수에 따라 해금)
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playSelect();
                      setEquippedAura('none');
                    }}
                    className={`p-2 rounded-lg border text-left text-xs font-bold ${
                      equippedAura === 'none'
                        ? 'bg-[#3b2f2f] text-white border-[#3b2f2f]'
                        : 'bg-[#faf5ec] text-[#5c4d47] border-[#e2d4c0]'
                    }`}
                  >
                    기본 모습 (오라 해제)
                  </button>

                  {SECRET_AURA_REWARDS.map((reward) => {
                    const unlocked = discoveredCount >= reward.requiredCount;
                    const active = equippedAura === reward.id;
                    return (
                      <button
                        key={reward.id}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => {
                          if (!unlocked) return;
                          soundEngine.playFanfare();
                          setEquippedAura(reward.id);
                        }}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          active
                            ? 'bg-[#d97b84] text-white border-[#b85d67] font-bold'
                            : unlocked
                            ? 'bg-[#faf5ec] text-[#3b2f2f] border-[#c59b6d] hover:bg-[#f3e9d8] font-semibold'
                            : 'bg-[#f5efe6] text-[#b0a298] border-[#e2d4c0] opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="text-xs truncate">{reward.name}</div>
                        <div className="text-[10px] opacity-85 truncate">
                          {unlocked
                            ? '장착 가능'
                            : `비밀 ${reward.requiredCount}개 발견 필요`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 9 Secret Props List */}
              <div className="space-y-2">
                {WORLD_SECRET_PROPS.map((prop) => {
                  const found = !!discoveredSecrets[prop.id];
                  const mapMeta = GARDEN_MAPS[prop.mapId];
                  return (
                    <div
                      key={prop.id}
                      className={`p-3 rounded-xl border flex items-start justify-between gap-2.5 ${
                        found
                          ? 'bg-[#fffdf9] border-[#c59b6d]'
                          : 'bg-[#faf5ec] border-[#e2d4c0]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-[#c59b6d]">
                          {mapMeta.icon} {mapMeta.tabLabel} ·{' '}
                          {found ? '✓ 발견 완료' : '미발견 힌트'}
                        </div>
                        <div className="text-xs font-bold text-[#3b2f2f] mt-0.5">
                          {prop.icon} {found ? prop.title : '??? (반짝이는 소품)'}
                        </div>
                        <p className="text-[11px] text-[#6e5d53] mt-1 leading-relaxed font-serif">
                          {found ? fillCoupleText(prop.storyText, config) : `힌트: ${prop.clueLabel}`}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowSecretBook(false);
                          if (currentMapRef.current !== prop.mapId) {
                            travelToMap(prop.mapId, prop.x, Math.min(90, prop.y + 6));
                          } else {
                            walkToSecretProp(prop);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#fcf0f1] hover:bg-[#f9dfe2] border border-[#e2a3a9] text-[#b85d67] text-[10px] font-bold shrink-0"
                      >
                        찾아가기 ▶
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {showPhotoBooth && (
        <PhotoBoothModal
          config={config}
          onClose={() => setShowPhotoBooth(false)}
          onUnlockTitle={onUnlockTitle}
        />
      )}
    </div>
  );
};
