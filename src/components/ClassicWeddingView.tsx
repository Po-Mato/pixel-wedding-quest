import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  ArrowUp,
  MapPin,
  Heart,
  PenLine,
  Calendar,
  Maximize2,
  X,
} from 'lucide-react';
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
import { RevealSection } from './RevealSection';
import { StorySection } from './sections/StorySection';
import { CeremonySection } from './sections/CeremonySection';
import { GallerySection } from './sections/GallerySection';
import { LocationSection } from './sections/LocationSection';
import { GiftSection } from './sections/GiftSection';
import { RsvpGuestbookSection } from './sections/RsvpGuestbookSection';
import { WeddingPhaseBanner } from './WeddingPhaseBanner';
import { WeddingPhase, getWeddingDayDiff } from '../utils/weddingPhase';
import { CloudSyncStatus } from '../utils/weddingCloudSync';
import { prefersReducedMotion } from '../utils/motion';
import { soundEngine } from '../utils/soundEngine';
import { useCoupleOrder } from '../utils/coupleOrder';
import { useBodyScrollLock } from '../utils/useBodyScrollLock';
import { useEscapeKey } from '../utils/useEscapeKey';

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

const HERO_PETALS = [
  { left: '14%', width: 9, height: 6, duration: '9.5s', delay: '0s' },
  { left: '32%', width: 7, height: 5, duration: '11s', delay: '2.2s' },
  { left: '52%', width: 10, height: 6, duration: '8.8s', delay: '4.1s' },
  { left: '68%', width: 8, height: 5, duration: '10.4s', delay: '1.3s' },
  { left: '84%', width: 9, height: 6, duration: '9.2s', delay: '5.5s' },
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
  const [heroLightboxOpen, setHeroLightboxOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<QuestBuildingId | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const navScrollRef = useRef<HTMLDivElement | null>(null);
  const navBtnRefs = useRef<Partial<Record<QuestBuildingId, HTMLButtonElement | null>>>({});

  const { primary, pair } = useCoupleOrder();
  const [firstName, secondName] = pair(config.groom.fullName, config.bride.fullName);

  useBodyScrollLock(heroLightboxOpen);
  useEscapeKey(heroLightboxOpen, () => setHeroLightboxOpen(false));

  const dayDiff = getWeddingDayDiff(config.wedding.dateISO);
  const dDayLabel =
    dayDiff === null
      ? null
      : dayDiff === 0
      ? 'D-DAY · 오늘 결혼합니다 💍'
      : dayDiff > 0
      ? `예식까지 D-${dayDiff}`
      : `결혼 +${Math.abs(dayDiff)}일째 💐`;

  const heroImageSrc =
    heroStyle === 'photo' && config.gallery[0]?.imageUrl
      ? config.gallery[0].imageUrl
      : PIXEL_ASSETS.weddingCover;

  const updateNavFadeHints = useCallback(() => {
    const el = navScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateNavFadeHints();
    window.addEventListener('resize', updateNavFadeHints, { passive: true });
    return () => window.removeEventListener('resize', updateNavFadeHints);
  }, [updateNavFadeHints]);

  // Smoothly center the active section tab inside the sticky horizontal nav bar
  useEffect(() => {
    if (!activeSectionId) return;
    const container = navScrollRef.current;
    const btn = navBtnRefs.current[activeSectionId];
    if (!container || !btn) return;

    const targetLeft =
      btn.offsetLeft - container.clientWidth / 2 + btn.offsetWidth / 2;
    const clampedLeft = Math.max(
      0,
      Math.min(targetLeft, Math.max(0, container.scrollWidth - container.clientWidth))
    );
    container.scrollTo({
      left: clampedLeft,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }, [activeSectionId]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowScrollTop(scrollY > 320);

      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      setScrollProgress(Math.min(100, Math.max(0, Math.round((scrollY / maxScroll) * 100))));

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

          {dDayLabel && (
            <div className="mt-2.5 flex justify-center font-sans">
              <span
                className={`inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold border ${
                  dayDiff === 0
                    ? 'bg-[#d97b84] text-white border-[#c56871] shadow-sm'
                    : 'bg-[#fcf0f1] text-[#b85d67] border-[#e8b8be]'
                }`}
              >
                {dDayLabel}
              </span>
            </div>
          )}

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
                    ? 'bg-[#d97b84] text-white shadow-sm'
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
                    ? 'bg-[#3b2f2f] text-white shadow-sm'
                    : 'text-[#7d6e65] hover:text-[#3b2f2f]'
                }`}
              >
                <ImageIcon className="w-3 h-3" />
                <span>웨딩 포토</span>
              </button>
            </div>
          </div>
        </div>

        {/* Full-bleed Arch Photo / Pixel Illustration inside Classic Cover (Tap to Zoom) */}
        <div className="px-6">
          <div className="relative mx-auto max-w-[340px]">
            <button
              type="button"
              onClick={() => {
                soundEngine.playSelect();
                setHeroLightboxOpen(true);
              }}
              aria-label="표지 사진 크게 보기"
              className="group block w-full relative aspect-[3/3.7] rounded-t-full rounded-b-xl overflow-hidden border border-[#e2d4c0] shadow-sm cursor-zoom-in text-left"
            >
              <img
                src={heroImageSrc}
                alt={`${firstName} ♥ ${secondName} 웨딩 표지`}
                className="w-full h-full object-cover object-[50%_25%] transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              {/* Subtle Ambient Spring Petals */}
              <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
                {HERO_PETALS.map((petal, idx) => (
                  <span
                    key={idx}
                    className="hero-petal"
                    style={
                      {
                        left: petal.left,
                        width: `${petal.width}px`,
                        height: `${petal.height}px`,
                        '--petal-duration': petal.duration,
                        '--petal-delay': petal.delay,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
              <span
                aria-hidden="true"
                className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-[#3b2f2f]/65 text-white flex items-center justify-center backdrop-blur-sm shadow"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </span>
              <div className="absolute bottom-8 inset-x-4 text-center text-white text-xs tracking-widest font-engSerif">
                WE INVITE YOU TO OUR SPRING GARDEN
              </div>
            </button>

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

        {/* Date, Venue & 1-Tap Quick Actions in Hero */}
        <div className="pt-4 pb-5 px-5 space-y-1">
          <div className="text-sm sm:text-base font-bold text-[#3b2f2f]">
            {config.wedding.dateDisplay} {config.wedding.timeDisplay}
          </div>
          <div className="text-xs sm:text-sm text-[#5c4d47]">
            {config.wedding.venueName} {config.wedding.hallName}
          </div>

          <div className="pt-3 grid grid-cols-3 gap-1.5 font-sans">
            <button
              type="button"
              onClick={() => {
                soundEngine.playSelect();
                scrollToClassicSection('ceremony');
              }}
              className="py-2 px-2 rounded-xl bg-[#faf5ec] hover:bg-[#f3e9d8] border border-[#e2d4c0] text-[#3b2f2f] text-xs font-bold flex items-center justify-center gap-1 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-[#c59b6d] shrink-0" />
              <span>예식·일정</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playSelect();
                scrollToClassicSection('location');
              }}
              className="py-2 px-2 rounded-xl bg-[#faf5ec] hover:bg-[#f3e9d8] border border-[#e2d4c0] text-[#3b2f2f] text-xs font-bold flex items-center justify-center gap-1 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-[#6b9071] shrink-0" />
              <span>오시는 길</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playSelect();
                scrollToClassicSection('rsvp');
              }}
              className="py-2 px-2 rounded-xl bg-[#fcf0f1] hover:bg-[#f9e1e4] border border-[#e8b8be] text-[#b85d67] text-xs font-bold flex items-center justify-center gap-1 transition-colors"
            >
              <PenLine className="w-3.5 h-3.5 shrink-0" />
              <span>참석 전달</span>
            </button>
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
            className="px-3 py-1.5 rounded-full bg-[#d97b84] text-white text-xs font-sans font-bold shrink-0 flex items-center gap-1 shadow-sm"
          >
            <Sparkles className="w-3 h-3" /> 픽셀 정원 산책하기
          </button>
        </div>
      </div>

      {/* Sticky Quick-Jump Navigation Bar with Auto-Centering Active Tab, Edge Fades & Reading Progress */}
      <nav
        aria-label="청첩장 섹션 바로가기"
        className="sticky top-1 z-30 bg-[#fffdf9]/95 backdrop-blur-sm border border-[#d4b48c] rounded-full px-2.5 py-1.5 shadow-sm overflow-hidden font-sans"
      >
        <div className="relative">
          <div
            ref={navScrollRef}
            onScroll={updateNavFadeHints}
            className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar"
          >
            {QUEST_BUILDINGS.filter((b) => b.id !== 'minigame').map((b) => {
              const isActive = activeSectionId === b.id;
              return (
                <button
                  key={b.id}
                  ref={(el) => {
                    navBtnRefs.current[b.id] = el;
                  }}
                  type="button"
                  onClick={() => {
                    soundEngine.playBlip();
                    scrollToClassicSection(b.id);
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs shrink-0 transition-all ${
                    isActive
                      ? 'bg-[#3b2f2f] text-[#fffdf9] font-bold shadow-sm'
                      : 'hover:bg-[#faf5ec] text-[#5c4d47] hover:text-[#3b2f2f] font-medium'
                  }`}
                >
                  {b.shortName}
                </button>
              );
            })}
          </div>
          {canScrollLeft && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#fffdf9] to-transparent"
            />
          )}
          {canScrollRight && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#fffdf9] to-transparent"
            />
          )}
        </div>
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#efe6d8] rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-gradient-to-r from-[#d4b48c] to-[#d97b84] transition-[width] duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      </nav>

      {/* 1. Invitation & Couple Story */}
      <RevealSection id="classic-story" className="scroll-mt-16">
        <StorySection config={config} initialSide={initialSide} />
      </RevealSection>

      {/* 2. Ceremony Calendar & D-Day */}
      <RevealSection id="classic-ceremony" className="scroll-mt-16">
        <CeremonySection config={config} />
      </RevealSection>

      {/* 3. Photo Gallery */}
      <RevealSection id="classic-gallery" className="scroll-mt-16">
        <GallerySection config={config} onUnlockTitle={onUnlockTitle} />
      </RevealSection>

      {/* 4. Location & Directions */}
      <RevealSection id="classic-location" className="scroll-mt-16">
        <LocationSection config={config} />
      </RevealSection>

      {/* 5. Blessing Gift Accounts */}
      <RevealSection id="classic-gift" className="scroll-mt-16">
        <GiftSection config={config} initialSide={initialSide} />
      </RevealSection>

      {/* 6. RSVP & Guestbook */}
      <RevealSection id="classic-rsvp" className="scroll-mt-16">
        <RsvpGuestbookSection
          config={config}
          guestbook={guestbook}
          syncStatus={syncStatus}
          earnedTitle={earnedTitle}
          initialSide={initialSide}
          onAddGuestbook={onAddGuestbook}
          onDeleteGuestbook={onDeleteGuestbook}
        />
      </RevealSection>

      {/* 7. Optional Collapsible Mini-Game & Couple Quiz Card */}
      <RevealSection id="classic-minigame" className="scroll-mt-16 space-y-3">
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
      </RevealSection>

      {/* Thumb-Friendly Floating Bottom Quick-Action Pill Bar */}
      {showScrollTop && (
        <div
          style={{ bottom: 'calc(0.85rem + env(safe-area-inset-bottom))' }}
          className="fixed inset-x-3 z-40 flex justify-center pointer-events-none font-sans"
        >
          <div className="pointer-events-auto bg-[#3b2f2f]/95 backdrop-blur-sm border border-[#d4b48c] rounded-full px-1.5 py-1 shadow-xl flex items-center gap-1 animate-fadeIn">
            {[
              { id: 'location' as const, label: '오시는 길', Icon: MapPin },
              { id: 'gift' as const, label: '마음 전하기', Icon: Heart },
              { id: 'rsvp' as const, label: '참석 전달', Icon: PenLine },
            ].map(({ id, label, Icon }) => {
              const active = activeSectionId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    soundEngine.playBlip(640);
                    scrollToClassicSection(id);
                  }}
                  className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-[#d97b84] text-white shadow-sm'
                      : 'text-[#fffdf9]/90 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  <span>{label}</span>
                </button>
              );
            })}
            <span className="w-[1px] h-4 bg-white/20 mx-0.5" aria-hidden="true" />
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
              title="맨 위로"
              className="p-1.5 rounded-full text-[#f0d29c] hover:bg-white/10 transition-colors"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Hero Cover Photo Lightbox */}
      {heroLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="표지 사진 확대 보기"
          onClick={() => setHeroLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm overscroll-contain flex flex-col items-center justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] animate-fadeIn font-sans"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-3"
          >
            <div className="flex items-center justify-between text-white text-xs">
              <span className="font-semibold text-[#f4acb7]">
                {heroStyle === 'pixel' ? '픽셀 웨딩 일러스트' : '웨딩 표지 포토'}
              </span>
              <button
                type="button"
                onClick={() => setHeroLightboxOpen(false)}
                className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                <span>닫기</span>
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-white/20 bg-[#1f1917]">
              <img
                src={heroImageSrc}
                alt={`${firstName} ♥ ${secondName} 웨딩 표지 확대`}
                className="w-full max-h-[75vh] object-contain mx-auto block"
              />
            </div>
            <div className="text-center text-xs text-white/85 font-serif">
              {firstName} ♥ {secondName} · {config.wedding.dateDisplay}{' '}
              {config.wedding.timeDisplay}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
