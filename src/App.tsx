import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
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
} from 'lucide-react';
import {
  DEFAULT_WEDDING_CONFIG,
  QUEST_BUILDINGS,
  QuestBuildingId,
  WeddingConfig,
  GuestbookEntry,
} from './data/weddingConfig';
import { soundEngine } from './utils/soundEngine';
import { migrateLegacyProfileTexts, syncAccountHolderNames } from './utils/configSync';
import { TitleScreen } from './components/TitleScreen';
import { VillageCanvas } from './components/VillageCanvas';
import { ClassicWeddingView } from './components/ClassicWeddingView';
import { StorySection } from './components/sections/StorySection';
import { CeremonySection } from './components/sections/CeremonySection';
import { GallerySection } from './components/sections/GallerySection';
import { LocationSection } from './components/sections/LocationSection';
import { GiftSection } from './components/sections/GiftSection';
import { RsvpGuestbookSection } from './components/sections/RsvpGuestbookSection';
import { MiniGameSection } from './components/sections/MiniGameSection';
import { CustomizerModal } from './components/CustomizerModal';
import { CertificateModal } from './components/CertificateModal';
import {
  fetchSyncedGuestbook,
  publishGuestbookEntry,
} from './utils/weddingCloudSync';

type AppScreenMode = 'title' | 'world' | 'classic';

const STORAGE_CONFIG_KEY = 'pixel_wedding_quest_config_v2';
const STORAGE_GUESTBOOK_KEY = 'pixel_wedding_quest_guestbook_v2';

export function App() {
  const [config, setConfig] = useState<WeddingConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as WeddingConfig;
        // Migrate legacy placeholder '김민준 / 이서연' defaults or sync short names if fullName was edited
        const groomFullName =
          parsed.groom?.fullName === '김민준'
            ? DEFAULT_WEDDING_CONFIG.groom.fullName
            : parsed.groom?.fullName || DEFAULT_WEDDING_CONFIG.groom.fullName;
        const brideFullName =
          parsed.bride?.fullName === '이서연'
            ? DEFAULT_WEDDING_CONFIG.bride.fullName
            : parsed.bride?.fullName || DEFAULT_WEDDING_CONFIG.bride.fullName;
        const groomName =
          !parsed.groom?.name || parsed.groom.name === '민준'
            ? groomFullName.length >= 2
              ? groomFullName.slice(-2)
              : groomFullName
            : parsed.groom.name;
        const brideName =
          !parsed.bride?.name || parsed.bride.name === '서연'
            ? brideFullName.length >= 2
              ? brideFullName.slice(-2)
              : brideFullName
            : parsed.bride.name;
        const isLegacyVenue =
          parsed.wedding?.venueName === '아르카디아 보타닉 가든 채플';
        const merged: WeddingConfig = {
          ...DEFAULT_WEDDING_CONFIG,
          ...parsed,
          groom: {
            ...DEFAULT_WEDDING_CONFIG.groom,
            ...parsed.groom,
            fullName: groomFullName,
            name: groomName,
          },
          bride: {
            ...DEFAULT_WEDDING_CONFIG.bride,
            ...parsed.bride,
            fullName: brideFullName,
            name: brideName,
          },
          wedding: isLegacyVenue
            ? DEFAULT_WEDDING_CONFIG.wedding
            : { ...DEFAULT_WEDDING_CONFIG.wedding, ...parsed.wedding },
          // 퀴즈는 관리자 편집 항목이 아니므로 항상 최신 템플릿({groom}/{bride} 토큰)을 사용
          quiz: DEFAULT_WEDDING_CONFIG.quiz,
          initialGuestbook: DEFAULT_WEDDING_CONFIG.initialGuestbook,
        };
        // 샘플 이름이 남아 있는 계좌 예금주·소개 문구를 현재 성함 기준으로 정리
        const legacySample: WeddingConfig = {
          ...DEFAULT_WEDDING_CONFIG,
          groom: { ...DEFAULT_WEDDING_CONFIG.groom, fullName: '김민준' },
          bride: { ...DEFAULT_WEDDING_CONFIG.bride, fullName: '이서연' },
        };
        return migrateLegacyProfileTexts(
          syncAccountHolderNames(
            legacySample,
            syncAccountHolderNames(DEFAULT_WEDDING_CONFIG, merged)
          )
        );
      }
    } catch {
      // fallback
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

  const [screenMode, setScreenMode] = useState<AppScreenMode>('title');
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
    try {
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
    } catch {
      // ignore
    }

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
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute(
        'content',
        `${config.wedding.dateDisplay} ${config.wedding.timeDisplay} · ${config.wedding.venueName} ${config.wedding.hallName} | 소중한 분들을 초대합니다`
      );
    }
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_GUESTBOOK_KEY, JSON.stringify(guestbook));
    } catch {
      // ignore
    }
  }, [guestbook]);

  // Initial Cloud D1 + BroadcastChannel Sync for Guestbook
  useEffect(() => {
    fetchSyncedGuestbook(guestbook).then(({ entries }) => {
      if (entries.length > guestbook.length) {
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
    setGuestbook((prev) => [entry, ...prev]);
    publishGuestbookEntry(entry).catch(() => {});
  };

  const stampCount = Object.values(visitedQuests).filter(Boolean).length;

  const handleOpenQuest = (id: QuestBuildingId) => {
    setActiveQuest(id);
    setVisitedQuests((prev) => {
      const next = { ...prev, [id]: true };
      const prevCount = Object.values(prev).filter(Boolean).length;
      const nextCount = Object.values(next).filter(Boolean).length;
      if (prevCount < 7 && nextCount === 7) {
        soundEngine.playFanfare();
        try {
          confetti({
            particleCount: 55,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#e899a0', '#d4af7a', '#84a98c'],
          });
        } catch {
          // ignore
        }
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
  };

  const handleStartClassicMode = () => {
    setScreenMode('classic');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShareLink = () => {
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
      navigator.clipboard?.writeText(url).catch(() => {});
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
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
    handleOpenQuest(QUEST_BUILDINGS[nextIdx].id);
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
          screenMode === 'world' ? 'max-w-[520px] gap-1.5' : 'max-w-[480px] gap-3'
        }`}
      >
        {/* Top Elegant Mode Switcher & Audio Bar (Ultra-slim in World Mode) */}
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
              }}
              title="표지 화면으로"
              className="p-1.5 rounded-full bg-[#faf5ec] hover:bg-[#f3e9d8] text-[#5c4d47] border border-[#e2d4c0]"
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
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                  screenMode === 'classic'
                    ? 'bg-[#3b2f2f] text-[#fffdf9] shadow-xs'
                    : 'text-[#7d6e65] hover:text-[#3b2f2f]'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>일반 청첩장</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playSelect();
                  setActiveQuest(null);
                  setScreenMode('world');
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                  screenMode === 'world'
                    ? 'bg-[#d97b84] text-white shadow-xs'
                    : 'text-[#7d6e65] hover:text-[#3b2f2f]'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>픽셀 가든</span>
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

        {/* MAIN VIEWPORT */}
        <main className="w-full">
          {screenMode === 'title' && (
            <TitleScreen
              config={config}
              onStartWorldMode={handleStartWorldMode}
              onStartClassicMode={handleStartClassicMode}
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
              onUnlockTitle={setEarnedTitle}
              onAddGuestbook={handleAddGuestbook}
              onSwitchToGardenMode={() => setScreenMode('world')}
            />
          )}
        </main>

        {/* Footer Share & Couple Mark (5-tap secret trigger for Admin Console) */}
        <footer className="pixel-card p-3.5 bg-[#fffdf9] flex items-center justify-between text-xs">
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

          <button
            onClick={handleShareLink}
            className="px-3.5 py-1.5 rounded-full bg-[#faf5ec] hover:bg-[#f3e9d8] border border-[#d4b48c] text-[#5c4d47] text-xs font-sans font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#6b9071]" /> 링크 복사됨
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-[#c59b6d]" /> 청첩장 공유하기
              </>
            )}
          </button>
        </footer>
      </div>

      {/* Pavilion Modal (when exploring Pixel Garden Mode) */}
      {screenMode === 'world' && activeQuest && currentBuildingMeta && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
          <div className="pixel-card w-full max-w-[480px] max-h-[90vh] bg-[#f7f2e9] flex flex-col overflow-hidden animate-fadeIn">
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
                  setActiveQuest(null);
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
                <MiniGameSection
                  config={config}
                  earnedTitle={earnedTitle}
                  onUnlockTitle={setEarnedTitle}
                />
              )}
              {activeQuest === 'rsvp' && (
                <RsvpGuestbookSection
                  config={config}
                  guestbook={guestbook}
                  earnedTitle={earnedTitle}
                  onAddGuestbook={handleAddGuestbook}
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
                  setActiveQuest(null);
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
        <CustomizerModal
          config={config}
          onUpdateConfig={setConfig}
          onClose={() => setShowCustomizer(false)}
        />
      )}

      {showCertificate && (
        <CertificateModal
          config={config}
          earnedTitle={earnedTitle}
          stampCount={stampCount}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
}
export default App;
