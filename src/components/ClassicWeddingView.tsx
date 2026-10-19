import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { WeddingConfig, GuestbookEntry, QUEST_BUILDINGS } from '../data/weddingConfig';
import { StorySection } from './sections/StorySection';
import { CeremonySection } from './sections/CeremonySection';
import { GallerySection } from './sections/GallerySection';
import { LocationSection } from './sections/LocationSection';
import { GiftSection } from './sections/GiftSection';
import { RsvpGuestbookSection } from './sections/RsvpGuestbookSection';
import { MiniGameSection } from './sections/MiniGameSection';
import { soundEngine } from '../utils/soundEngine';

interface ClassicWeddingViewProps {
  config: WeddingConfig;
  guestbook: GuestbookEntry[];
  earnedTitle: string | null;
  onUnlockTitle: (title: string) => void;
  onAddGuestbook: (entry: GuestbookEntry) => void;
  onSwitchToGardenMode: () => void;
}

export const ClassicWeddingView: React.FC<ClassicWeddingViewProps> = ({
  config,
  guestbook,
  earnedTitle,
  onUnlockTitle,
  onAddGuestbook,
  onSwitchToGardenMode,
}) => {
  const [showBonusEvent, setShowBonusEvent] = useState(false);

  return (
    <div className="space-y-5">
      {/* Classic Editorial Hero Cover Card */}
      <div className="pixel-card bg-[#fffdf9] overflow-hidden text-center">
        <div className="pt-8 pb-5 px-6">
          <div className="text-[11px] tracking-[0.32em] text-[#c59b6d] font-engSerif uppercase">
            THE MARRIAGE OF
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[0.2em] text-[#3b2f2f] mt-2">
            {config.groom.fullName}{' '}
            <span className="text-[#d97b84] text-lg align-middle mx-1">·</span>{' '}
            {config.bride.fullName}
          </h1>
          <p className="text-xs text-[#8c7a70] mt-2 font-engSerif italic tracking-wider">
            Saturday, May 22, 2027 · 1:00 PM
          </p>
        </div>

        {/* Full-bleed Arch Photo inside Classic Cover */}
        <div className="px-6">
          <div className="relative mx-auto max-w-[340px] aspect-[3/3.7] rounded-t-full rounded-b-xl overflow-hidden border border-[#e2d4c0] shadow-sm">
            <img
              src={config.gallery[0]?.imageUrl}
              alt="Wedding Main"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
            <div className="absolute bottom-4 inset-x-4 text-white text-xs tracking-widest font-engSerif">
              WE INVITE YOU TO OUR SPRING GARDEN
            </div>
          </div>
        </div>

        {/* Date & Venue Footer in Hero */}
        <div className="py-6 px-6 space-y-1">
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

      {/* Sticky Quick-Jump Navigation Bar */}
      <div className="sticky top-1 z-30 bg-[#fffdf9]/95 backdrop-blur-sm border border-[#d4b48c] rounded-full px-3 py-2 shadow-sm flex items-center justify-between gap-1 overflow-x-auto font-sans">
        {QUEST_BUILDINGS.filter((b) => b.id !== 'minigame').map((b) => (
          <button
            key={b.id}
            onClick={() => {
              soundEngine.playBlip();
              document
                .getElementById(`classic-${b.id}`)
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-2.5 py-1 rounded-full hover:bg-[#faf5ec] text-[#5c4d47] hover:text-[#3b2f2f] text-xs font-medium shrink-0 transition-colors"
          >
            {b.shortName}
          </button>
        ))}
      </div>

      {/* 1. Invitation & Couple Story */}
      <section id="classic-story">
        <StorySection config={config} />
      </section>

      {/* 2. Ceremony Calendar & D-Day */}
      <section id="classic-ceremony">
        <CeremonySection config={config} />
      </section>

      {/* 3. Photo Gallery */}
      <section id="classic-gallery">
        <GallerySection config={config} />
      </section>

      {/* 4. Location & Directions */}
      <section id="classic-location">
        <LocationSection config={config} />
      </section>

      {/* 5. Blessing Gift Accounts */}
      <section id="classic-gift">
        <GiftSection config={config} />
      </section>

      {/* 6. RSVP & Guestbook */}
      <section id="classic-rsvp">
        <RsvpGuestbookSection
          config={config}
          guestbook={guestbook}
          earnedTitle={earnedTitle}
          onAddGuestbook={onAddGuestbook}
        />
      </section>

      {/* 7. Optional Collapsible Mini-Game & Couple Quiz Card */}
      <section id="classic-minigame" className="space-y-3">
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
            <MiniGameSection
              config={config}
              earnedTitle={earnedTitle}
              onUnlockTitle={onUnlockTitle}
            />
          </div>
        )}
      </section>
    </div>
  );
};
