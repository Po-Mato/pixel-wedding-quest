import React, { useState, useEffect, Suspense } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Image as ImageIcon, ArrowUp } from 'lucide-react';
import {
  WeddingConfig,
  GuestbookEntry,
  QUEST_BUILDINGS,
  QuestBuildingId,
} from '../data/weddingConfig';
import {
  PIXEL_ASSETS,
  GroomSprite,
  BrideSprite,
  PetCatSprite,
  PixelRing,
  PixelHeart,
} from './PixelSprites';
import { StorySection } from './sections/StorySection';
import { CeremonySection } from './sections/CeremonySection';
import { GallerySection } from './sections/GallerySection';
import { LocationSection } from './sections/LocationSection';
import { GiftSection } from './sections/GiftSection';
import { RsvpGuestbookSection } from './sections/RsvpGuestbookSection';
import { WeddingPhaseBanner } from './WeddingPhaseBanner';
import { WeddingPhase } from '../utils/weddingPhase';
import { CloudSyncStatus } from '../utils/weddingCloudSync';
import { prefersReducedMotion } from '../utils/motion';
import { soundEngine } from '../utils/soundEngine';
import { useCoupleOrder } from '../utils/coupleOrder';

const MiniGameSection = React.lazy(() =>
  import('./sections/MiniGameSection').then((m) => ({ default: m.MiniGameSection }))
);

interface ClassicWeddingViewProps {
  config: WeddingConfig;
  guestbook: GuestbookEntry[];
  syncStatus?: CloudSyncStatus | null;
  earnedTitle: string | null;
  initialSide?: 'groom' | 'bride';
  phase?: WeddingPhase;
  isPreviewPhase?: boolean;
  onResetPhasePreview?: () => void;
  onUnlockTitle: (title: string) => void;
  onAddGuestbook: (entry: GuestbookEntry) => Promise<boolean> | boolean | void;
  onDeleteGuestbook?: (id: string) => void;
  onSwitchToGardenMode: () => void;
}

const NAV_SECTION_IDS: QuestBuildingId[] = [
  'story',
  'ceremony',
  'gallery',
  'location',
  'gift',
  'rsvp',
];

export const ClassicWeddingView: React.FC<ClassicWeddingViewProps> = ({
  config,
  guestbook,
  syncStatus,
  earnedTitle,
  initialSide = 'groom',
  phase = 'upcoming',
  isPreviewPhase = false,
  onResetPhasePreview,
  onUnlockTitle,
  onAddGuestbook,
  onDeleteGuestbook,
  onSwitchToGardenMode,
}) => {
  const [showBonusEvent, setShowBonusEvent] = useState(false);
  const [heroStyle, setHeroStyle] = useState<'pixel' | 'photo'>('pixel');
  const [activeSectionId, setActiveSectionId] = useState<QuestBuildingId | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { primary, pair } = useCoupleOrder();
  const [firstName, secondName] = pair(config.groom.fullName, config.bride.fullName);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowScrollTop(scrollY > 420);

      if (scrollY < 260) {
        setActiveSectionId(null);
        return;
      }

      const triggerLine = window.innerHeight * 0.32;
      let current: QuestBuildingId | null = 'story';
      for (const id of NAV_SECTION_IDS) {
        const el = document.getElementById(`classic-${id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= triggerLine) {
            current = id;
          }
        }
      }
      setActiveSectionId(current);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToClassicSection = (sectionId: QuestBuildingId) => {
    setActiveSectionId(sectionId);
    document.getElementById(`classic-${sectionId}`)?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  return (
    <div className="space-y-5">
      {phase !== 'upcoming' && (
        <WeddingPhaseBanner
          config={config}
          phase={phase}
          isPreviewOverride={isPreviewPhase}
          onResetPreview={onResetPhasePreview}
          onJumpToSection={scrollToClassicSection}
        />
      )}

      {/* Classic Editorial Hero Cover Card */}
      <div className="pixel-card bg-[#fffdf9] overflow-hidden text-center">
        <div className="pt-8 pb-4 px-6">
          <div className="text-[11px] tracking-[0.32em] text-[#c59b6d] font-engSerif uppercase">
            THE MARRIAGE OF
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[0.2em] text-[#3b2f2f] mt-2">
            {firstName}{' '}
            <span className="text-[#d97b84] text-lg align-middle mx-1">·</span>{' '}
            {secondName}
          </h1>
          <p className="text-xs text-[#8c7a70] mt-2 font-engSerif italic tracking-wider">
            {config.wedding.year}. {String(config.wedding.month).padStart(2, '0')}.{' '}
            {String(config.wedding.day).padStart(2, '0')} ({config.wedding.dayOfWeek}) ·{' '}
            {config.wedding.timeDisplay}
          </p>

          {/* Cover Illustration / Photo Switch */}
          <div className="flex justify-center mt-3 font-sans">
            <div className="inline-flex rounded-full bg-[#faf5ec] p-0.5 border border-[#e6d5b8]">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playBlip();
                  setHeroStyle('pixel');
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                  heroStyle === 'pixel'
                    ? 'bg-[#d97b84] text-white shadow-2xs'
                    : 'text-[#7d6e65] hover:text-[#3b2f2f]'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>픽셀 웨딩 일러스트</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playBlip();
                  setHeroStyle('photo');
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                  heroStyle === 'photo'
                    ? 'bg-[#3b2f2f] text-white shadow-2xs'
                    : 'text-[#7d6e65] hover:text-[#3b2f2f]'
                }`}
              >
                <ImageIcon className="w-3 h-3" />
                <span>웨딩 포토</span>
              </button>
            </div>
          </div>
        </div>

        {/* Full-bleed Arch Photo / Pixel Illustration inside Classic Cover */}
        <div className="px-6">
          <div className="relative mx-auto max-w-[340px]">
            <div className="relative aspect-[3/3.7] rounded-t-full rounded-b-xl overflow-hidden border border-[#e2d4c0] shadow-sm">
              <img
                src={
                  heroStyle === 'pixel'
                    ? PIXEL_ASSETS.weddingCover
                    : config.gallery[0]?.imageUrl
                }
                alt="Wedding Main"
                className={`w-full h-full object-cover ${
                  heroStyle === 'pixel' ? 'pixelated' : ''
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              <div className="absolute bottom-8 inset-x-4 text-white text-xs tracking-widest font-engSerif">
                WE INVITE YOU TO OUR SPRING GARDEN
              </div>
            </div>

            {/* Couple Portrait Badge overlapping bottom of arch */}
            <div className="relative -mt-6 mx-auto w-fit bg-[#fffdf9] border border-[#e2d4c0] rounded-full px-5 py-2 shadow-sm flex items-center gap-3 z-10">
              <div style={{ order: primary === 'bride' ? 3 : 1 }}>
                <GroomSprite size={32} />
              </div>
              <div style={{ order: 2 }} className="flex flex-col items-center">
                <PixelRing size={16} />
                <PixelHeart size={10} className="mt-0.5 animate-pulse" />
              </div>
              <div style={{ order: primary === 'bride' ? 1 : 3 }}>
                <BrideSprite size={32} />
              </div>
              <div style={{ order: 4 }} className="-ml-1 mt-1">
                <PetCatSprite size={22} />
              </div>
            </div>
          </div>
        </div>

        {/* Date & Venue Footer in Hero */}
        <div className="pt-4 pb-6 px-6 space-y-1">
          <div className="text-sm sm:text-base font-bold text-[#3b2f2f]">
            {config.wedding.dateDisplay} {config.wedding.timeDisplay}
          </div>
          <div className="text-xs sm:text-sm text-[#5c4d47]">
            {config.wedding.venueName} {config.wedding.hallName}
          </div>
        </div>

        {/* Subtle Banner to Try Pixel Garden Mode */}
        <div className="bg-[#faf5ec] border-t border-[#efe6d8] px-4 py-3 flex items-center justify-between gap-2">
          <span className="text-xs text-[#5c4d47] text-left">
            🌸 신랑·신부의 <strong>픽셀 보타닉 정원</strong>을 직접 산책해 보실래요?
          </span>
          <button
            onClick={() => {
              soundEngine.playSelect();
              onSwitchToGardenMode();
            }}
            className="px-3 py-1.5 rounded-full bg-[#d97b84] text-white text-xs font-sans font-bold shrink-0 flex items-center gap-1 shadow-xs"
          >
            <Sparkles className="w-3 h-3" /> 픽셀 정원 산책하기
          </button>
        </div>
      </div>

      {/* Sticky Quick-Jump Navigation Bar with Active Section Scroll Spy */}
      <nav
        aria-label="청첩장 섹션 바로가기"
        className="sticky top-1 z-30 bg-[#fffdf9]/95 backdrop-blur-sm border border-[#d4b48c] rounded-full px-2.5 py-1.5 shadow-sm flex items-center justify-between gap-1 overflow-x-auto font-sans"
      >
        {QUEST_BUILDINGS.filter((b) => b.id !== 'minigame').map((b) => {
          const isActive = activeSectionId === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                soundEngine.playBlip();
                scrollToClassicSection(b.id);
              }}
              className={`px-2.5 py-1 rounded-full text-xs shrink-0 transition-all ${
                isActive
                  ? 'bg-[#3b2f2f] text-[#fffdf9] font-bold shadow-2xs'
                  : 'hover:bg-[#faf5ec] text-[#5c4d47] hover:text-[#3b2f2f] font-medium'
              }`}
            >
              {b.shortName}
            </button>
          );
        })}
      </nav>

      {/* 1. Invitation & Couple Story */}
      <section id="classic-story" className="scroll-mt-16">
        <StorySection config={config} initialSide={initialSide} />
      </section>

      {/* 2. Ceremony Calendar & D-Day */}
      <section id="classic-ceremony" className="scroll-mt-16">
        <CeremonySection config={config} />
      </section>

      {/* 3. Photo Gallery */}
      <section id="classic-gallery" className="scroll-mt-16">
        <GallerySection config={config} onUnlockTitle={onUnlockTitle} />
      </section>

      {/* 4. Location & Directions */}
      <section id="classic-location" className="scroll-mt-16">
        <LocationSection config={config} />
      </section>

      {/* 5. Blessing Gift Accounts */}
      <section id="classic-gift" className="scroll-mt-16">
        <GiftSection config={config} initialSide={initialSide} />
      </section>

      {/* 6. RSVP & Guestbook */}
      <section id="classic-rsvp" className="scroll-mt-16">
        <RsvpGuestbookSection
          config={config}
          guestbook={guestbook}
          syncStatus={syncStatus}
          earnedTitle={earnedTitle}
          initialSide={initialSide}
          onAddGuestbook={onAddGuestbook}
          onDeleteGuestbook={onDeleteGuestbook}
        />
      </section>

      {/* 7. Optional Collapsible Mini-Game & Couple Quiz Card */}
      <section id="classic-minigame" className="scroll-mt-16 space-y-3">
        <button
          onClick={() => {
            soundEngine.playSelect();
            setShowBonusEvent(!showBonusEvent);
          }}
          className="w-full pixel-card p-4 bg-[#faf5ec] hover:bg-[#f4ece0] flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg">💐</span>
            <div>
              <div className="text-xs sm:text-sm font-bold text-[#3b2f2f]">
                작은 이벤트 : 부케 받기 미니게임 & 신랑·신부 퀴즈
              </div>
              <div className="text-[11px] text-[#7d6e65] font-sans">
                가볍게 참여하고 방명록 기념 뱃지를 받아보세요
              </div>
            </div>
          </div>
          <span className="text-xs font-sans font-semibold text-[#c59b6d] flex items-center gap-1 shrink-0">
            {showBonusEvent ? (
              <>
                접기 <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                열어보기 <ChevronDown className="w-4 h-4" />
              </>
            )}
          </span>
        </button>

        {showBonusEvent && (
          <div className="animate-fadeIn">
            <Suspense fallback={null}>
              <MiniGameSection
                config={config}
                earnedTitle={earnedTitle}
                onUnlockTitle={onUnlockTitle}
              />
            </Suspense>
          </div>
        )}
      </section>

      {/* Floating Scroll-To-Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => {
            soundEngine.playBlip(680);
            window.scrollTo({
              top: 0,
              behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            });
          }}
          aria-label="맨 위로 이동"
          style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
          className="fixed right-4 z-40 px-3 py-2 rounded-full bg-[#3b2f2f]/90 hover:bg-[#3b2f2f] text-[#fffdf9] border border-[#d4b48c] shadow-lg text-xs font-sans font-bold flex items-center gap-1 backdrop-blur-xs transition-all"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          <span>맨 위로</span>
        </button>
      )}
    </div>
  );
};
