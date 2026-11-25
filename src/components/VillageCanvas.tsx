import React, { useEffect, useRef, useState, useCallback, Suspense } from 'react';
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
import {
  PIXEL_ASSETS,
  PIXEL_SPRITE_SHEETS,
  GUEST_SPRITES,
  MAP_ASSET_BY_ID,
} from './PixelSprites';
import {
  SpriteFacing,
  CharacterActionKind,
  CharacterActionState,
  resolveFacingFromDelta,
  resolveFacingToward,
  getWalkFrameCol,
  createCharacterAction,
  getActionForReactionEmoji,
  drawCharacterSprite,
} from '../utils/spriteAnimator';
import { soundEngine } from '../utils/soundEngine';
import { fillCoupleText } from '../utils/coupleText';
import { fireCelebrationConfetti, prefersReducedMotion } from '../utils/motion';
import { showToast } from '../utils/toast';
import { useEscapeKey } from '../utils/useEscapeKey';
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
import { InGameVirtualJoystick } from './InGameVirtualJoystick';
import {
  WorldMapSheetModal,
  AvatarPickerModal,
  SecretArchiveModal,
} from './WorldModals';

const PhotoBoothModal = React.lazy(() =>
  import('./sections/PhotoBoothModal').then((m) => ({ default: m.PhotoBoothModal }))
);

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
const STORAGE_VISITED_MAPS_KEY = 'pixel_wedding_quest_visited_maps_v1';
const STORAGE_VISITED_MEMORIES_KEY = 'pixel_wedding_quest_visited_memories_v1';
const STORAGE_DONE_MISSIONS_KEY = 'pixel_wedding_quest_done_missions_v1';
const STORAGE_WORLD_COMPLETE_KEY = 'pixel_wedding_quest_world_complete_v1';

export type WalkMode = 'guest' | 'couple';

const STORAGE_WALK_HINT_KEY = 'pixel_wedding_quest_walk_hint_seen_v1';

const DEFAULT_VISITED_MAPS: Record<GardenMapId, boolean> = {
  home: true,
  neighborhood: false,
  station: false,
  train: false,
  garden: false,
  bridal: false,
  chapel: false,
  memory: false,
  reception: false,
};

interface OffscreenPortalIndicator {
  portal: MapPortal;
  leftPct: number;
  topPct: number;
  arrow: string;
  shortLabel: string;
}

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
  const [visitedMaps, setVisitedMaps] = useState<Record<GardenMapId, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_VISITED_MAPS_KEY);
      if (saved) {
        return { ...DEFAULT_VISITED_MAPS, ...JSON.parse(saved), home: true };
      }
    } catch {
      // ignore
    }
    return { ...DEFAULT_VISITED_MAPS };
  });
  const [visitedMemories, setVisitedMemories] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_VISITED_MEMORIES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });
  const [completedZoneMissions, setCompletedZoneMissions] = useState<
    Partial<Record<GardenMapId, boolean>>
  >(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DONE_MISSIONS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_VISITED_MAPS_KEY, JSON.stringify(visitedMaps));
    } catch {
      // ignore
    }
  }, [visitedMaps]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_VISITED_MEMORIES_KEY, JSON.stringify(visitedMemories));
    } catch {
      // ignore
    }
  }, [visitedMemories]);
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_DONE_MISSIONS_KEY,
        JSON.stringify(completedZoneMissions)
      );
    } catch {
      // ignore
    }
  }, [completedZoneMissions]);

  const [mapTransitionFade, setMapTransitionFade] = useState<boolean>(false);
  const [arrivalBanner, setArrivalBanner] = useState<{
    icon: string;
    title: string;
    subtitle: string;
  } | null>(null);
  const arrivalTimerRef = useRef<number | null>(null);
  const mapChipRefs = useRef<Partial<Record<GardenMapId, HTMLButtonElement | null>>>({});
  const tapRippleRef = useRef<{ x: number; y: number; life: number } | null>(null);
  const ambientNpcIdRef = useRef<string | null>(null);
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
  const [typedDialogueText, setTypedDialogueText] = useState<string>('');
  const [activeWalkTargetId, setActiveWalkTargetId] = useState<string | null>(null);
  const [secretRadarNear, setSecretRadarNear] = useState<boolean>(false);

  // Escape key closes open NPC dialogue or story toast
  useEscapeKey(Boolean(activeDialogueNpc || activeStoryToast), () => {
    if (activeDialogueNpc) {
      setActiveDialogueNpc(null);
    } else if (activeStoryToast) {
      setActiveStoryToast(null);
    }
  });

  // Gentle RPG Typewriter effect for NPC dialogue text
  useEffect(() => {
    if (!activeDialogueNpc || !dialogueReplyText) {
      setTypedDialogueText('');
      return;
    }
    if (prefersReducedMotion()) {
      setTypedDialogueText(dialogueReplyText);
      return;
    }
    setTypedDialogueText('');
    let idx = 0;
    const timer = window.setInterval(() => {
      idx += 2;
      if (idx >= dialogueReplyText.length) {
        setTypedDialogueText(dialogueReplyText);
        window.clearInterval(timer);
      } else {
        setTypedDialogueText(dialogueReplyText.slice(0, idx));
      }
    }, 24);
    return () => window.clearInterval(timer);
  }, [activeDialogueNpc, dialogueReplyText]);

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
  const playerFacingRef = useRef<SpriteFacing>('down');
  const walkPhaseRef = useRef<number>(0);
  const playerActionRef = useRef<CharacterActionState | null>(null);
  const companionActionsRef = useRef<{
    bride: CharacterActionState | null;
    cream: CharacterActionState | null;
    kkomi: CharacterActionState | null;
  }>({ bride: null, cream: null, kkomi: null });
  const npcActionRef = useRef<{ npcId: string; action: CharacterActionState } | null>(null);
  const selfActionCycleRef = useRef<number>(0);
  const activeDialogueNpcRef = useRef<ActiveNpcTarget | null>(null);
  useEffect(() => {
    activeDialogueNpcRef.current = activeDialogueNpc;
  }, [activeDialogueNpc]);

  const triggerPlayerAction = useCallback((kind: CharacterActionKind) => {
    const now = performance.now();
    playerActionRef.current = createCharacterAction(kind, now, 0);
    companionActionsRef.current = {
      bride: createCharacterAction(kind, now, 70),
      cream: createCharacterAction(kind, now, 130),
      kkomi: createCharacterAction(kind, now, 190),
    };
  }, []);
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
  const [ambientNpc, setAmbientNpc] = useState<ActiveNpcTarget | null>(null);
  const npcBubbleIndexRef = useRef<number>(0);
  const [offscreenPortals, setOffscreenPortals] = useState<OffscreenPortalIndicator[]>([]);
  const offscreenPortalSigRef = useRef<string>('');
  const [showWalkHint, setShowWalkHint] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_WALK_HINT_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const dismissWalkHint = useCallback(() => {
    setShowWalkHint((prev) => {
      if (!prev) return false;
      try {
        localStorage.setItem(STORAGE_WALK_HINT_KEY, '1');
      } catch {
        // ignore
      }
      return false;
    });
  }, []);

  // Follow Camera State: 1024x1024 world viewed through a 660x660 (1.55x zoom) smooth follow viewport
  const [cameraZoomMode, setCameraZoomMode] = useState<'follow' | 'overview'>('follow');
  const cameraZoomModeRef = useRef<'follow' | 'overview'>('follow');
  useEffect(() => {
    cameraZoomModeRef.current = cameraZoomMode;
  }, [cameraZoomMode]);
  const cameraRef = useRef<{ x: number; y: number; viewW: number; viewH: number }>({
    x: Math.max(0, Math.min(1024 - 660, (48 / 100) * 1024 - 660 / 2)),
    y: Math.max(0, Math.min(1024 - 660, (70 / 100) * 1024 - 660 / 2)),
    viewW: 660,
    viewH: 660,
  });
  const snapCameraRef = useRef<boolean>(true);

  // Preload all 9 Map Backgrounds + Chibi Character Sprites + 3x4 Animated Sprite Sheets + Bichon Dogs
  const assetsRef = useRef<{
    maps: Partial<Record<GardenMapId, HTMLImageElement>>;
    groom: HTMLImageElement | null;
    bride: HTMLImageElement | null;
    dogCream: HTMLImageElement | null;
    dogKkomi: HTMLImageElement | null;
    cat: HTMLImageElement | null;
    guests: Partial<Record<AvatarClassId, HTMLImageElement>>;
    sheets: {
      groom: HTMLImageElement | null;
      bride: HTMLImageElement | null;
      dogCream: HTMLImageElement | null;
      dogKkomi: HTMLImageElement | null;
      guests: Partial<Record<AvatarClassId, HTMLImageElement>>;
    };
  }>({
    maps: {},
    groom: null,
    bride: null,
    dogCream: null,
    dogKkomi: null,
    cat: null,
    guests: {},
    sheets: {
      groom: null,
      bride: null,
      dogCream: null,
      dogKkomi: null,
      guests: {},
    },
  });

  const ensureMapAssetLoaded = useCallback((mapId: GardenMapId) => {
    if (assetsRef.current.maps[mapId]) return;
    const img = new Image();
    img.src = MAP_ASSET_BY_ID[mapId];
    img.onload = () => {
      assetsRef.current.maps[mapId] = img;
    };
  }, []);

  useEffect(() => {
    const loadImg = (src: string, onLoad: (img: HTMLImageElement) => void) => {
      const img = new Image();
      img.src = src;
      img.onload = () => onLoad(img);
    };
    // Priority 1: Static Fallback Sprites + Core Animated Sheets + Starting Maps
    loadImg(PIXEL_ASSETS.groomSprite, (img) => (assetsRef.current.groom = img));
    loadImg(PIXEL_ASSETS.brideSprite, (img) => (assetsRef.current.bride = img));
    loadImg(PIXEL_ASSETS.dogCreamSprite, (img) => (assetsRef.current.dogCream = img));
    loadImg(PIXEL_ASSETS.dogKkomiSprite, (img) => (assetsRef.current.dogKkomi = img));
    loadImg(PIXEL_ASSETS.catSprite, (img) => (assetsRef.current.cat = img));
    (Object.keys(GUEST_SPRITES) as AvatarClassId[]).forEach((id) =>
      loadImg(GUEST_SPRITES[id].sprite, (img) => (assetsRef.current.guests[id] = img))
    );

    // 3x4 4-Direction + Walk + Action Sprite Sheets
    loadImg(PIXEL_SPRITE_SHEETS.groom, (img) => (assetsRef.current.sheets.groom = img));
    loadImg(PIXEL_SPRITE_SHEETS.bride, (img) => (assetsRef.current.sheets.bride = img));
    loadImg(PIXEL_SPRITE_SHEETS.dogCream, (img) => (assetsRef.current.sheets.dogCream = img));
    loadImg(PIXEL_SPRITE_SHEETS.dogKkomi, (img) => (assetsRef.current.sheets.dogKkomi = img));
    (Object.keys(PIXEL_SPRITE_SHEETS.guests) as AvatarClassId[]).forEach((id) => {
      const sheetUrl = PIXEL_SPRITE_SHEETS.guests[id];
      if (sheetUrl) {
        loadImg(sheetUrl, (img) => (assetsRef.current.sheets.guests[id] = img));
      }
    });
    ensureMapAssetLoaded('home');
    ensureMapAssetLoaded('neighborhood');
    ensureMapAssetLoaded('garden');

    // Priority 2: Background preload remaining maps after initial paint settles
    const deferredTimer = window.setTimeout(() => {
      (
        ['station', 'train', 'bridal', 'chapel', 'memory', 'reception'] as GardenMapId[]
      ).forEach((mId) => ensureMapAssetLoaded(mId));
    }, 1000);

    return () => window.clearTimeout(deferredTimer);
  }, [ensureMapAssetLoaded]);

  // Ensure current map and its portal destinations are always loaded
  useEffect(() => {
    ensureMapAssetLoaded(currentMapId);
    GARDEN_MAPS[currentMapId].portals.forEach((p) =>
      ensureMapAssetLoaded(p.targetMap)
    );
  }, [currentMapId, ensureMapAssetLoaded]);

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
        if (!customOrigin) {
          triggerPlayerAction(getActionForReactionEmoji(emoji));
        }
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
    [triggerPlayerAction]
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
      triggerPlayerAction('cheer');
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
          fireCelebrationConfetti({
            particleCount: 40,
            spread: 65,
            origin: { y: 0.6 },
            colors: ['#e899a0', '#d4af7a', '#fffdf9'],
          });
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
      snapCameraRef.current = true;
      setAmbientNpc(null);
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
      setActiveWalkTargetId(null);
      setSecretRadarNear(false);
      tapRippleRef.current = null;

      // Show RPG-style area arrival banner briefly
      if (arrivalTimerRef.current !== null) {
        window.clearTimeout(arrivalTimerRef.current);
      }
      setArrivalBanner({
        icon: destConfig.icon,
        title: destConfig.title,
        subtitle: destConfig.subtitle,
      });
      arrivalTimerRef.current = window.setTimeout(() => {
        setArrivalBanner(null);
        arrivalTimerRef.current = null;
      }, 1900);
    },
    []
  );

  // Auto-center active map pill in top 9-map strip on map change
  useEffect(() => {
    const chip = mapChipRefs.current[currentMapId];
    if (chip) {
      chip.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [currentMapId]);

  useEffect(() => {
    return () => {
      if (arrivalTimerRef.current !== null) {
        window.clearTimeout(arrivalTimerRef.current);
      }
    };
  }, []);

  // Trigger a landmark's special interaction or open its linked invitation modal
  const activateLandmark = useCallback(
    (landmark: MapLandmark) => {
      triggerPlayerAction('wave');
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
          fireCelebrationConfetti({
            particleCount: 45,
            spread: 68,
            origin: { y: 0.58 },
            colors: ['#e899a0', '#d4af7a', '#fffdf9'],
          });
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
    const syncAmbientSpeaker = (advance: boolean) => {
      const npcs = liveNpcsRef.current;
      if (!npcs || npcs.length === 0) {
        setAmbientNpc(null);
        return;
      }
      if (advance) {
        npcBubbleIndexRef.current += 1;
      }
      const next = npcs[npcBubbleIndexRef.current % npcs.length];
      setAmbientNpc(next || null);
    };

    const initTimer = window.setTimeout(() => syncAmbientSpeaker(false), 350);
    const timer = window.setInterval(() => syncAmbientSpeaker(true), 4200);
    return () => {
      window.clearTimeout(initTimer);
      window.clearInterval(timer);
    };
  }, [currentMapId, walkMode]);

  useEffect(() => {
    const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
    const MOVE_KEYS = new Set([
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'w',
      'a',
      's',
      'd',
      'W',
      'A',
      'S',
      'D',
    ]);

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (ARROW_KEYS.has(e.key)) {
        e.preventDefault();
      }
      if (MOVE_KEYS.has(e.key)) {
        dismissWalkHint();
        setActiveDialogueNpc(null);
        setActiveWalkTargetId(null);
      }

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
        } else if (e.key === ' ') {
          e.preventDefault();
          const cycle: CharacterActionKind[] = ['wave', 'cheer', 'pose', 'spin'];
          const nextKind = cycle[selfActionCycleRef.current % cycle.length];
          selfActionCycleRef.current += 1;
          soundEngine.playBlip(680);
          triggerPlayerAction(nextKind);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };
    const handleWindowBlur = () => {
      keysRef.current = {};
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [
    nearbyLandmark,
    nearbyPortal,
    nearbySecret,
    activateLandmark,
    activateSecretProp,
    travelToMap,
    dismissWalkHint,
  ]);

  const walkToLandmark = useCallback(
    (lm: MapLandmark) => {
      dismissWalkHint();
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
      setActiveWalkTargetId(lm.id);
      setActiveDialogueNpc(null);
      tapRippleRef.current = { x: goalX, y: goalY, life: 1.0 };
    },
    [dismissWalkHint]
  );

  const walkToPortal = useCallback(
    (portal: MapPortal) => {
      dismissWalkHint();
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
      setActiveWalkTargetId(portal.id);
      setActiveDialogueNpc(null);
      tapRippleRef.current = { x: portal.x, y: portal.y, life: 1.0 };
    },
    [dismissWalkHint]
  );

  const walkToSecretProp = useCallback(
    (prop: SecretPropItem) => {
      dismissWalkHint();
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
      setActiveWalkTargetId(prop.id);
      setActiveDialogueNpc(null);
      tapRippleRef.current = { x: prop.x, y: prop.y, life: 1.0 };
    },
    [dismissWalkHint]
  );

  // Open 3-Choice Dialogue Modal with a Guest NPC, Pet Dog, Groom, or Bride
  const openNpcDialogue = useCallback((npc: ActiveNpcTarget) => {
    soundEngine.playSelect();
    playerFacingRef.current = resolveFacingToward(
      posRef.current.x,
      posRef.current.y,
      npc.x,
      npc.y,
      playerFacingRef.current
    );
    npcActionRef.current = {
      npcId: npc.id,
      action: createCharacterAction('wave', performance.now()),
    };
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

    npcActionRef.current = {
      npcId: activeDialogueNpc.id,
      action: createCharacterAction('cheer', performance.now()),
    };
    triggerPlayerAction('wave');

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
    dismissWalkHint();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width;
    const normY = (e.clientY - rect.top) / rect.height;
    const cam = cameraRef.current;
    const worldPxX = cam.x + normX * cam.viewW;
    const worldPxY = cam.y + normY * cam.viewH;
    const clickX = Math.max(0, Math.min(100, (worldPxX / 1024) * 100));
    const clickY = Math.max(0, Math.min(100, (worldPxY / 1024) * 100));

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
    } else if (
      Math.hypot(clickX - posRef.current.x, clickY - (posRef.current.y - 4)) < 7.5
    ) {
      // Tapping directly on the player character triggers a playful action emote!
      const cycle: CharacterActionKind[] = ['wave', 'cheer', 'pose', 'spin'];
      const nextKind = cycle[selfActionCycleRef.current % cycle.length];
      selfActionCycleRef.current += 1;
      soundEngine.playCoin();
      triggerPlayerAction(nextKind);
      const emojisByAction: Record<CharacterActionKind, string> = {
        wave: '👋',
        cheer: '🎉',
        pose: '💖',
        spin: '✨',
        jump: '✨',
      };
      reactionsRef.current.push({
        id: Date.now() + Math.random(),
        emoji: emojisByAction[nextKind],
        x: posRef.current.x,
        y: posRef.current.y - 10,
        vx: (Math.random() - 0.5) * 0.16,
        vy: -0.45,
        alpha: 1,
        scale: 1.15,
      });
    } else {
      soundEngine.playBlip(560);
      setActiveDialogueNpc(null);
      setActiveWalkTargetId(null);
      tapRippleRef.current = { x: clickX, y: clickY, life: 1.0 };
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

    const W = 1024;
    const H = 1024;
    const FOLLOW_VIEW_W = 660;
    const CANVAS_LOGICAL = 660;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(CANVAS_LOGICAL * dpr);
    canvas.height = Math.round(CANVAS_LOGICAL * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const drawRoundedPill = (
      rx: number,
      ry: number,
      rw: number,
      rh: number,
      radius: number
    ) => {
      const r = Math.min(radius, rw / 2, rh / 2);
      ctx.beginPath();
      ctx.moveTo(rx + r, ry);
      ctx.arcTo(rx + rw, ry, rx + rw, ry + rh, r);
      ctx.arcTo(rx + rw, ry + rh, rx, ry + rh, r);
      ctx.arcTo(rx, ry + rh, rx, ry, r);
      ctx.arcTo(rx, ry, rx + rw, ry, r);
      ctx.closePath();
    };

    const TILE_PX_W = ((92 - 8) / (TILE_GRID_SIZE - 1) / 100) * W;
    const TILE_PX_H = ((93 - 14) / (TILE_GRID_SIZE - 1) / 100) * H;

    const reducedMotion = prefersReducedMotion();
    const particles: Particle[] = reducedMotion
      ? []
      : Array.from({ length: 34 }, (_, i) => ({
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
      isNear: boolean,
      showFullLabel: boolean
    ) => {
      const x = Math.round(bx);
      const y = Math.round(by);

      if (isNear) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 253, 249, 0.28)';
        ctx.beginPath();
        ctx.arc(x, y, 58, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d97b84';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.arc(x, y, 58 + Math.sin(tick * 0.08) * 3.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        // Subtle ground pin halo so landmarks are clearly discoverable without visual clutter
        ctx.save();
        ctx.fillStyle = isVisited
          ? 'rgba(107, 144, 113, 0.2)'
          : 'rgba(217, 123, 132, 0.18)';
        ctx.beginPath();
        ctx.ellipse(x, y + 6, 22, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const floatY = Math.sin(tick * 0.07 + lm.x) * 3.5;
      const pinRadius = isNear ? 20 : 17;
      const pinY = Math.round(y - 34 + floatY);
      const iconEmoji = lm.name.split(' ')[0] || '♥';

      // Circular Floating Icon Pin
      ctx.save();
      ctx.fillStyle = isVisited
        ? '#6b9071'
        : isNear
        ? '#d97b84'
        : 'rgba(255, 253, 249, 0.96)';
      ctx.beginPath();
      ctx.arc(x, pinY, pinRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isVisited || isNear ? '#fffdf9' : '#c59b6d';
      ctx.lineWidth = 2.4;
      ctx.stroke();

      ctx.fillStyle = isVisited || isNear ? '#fffdf9' : '#d97b84';
      ctx.font = `bold ${isVisited ? 16 : 15}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isVisited ? '✓' : iconEmoji, x, pinY + 1);
      ctx.restore();

      // Show full text pill ONLY when player approaches or targets this landmark (keeps map uncluttered!)
      if (showFullLabel) {
        const label = lm.shortName;
        ctx.save();
        ctx.font = 'bold 14px "Pretendard", "Gowun Batang", sans-serif';
        const textWidth = ctx.measureText(label).width + 22;
        const pillH = 26;
        const labelY = lm.y > 84 ? Math.round(pinY - 40) : Math.round(y + 18);
        const clampedX = Math.max(
          textWidth / 2 + 12,
          Math.min(W - textWidth / 2 - 12, x)
        );

        ctx.fillStyle = isNear ? '#d97b84' : 'rgba(255, 253, 249, 0.96)';
        drawRoundedPill(
          Math.round(clampedX - textWidth / 2),
          labelY,
          Math.round(textWidth),
          pillH,
          13
        );
        ctx.fill();
        ctx.strokeStyle = isNear ? '#fffdf9' : '#c59b6d';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = isNear ? '#fffdf9' : '#3b2f2f';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, clampedX, labelY + pillH / 2 + 0.5);
        ctx.restore();
      }
    };

    const drawPortalGate = (
      portal: MapPortal,
      isNear: boolean,
      showFullLabel: boolean
    ) => {
      const px = Math.round((portal.x / 100) * W);
      const py = Math.round((portal.y / 100) * H);
      const pulse = Math.sin(tick * 0.1) * 3;

      ctx.save();
      ctx.fillStyle = isNear ? 'rgba(217, 123, 132, 0.36)' : 'rgba(255, 245, 225, 0.32)';
      ctx.beginPath();
      ctx.ellipse(px, py + 6, 36 + pulse, 16 + pulse * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isNear ? '#fffdf9' : '#d97b84';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(px, py + 6, 36 + pulse, 16 + pulse * 0.4, 0, 0, Math.PI * 2);
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
      const targetTabLabel = GARDEN_MAPS[portal.targetMap]?.tabLabel || portal.label;
      const text = showFullLabel
        ? `${arrow}${portal.label}${suffix}`
        : `${arrow}${targetTabLabel}${suffix}`;

      ctx.save();
      ctx.font = showFullLabel
        ? 'bold 14px "Pretendard", sans-serif'
        : 'bold 12px "Pretendard", sans-serif';
      const pillW = ctx.measureText(text).width + (showFullLabel ? 24 : 18);
      const pillH = showFullLabel ? 28 : 23;
      const clampedX = Math.max(pillW / 2 + 10, Math.min(W - pillW / 2 - 10, px));
      const pillY = Math.round(py - 28 + Math.sin(tick * 0.08) * 2.5);

      ctx.fillStyle = isNear
        ? '#3b2f2f'
        : showFullLabel
        ? '#d97b84'
        : 'rgba(217, 123, 132, 0.88)';
      drawRoundedPill(
        Math.round(clampedX - pillW / 2),
        pillY,
        Math.round(pillW),
        pillH,
        pillH / 2
      );
      ctx.fill();
      ctx.strokeStyle = '#fffdf9';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fffdf9';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, clampedX, pillY + pillH / 2 + 0.5);
      ctx.restore();
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
        // Always orient character toward joystick/keyboard direction (even if blocked)
        playerFacingRef.current = resolveFacingFromDelta(
          dx,
          dy,
          playerFacingRef.current,
          0.14
        );
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
          playerFacingRef.current = resolveFacingFromDelta(
            stepX,
            stepY,
            playerFacingRef.current,
            0.015
          );
          walkPhaseRef.current += Math.hypot(stepX, stepY) * 0.62;
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
            setActiveWalkTargetId(null);
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

      // Check proximity to Secret Props on current map (+ subtle 30-unit radar cue)
      let closestSecret: SecretPropItem | null = null;
      let minSecretDist = 11.5;
      let hasNearUndiscoveredSecret = false;
      for (const s of WORLD_SECRET_PROPS) {
        if (s.mapId !== activeMapId) continue;
        const d = Math.hypot(posRef.current.x - s.x, posRef.current.y - s.y);
        if (!discoveredSecretsRef.current[s.id] && d < 30) {
          hasNearUndiscoveredSecret = true;
        }
        if (d < minSecretDist) {
          minSecretDist = d;
          closestSecret = s;
        }
      }
      setNearbySecret((prev) => (prev?.id !== closestSecret?.id ? closestSecret : prev));
      setSecretRadarNear((prev) =>
        prev !== hasNearUndiscoveredSecret ? hasNearUndiscoveredSecret : prev
      );

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

      // 2. Smooth Follow Camera Transform (1.55x Follow Zoom OR 1.0x Full Overview)
      const targetViewW =
        cameraZoomModeRef.current === 'overview' ? W : FOLLOW_VIEW_W;
      const targetViewH = targetViewW;
      const cam = cameraRef.current;
      const camLerp = reducedMotion || snapCameraRef.current ? 1 : 0.14;
      cam.viewW += (targetViewW - cam.viewW) * camLerp;
      cam.viewH += (targetViewH - cam.viewH) * camLerp;

      const playerWorldX = (posRef.current.x / 100) * W;
      const playerWorldY = (posRef.current.y / 100) * H;
      const targetCamX = Math.max(
        0,
        Math.min(W - cam.viewW, playerWorldX - cam.viewW / 2)
      );
      const targetCamY = Math.max(
        0,
        Math.min(H - cam.viewH, playerWorldY - cam.viewH / 2)
      );
      cam.x += (targetCamX - cam.x) * camLerp;
      cam.y += (targetCamY - cam.y) * camLerp;
      const didSnapCam = snapCameraRef.current;
      snapCameraRef.current = false;

      // Compute off-screen portal edge indicators while zoomed in (throttled to avoid extra React renders)
      if (didSnapCam || tick % 6 === 0) {
        const nextIndicators: OffscreenPortalIndicator[] = [];
        if (cameraZoomModeRef.current === 'follow' && cam.viewW < W - 40) {
          const marginX = 28;
          const marginTop = 44;
          const marginBottom = 64;
          const camCenterX = cam.x + cam.viewW / 2;
          const camCenterY = cam.y + cam.viewH / 2;

          for (const portal of mapConfig.portals) {
            const px = (portal.x / 100) * W;
            const py = (portal.y / 100) * H;
            const inView =
              px >= cam.x + marginX &&
              px <= cam.x + cam.viewW - marginX &&
              py >= cam.y + marginTop &&
              py <= cam.y + cam.viewH - marginBottom;
            if (inView) continue;

            const dx = px - camCenterX;
            const dy = py - camCenterY;
            const safeHalfW = 40; // 10% .. 90%
            const safeHalfH = 35; // 11% .. 81%
            const scaleX = dx !== 0 ? safeHalfW / Math.abs(dx) : Infinity;
            const scaleY = dy !== 0 ? safeHalfH / Math.abs(dy) : Infinity;
            const t = Math.min(scaleX, scaleY);
            const leftPct = Math.max(11, Math.min(89, Math.round(50 + dx * t)));
            const isTopCenter = leftPct >= 34 && leftPct <= 66;
            const minTopPct = isTopCenter ? 11 : 17;
            const topPct = Math.max(minTopPct, Math.min(81, Math.round(46 + dy * t)));

            const arrow =
              Math.abs(dy) >= Math.abs(dx)
                ? dy > 0
                  ? '▼'
                  : '▲'
                : dx > 0
                ? '▶'
                : '◀';
            const shortLabel = GARDEN_MAPS[portal.targetMap]?.tabLabel || portal.label;
            nextIndicators.push({
              portal,
              leftPct,
              topPct,
              arrow,
              shortLabel,
            });
          }
        }
        const sig = nextIndicators
          .map((item) => `${item.portal.id}:${item.leftPct}:${item.topPct}`)
          .join('|');
        if (sig !== offscreenPortalSigRef.current) {
          offscreenPortalSigRef.current = sig;
          setOffscreenPortals(nextIndicators);
        }
      }

      const camScale = CANVAS_LOGICAL / cam.viewW;
      ctx.setTransform(
        dpr * camScale,
        0,
        0,
        dpr * camScale,
        -cam.x * dpr * camScale,
        -cam.y * dpr * camScale
      );
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw Current Map Background
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
        // Dashed rose-gold walking route from player's feet through remaining A* path
        ctx.save();
        ctx.strokeStyle = 'rgba(217, 123, 132, 0.62)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([7, 7]);
        ctx.beginPath();
        ctx.moveTo((posRef.current.x / 100) * W, (posRef.current.y / 100) * H);
        pathQueueRef.current.forEach((tile) => {
          ctx.lineTo((tile.x / 100) * W, (tile.y / 100) * H);
        });
        ctx.stroke();
        ctx.restore();

        const finalTile = pathQueueRef.current[pathQueueRef.current.length - 1];
        const ftx = (finalTile.x / 100) * W;
        const fty = (finalTile.y / 100) * H;
        const destPulse = Math.sin(tick * 0.16) * 2.5;
        ctx.save();
        ctx.fillStyle = 'rgba(217, 123, 132, 0.24)';
        ctx.beginPath();
        ctx.arc(ftx, fty, 14 + destPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d97b84';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(ftx, fty, 14 + destPulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#d97b84';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♥', ftx, fty + 0.5);
        ctx.restore();
      }

      // Ground Tap Ripple Feedback (when user taps to walk)
      if (tapRippleRef.current) {
        const rip = tapRippleRef.current;
        const rx = (rip.x / 100) * W;
        const ry = (rip.y / 100) * H;
        const progress = 1 - rip.life;
        const outerR = 10 + progress * 34;
        const innerR = 6 + progress * 18;
        ctx.save();
        ctx.globalAlpha = Math.max(0, rip.life * 0.85);
        ctx.strokeStyle = '#d97b84';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(rx, ry, outerR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#c59b6d';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(rx, ry, innerR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        rip.life -= 0.045;
        if (rip.life <= 0) {
          tapRippleRef.current = null;
        }
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

      // 5. Draw Landmarks & Portals (Show full text pill only when nearby or targeted)
      mapConfig.landmarks.forEach((lm) => {
        const bx = (lm.x / 100) * W;
        const by = (lm.y / 100) * H;
        const done = lm.questId
          ? !!visitedQuests[lm.questId]
          : !!visitedMemories[lm.id];
        const distToPlayer = Math.hypot(
          posRef.current.x - lm.x,
          posRef.current.y - lm.y
        );
        const isNear = closestLandmark?.id === lm.id;
        const showFullLabel =
          isNear ||
          pendingLandmarkRef.current?.id === lm.id ||
          distToPlayer < 22;
        drawLandmarkBadge(lm, bx, by, done, isNear, showFullLabel);
      });

      mapConfig.portals.forEach((p) => {
        const distToPlayer = Math.hypot(
          posRef.current.x - p.x,
          posRef.current.y - p.y
        );
        const isNear = closestPortal?.id === p.id;
        const showFullLabel =
          isNear ||
          pendingPortalRef.current?.id === p.id ||
          distToPlayer < 24;
        drawPortalGate(p, isNear, showFullLabel);
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
      const nowMs = performance.now();
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
        const distToPlayer = Math.hypot(posRef.current.x - wx, posRef.current.y - wy);
        const isTalkingToThis = activeDialogueNpcRef.current?.id === id;
        const hostFacing: SpriteFacing =
          isTalkingToThis || distToPlayer < 16
            ? resolveFacingToward(wx, wy, posRef.current.x, posRef.current.y, 'down')
            : 'down';
        const hostSheet =
          avatar === 'groom'
            ? assetsRef.current.sheets.groom
            : avatar === 'bride'
            ? assetsRef.current.sheets.bride
            : avatar === 'cream'
            ? assetsRef.current.sheets.dogCream
            : avatar === 'kkomi'
            ? assetsRef.current.sheets.dogKkomi
            : assetsRef.current.sheets.dogCream;
        const hostAction =
          npcActionRef.current?.npcId === id ? npcActionRef.current.action : null;

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
          y: fy - spriteH,
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

            const { drawTopY } = drawCharacterSprite(ctx, {
              sheetImg: hostSheet,
              fallbackImg: img,
              footX: fx,
              footY: fy,
              targetH: spriteH,
              facing: hostFacing,
              walkCol: 0,
              isMoving: false,
              action: hostAction,
              nowMs,
              tick,
              phaseOffset: wx,
            });

            // Host Crown/Heart Nameplate above Groom & Bride
            if (avatar === 'groom' || avatar === 'bride') {
              const badgeText =
                avatar === 'groom'
                  ? `🤵 신랑 ${config.groom.name}`
                  : `👰 신부 ${config.bride.name}`;
              ctx.font = 'bold 13px "Gowun Batang", sans-serif';
              const tw = ctx.measureText(badgeText).width + 16;
              const ty = Math.round(drawTopY - 26);
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
          { x: 67, y: 76, avatar: 'cat', cheer: '멍멍~ 행복하게 잘 살아요! 🐾' },
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

          const npcId = `chapel-npc-${idx}`;
          const chapelSheet = assetsRef.current.sheets.guests[spot.avatar];
          const isTalkingHere = activeDialogueNpcRef.current?.id === npcId;
          const chapelFacing: SpriteFacing = isTalkingHere
            ? resolveFacingToward(spot.x, spot.y, posRef.current.x, posRef.current.y, 'down')
            : spot.x < 50
            ? 'right'
            : 'left';
          const chapelAction: CharacterActionState | null =
            npcActionRef.current?.npcId === npcId
              ? npcActionRef.current.action
              : onVirginRoad
              ? {
                  kind: idx % 2 === 0 ? 'cheer' : 'wave',
                  startedAt: nowMs - ((tick * 16 + idx * 140) % 900),
                  durationMs: 900,
                }
              : null;

          depthList.push({
            footY: fy,
            draw: () => {
              ctx.fillStyle = 'rgba(59, 47, 47, 0.18)';
              ctx.beginPath();
              ctx.ellipse(fx, fy, 14, 5, 0, 0, Math.PI * 2);
              ctx.fill();

              drawCharacterSprite(ctx, {
                sheetImg: chapelSheet,
                fallbackImg: img,
                footX: fx,
                footY: fy,
                targetH: h,
                facing: chapelFacing,
                walkCol: 0,
                isMoving: false,
                action: chapelAction,
                nowMs,
                tick,
                phaseOffset: idx * 1.5,
              });
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

          const guestNpcId = `guest-npc-${activeMapId}-${g.id}`;
          const guestSheet = assetsRef.current.sheets.guests[g.avatar];
          const distToPlayer = Math.hypot(posRef.current.x - spot.x, posRef.current.y - spot.y);
          const guestFacing: SpriteFacing =
            activeDialogueNpcRef.current?.id === guestNpcId || distToPlayer < 16
              ? resolveFacingToward(spot.x, spot.y, posRef.current.x, posRef.current.y, 'down')
              : 'down';
          const guestNpcAction =
            npcActionRef.current?.npcId === guestNpcId ? npcActionRef.current.action : null;

          depthList.push({
            footY: fy,
            draw: () => {
              ctx.fillStyle = 'rgba(59, 47, 47, 0.2)';
              ctx.beginPath();
              ctx.ellipse(fx, fy, 15, 5, 0, 0, Math.PI * 2);
              ctx.fill();
              drawCharacterSprite(ctx, {
                sheetImg: guestSheet,
                fallbackImg: img,
                footX: fx,
                footY: fy,
                targetH: h,
                facing: guestFacing,
                walkCol: 0,
                isMoving: false,
                action: guestNpcAction,
                nowMs,
                tick,
                phaseOffset: idx * 1.7,
              });
            },
          });
        });
      }

      // Render Controlled Player Character(s): either Guest Protagonist ('guest') OR Groom & Bride Couple ('couple')
      const playerWalkCol = getWalkFrameCol(walkPhaseRef.current, isMoving);
      const companionWalkCol = getWalkFrameCol(walkPhaseRef.current + 1.0, isMoving);
      const dogWalkCol = getWalkFrameCol(walkPhaseRef.current + 0.5, isMoving);
      const playerFacing = playerFacingRef.current;

      const playerFootX = (posRef.current.x / 100) * W;
      const playerFootY = (posRef.current.y / 100) * H;
      const activeAura = equippedAuraRef.current;

      if (walkModeRef.current === 'guest') {
        liveNpcsRef.current = currentFrameNpcs;

        depthList.push({
          footY: playerFootY,
          draw: () => {
            const avatarId = guestAvatarRef.current;
            const guestSheet = assetsRef.current.sheets.guests[avatarId];
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

            const { drawTopY } = drawCharacterSprite(ctx, {
              sheetImg: guestSheet,
              fallbackImg: guestImg,
              footX: playerFootX,
              footY: playerFootY,
              targetH: playerH,
              facing: playerFacing,
              walkCol: playerWalkCol,
              isMoving,
              action: playerActionRef.current,
              nowMs,
              tick,
            });

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
              ctx.fillText('👑', playerFootX, drawTopY - 4);
              ctx.restore();
            }

            // Guest Protagonist Nameplate (below feet so it doesn't overlap overhead landmarks)
            const label = `🎒 ${guestNicknameRef.current}`;
            ctx.font = 'bold 12px "Gowun Batang", sans-serif';
            const tagW = Math.max(88, ctx.measureText(label).width + 16);
            const tagY = Math.min(H - 26, Math.round(playerFootY + 10));
            ctx.fillStyle = 'rgba(255, 253, 249, 0.94)';
            ctx.fillRect(Math.round(playerFootX - tagW / 2), tagY, tagW, 20);
            ctx.strokeStyle = '#c59b6d';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(Math.round(playerFootX - tagW / 2), tagY, tagW, 20);
            ctx.fillStyle = '#3b2f2f';
            ctx.textAlign = 'center';
            ctx.fillText(label, playerFootX, tagY + 14);
          },
        });
      } else {
        // Couple Walk Mode ('couple')
        const groomFootX = playerFootX;
        const groomFootY = playerFootY;

        const trail = trailRef.current;
        const getTrailPoint = (idx: number) =>
          trail[Math.min(idx, trail.length - 1)] || posRef.current;

        const brideTrail = getTrailPoint(7);
        const creamTrail = getTrailPoint(15);
        const kkomiTrail = getTrailPoint(22);

        // Individual 4-way facing for Bride, Cream, and Kkomi along their trailing paths
        const resolveTrailFacing = (fromIdx: number, toIdx: number): SpriteFacing => {
          if (!isMoving) return playerFacing;
          const a = getTrailPoint(fromIdx);
          const b = getTrailPoint(toIdx);
          return resolveFacingFromDelta(b.x - a.x, b.y - a.y, playerFacing, 0.08);
        };
        const brideFacing = resolveTrailFacing(7, 2);
        const creamFacing = resolveTrailFacing(15, 9);
        const kkomiFacing = resolveTrailFacing(22, 16);

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

            drawCharacterSprite(ctx, {
              sheetImg: assetsRef.current.sheets.dogCream,
              fallbackImg: assetsRef.current.dogCream || assetsRef.current.cat,
              footX: creamFootX,
              footY: creamFootY,
              targetH: 48,
              facing: creamFacing,
              walkCol: dogWalkCol,
              isMoving,
              action:
                npcActionRef.current?.npcId === 'companion-cream'
                  ? npcActionRef.current.action
                  : companionActionsRef.current.cream,
              nowMs,
              tick,
              phaseOffset: 1.1,
            });
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

            drawCharacterSprite(ctx, {
              sheetImg: assetsRef.current.sheets.dogKkomi,
              fallbackImg: assetsRef.current.dogKkomi || assetsRef.current.cat,
              footX: kkomiFootX,
              footY: kkomiFootY,
              targetH: 42,
              facing: kkomiFacing,
              walkCol: companionWalkCol,
              isMoving,
              action:
                npcActionRef.current?.npcId === 'companion-kkomi'
                  ? npcActionRef.current.action
                  : companionActionsRef.current.kkomi,
              nowMs,
              tick,
              phaseOffset: 2.3,
            });
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

            const drawGroom = () =>
              drawCharacterSprite(ctx, {
                sheetImg: assetsRef.current.sheets.groom,
                fallbackImg: assetsRef.current.groom,
                footX: groomFootX - 6,
                footY: groomFootY,
                targetH: CHIBI_H,
                facing: playerFacing,
                walkCol: playerWalkCol,
                isMoving,
                action: playerActionRef.current,
                nowMs,
                tick,
                phaseOffset: 0,
              });

            const drawBride = () =>
              drawCharacterSprite(ctx, {
                sheetImg: assetsRef.current.sheets.bride,
                fallbackImg: assetsRef.current.bride,
                footX: brideFootX,
                footY: brideFootY,
                targetH: CHIBI_H,
                facing: brideFacing,
                walkCol: companionWalkCol,
                isMoving,
                action: companionActionsRef.current.bride,
                nowMs,
                tick,
                phaseOffset: 0.7,
              });

            // Draw back-to-front so vertical walking layers Groom & Bride naturally
            let groomTopY = groomFootY - CHIBI_H;
            let brideTopY = brideFootY - CHIBI_H;
            if (groomFootY <= brideFootY) {
              groomTopY = drawGroom().drawTopY;
              brideTopY = drawBride().drawTopY;
            } else {
              brideTopY = drawBride().drawTopY;
              groomTopY = drawGroom().drawTopY;
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
              ctx.fillText('👑', groomFootX - 6, groomTopY - 4);
              ctx.fillText('👑', brideFootX, brideTopY - 4);
              ctx.restore();
            }

            const topAnchor = Math.min(groomTopY, brideTopY);
            ctx.fillStyle = '#d97b84';
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
              '♥',
              Math.round(centerCoupleX),
              Math.round(topAnchor - 4 + Math.sin(tick * 0.1) * 2)
            );

            const tagY = Math.round(topAnchor - 36);
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

      // 8. Minimal floating 💬 badge above the currently speaking ambient NPC (links map sprite <-> bottom chatter bar)
      if (ambientNpcIdRef.current) {
        const speaker = currentFrameNpcs.find((n) => n.id === ambientNpcIdRef.current);
        if (speaker) {
          const sx = Math.round((speaker.x / 100) * W);
          const isPet =
            speaker.avatar === 'cream' ||
            speaker.avatar === 'kkomi' ||
            speaker.avatar === 'mochi' ||
            speaker.avatar === 'cat';
          const floatOffset = Math.sin(tick * 0.1) * 3;
          const sy = Math.round((speaker.y / 100) * H - (isPet ? 54 : 88) + floatOffset);
          ctx.save();
          ctx.fillStyle = 'rgba(255, 253, 249, 0.96)';
          ctx.beginPath();
          ctx.arc(sx, sy, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#d97b84';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💬', sx, sy + 1);
          ctx.restore();
        }
      }
      void guestHeads;

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
    activateLandmark,
    activateSecretProp,
    travelToMap,
  ]);

  const handleJoystickVectorChange = useCallback(
    (dx: number, dy: number) => {
      if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
        dismissWalkHint();
        setActiveDialogueNpc(null);
        setActiveWalkTargetId(null);
      }
      dpadDirRef.current = { dx, dy };
    },
    [dismissWalkHint]
  );

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

  // Keep canvas ref synced with active ambient NPC
  useEffect(() => {
    ambientNpcIdRef.current = ambientNpc?.id ?? null;
  }, [ambientNpc]);

  // Celebrate when guest completes all mini-quest steps in a zone for the first time
  useEffect(() => {
    if (
      activeMiniQuest.steps.length > 0 &&
      completedMiniQuestCount >= activeMiniQuest.steps.length &&
      !completedZoneMissions[currentMapId]
    ) {
      setCompletedZoneMissions((prev) => ({ ...prev, [currentMapId]: true }));
      soundEngine.playFanfare();
      triggerPlayerAction('spin');
      fireCelebrationConfetti({
        particleCount: 38,
        spread: 60,
        origin: { y: 0.62 },
        colors: ['#d97b84', '#d4b48c', '#6b9071'],
      });
      showToast(
        `🎉 ${activeMapConfig.tabLabel} 구역 미션 완료! 다음 맵으로 산책해 보세요`,
        'success',
        3400
      );
    }
  }, [
    completedMiniQuestCount,
    activeMiniQuest.steps.length,
    completedZoneMissions,
    currentMapId,
    activeMapConfig.tabLabel,
  ]);

  // Special reward when guest finishes exploring all 9 maps
  useEffect(() => {
    if (exploredMapCount < 9) return;
    try {
      if (localStorage.getItem(STORAGE_WORLD_COMPLETE_KEY) === '1') return;
      localStorage.setItem(STORAGE_WORLD_COMPLETE_KEY, '1');
    } catch {
      // ignore
    }
    if (onUnlockTitle) {
      onUnlockTitle('🗺️ 웨딩 월드 완주자');
    }
    soundEngine.playFanfare();
    triggerPlayerAction('spin');
    fireCelebrationConfetti({
      particleCount: 55,
      spread: 75,
      origin: { y: 0.55 },
      colors: ['#d97b84', '#d4af37', '#6b9071', '#fffdf9'],
    });
    showToast(
      '🏆 9개 웨딩 월드 완주! [🗺️ 웨딩 월드 완주자] 칭호를 획득했습니다',
      'success',
      4200
    );
  }, [exploredMapCount, onUnlockTitle]);

  return (
    <div className="w-full min-w-0 flex flex-col gap-1.5">
      {/* ULTRA-SLIM 1-ROW WORLD HUD BAR: Map Drawer + 9-Map Strip + Utility Icons */}
      <div className="pixel-card w-full min-w-0 overflow-hidden px-2 py-1.5 bg-[#fffdf9] flex items-center justify-between gap-1.5 font-sans">
        {/* Left: World Map & Mission Drawer Trigger */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playSelect();
            setShowWorldMapSheet(true);
          }}
          className="px-2.5 py-1 rounded-lg bg-[#3b2f2f] hover:bg-[#2a2020] text-[#fffdf9] text-[11px] font-bold flex items-center gap-1 shrink-0 shadow-sm"
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
            const hasSecretLeft = WORLD_SECRET_PROPS.some(
              (s) => s.mapId === mapId && !discoveredSecrets[s.id]
            );
            return (
              <button
                key={mapId}
                ref={(el) => {
                  mapChipRefs.current[mapId] = el;
                }}
                type="button"
                onClick={() => {
                  if (currentMapId !== mapId) {
                    travelToMap(mapId);
                  }
                }}
                className={`relative px-2 py-1 rounded-full border text-[10px] shrink-0 flex items-center gap-1 transition-all ${
                  isActive
                    ? 'bg-[#d97b84] text-white border-[#b85d67] font-bold shadow-sm'
                    : isVisited
                    ? 'bg-[#faf5ec] text-[#3b2f2f] border-[#c59b6d] font-semibold'
                    : 'bg-[#fcfaf5] text-[#8c7a70] border-[#e2d4c0]'
                }`}
              >
                <span className="leading-none">{m.icon}</span>
                <span>{m.tabLabel}</span>
                {hasSecretLeft && (
                  <span
                    aria-hidden="true"
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isActive ? 'bg-[#ffe999]' : 'bg-[#d4af37]'
                    }`}
                  />
                )}
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
            title={
              secretRadarNear
                ? '근처에 반짝이는 비밀 소품이 있습니다!'
                : '반짝이는 비밀 소품 도감'
            }
            className={`px-2 py-1 rounded-full border text-[10px] font-bold flex items-center gap-0.5 transition-all ${
              secretRadarNear
                ? 'bg-[#fff7dc] border-[#d4af37] text-[#8a6220] ring-1 ring-[#d4af37] animate-pulse shadow-sm'
                : 'bg-[#faf5ec] hover:bg-[#f3e9d8] border-[#c59b6d] text-[#5c4d47]'
            }`}
          >
            <Sparkles
              className={`w-3 h-3 ${
                secretRadarNear ? 'text-[#d4af37]' : 'text-[#d97b84]'
              }`}
            />
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
              className="pointer-events-auto bg-[#fffdf9]/90 backdrop-blur-sm hover:bg-[#fffdf9] border border-[#d4b48c] px-2.5 py-1 rounded-full text-[11px] text-[#3b2f2f] font-bold flex items-center gap-1.5 shadow-sm truncate"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-[#d97b84] animate-pulse shrink-0" />
              <span>
                {activeMapConfig.icon} {activeMapConfig.tabLabel}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#faf5ec] text-[#c59b6d] border border-[#e6d5b8]">
                미션 {completedMiniQuestCount}/{activeMiniQuest.steps.length} ▾
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundEngine.playBlip(680);
                setCameraZoomMode((z) => (z === 'follow' ? 'overview' : 'follow'));
              }}
              title="산책 확대 카메라 / 전체 맵 보기 전환"
              className="pointer-events-auto bg-[#fffdf9]/90 backdrop-blur-sm hover:bg-[#faf5ec] border border-[#d4b48c] px-2 py-1 rounded-full text-[10px] font-bold text-[#5c4d47] shadow-sm shrink-0 whitespace-nowrap"
            >
              {cameraZoomMode === 'follow' ? '🗺️ 전체보기' : '🔍 산책확대'}
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playSelect();
                setWalkMode((m) => (m === 'guest' ? 'couple' : 'guest'));
              }}
              className="pointer-events-auto bg-[#fffdf9]/90 backdrop-blur-sm hover:bg-[#fcf0f1] border border-[#d4b48c] px-2 py-1 rounded-full text-[10px] font-bold text-[#3b2f2f] shadow-sm shrink-0 whitespace-nowrap"
            >
              {walkMode === 'guest' ? '👫 커플 산책' : '🎒 하객 모드'}
            </button>
          </div>
        </div>

        {/* RPG Area Arrival Title Banner when traveling between maps */}
        {arrivalBanner && !activeDialogueNpc && !activeStoryToast && (
          <div className="pointer-events-none absolute top-14 inset-x-3 z-10 flex justify-center">
            <div className="bg-[#3b2f2f]/90 backdrop-blur-sm border border-[#d4b48c] rounded-2xl px-4 py-2 text-center shadow-lg animate-fadeIn">
              <div className="text-xs font-serif font-bold text-[#fffdf9] flex items-center justify-center gap-1.5">
                <span>{arrivalBanner.icon}</span>
                <span>{arrivalBanner.title}</span>
              </div>
              <div className="text-[10px] font-sans text-[#e6d5b8] mt-0.5">
                {arrivalBanner.subtitle}
              </div>
            </div>
          </div>
        )}

        {/* First-Visit Gentle Walk Controls Hint (auto-dismissed on first movement) */}
        {showWalkHint && !activeDialogueNpc && !activeStoryToast && (
          <div className="absolute bottom-12 inset-x-2 z-10 flex justify-center pointer-events-none">
            <button
              type="button"
              onClick={dismissWalkHint}
              className="pointer-events-auto bg-[#3b2f2f]/90 hover:bg-[#3b2f2f] backdrop-blur-sm text-[#fffdf9] border border-[#d4b48c] rounded-full px-3.5 py-1.5 text-[11px] font-sans font-bold shadow-md whitespace-nowrap flex items-center gap-1.5 animate-fadeIn"
            >
              <span>👆 바닥 터치 · 아래 조이스틱으로 산책해 보세요!</span>
              <span className="text-[#e6d5b8] text-[10px]">✕</span>
            </button>
          </div>
        )}

        {/* Off-screen Portal Edge Indicators (helps guests find exits while zoomed in) */}
        {!activeDialogueNpc &&
          offscreenPortals.map((ind) => (
            <button
              key={ind.portal.id}
              type="button"
              onClick={() => walkToPortal(ind.portal)}
              style={{
                left: `${ind.leftPct}%`,
                top: `${ind.topPct}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 bg-[#3b2f2f]/90 hover:bg-[#d97b84] backdrop-blur-sm text-[#fffdf9] border border-[#e6d5b8] rounded-full px-2.5 py-1 text-[10px] font-sans font-bold shadow-md whitespace-nowrap flex items-center gap-1 transition-colors active:scale-95"
            >
              <span className="text-[#f4acb7]">{ind.arrow}</span>
              <span>{ind.shortLabel}</span>
            </button>
          ))}

        {/* Clean Non-Overlapping 1-Line NPC Ambient Chatter Bar (Bottom of Canvas) */}
        {ambientNpc && !activeDialogueNpc && (
          <button
            type="button"
            onClick={() => openNpcDialogue(ambientNpc)}
            className="absolute bottom-2 left-2 right-2 z-10 bg-[#fffdf9]/95 hover:bg-[#fffdf9] backdrop-blur-sm border border-[#d4b48c] rounded-full px-2.5 py-1.5 shadow-md flex items-center gap-2 text-left font-sans transition-all"
          >
            <img
              src={resolveDialoguePortrait(ambientNpc.avatar)}
              alt={ambientNpc.name}
              className="w-6 h-6 rounded-full object-cover border border-[#d97b84] bg-[#faf5ec] shrink-0"
            />
            <span className="text-[11px] font-bold text-[#3b2f2f] shrink-0">
              {ambientNpc.name}
            </span>
            <span className="text-[11px] text-[#5c4d47] truncate flex-1 min-w-0">
              “{ambientNpc.initialMessage}”
            </span>
            <span className="text-[10px] font-bold text-[#d97b84] shrink-0">
              대화 ▸
            </span>
          </button>
        )}

        {/* Story / Secret Toast Overlay when visiting special spots */}
        {activeStoryToast && !activeDialogueNpc && (
          <div className="absolute top-11 left-2.5 right-2.5 z-10 bg-[#fffdf9]/95 backdrop-blur-sm border-2 border-[#d97b84] rounded-xl px-3 py-2 shadow-md flex items-center justify-between gap-2 animate-fadeIn">
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
            className="absolute inset-x-2.5 bottom-2.5 z-20 bg-[#fffdf9]/95 backdrop-blur-sm border-2 border-[#c59b6d] rounded-2xl p-3 shadow-xl space-y-2 animate-fadeIn font-sans"
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

            <div
              onClick={() => setTypedDialogueText(dialogueReplyText)}
              title="탭하면 대사를 바로 모두 표시합니다"
              className="bg-[#faf5ec] border border-[#e6d5b8] rounded-xl px-3 py-2 text-xs text-[#3b2f2f] font-serif leading-relaxed cursor-pointer min-h-[44px]"
            >
              {typedDialogueText || dialogueReplyText}
              {typedDialogueText.length < dialogueReplyText.length && (
                <span className="inline-block w-1.5 h-3 ml-0.5 bg-[#d97b84] align-middle animate-pulse" />
              )}
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
          className={`w-full aspect-square block cursor-pointer touch-none transition-opacity duration-200 ${
            mapTransitionFade ? 'opacity-40' : 'opacity-100'
          }`}
        />
      </div>

      {/* COMPACT STICKY CONSOLE DOCK: Joystick + Action CTA + 1-Line Spot Quick-Chips */}
      <div className="sticky bottom-1.5 z-30 w-full min-w-0 overflow-hidden pixel-card bg-[#fffdf9] border-2 border-[#c59b6d] px-2.5 sm:px-3 py-2 shadow-lg rounded-2xl space-y-1.5 font-sans">
        <div className="flex items-center justify-between gap-2 min-w-0">
          {/* Left: Wedding Compass Virtual Joystick */}
          <div className="flex items-center shrink-0">
            <InGameVirtualJoystick onVectorChange={handleJoystickVectorChange} />
          </div>

          {/* Right: Live Emoji Reactions + Contextual Portal/Secret/Landmark Action Dock */}
          <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
            {/* Upper Row: Live Blessing Emoji Reactions + NPC Talk Button */}
            <div className="flex items-center justify-between gap-1 bg-[#faf5ec] px-2 py-1 rounded-full border border-[#e6d5b8] min-w-0 overflow-x-auto no-scrollbar">
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
                className="text-[10px] font-bold text-[#b85d67] hover:text-[#d97b84] flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <MessageCircle className="w-3 h-3 shrink-0" />
                <span>대화·축복 ♥{blessingCount}</span>
              </button>
              <div className="flex items-center gap-1 shrink-0">
                {REACTION_EMOJIS.map((item) => (
                  <button
                    key={item.emoji}
                    type="button"
                    onClick={() => spawnFloatingReaction(item.emoji)}
                    title={`${item.label} 축복 보내기`}
                    aria-label={`${item.label} 축복 보내기`}
                    className="w-7 h-7 rounded-full bg-[#fffdf9] hover:bg-[#fcf0f1] active:scale-90 border border-[#e2d4c0] flex items-center justify-center text-xs transition-transform shrink-0 shadow-sm"
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
                className="w-full bg-[#3b2f2f] hover:bg-[#2a2020] text-[#fffdf9] border border-[#c59b6d] rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 shadow-sm active:scale-95 transition-all"
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
                className="w-full bg-[#fff8e7] hover:bg-[#faefd4] text-[#3b2f2f] border-2 border-[#d4af37] rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 shadow-sm active:scale-95 transition-all"
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
                className="w-full bg-[#fcf0f1] hover:bg-[#f9dfe2] text-[#3b2f2f] border border-[#d97b84] rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 shadow-sm active:scale-95 transition-all"
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
                  className="py-1.5 px-2 rounded-xl bg-[#d97b84] hover:bg-[#c56871] border border-[#b85d67] text-white text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform shadow-sm"
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">초대장 열기</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Ultra-Slim 1-Line Recommended Course + Spot & Portal Quick-Jump Strip */}
        <div className="pt-1 border-t border-[#efe6d8] flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={handleGuideNextSpot}
            className="px-2 py-0.5 rounded-full bg-[#3b2f2f] hover:bg-[#2a2020] text-[#fffdf9] border border-[#c59b6d] text-[10px] font-bold shrink-0 flex items-center gap-1 shadow-sm active:scale-95 transition-transform"
          >
            <Compass className="w-3 h-3 text-[#f4acb7] shrink-0" />
            <span>추천코스</span>
          </button>

          {activeMapConfig.landmarks.map((lm) => {
            const done = lm.questId
              ? !!visitedQuests[lm.questId]
              : !!visitedMemories[lm.id];
            const isWalkingHere = activeWalkTargetId === lm.id;
            return (
              <button
                key={lm.id}
                type="button"
                onClick={() => walkToLandmark(lm)}
                className={`px-2 py-0.5 rounded-full border text-[10px] shrink-0 flex items-center gap-1 transition-all ${
                  isWalkingHere
                    ? 'bg-[#fcf0f1] text-[#b85d67] border-[#d97b84] ring-1 ring-[#d97b84] font-bold'
                    : done
                    ? 'bg-[#edf3ee] text-[#3f6246] border-[#a3bfa8] font-semibold'
                    : 'bg-[#faf5ec] text-[#4a3b32] border-[#e2d4c0] hover:border-[#c59b6d] font-semibold'
                }`}
              >
                {done ? (
                  <span className="text-[#4d6b53] font-extrabold">✓</span>
                ) : (
                  <span>{lm.name.split(' ')[0]}</span>
                )}
                <span>{lm.shortName}</span>
                {isWalkingHere && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d97b84] animate-pulse" />
                )}
              </button>
            );
          })}
          {activeMapConfig.portals.map((p) => {
            const isWalkingHere = activeWalkTargetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => walkToPortal(p)}
                className={`px-2 py-0.5 rounded-full border text-[10px] font-bold shrink-0 flex items-center gap-1 transition-all ${
                  isWalkingHere
                    ? 'bg-[#d97b84] text-white border-[#b85d67] ring-1 ring-[#d97b84]'
                    : 'border-[#d97b84] bg-[#fcf3f3] hover:bg-[#f9e5e7] text-[#3b2f2f]'
                }`}
              >
                <span>{p.label}</span>
                <span className={isWalkingHere ? 'text-white' : 'text-[#d97b84]'}>▶</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* WORLD MAP, MISSION & SPOT QUICK-JUMP DRAWER MODAL */}
      {showWorldMapSheet && (
        <WorldMapSheetModal
          currentMapId={currentMapId}
          visitedMaps={visitedMaps}
          discoveredSecrets={discoveredSecrets}
          exploredMapCount={exploredMapCount}
          activeMiniQuest={activeMiniQuest}
          completedMiniQuestCount={completedMiniQuestCount}
          isMiniQuestStepDone={isMiniQuestStepDone}
          onSelectMap={(mapId) => {
            setShowWorldMapSheet(false);
            if (currentMapId !== mapId) travelToMap(mapId);
          }}
          onSelectMiniQuestStep={(step) => {
            setShowWorldMapSheet(false);
            handleMiniQuestClick(step);
          }}
          onOpenQuest={onOpenQuest}
          onClose={() => setShowWorldMapSheet(false)}
        />
      )}

      {/* Guest Protagonist Avatar & Walk Mode Selector Modal */}
      {showAvatarPicker && (
        <AvatarPickerModal
          walkMode={walkMode}
          guestNickname={guestNickname}
          guestAvatar={guestAvatar}
          onChangeWalkMode={setWalkMode}
          onChangeNickname={setGuestNickname}
          onSelectAvatar={(avatarId) => {
            setGuestAvatar(avatarId);
            setWalkMode('guest');
          }}
          onConfirm={() => {
            soundEngine.playFanfare();
            setVisitedMemories((prev) => ({ ...prev, 'home-mirror': true }));
            setShowAvatarPicker(false);
          }}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}

      {/* Secret Prop Collection Book & Aura Equip Modal */}
      {showSecretBook && (
        <SecretArchiveModal
          config={config}
          discoveredSecrets={discoveredSecrets}
          discoveredCount={discoveredCount}
          equippedAura={equippedAura}
          onSelectAura={setEquippedAura}
          onNavigateToSecret={(prop) => {
            setShowSecretBook(false);
            if (currentMapRef.current !== prop.mapId) {
              travelToMap(prop.mapId, prop.x, Math.min(90, prop.y + 6));
            } else {
              walkToSecretProp(prop);
            }
          }}
          onClose={() => setShowSecretBook(false)}
        />
      )}

      {showPhotoBooth && (
        <Suspense fallback={null}>
          <PhotoBoothModal
            config={config}
            initialMapId={currentMapId}
            initialAvatar={guestAvatar}
            initialGuestName={guestNickname}
            onClose={() => setShowPhotoBooth(false)}
            onUnlockTitle={onUnlockTitle}
          />
        </Suspense>
      )}
    </div>
  );
};
