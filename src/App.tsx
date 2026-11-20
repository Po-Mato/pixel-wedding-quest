import React, { useState, useEffect, useMemo, Suspense } from 'react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  BookOpen,
  Home,
  Share2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Award,
  MessageCircle,
} from 'lucide-react';
import {
  DEFAULT_WEDDING_CONFIG,
  QUEST_BUILDINGS,
  QuestBuildingId,
  WeddingConfig,
  GuestbookEntry,
} from './data/weddingConfig';
import { soundEngine } from './utils/soundEngine';
import { copyTextToClipboard } from './utils/clipboard';
import { showToast } from './utils/toast';
import { GlobalToast } from './components/GlobalToast';
import { fireCelebrationConfetti, prefersReducedMotion } from './utils/motion';
import { useBodyScrollLock } from './utils/useBodyScrollLock';
import { useEscapeKey } from './utils/useEscapeKey';
import { shareViaKakaoTalk } from './utils/kakaoShare';
import { detectWeddingPhase, WeddingPhase } from './utils/weddingPhase';
import {
  CoupleOrderProvider,
  CoupleSide,
  getRandomPrimarySide,
  joinCoupleNames,
  resolvePrimarySide,
  rollRandomPrimarySide,
} from './utils/coupleOrder';
import { PIXEL_ASSETS } from './components/PixelSprites';
import { TitleScreen } from './components/TitleScreen';
import { ClassicWeddingView } from './components/ClassicWeddingView';
import { WeddingPhaseBanner } from './components/WeddingPhaseBanner';
import type { ParentsSideFilter } from './components/ParentsWeddingView';
import { StorySection } from './components/sections/StorySection';
import { CeremonySection } from './components/sections/CeremonySection';
import { GallerySection } from './components/sections/GallerySection';
import { LocationSection } from './components/sections/LocationSection';
import { GiftSection } from './components/sections/GiftSection';
import { RsvpGuestbookSection } from './components/sections/RsvpGuestbookSection';
import {
  CloudSyncStatus,
  fetchSyncedGuestbook,
  publishGuestbookEntry,
  fetchCloudWeddingConfig,
} from './utils/weddingCloudSync';

const VillageCanvas = React.lazy(() =>
  import('./components/VillageCanvas').then((m) => ({ default: m.VillageCanvas }))
);
const ParentsWeddingView = React.lazy(() =>
  import('./components/ParentsWeddingView').then((m) => ({
    default: m.ParentsWeddingView,
  }))
);
const MiniGameSection = React.lazy(() =>
  import('./components/sections/MiniGameSection').then((m) => ({
    default: m.MiniGameSection,
  }))
);
const CustomizerModal = React.lazy(() =>
  import('./components/CustomizerModal').then((m) => ({ default: m.CustomizerModal }))
);
const CertificateModal = React.lazy(() =>
  import('./components/CertificateModal').then((m) => ({
    default: m.CertificateModal,
  }))
);

type AppScreenMode = 'title' | 'world' | 'classic' | 'parents';

const STORAGE_GUESTBOOK_KEY = 'pixel_wedding_quest_guestbook_v2';
const STORAGE_CLOUD_CONFIG_KEY = 'pixel_wedding_quest_cloud_config_v3';
const STORAGE_ENTRY_PREF_KEY = 'pixel_wedding_quest_entry_pref_v1';

interface SavedEntryPref {
  mode: 'classic' | 'parents';
  side: CoupleSide;
}

function loadSavedEntryPref(): SavedEntryPref | null {
  try {
    const raw = localStorage.getItem(STORAGE_ENTRY_PREF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedEntryPref>;
    if (
      (parsed.mode === 'classic' || parsed.mode === 'parents') &&
      (parsed.side === 'groom' || parsed.side === 'bride')
    ) {
      return { mode: parsed.mode, side: parsed.side };
    }
  } catch {
    // ignore
  }
  return null;
}

function saveEntryPref(mode: 'classic' | 'parents', side: CoupleSide): void {
  try {
    localStorage.setItem(STORAGE_ENTRY_PREF_KEY, JSON.stringify({ mode, side }));
  } catch {
    // ignore
  }
}

function loadCachedCloudConfig(): WeddingConfig | null {
  try {
    localStorage.removeItem('pixel_wedding_quest_config_v2');
    localStorage.removeItem('pixel_wedding_quest_config_v1');
    const raw = localStorage.getItem(STORAGE_CLOUD_CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeddingConfig;
    if (parsed?.groom?.fullName && parsed?.bride?.fullName && parsed?.wedding?.venueName) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function saveCachedCloudConfig(cfg: WeddingConfig): void {
  try {
    localStorage.setItem(STORAGE_CLOUD_CONFIG_KEY, JSON.stringify(cfg));
  } catch {
    // ignore
  }
}

function detectInitialRoute(): { mode: AppScreenMode; side: ParentsSideFilter } {
  try {
    const params = new URLSearchParams(window.location.search);
    const rawMode = params.get('mode') || params.get('target');
    const rawSide = params.get('side');
    const explicitSide: ParentsSideFilter | null =
      rawSide === 'groom' || rawSide === 'bride' ? rawSide : null;

    if (rawMode === 'parents' || window.location.hash === '#parents') {
      return { mode: 'parents', side: explicitSide ?? 'all' };
    }
    if (rawMode === 'title' || rawMode === 'cover') {
      return { mode: 'title', side: 'all' };
    }
    if (rawMode === 'world' || rawMode === 'garden') {
      return { mode: 'world', side: explicitSide ?? 'all' };
    }
    if (rawMode === 'classic') {
      return { mode: 'classic', side: explicitSide ?? 'all' };
    }
    // 전용 링크(?side=groom / ?side=bride)로 접속 시 선택 화면을 건너뛰고 바로 진입
    if (explicitSide) {
      return { mode: 'classic', side: explicitSide };
    }
  } catch {
    // ignore
  }

  // 기본 링크 재방문 시 이전에 고른 맞춤 모드로 바로 진입, 최초 방문 시 4버튼 선택 화면 표시
  const saved = loadSavedEntryPref();
  if (saved) {
    return { mode: saved.mode, side: saved.side };
  }
  return { mode: 'title', side: 'all' };
}

export function App() {
  // Cloudflare D1 DB 설정을 로컬 캐시(Stale-While-Revalidate)로 즉시 복원하고,
  // 최초 방문 시에는 DB 응답을 받아 깜빡임 없이 최신 정보를 표시합니다.
  const initialCachedConfig = useMemo(() => loadCachedCloudConfig(), []);
  const [config, setConfig] = useState<WeddingConfig>(
    () => initialCachedConfig || DEFAULT_WEDDING_CONFIG
  );
  const [isConfigReady, setIsConfigReady] = useState<boolean>(() =>
    Boolean(initialCachedConfig)
  );

  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_GUESTBOOK_KEY);
      if (saved) {
        // 예전 버전에서 샘플 이름이 박힌 채 저장된 기본 방명록(gb-*)은 최신 템플릿 문구로 교체
        const samples = new Map(
          DEFAULT_WEDDING_CONFIG.initialGuestbook.map((entry) => [entry.id, entry])
        );
        return (JSON.parse(saved) as GuestbookEntry[]).map((entry) => {
          const sample = samples.get(entry.id);
          return sample ? { ...entry, message: sample.message } : entry;
        });
      }
    } catch {
      // fallback
    }
    return DEFAULT_WEDDING_CONFIG.initialGuestbook;
  });

  const initialRoute = useMemo(() => detectInitialRoute(), []);
  const [screenMode, setScreenMode] = useState<AppScreenMode>(initialRoute.mode);
  const [parentsSide, setParentsSide] = useState<ParentsSideFilter>(initialRoute.side);
  const [randomSide, setRandomSide] = useState<CoupleSide>(getRandomPrimarySide);
  // 신랑측 링크 → 신랑 우선, 신부측 링크 → 신부 우선, 일반 링크 → 무작위(전 섹션 동일 순서)
  const defaultGuestSide = resolvePrimarySide(parentsSide, randomSide);
  const [activeQuest, setActiveQuest] = useState<QuestBuildingId | null>(null);
  const [visitedQuests, setVisitedQuests] = useState<Record<QuestBuildingId, boolean>>({
    story: false,
    ceremony: false,
    gallery: false,
    minigame: false,
    location: false,
    gift: false,
    rsvp: false,
  });

  const [bgmPlaying, setBgmPlaying] = useState(false);
  const [earnedTitle, setEarnedTitle] = useState<string | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === '1' || window.location.hash === '#admin') {
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  });
  const [showCertificate, setShowCertificate] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedKakao, setCopiedKakao] = useState(false);
  const [guestbookSyncStatus, setGuestbookSyncStatus] = useState<CloudSyncStatus | null>(
    null
  );
  const [phaseOverride, setPhaseOverride] = useState<WeddingPhase | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const p = params.get('phase');
      if (p === 'dday' || p === 'post' || p === 'upcoming') return p;
    } catch {
      // ignore
    }
    return null;
  });
  const activePhase: WeddingPhase = phaseOverride ?? detectWeddingPhase(config);
  const secretTapRef = React.useRef<{ count: number; lastTap: number }>({
    count: 0,
    lastTap: 0,
  });

  // Hidden Admin Page Trigger via URL hash (#admin) or Keyboard Shortcut (Ctrl/Cmd + Shift + A)
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#admin') {
        setShowCustomizer(true);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        soundEngine.playSelect();
        setShowCustomizer(true);
      }
    };
    window.addEventListener('hashchange', checkHash);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('hashchange', checkHash);
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  const handleSecretFooterTap = () => {
    const now = Date.now();
    if (now - secretTapRef.current.lastTap > 2500) {
      secretTapRef.current.count = 1;
    } else {
      secretTapRef.current.count += 1;
    }
    secretTapRef.current.lastTap = now;
    if (secretTapRef.current.count >= 5) {
      secretTapRef.current.count = 0;
      soundEngine.playSelect();
      setShowCustomizer(true);
    }
  };

  useEffect(() => {
    // Dynamically sync browser tab <title> & OpenGraph meta tags with couple names and wedding date
    const y = config.wedding.year;
    const m = String(config.wedding.month).padStart(2, '0');
    const d = String(config.wedding.day).padStart(2, '0');
    const dateDot = `${y}. ${m}. ${d}`;
    const coupleNames = joinCoupleNames(config, defaultGuestSide, 'fullName', ' ♥ ');
    document.title = `${coupleNames} 모바일 청첩장 | ${dateDot}`;

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute(
        'content',
        `${coupleNames} 결혼합니다 | ${dateDot}`
      );
    }
    const descText = `${config.wedding.dateDisplay} ${config.wedding.timeDisplay} · ${config.wedding.venueName} ${config.wedding.hallName} | 소중한 분들을 초대합니다`;
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute('content', descText);
    }
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', descText);
    }
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute('content', window.location.href.split('#')[0]);
    }
    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg) {
      try {
        ogImg.setAttribute(
          'content',
          new URL(PIXEL_ASSETS.weddingOgThumb, window.location.href).href
        );
      } catch {
        // ignore
      }
    }
  }, [config, defaultGuestSide]);

  // Synchronize screenMode & activeQuest with browser History API so mobile 'Back' button
  // closes modals or returns to the cover instead of exiting the KakaoTalk in-app browser
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state as {
        screenMode?: AppScreenMode;
        activeQuest?: QuestBuildingId | null;
        side?: ParentsSideFilter;
      } | null;
      if (state && state.screenMode) {
        setScreenMode(state.screenMode);
        setActiveQuest(state.activeQuest || null);
        if (state.side) {
          setParentsSide(state.side);
        }
      } else {
        const route = detectInitialRoute();
        setActiveQuest(null);
        setScreenMode(route.mode);
        setParentsSide(route.side);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const buildNavigationUrl = (
    nextMode: AppScreenMode,
    nextSide: ParentsSideFilter = parentsSide
  ) => {
    const url = new URL(window.location.href);
    if (nextMode === 'title') {
      url.searchParams.set('mode', 'title');
      url.searchParams.delete('side');
    } else if (nextMode === 'classic') {
      url.searchParams.delete('mode');
      if (nextSide === 'groom' || nextSide === 'bride') {
        url.searchParams.set('side', nextSide);
      } else {
        url.searchParams.delete('side');
      }
    } else {
      url.searchParams.set('mode', nextMode);
      if (nextSide === 'groom' || nextSide === 'bride') {
        url.searchParams.set('side', nextSide);
      } else {
        url.searchParams.delete('side');
      }
    }
    return url.toString();
  };

  const pushNavigationState = (
    nextMode: AppScreenMode,
    nextQuest: QuestBuildingId | null = null,
    nextSide: ParentsSideFilter = parentsSide
  ) => {
    try {
      window.history.pushState(
        { screenMode: nextMode, activeQuest: nextQuest, side: nextSide },
        '',
        buildNavigationUrl(nextMode, nextSide)
      );
    } catch {
      // ignore
    }
  };

  const replaceNavigationState = (
    nextMode: AppScreenMode,
    nextQuest: QuestBuildingId | null = null,
    nextSide: ParentsSideFilter = parentsSide
  ) => {
    try {
      window.history.replaceState(
        { screenMode: nextMode, activeQuest: nextQuest, side: nextSide },
        '',
        buildNavigationUrl(nextMode, nextSide)
      );
    } catch {
      // ignore
    }
  };

  const closeActiveQuest = () => {
    const currentState = window.history.state as {
      activeQuest?: QuestBuildingId | null;
    } | null;
    if (currentState?.activeQuest) {
      window.history.back();
    } else {
      setActiveQuest(null);
      replaceNavigationState(screenMode, null);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_GUESTBOOK_KEY, JSON.stringify(guestbook));
    } catch {
      // ignore
    }
  }, [guestbook]);

  // Initial Cloud D1 Sync for Config + Guestbook + BroadcastChannel
  useEffect(() => {
    let cancelled = false;
    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled) setIsConfigReady(true);
    }, 1500);

    fetchCloudWeddingConfig()
      .then((remoteConfig) => {
        if (cancelled) return;
        if (remoteConfig && remoteConfig.groom?.fullName && remoteConfig.bride?.fullName) {
          setConfig(remoteConfig);
          saveCachedCloudConfig(remoteConfig);
        }
      })
      .finally(() => {
        if (!cancelled) {
          window.clearTimeout(fallbackTimer);
          setIsConfigReady(true);
        }
      });

    fetchSyncedGuestbook(DEFAULT_WEDDING_CONFIG.initialGuestbook).then(
      ({ entries, status }) => {
        if (cancelled) return;
        setGuestbookSyncStatus(status);
        if (entries.length > 0) {
          setGuestbook(entries);
        }
      }
    );

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('pixel_wedding_quest_live_channel');
        bc.onmessage = (ev) => {
          if (ev.data?.type === 'NEW_GUESTBOOK_ENTRY' && ev.data?.entry) {
            const incoming = ev.data.entry as GuestbookEntry;
            setGuestbook((prev) =>
              prev.some((p) => p.id === incoming.id) ? prev : [incoming, ...prev]
            );
          }
        };
      } catch {
        // ignore
      }
    }
    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
      try {
        bc?.close();
      } catch {
        // ignore
      }
    };
  }, []);

  const handleAddGuestbook = async (entry: GuestbookEntry): Promise<boolean> => {
    const tempId = entry.id;
    setGuestbook((prev) => [entry, ...prev]);
    try {
      const { ok, savedEntry } = await publishGuestbookEntry(entry);
      const nowStr = new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      if (ok) {
        setGuestbook((prev) =>
          prev.map((item) => (item.id === tempId ? savedEntry : item))
        );
        setGuestbookSyncStatus((prev) => ({
          mode: 'cloud',
          syncedAt: nowStr,
          apiBase: prev?.apiBase,
        }));
      } else {
        setGuestbookSyncStatus((prev) => ({
          mode: 'local',
          syncedAt: nowStr,
          apiBase: prev?.apiBase,
        }));
      }
      return ok;
    } catch {
      return false;
    }
  };

  const handleDeleteGuestbook = (id: string) => {
    setGuestbook((prev) => prev.filter((item) => item.id !== id));
  };

  const stampCount = Object.values(visitedQuests).filter(Boolean).length;

  const handleOpenQuest = (id: QuestBuildingId, replaceHistory = false) => {
    const wasAlreadyOpen = Boolean(activeQuest);
    setActiveQuest(id);
    if (replaceHistory || wasAlreadyOpen) {
      replaceNavigationState(screenMode, id);
    } else {
      pushNavigationState(screenMode, id);
    }
    setVisitedQuests((prev) => {
      const next = { ...prev, [id]: true };
      const prevCount = Object.values(prev).filter(Boolean).length;
      const nextCount = Object.values(next).filter(Boolean).length;
      if (prevCount < 7 && nextCount === 7) {
        soundEngine.playFanfare();
        fireCelebrationConfetti({
          particleCount: 55,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      return next;
    });
  };

  const handleToggleBgm = () => {
    const playing = soundEngine.toggleBgm();
    setBgmPlaying(playing);
  };

  const handleSelectEntry = (mode: 'classic' | 'parents', side: CoupleSide) => {
    saveEntryPref(mode, side);
    if (mode === 'parents') {
      soundEngine.stopBgm();
      setBgmPlaying(false);
    }
    setActiveQuest(null);
    setParentsSide(side);
    setScreenMode(mode);
    pushNavigationState(mode, null, side);
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  const handleReturnToEntry = () => {
    soundEngine.playBlip();
    setActiveQuest(null);
    setRandomSide(rollRandomPrimarySide());
    setParentsSide('all');
    setScreenMode('title');
    pushNavigationState('title', null, 'all');
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  const handleStartClassicMode = () => {
    setScreenMode('classic');
    pushNavigationState('classic', null, parentsSide);
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };


  const buildShareTargetUrl = (sideParam: ParentsSideFilter = parentsSide) => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('admin');
      url.searchParams.delete('quest');
      if (sideParam === 'groom' || sideParam === 'bride') {
        url.searchParams.set('side', sideParam);
      } else {
        url.searchParams.delete('side');
      }
      return url.toString();
    } catch {
      return window.location.href;
    }
  };

  const handleShareLink = async () => {
    soundEngine.playCoin();
    const url = buildShareTargetUrl(parentsSide);
    const sidePrefix =
      parentsSide === 'groom'
        ? '[신랑측 초대장] '
        : parentsSide === 'bride'
        ? '[신부측 초대장] '
        : '';
    if (navigator.share) {
      navigator
        .share({
          title: `${sidePrefix}${joinCoupleNames(config, defaultGuestSide)} 결혼합니다`,
          text: `${config.wedding.dateDisplay} ${config.wedding.timeDisplay} · ${config.wedding.venueName}`,
          url,
        })
        .catch(() => {});
    } else {
      await copyTextToClipboard(url);
      setCopiedLink(true);
      showToast('청첩장 링크가 복사되었습니다');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShareKakao = async () => {
    soundEngine.playCoin();
    const url = buildShareTargetUrl(parentsSide);
    const prefix =
      parentsSide === 'groom'
        ? '[신랑측 모바일 청첩장]'
        : parentsSide === 'bride'
        ? '[신부측 모바일 청첩장]'
        : '[모바일 청첩장]';
    const res = await shareViaKakaoTalk(config, url, prefix, defaultGuestSide);
    if (res === 'copied_card') {
      setCopiedKakao(true);
      showToast('카카오톡 초대 문구가 복사되었습니다');
      setTimeout(() => setCopiedKakao(false), 3000);
    }
  };

  const currentBuildingMeta = activeQuest
    ? QUEST_BUILDINGS.find((b) => b.id === activeQuest)
    : null;
  const isPavilionOpen = screenMode === 'world' && Boolean(activeQuest && currentBuildingMeta);
  useBodyScrollLock(isPavilionOpen);
  useEscapeKey(isPavilionOpen, () => {
    soundEngine.playBlip(440);
    closeActiveQuest();
  });

  const navigateAdjacentQuest = (dir: -1 | 1) => {
    if (!activeQuest) return;
    const idx = QUEST_BUILDINGS.findIndex((b) => b.id === activeQuest);
    const nextIdx = (idx + dir + QUEST_BUILDINGS.length) % QUEST_BUILDINGS.length;
    soundEngine.playSelect();
    handleOpenQuest(QUEST_BUILDINGS[nextIdx].id, true);
  };

  const handleStartParentsMode = (side: ParentsSideFilter = parentsSide) => {
    soundEngine.stopBgm();
    setBgmPlaying(false);
    setParentsSide(side);
    setScreenMode('parents');
    pushNavigationState('parents', null, side);
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  return (
    <CoupleOrderProvider primary={defaultGuestSide}>
    <div
      className={`min-h-screen w-full overflow-x-hidden bg-[#f3ede2] text-[#3b2f2f] flex flex-col items-center ${
        screenMode === 'title' ? 'justify-center' : 'justify-start'
      } ${
        screenMode === 'world'
          ? 'pt-1.5 sm:pt-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:pb-3 px-1.5 sm:px-3'
          : 'pt-3 sm:pt-6 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-6 px-2.5 sm:px-4'
      }`}
    >
      <div
        className={`w-full min-w-0 flex flex-col ${
          screenMode === 'parents'
            ? 'max-w-[540px] gap-3'
            : screenMode === 'world'
            ? 'max-w-[520px] gap-1.5'
            : 'max-w-[480px] gap-3'
        }`}
      >
        {/* Top Mode Switcher Bar (Hidden on initial 4-button entry screen and dedicated Parents Mode) */}
        {screenMode !== 'parents' && screenMode !== 'title' && (
          <header
            className={`pixel-card bg-[#fffdf9] flex items-center justify-between gap-1 font-sans ${
              screenMode === 'world' ? 'px-2 py-1.5 sm:px-2.5' : 'px-2.5 py-2 sm:px-3 sm:py-2.5'
            }`}
          >
            {/* Left: Entry Selector & Mode Toggle Pills */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleReturnToEntry}
                title="처음 선택 화면으로"
                className="p-1.5 rounded-full border transition-all shrink-0 bg-[#faf5ec] hover:bg-[#f3e9d8] text-[#5c4d47] border-[#e2d4c0]"
              >
                <Home className="w-3.5 h-3.5" />
              </button>

              <div className="inline-flex rounded-full bg-[#f5efe6] p-0.5 border border-[#e2d4c0]">
                <button
                  onClick={() => {
                    soundEngine.playSelect();
                    setActiveQuest(null);
                    handleStartClassicMode();
                  }}
                  className={`px-1.5 sm:px-2 py-1 rounded-full text-[11px] font-bold flex items-center gap-0.5 sm:gap-1 whitespace-nowrap shrink-0 transition-all ${
                    screenMode === 'classic'
                      ? 'bg-[#3b2f2f] text-[#fffdf9] shadow-sm'
                      : 'text-[#7d6e65] hover:text-[#3b2f2f]'
                  }`}
                >
                  <BookOpen className="w-3 h-3 shrink-0" />
                  <span>일반</span>
                </button>

                <button
                  onClick={() => {
                    soundEngine.playSelect();
                    setActiveQuest(null);
                    setScreenMode('world');
                    pushNavigationState('world', null);
                  }}
                  className={`px-1.5 sm:px-2 py-1 rounded-full text-[11px] font-bold flex items-center gap-0.5 sm:gap-1 whitespace-nowrap shrink-0 transition-all ${
                    screenMode === 'world'
                      ? 'bg-[#d97b84] text-white shadow-sm'
                      : 'text-[#7d6e65] hover:text-[#3b2f2f]'
                  }`}
                >
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>픽셀 가든</span>
                </button>

                <button
                  onClick={() => {
                    soundEngine.playSelect();
                    setActiveQuest(null);
                    handleStartParentsMode();
                  }}
                  title="부모님·어르신 지인 전달용 큰글씨 청첩장"
                  className="px-1.5 sm:px-2 py-1 rounded-full text-[11px] font-bold text-[#7d6e65] hover:text-[#3b2f2f] whitespace-nowrap shrink-0 transition-all"
                >
                  <span>부모님용</span>
                </button>
              </div>
            </div>

            {/* Right: Compact Stamp Badge (in World Mode) + Music-Box BGM */}
            <div className="flex items-center gap-1 shrink-0">
              {screenMode === 'world' && (
                <button
                  onClick={() => {
                    soundEngine.playFanfare();
                    setShowCertificate(true);
                  }}
                  title="가든 산책 스탬프 & 초대권 확인"
                  className={`px-1.5 sm:px-2 py-1 rounded-full text-[10px] font-bold border flex items-center gap-0.5 sm:gap-1 whitespace-nowrap shrink-0 transition-colors ${
                    stampCount >= 3
                      ? 'bg-[#fcf0f1] text-[#b85d67] border-[#d97b84]'
                      : 'bg-[#faf5ec] text-[#5c4d47] border-[#e2d4c0]'
                  }`}
                >
                  <Award className="w-3 h-3 text-[#d97b84] shrink-0" />
                  <span className="hidden min-[420px]:inline">스탬프</span>
                  <span>{stampCount}/7</span>
                </button>
              )}

              <button
                onClick={handleToggleBgm}
                className={`px-1.5 sm:px-2 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors ${
                  bgmPlaying
                    ? 'bg-[#fcf0f1] text-[#b85d67] border-[#e2a3a9]'
                    : 'bg-[#faf5ec] text-[#7d6e65] border-[#e2d4c0]'
                }`}
                title="오르골 웨딩 BGM 켜기/끄기"
              >
                {bgmPlaying ? (
                  <>
                    <Volume2 className="w-3 h-3 animate-pulse" />
                    <span>BGM</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3 h-3" />
                    <span>BGM</span>
                  </>
                )}
              </button>
            </div>
          </header>
        )}

        {/* MAIN VIEWPORT */}
        <main className="w-full min-w-0 space-y-2.5">
          {screenMode === 'world' && activePhase !== 'upcoming' && (
            <WeddingPhaseBanner
              config={config}
              phase={activePhase}
              isPreviewOverride={Boolean(phaseOverride)}
              onResetPreview={() => setPhaseOverride(null)}
              onJumpToSection={(id) => handleOpenQuest(id)}
            />
          )}

          {!isConfigReady ? (
            <div className="pixel-card p-10 bg-[#fffdf9] text-center space-y-2.5 animate-fadeIn">
              <div className="text-[11px] tracking-[0.28em] text-[#c59b6d] font-engSerif uppercase">
                WEDDING INVITATION
              </div>
              <div className="text-base font-bold text-[#3b2f2f]">
                {joinCoupleNames(config, defaultGuestSide, 'fullName', ' ♥ ')}
              </div>
              <p className="text-xs font-sans text-[#8c7a70]">
                최신 청첩장 정보를 불러오는 중입니다...
              </p>
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="pixel-card p-8 bg-[#fffdf9] text-center text-xs font-sans text-[#8c7a70]">
                  청첩장 화면을 불러오는 중입니다...
                </div>
              }
            >
            {screenMode === 'title' && (
              <TitleScreen
                config={config}
                onSelectEntry={handleSelectEntry}
                onSecretTap={handleSecretFooterTap}
              />
            )}

            {screenMode === 'world' && (
              <VillageCanvas
                config={config}
                visitedQuests={visitedQuests}
                guestbook={guestbook}
                onOpenQuest={handleOpenQuest}
                onUnlockTitle={setEarnedTitle}
              />
            )}

            {screenMode === 'classic' && (
              <ClassicWeddingView
                config={config}
                guestbook={guestbook}
                syncStatus={guestbookSyncStatus}
                earnedTitle={earnedTitle}
                initialSide={defaultGuestSide}
                phase={activePhase}
                isPreviewPhase={Boolean(phaseOverride)}
                onResetPhasePreview={() => setPhaseOverride(null)}
                onUnlockTitle={setEarnedTitle}
                onAddGuestbook={handleAddGuestbook}
                onDeleteGuestbook={handleDeleteGuestbook}
                onSwitchToGardenMode={() => {
                  setScreenMode('world');
                  pushNavigationState('world', null);
                  window.scrollTo({
                    top: 0,
                    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
                  });
                }}
              />
            )}

            {screenMode === 'parents' && (
              <ParentsWeddingView
                config={config}
                guestbook={guestbook}
                initialSide={parentsSide}
                onAddGuestbook={handleAddGuestbook}
                onDeleteGuestbook={handleDeleteGuestbook}
              />
            )}
            </Suspense>
          )}
        </main>

        {/* Footer Share, Phase Preview Switcher & Couple Mark (Hidden on initial 4-button entry screen) */}
        {screenMode !== 'title' && (
        <footer className="pixel-card p-3.5 bg-[#fffdf9] space-y-2.5 text-xs font-sans">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div
              onClick={handleSecretFooterTap}
              className="text-xs text-[#6e5d53] select-none cursor-default"
            >
              <strong className="text-[#3b2f2f]">
                {defaultGuestSide === 'bride' ? config.bride.fullName : config.groom.fullName}
              </strong>{' '}
              <span className="text-[#d97b84]">♥</span>{' '}
              <strong className="text-[#3b2f2f]">
                {defaultGuestSide === 'bride' ? config.groom.fullName : config.bride.fullName}
              </strong>{' '}
              ·{' '}
              {config.wedding.year}. {String(config.wedding.month).padStart(2, '0')}.{' '}
              {String(config.wedding.day).padStart(2, '0')}
            </div>

            {screenMode === 'parents' ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleReturnToEntry}
                  className="px-2.5 py-1.5 rounded-full bg-[#fffdf9] hover:bg-[#faf5ec] border border-[#e2d4c0] text-[#7d6e65] text-xs font-semibold shrink-0"
                >
                  처음 화면
                </button>
                <button
                  onClick={handleStartClassicMode}
                  className="px-3 py-1.5 rounded-full bg-[#faf5ec] hover:bg-[#f3e9d8] border border-[#d4b48c] text-[#5c4d47] text-xs font-semibold shrink-0"
                >
                  신랑·신부 지인용 보기
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleShareKakao}
                  className="px-3 py-1.5 rounded-full bg-[#fee500] hover:bg-[#f5dc00] border border-[#dfca00] text-[#191919] text-xs font-bold flex items-center gap-1 transition-colors shrink-0"
                >
                  {copiedKakao ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#2d5a36]" /> 카톡 문구 복사됨
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-3.5 h-3.5" /> 카톡 공유
                    </>
                  )}
                </button>

                <button
                  onClick={handleShareLink}
                  className="px-3 py-1.5 rounded-full bg-[#faf5ec] hover:bg-[#f3e9d8] border border-[#d4b48c] text-[#5c4d47] text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#6b9071]" /> 링크 복사됨
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-[#c59b6d]" /> 링크 공유
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </footer>
        )}
      </div>

      {/* Pavilion Modal (when exploring Pixel Garden Mode) */}
      {screenMode === 'world' && activeQuest && currentBuildingMeta && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={currentBuildingMeta.name}
          onClick={() => {
            soundEngine.playBlip(440);
            closeActiveQuest();
          }}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm overscroll-contain flex items-center justify-center p-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="pixel-card w-full max-w-[480px] max-h-[90vh] bg-[#f7f2e9] flex flex-col overflow-hidden animate-fadeIn"
          >
            {/* Modal Top Header */}
            <div className="p-3.5 bg-[#fffdf9] border-b border-[#e6d5b8] flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <div className="text-[10px] tracking-widest font-sans font-bold text-[#c59b6d]">
                  {currentBuildingMeta.badge} · {currentBuildingMeta.npcName}
                </div>
                <h2 className="text-sm sm:text-base font-bold text-[#3b2f2f] truncate">
                  {currentBuildingMeta.name}
                </h2>
              </div>

              <button
                onClick={() => {
                  soundEngine.playBlip(440);
                  closeActiveQuest();
                }}
                className="px-3 py-1 rounded-full bg-[#faf5ec] hover:bg-[#f3e9d8] border border-[#d4b48c] text-[#5c4d47] text-xs font-sans font-bold flex items-center gap-1 shrink-0"
              >
                <X className="w-3.5 h-3.5" /> 닫기
              </button>
            </div>

            {/* Scrollable Pavilion Content */}
            <div className="p-3 sm:p-4 overflow-y-auto flex-1">
              {activeQuest === 'story' && (
                <StorySection config={config} initialSide={defaultGuestSide} />
              )}
              {activeQuest === 'ceremony' && <CeremonySection config={config} />}
              {activeQuest === 'gallery' && (
                <GallerySection config={config} onUnlockTitle={setEarnedTitle} />
              )}
              {activeQuest === 'location' && <LocationSection config={config} />}
              {activeQuest === 'gift' && (
                <GiftSection config={config} initialSide={defaultGuestSide} />
              )}
              {activeQuest === 'minigame' && (
                <Suspense fallback={null}>
                  <MiniGameSection
                    config={config}
                    earnedTitle={earnedTitle}
                    onUnlockTitle={setEarnedTitle}
                  />
                </Suspense>
              )}
              {activeQuest === 'rsvp' && (
                <RsvpGuestbookSection
                  config={config}
                  guestbook={guestbook}
                  syncStatus={guestbookSyncStatus}
                  earnedTitle={earnedTitle}
                  initialSide={defaultGuestSide}
                  onAddGuestbook={handleAddGuestbook}
                  onDeleteGuestbook={handleDeleteGuestbook}
                />
              )}
            </div>

            {/* Modal Footer: Prev / Return to Garden / Next */}
            <div className="p-2.5 bg-[#fffdf9] border-t border-[#e6d5b8] flex items-center justify-between gap-2 shrink-0 font-sans">
              <button
                onClick={() => navigateAdjacentQuest(-1)}
                className="px-3 py-1.5 rounded-full bg-[#faf5ec] border border-[#e2d4c0] text-[#5c4d47] text-xs font-semibold flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> 이전 카드
              </button>

              <button
                onClick={() => {
                  soundEngine.playBlip(520);
                  closeActiveQuest();
                }}
                className="px-4 py-1.5 rounded-full bg-[#d97b84] text-white text-xs font-bold shadow-sm"
              >
                🌿 정원으로 돌아가기
              </button>

              <button
                onClick={() => navigateAdjacentQuest(1)}
                className="px-3 py-1.5 rounded-full bg-[#faf5ec] border border-[#e2d4c0] text-[#5c4d47] text-xs font-semibold flex items-center gap-1"
              >
                다음 카드 <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showCustomizer && (
        <Suspense fallback={null}>
          <CustomizerModal
            config={config}
            activePhase={activePhase}
            onChangePhasePreview={(next) => setPhaseOverride(next)}
            onUpdateConfig={(nextConfig) => {
              setConfig(nextConfig);
              saveCachedCloudConfig(nextConfig);
            }}
            onClose={() => setShowCustomizer(false)}
          />
        </Suspense>
      )}

      {showCertificate && (
        <Suspense fallback={null}>
          <CertificateModal
            config={config}
            earnedTitle={earnedTitle}
            stampCount={stampCount}
            onClose={() => setShowCertificate(false)}
          />
        </Suspense>
      )}

      <GlobalToast />
    </div>
    </CoupleOrderProvider>
  );
}
export default App;
