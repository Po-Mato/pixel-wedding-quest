import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Volume2,
  VolumeX,
  Sparkles,
  BookOpen,
  Home,
  Wrench,
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

type AppScreenMode = 'title' | 'world' | 'classic';

const STORAGE_CONFIG_KEY = 'pixel_wedding_quest_config_v2';
const STORAGE_GUESTBOOK_KEY = 'pixel_wedding_quest_guestbook_v2';

export function App() {
  const [config, setConfig] = useState<WeddingConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_WEDDING_CONFIG;
  });

  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_GUESTBOOK_KEY);
      if (saved) return JSON.parse(saved);
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
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
    } catch {
      // ignore
    }
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_GUESTBOOK_KEY, JSON.stringify(guestbook));
    } catch {
      // ignore
    }
  }, [guestbook]);

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
    <div className="min-h-screen bg-[#f3ede2] text-[#3b2f2f] flex flex-col items-center justify-start py-3 sm:py-6 px-2.5 sm:px-4">
      <div className="w-full max-w-[480px] flex flex-col gap-3">
        {/* Top Elegant Mode Switcher & Audio Bar */}
        <header className="pixel-card px-3 py-2.5 bg-[#fffdf9] flex items-center justify-between gap-1.5 font-sans">
          {/* Left: Cover & Mode Toggle Pills */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                soundEngine.playBlip();
                setActiveQuest(null);
                setScreenMode('title');
              }}
              title="표지 화면으로"
              className="p-1.5 rounded-full bg-[#faf5ec] hover:bg-[#f3e9d8] text-[#5c4d47] border border-[#e2d4c0]"
            >
              <Home className="w-4 h-4" />
            </button>

            <div className="inline-flex rounded-full bg-[#f5efe6] p-0.5 border border-[#e2d4c0]">
              <button
                onClick={() => {
                  soundEngine.playSelect();
                  setActiveQuest(null);
                  handleStartClassicMode();
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
                  screenMode === 'classic'
                    ? 'bg-[#3b2f2f] text-[#fffdf9] shadow-xs'
                    : 'text-[#7d6e65] hover:text-[#3b2f2f]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>일반 청첩장</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playSelect();
                  setActiveQuest(null);
                  setScreenMode('world');
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
                  screenMode === 'world'
                    ? 'bg-[#d97b84] text-white shadow-xs'
                    : 'text-[#7d6e65] hover:text-[#3b2f2f]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>픽셀 가든</span>
              </button>
            </div>
          </div>

          {/* Right: Music-Box BGM & Customizer */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleBgm}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 transition-colors ${
                bgmPlaying
                  ? 'bg-[#fcf0f1] text-[#b85d67] border-[#e2a3a9]'
                  : 'bg-[#faf5ec] text-[#7d6e65] border-[#e2d4c0]'
              }`}
              title="오르골 웨딩 BGM 켜기/끄기"
            >
              {bgmPlaying ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                  <span>오르골 ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>BGM</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                soundEngine.playSelect();
                setShowCustomizer(true);
              }}
              title="청첩장 내용 편집"
              className="p-1.5 rounded-full bg-[#faf5ec] hover:bg-[#f3e9d8] text-[#7d6e65] border border-[#e2d4c0]"
            >
              <Wrench className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Garden Stamp Bar (Only shown in Pixel Garden Mode) */}
        {screenMode === 'world' && (
          <div className="pixel-card px-3.5 py-2 bg-[#fffdf9] flex items-center justify-between gap-2 font-sans">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[11px] font-bold text-[#5c4d47] shrink-0">
                가든 산책 스탬프 {stampCount}/7
              </span>
              <div className="flex items-center gap-1">
                {QUEST_BUILDINGS.map((b) => {
                  const done = visitedQuests[b.id];
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        soundEngine.playSelect();
                        handleOpenQuest(b.id);
                      }}
                      title={b.name}
                      className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border transition-colors ${
                        done
                          ? 'bg-[#d97b84] text-white border-[#d97b84]'
                          : 'bg-[#faf5ec] text-[#b8a99e] border-[#e2d4c0]'
                      }`}
                    >
                      {done ? '♥' : '·'}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                soundEngine.playFanfare();
                setShowCertificate(true);
              }}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 shrink-0 ${
                stampCount >= 3
                  ? 'bg-[#faf5ec] text-[#b85d67] border-[#d97b84]'
                  : 'bg-[#faf5ec] text-[#9c897e] border-[#e2d4c0]'
              }`}
            >
              <Award className="w-3 h-3" />
              <span>초대권</span>
            </button>
          </div>
        )}

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
              onAddGuestbook={(entry) => setGuestbook((prev) => [entry, ...prev])}
              onSwitchToGardenMode={() => setScreenMode('world')}
            />
          )}
        </main>

        {/* Footer Share & Couple Mark */}
        <footer className="pixel-card p-3.5 bg-[#fffdf9] flex items-center justify-between text-xs">
          <div className="text-xs text-[#6e5d53]">
            <strong className="text-[#3b2f2f]">{config.groom.fullName}</strong>{' '}
            <span className="text-[#d97b84]">♥</span>{' '}
            <strong className="text-[#3b2f2f]">{config.bride.fullName}</strong> · 2027. 05. 22
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
              {activeQuest === 'gallery' && <GallerySection config={config} />}
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
                  onAddGuestbook={(entry) =>
                    setGuestbook((prev) => [entry, ...prev])
                  }
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
