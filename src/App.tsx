import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Volume2,
  VolumeX,
  Gamepad2,
  ScrollText,
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
import { StorySection } from './components/sections/StorySection';
import { CeremonySection } from './components/sections/CeremonySection';
import { GallerySection } from './components/sections/GallerySection';
import { LocationSection } from './components/sections/LocationSection';
import { GiftSection } from './components/sections/GiftSection';
import { RsvpGuestbookSection } from './components/sections/RsvpGuestbookSection';
import { MiniGameSection } from './components/sections/MiniGameSection';
import { CustomizerModal } from './components/CustomizerModal';
import { CertificateModal } from './components/CertificateModal';

type AppScreenMode = 'title' | 'world' | 'scroll';

const STORAGE_CONFIG_KEY = 'pixel_wedding_quest_config_v1';
const STORAGE_GUESTBOOK_KEY = 'pixel_wedding_quest_guestbook_v1';

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

  // Persist config & guestbook
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
          confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
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

  const handleStartScrollMode = () => {
    setScreenMode('scroll');
    // Mark main quests as visited when browsing scroll mode
    setVisitedQuests((prev) => ({
      ...prev,
      story: true,
      ceremony: true,
      gallery: true,
      location: true,
      gift: true,
      rsvp: true,
    }));
  };

  const handleShareLink = () => {
    soundEngine.playCoin();
    const url = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: `💍 ${config.groom.name} ♥ ${config.bride.name}의 모바일 웨딩 퀘스트`,
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
    <div className="min-h-screen bg-[#0d0917] text-[#fff8e7] flex flex-col items-center justify-start py-2 sm:py-6 px-2 sm:px-4">
      {/* Handheld Game Console Outer Shell */}
      <div className="w-full max-w-[480px] flex flex-col gap-2.5">
        {/* Top Console Header Bar */}
        <header className="pixel-box px-3 py-2 bg-[#1c152e] flex items-center justify-between gap-1.5">
          {/* Left: Home & Mode Switcher */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                soundEngine.playBlip();
                setActiveQuest(null);
                setScreenMode('title');
              }}
              title="타이틀 화면으로"
              className="pixel-btn bg-[#2e2448] text-[#ffd541] p-1.5"
            >
              <Home className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                soundEngine.playSelect();
                setActiveQuest(null);
                setScreenMode('world');
              }}
              className={`pixel-btn px-2.5 py-1 text-xs font-extrabold flex items-center gap-1 ${
                screenMode === 'world'
                  ? 'bg-[#ff5277] text-white'
                  : 'bg-[#151024] text-[#a599b8]'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>마을탐험</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playSelect();
                setActiveQuest(null);
                handleStartScrollMode();
              }}
              className={`pixel-btn px-2.5 py-1 text-xs font-extrabold flex items-center gap-1 ${
                screenMode === 'scroll'
                  ? 'bg-[#ffd541] text-[#120d1e]'
                  : 'bg-[#151024] text-[#a599b8]'
              }`}
            >
              <ScrollText className="w-3.5 h-3.5" />
              <span>한눈에보기</span>
            </button>
          </div>

          {/* Right: BGM & Customizer */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleBgm}
              className={`pixel-btn px-2 py-1 text-[11px] font-extrabold flex items-center gap-1 ${
                bgmPlaying
                  ? 'bg-[#38d9a9] text-[#120d1e]'
                  : 'bg-[#151024] text-[#a599b8]'
              }`}
              title="8-Bit 웨딩 칩튠 BGM 켜기/끄기"
            >
              {bgmPlaying ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                  <span>8-BIT ON</span>
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
              title="청첩장 내용 커스텀 편집"
              className="pixel-btn bg-[#2e2448] text-[#ffd541] p-1.5"
            >
              <Wrench className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Quest Stamp Tracker Bar (Shown in World & Scroll modes) */}
        {screenMode !== 'title' && (
          <div className="pixel-box px-3 py-2 bg-[#181229] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[11px] font-extrabold text-[#ffd541] shrink-0">
                스탬프 {stampCount}/7
              </span>
              <div className="flex items-center gap-1">
                {QUEST_BUILDINGS.map((b) => {
                  const done = visitedQuests[b.id];
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        soundEngine.playSelect();
                        if (screenMode === 'world') {
                          handleOpenQuest(b.id);
                        } else {
                          document
                            .getElementById(`section-${b.id}`)
                            ?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      title={b.name}
                      className={`w-5 h-5 text-[10px] font-bold flex items-center justify-center border ${
                        done
                          ? 'bg-[#38d9a9] text-[#120d1e] border-[#120d1e]'
                          : 'bg-[#120d1e] text-[#a599b8] border-[#362b52]'
                      }`}
                    >
                      {done ? '★' : '·'}
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
              className={`pixel-btn px-2 py-1 text-[10px] font-extrabold flex items-center gap-1 shrink-0 ${
                stampCount >= 3
                  ? 'bg-[#ffd541] text-[#120d1e] animate-pulse'
                  : 'bg-[#2e2448] text-[#c3b8d9]'
              }`}
            >
              <Award className="w-3 h-3" />
              <span>인증서</span>
            </button>
          </div>
        )}

        {/* MAIN VIEWPORT */}
        <main className="w-full">
          {screenMode === 'title' && (
            <TitleScreen
              config={config}
              onStartWorldMode={handleStartWorldMode}
              onStartScrollMode={handleStartScrollMode}
            />
          )}

          {screenMode === 'world' && (
            <VillageCanvas
              config={config}
              visitedQuests={visitedQuests}
              guestbook={guestbook}
              onOpenQuest={handleOpenQuest}
            />
          )}

          {screenMode === 'scroll' && (
            <div className="space-y-6">
              {/* Sticky Quick-Jump Bar for Scroll Mode */}
              <div className="sticky top-1 z-30 pixel-box p-2 bg-[#161124]/95 backdrop-blur flex items-center justify-between gap-1 overflow-x-auto">
                {QUEST_BUILDINGS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      soundEngine.playBlip();
                      document
                        .getElementById(`section-${b.id}`)
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="pixel-btn bg-[#2e2448] hover:bg-[#ffd541] hover:text-[#120d1e] text-white px-2 py-1 text-[11px] font-bold shrink-0"
                  >
                    {b.shortName}
                  </button>
                ))}
              </div>

              <section id="section-story">
                <StorySection config={config} />
              </section>

              <section id="section-ceremony">
                <CeremonySection config={config} />
              </section>

              <section id="section-gallery">
                <GallerySection config={config} />
              </section>

              <section id="section-location">
                <LocationSection config={config} />
              </section>

              <section id="section-gift">
                <GiftSection config={config} />
              </section>

              <section id="section-minigame">
                <MiniGameSection
                  config={config}
                  earnedTitle={earnedTitle}
                  onUnlockTitle={setEarnedTitle}
                />
              </section>

              <section id="section-rsvp">
                <RsvpGuestbookSection
                  config={config}
                  guestbook={guestbook}
                  earnedTitle={earnedTitle}
                  onAddGuestbook={(entry) =>
                    setGuestbook((prev) => [entry, ...prev])
                  }
                />
              </section>
            </div>
          )}
        </main>

        {/* Footer Share & Copyright */}
        <footer className="pixel-box p-3 bg-[#161124] flex items-center justify-between text-xs">
          <div className="text-[11px] text-[#a599b8]">
            💍 <strong className="text-[#ffd541]">{config.groom.name} ♥ {config.bride.name}</strong> · 2027.05.22
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareLink}
              className="pixel-btn bg-[#38d9a9] text-[#120d1e] px-3 py-1 text-[11px] font-extrabold flex items-center gap-1"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" /> 링크 복사됨!
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" /> 청첩장 공유하기
                </>
              )}
            </button>
          </div>
        </footer>
      </div>

      {/* RPG Building Quest Modal (when exploring World Mode) */}
      {screenMode === 'world' && activeQuest && currentBuildingMeta && (
        <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-2.5 sm:p-4">
          <div className="pixel-box-gold w-full max-w-[480px] max-h-[90vh] bg-[#161124] flex flex-col overflow-hidden animate-fadeIn">
            {/* Modal Top RPG Dialogue Header */}
            <div className="p-3 bg-[#261e3d] border-b-2 border-[#ffd541] flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <div className="text-[10px] font-extrabold text-[#38d9a9]">
                  {currentBuildingMeta.badge} · NPC {currentBuildingMeta.npcName}
                </div>
                <h2 className="text-sm sm:text-base font-extrabold text-[#ffd541] truncate">
                  {currentBuildingMeta.name}
                </h2>
              </div>

              <button
                onClick={() => {
                  soundEngine.playBlip(440);
                  setActiveQuest(null);
                }}
                className="pixel-btn bg-[#ff5277] text-white px-2.5 py-1 text-xs font-extrabold flex items-center gap-1 shrink-0"
              >
                <X className="w-3.5 h-3.5" /> 닫기
              </button>
            </div>

            {/* Scrollable Quest Content */}
            <div className="p-3.5 sm:p-4 overflow-y-auto flex-1">
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

            {/* Modal Footer: Prev / Return to Map / Next Building */}
            <div className="p-2.5 bg-[#221b36] border-t-2 border-[#ffd541] flex items-center justify-between gap-2 shrink-0">
              <button
                onClick={() => navigateAdjacentQuest(-1)}
                className="pixel-btn bg-[#2e2448] text-[#e9ecef] px-2.5 py-1.5 text-xs font-bold flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> 이전 건물
              </button>

              <button
                onClick={() => {
                  soundEngine.playBlip(520);
                  setActiveQuest(null);
                }}
                className="pixel-btn bg-[#ffd541] text-[#120d1e] px-3 py-1.5 text-xs font-extrabold"
              >
                🗺️ 마을 광장으로
              </button>

              <button
                onClick={() => navigateAdjacentQuest(1)}
                className="pixel-btn bg-[#2e2448] text-[#e9ecef] px-2.5 py-1.5 text-xs font-bold flex items-center gap-1"
              >
                다음 건물 <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Customizer Modal */}
      {showCustomizer && (
        <CustomizerModal
          config={config}
          onUpdateConfig={setConfig}
          onClose={() => setShowCustomizer(false)}
        />
      )}

      {/* Honorary Party Member Certificate Modal */}
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
