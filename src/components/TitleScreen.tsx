import React, { useState } from 'react';
import { Volume2, BookOpen, Sparkles, Image as ImageIcon } from 'lucide-react';
import { WeddingConfig } from '../data/weddingConfig';
import {
  GroomSprite,
  BrideSprite,
  PetCatSprite,
  PixelHeart,
  PixelRing,
  PIXEL_ASSETS,
} from './PixelSprites';
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
  const [coverType, setCoverType] = useState<'pixel' | 'photo'>('pixel');

  return (
    <div className="pixel-card p-6 sm:p-8 bg-[#fffdf9] text-center relative overflow-hidden">
      {/* Top English Editorial Header */}
      <div className="space-y-1 mb-4">
        <div className="text-[11px] tracking-[0.3em] text-[#c59b6d] font-engSerif uppercase">
          WEDDING INVITATION
        </div>
        <div className="text-xs text-[#8c7a70] font-engSerif italic">
          {config.wedding.year}. {String(config.wedding.month).padStart(2, '0')}.{' '}
          {String(config.wedding.day).padStart(2, '0')} — {config.wedding.timeDisplay}
        </div>
      </div>

      {/* Cover Style Toggle Pill */}
      <div className="flex justify-center mb-3 font-sans">
        <div className="inline-flex rounded-full bg-[#faf5ec] p-0.5 border border-[#e6d5b8]">
          <button
            type="button"
            onClick={() => {
              soundEngine.playBlip();
              setCoverType('pixel');
            }}
            className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
              coverType === 'pixel'
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
              setCoverType('photo');
            }}
            className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
              coverType === 'photo'
                ? 'bg-[#3b2f2f] text-white shadow-2xs'
                : 'text-[#7d6e65] hover:text-[#3b2f2f]'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>웨딩 포토</span>
          </button>
        </div>
      </div>

      {/* Arched Bridal Cover Frame */}
      <div className="relative mx-auto max-w-[320px] aspect-[3/3.9] rounded-t-full rounded-b-2xl border-2 border-[#d4b48c] bg-[#faf5ec] p-2 shadow-sm overflow-hidden">
        <div className="relative w-full h-full rounded-t-full rounded-b-xl overflow-hidden bg-[#f3ede2]">
          <img
            src={
              coverType === 'pixel'
                ? PIXEL_ASSETS.weddingCover
                : config.gallery[0]?.imageUrl
            }
            alt="Wedding Cover"
            className={`w-full h-full object-cover object-center transition-all duration-500 ${
              coverType === 'pixel' ? 'pixelated' : 'brightness-[0.97]'
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2b211e]/55 via-transparent to-transparent" />

          {/* Floating Couple Portrait Badge at Bottom of Arch */}
          <div className="absolute bottom-2.5 inset-x-2.5 bg-[#fffdf9]/92 backdrop-blur-xs border border-[#e6d5b8] rounded-xl py-1.5 px-3 flex items-center justify-center gap-2.5 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-[#faf5ec] border border-[#d4b48c] overflow-hidden flex items-center justify-center shrink-0">
              <GroomSprite size={54} variant="portrait" bounce />
            </div>
            <div className="flex flex-col items-center">
              <PixelRing size={20} />
              <PixelHeart size={13} color="#d97b84" className="mt-0.5" />
            </div>
            <div className="w-14 h-14 rounded-full bg-[#fcf5f5] border border-[#e2a3a9] overflow-hidden flex items-center justify-center shrink-0">
              <BrideSprite size={54} variant="portrait" bounce />
            </div>
            <PetCatSprite size={42} className="hidden xs:block -ml-1" />
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
