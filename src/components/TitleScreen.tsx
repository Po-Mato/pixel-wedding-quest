import React from 'react';
import { Volume2, BookOpen, Sparkles } from 'lucide-react';
import { WeddingConfig } from '../data/weddingConfig';
import { GroomSprite, BrideSprite, PetCatSprite, PixelHeart, PixelRing } from './PixelSprites';
import { soundEngine } from '../utils/soundEngine';

interface TitleScreenProps {
  config: WeddingConfig;
  onStartWorldMode: (withBgm: boolean) => void;
  onStartClassicMode: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  config,
  onStartWorldMode,
  onStartClassicMode,
}) => {
  return (
    <div className="pixel-card p-6 sm:p-8 bg-[#fffdf9] text-center relative overflow-hidden">
      {/* Top English Editorial Header */}
      <div className="space-y-1 mb-5">
        <div className="text-[11px] tracking-[0.3em] text-[#c59b6d] font-engSerif uppercase">
          WEDDING INVITATION
        </div>
        <div className="text-xs text-[#8c7a70] font-engSerif italic">
          {config.wedding.year}. {String(config.wedding.month).padStart(2, '0')}.{' '}
          {String(config.wedding.day).padStart(2, '0')} — {config.wedding.timeDisplay}
        </div>
      </div>

      {/* Arched Bridal Cover Frame */}
      <div className="relative mx-auto max-w-[310px] aspect-[3/3.8] rounded-t-full rounded-b-2xl border-2 border-[#d4b48c] bg-[#faf5ec] p-2 shadow-sm overflow-hidden">
        <div className="relative w-full h-full rounded-t-full rounded-b-xl overflow-hidden bg-[#f3ede2]">
          <img
            src={config.gallery[0]?.imageUrl}
            alt="Wedding Cover"
            className="w-full h-full object-cover object-center brightness-[0.97]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2b211e]/65 via-transparent to-transparent" />

          {/* High-Res 144x144 Pastel Pixel Couple Badge at Bottom of Arch */}
          <div className="absolute bottom-3 inset-x-3 bg-[#fffdf9]/94 backdrop-blur-sm border border-[#e6d5b8] rounded-xl py-2 px-3 flex items-center justify-center gap-2 shadow-sm">
            <GroomSprite
              size={82}
              primaryColor={config.groom.suitColor}
              hairColor={config.groom.hairColor}
              bounce
            />
            <div className="flex flex-col items-center">
              <PixelRing size={22} />
              <PixelHeart size={14} color="#d97b84" className="mt-1" />
            </div>
            <BrideSprite
              size={82}
              primaryColor={config.bride.dressColor}
              hairColor={config.bride.hairColor}
              bounce
            />
            <PetCatSprite size={48} className="hidden xs:block -ml-1" />
          </div>
        </div>
      </div>

      {/* Couple Names & Poetic Subtitle */}
      <div className="mt-6 space-y-2">
        <div className="text-xl sm:text-2xl font-bold tracking-[0.18em] text-[#3b2f2f]">
          {config.groom.fullName}{' '}
          <span className="text-[#d97b84] text-base align-middle mx-1">♥</span>{' '}
          {config.bride.fullName}
        </div>
        <p className="text-xs sm:text-sm text-[#6e5d53] leading-relaxed break-keep">
          “{config.invitationMessage.headline}”
        </p>
      </div>

      {/* Date & Venue Divider Box */}
      <div className="my-5 py-3.5 px-4 bg-[#faf5ec] border-y border-[#e6d5b8] space-y-1">
        <div className="text-xs sm:text-sm font-bold text-[#3b2f2f]">
          {config.wedding.dateDisplay} {config.wedding.timeDisplay}
        </div>
        <div className="text-xs text-[#6e5d53]">
          {config.wedding.venueName} · {config.wedding.hallName}
        </div>
      </div>

      {/* Dual Experience Selection Buttons */}
      <div className="space-y-2.5 font-sans">
        <button
          onClick={() => {
            soundEngine.playSelect();
            onStartClassicMode();
          }}
          className="w-full py-3.5 px-4 rounded-xl bg-[#3b2f2f] hover:bg-[#2a2121] text-[#fffdf9] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <BookOpen className="w-4 h-4 text-[#e6d5b8]" />
          <span>일반 모바일 청첩장으로 보기 (클래식 모드)</span>
        </button>

        <button
          onClick={() => {
            soundEngine.playFanfare();
            onStartWorldMode(true);
          }}
          className="w-full py-3.5 px-4 rounded-xl bg-[#fcf3f3] hover:bg-[#f9e5e7] text-[#3b2f2f] border-2 border-[#d97b84] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Sparkles className="w-4 h-4 text-[#d97b84]" />
          <span>픽셀 가든 산책하며 보기 (인터랙티브 정원)</span>
          <Volume2 className="w-3.5 h-3.5 text-[#c59b6d]" />
        </button>
      </div>

      <p className="mt-4 text-[11px] text-[#9c897e] font-sans">
        상단 스위치로 <strong>[일반 청첩장]</strong>과 <strong>[픽셀 가든]</strong> 모드를 언제든 자유롭게 오갈 수 있습니다.
      </p>
    </div>
  );
};
