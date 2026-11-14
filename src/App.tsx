import React, { useState, useEffect, Suspense } from 'react';
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
import { fireCelebrationConfetti } from './utils/motion';
import { shareViaKakaoTalk } from './utils/kakaoShare';
import { detectWeddingPhase, WeddingPhase } from './utils/weddingPhase';
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

function detectInitialScreenMode(): AppScreenMode {
  try {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode') || params.get('target');
    if (mode === 'parents' || window.location.hash === '#parents') {
      return 'parents';
    }
    if (mode === 'title' || mode === 'cover') return 'title';
    if (mode === 'world' || mode === 'garden') return 'world';
    if (mode === 'classic') return 'classic';
  } catch {
    // ignore
  }
  return 'classic';
}

function detectInitialParentsSide(): ParentsSideFilter {
  try {
    const params = new URLSearchParams(window.location.search);
    const side = params.get('side');
    if (side === 'groom' || side === 'bride') return side;
  } catch {
    // ignore
  }
  return 'all';
}

export function App() {
  // 모든 청첩장 설정은 src/data/wedding.json 단일 파일에서 불러오며,
  // 이전 버전의 브라우저 localStorage 캐시가 덮어쓰지 않도록 정리합니다.
  const [config, setConfig] = useState<WeddingConfig>(() => {
    try {
      localStorage.removeItem('pixel_wedding_quest_config_v2');
      localStorage.removeItem('pixel_wedding_quest_config_v1');
    } catch {
      // ignore
    }
    return DEFAULT_WEDDING_CONFIG;
  });

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

  const [screenMode, setScreenMode] = useState<AppScreenMode>(detectInitialScreenMode);
  const [parentsSide, setParentsSide] = useState<ParentsSideFilter>(detectInitialParentsSide);
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
    document.title = `${config.groom.fullName} ♥ ${config.bride.fullName} 모바일 청첩장 | ${dateDot}`;

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute(
        'content',
        `${config.groom.fullName} ♥ ${config.bride.fullName} 결혼합니다 | ${dateDot}`
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
  }, [config]);

  // Synchronize screenMode & activeQuest with browser History API so mobile 'Back' button
  // closes modals or returns to the cover instead of exiting the KakaoTalk in-app browser
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state as {
        screenMode?: AppScreenMode;
        activeQuest?: QuestBuildingId | null;
      } | null;
      if (state && state.screenMode) {
        setScreenMode(state.screenMode);
        setActiveQuest(state.activeQuest || null);
      } else {
        setActiveQuest(null);
        setScreenMode(detectInitialScreenMode());
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const buildNavigationUrl = (nextMode: AppScreenMode) => {
    const url = new URL(window.location.href);
    if (nextMode === 'classic') {
      url.searchParams.delete('mode');
    } else {
      url.searchParams.set('mode', nextMode);
    }
    return url.toString();
  };

  const pushNavigationState = (
    nextMode: AppScreenMode,
    nextQuest: QuestBuildingId | null = null
  ) => {
    try {
      window.history.pushState(
        { screenMode: nextMode, activeQuest: nextQuest },
        '',
        buildNavigationUrl(nextMode)
      );
    } catch {
      // ignore
    }
  };

  const replaceNavigationState = (
    nextMode: AppScreenMode,
    nextQuest: QuestBuildingId | null = null
  ) => {
    try {
      window.history.replaceState(
        { screenMode: nextMode, activeQuest: nextQuest },
        '',
        buildNavigationUrl(nextMode)
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
    fetchCloudWeddingConfig().then((remoteConfig) => {
      if (remoteConfig && remoteConfig.groom?.fullName && remoteConfig.bride?.fullName) {
        setConfig(remoteConfig);
      }
    });

    fetchSyncedGuestbook(DEFAULT_WEDDING_CONFIG.initialGuestbook).then(({ entries }) => {
      if (entries.length > 0) {
        setGuestbook(entries);
      }
    });

    if (typeof BroadcastChannel === 'undefined') return;
    let bc: BroadcastChannel | null = null;
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
    return () => {
      try {
        bc?.close();
      } catch {
        // ignore
      }
    };
  }, []);

  const handleAddGuestbook = (entry: GuestbookEntry) => {
    const tempId = entry.id;
    setGuestbook((prev) => [entry, ...prev]);
    publishGuestbookEntry(entry)
      .then(({ savedEntry }) => {
        setGuestbook((prev) =>
          prev.map((item) => (item.id === tempId ? savedEntry : item))
        );
      })
      .catch(() => {});
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

  const handleStartWorldMode = (withBgm: boolean) => {
    if (withBgm) {
      soundEngine.setMuted(false);
      soundEngine.startBgm();
      setBgmPlaying(true);
    } else {
      soundEngine.stopBgm();
      setBgmPlaying(false);
    }
    setScreenMode('world');
    pushNavigationState('world', null);
  };

  const handleStartClassicMode = () => {
    setScreenMode('classic');
    pushNavigationState('classic', null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShareLink = async () => {
    soundEngine.playCoin();
    const url = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: `${config.groom.fullName} ♥ ${config.bride.fullName} 결혼합니다`,
          text: `${config.wedding.dateDisplay} ${config.wedding.timeDisplay} · ${config.wedding.venueName}`,
          url,
        })
        .catch(() => {});
    } else {
      await copyTextToClipboard(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShareKakao = async () => {
    soundEngine.playCoin();
    const res = await shareViaKakaoTalk(config);
    if (res === 'copied_card') {
      setCopiedKakao(true);
      setTimeout(() => setCopiedKakao(false), 3000);
    }
  };

  const currentBuildingMeta = activeQuest
    ? QUEST_BUILDINGS.find((b) => b.id === activeQuest)
    : null;

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
    pushNavigationState('parents', null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className={`min-h-screen bg-[#f3ede2] text-[#3b2f2f] flex flex-col items-center justify-start ${
        screenMode === 'world'
          ? 'py-1.5 sm:py-3 px-1.5 sm:px-3'
          : 'py-3 sm:py-6 px-2.5 sm:px-4'
      }`}
    >
      <div
        className={`w-full flex flex-col ${
          screenMode === 'parents'
            ? 'max-w-[540px] gap-3'
            : screenMode === 'world'
            ? 'max-w-[520px] gap-1.5'
            : 'max-w-[480px] gap-3'
        }`}
      >
        {/* Top Mode Switcher Bar (Hidden in dedicated Parents Mode to keep senior UX distraction-free) */}
        {screenMode !== 'parents' && (
          <header
            className={`pixel-card bg-[#fffdf9] flex items-center justify-between gap-1 font-sans ${
              screenMode === 'world' ? 'px-2.5 py-1.5' : 'px-3 py-2.5'
            }`}
          >
            {/* Left: Cover & Mode Toggle Pills */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  soundEngine.playBlip();
                  setActiveQuest(null);
                  setScreenMode('title');
                  pushNavigationState('title', null);
                }}
                title="표지 화면으로"
                className={`p-1.5 rounded-full border transition-all ${
                  screenMode === 'title'
                    ? 'bg-[#3b2f2f] text-[#fffdf9] border-[#3b2f2f] shadow-xs'
                    : 'bg-[#faf5ec] hover:bg-[#f3e9d8] text-[#5c4d47] border-[#e2d4c0]'
                }`}
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
                  className={`px-2 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                    screenMode === 'classic'
                      ? 'bg-[#3b2f2f] text-[#fffdf9] shadow-xs'
                      : 'text-[#7d6e65] hover:text-[#3b2f2f]'
                  }`}
                >
                  <BookOpen className="w-3 h-3" />
                  <span>일반</span>
                </button>

                <button
                  onClick={() => {
                    soundEngine.playSelect();
                    setActiveQuest(null);
                    setScreenMode('world');
                    pushNavigationState('world', null);
                  }}
                  className={`px-2 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                    screenMode === 'world'
                      ? 'bg-[#d97b84] text-white shadow-xs'
                      : 'text-[#7d6e65] hover:text-[#3b2f2f]'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>픽셀 가든</span>
                </button>

                <button
                  onClick={() => {
                    soundEngine.playSelect();
                    setActiveQuest(null);
                    handleStartParentsMode();
                  }}
                  title="부모님·어르신 지인 전달용 큰글씨 청첩장"
                  className="px-2 py-1 rounded-full text-[11px] font-bold text-[#7d6e65] hover:text-[#3b2f2f] transition-all"
                >
                  <span>부모님용</span>
                </button>
              </div>
            </div>

            {/* Right: Compact Stamp Badge (in World Mode) + Music-Box BGM */}
            <div className="flex items-center gap-1">
              {screenMode === 'world' && (
                <button
                  onClick={() => {
                    soundEngine.playFanfare();
                    setShowCertificate(true);
                  }}
                  title="가든 산책 스탬프 & 초대권 확인"
                  className={`px-2 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 shrink-0 transition-colors ${
                    stampCount >= 3
                      ? 'bg-[#fcf0f1] text-[#b85d67] border-[#d97b84]'
                      : 'bg-[#faf5ec] text-[#5c4d47] border-[#e2d4c0]'
                  }`}
                >
                  <Award className="w-3 h-3 text-[#d97b84]" />
                  <span>스탬프 {stampCount}/7</span>
                </button>
              )}

              <button
                onClick={handleToggleBgm}
                className={`px-2 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 transition-colors ${
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
        <main className="w-full space-y-2.5">
          {screenMode === 'world' && activePhase !== 'upcoming' && (
            <WeddingPhaseBanner
              config={config}
              phase={activePhase}
              isPreviewOverride={Boolean(phaseOverride)}
              onResetPreview={() => setPhaseOverride(null)}
              onJumpToSection={(id) => handleOpenQuest(id)}
            />
          )}

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
                onStartWorldMode={handleStartWorldMode}
                onStartClassicMode={handleStartClassicMode}
                onStartParentsMode={() => handleStartParentsMode('all')}
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
                earnedTitle={earnedTitle}
                phase={activePhase}
                isPreviewPhase={Boolean(phaseOverride)}
                onResetPhasePreview={() => setPhaseOverride(null)}
                onUnlockTitle={setEarnedTitle}
                onAddGuestbook={handleAddGuestbook}
                onDeleteGuestbook={handleDeleteGuestbook}
                onSwitchToGardenMode={() => {
                  setScreenMode('world');
                  pushNavigationState('world', null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
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
        </main>

        {/* Footer Share, Phase Preview Switcher & Couple Mark (5-tap secret trigger for Admin Console) */}
        <footer className="pixel-card p-3.5 bg-[#fffdf9] space-y-2.5 text-xs font-sans">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div
              onClick={handleSecretFooterTap}
              className="text-xs text-[#6e5d53] select-none cursor-default"
            >
              <strong className="text-[#3b2f2f]">{config.groom.fullName}</strong>{' '}
              <span className="text-[#d97b84]">♥</span>{' '}
              <strong className="text-[#3b2f2f]">{config.bride.fullName}</strong> ·{' '}
              {config.wedding.year}. {String(config.wedding.month).padStart(2, '0')}.{' '}
              {String(config.wedding.day).padStart(2, '0')}
            </div>

            {screenMode === 'parents' ? (
              <button
                onClick={handleStartClassicMode}
                className="px-3 py-1.5 rounded-full bg-[#faf5ec] hover:bg-[#f3e9d8] border border-[#d4b48c] text-[#5c4d47] text-xs font-semibold shrink-0"
              >
                신랑·신부 지인용 보기
              </button>
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

          {screenMode !== 'parents' && (
            <div className="pt-2 border-t border-[#efe6d8] flex items-center justify-between gap-2 text-[11px] text-[#8c7a70]">
              <span>시점별 화면 미리보기</span>
              <div className="inline-flex rounded-full bg-[#faf5ec] p-0.5 border border-[#e2d4c0]">
                {[
                  { id: 'upcoming' as const, label: '예식 전(기본)' },
                  { id: 'dday' as const, label: '💍 예식 당일' },
                  { id: 'post' as const, label: '💐 예식 후 감사장' },
                ].map((item) => {
                  const isCurrent = activePhase === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playBlip();
                        setPhaseOverride(item.id === 'upcoming' ? null : item.id);
                        if (screenMode === 'title') {
                          handleStartClassicMode();
                        }
                      }}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                        isCurrent
                          ? 'bg-[#3b2f2f] text-white'
                          : 'text-[#7d6e65] hover:text-[#3b2f2f]'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </footer>
      </div>

      {/* Pavilion Modal (when exploring Pixel Garden Mode) */}
      {screenMode === 'world' && activeQuest && currentBuildingMeta && (
        <div
          onClick={() => {
            soundEngine.playBlip(440);
            closeActiveQuest();
          }}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4"
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
              {activeQuest === 'story' && <StorySection config={config} />}
              {activeQuest === 'ceremony' && <CeremonySection config={config} />}
              {activeQuest === 'gallery' && (
                <GallerySection config={config} onUnlockTitle={setEarnedTitle} />
              )}
              {activeQuest === 'location' && <LocationSection config={config} />}
              {activeQuest === 'gift' && <GiftSection config={config} />}
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
                  earnedTitle={earnedTitle}
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
                className="px-4 py-1.5 rounded-full bg-[#d97b84] text-white text-xs font-bold shadow-xs"
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
            onUpdateConfig={setConfig}
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
    </div>
  );
}
export default App;
