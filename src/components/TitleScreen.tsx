import React from 'react';
import { Volume2, ScrollText, Gamepad2, Sparkles } from 'lucide-react';
import { WeddingConfig } from '../data/weddingConfig';
import { GroomSprite, BrideSprite, PetCatSprite, PixelHeart, PixelRing } from './PixelSprites';
import { soundEngine } from '../utils/soundEngine';

interface TitleScreenProps {
  config: WeddingConfig;
  onStartWorldMode: (withBgm: boolean) => void;
  onStartScrollMode: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  config,
  onStartWorldMode,
  onStartScrollMode,
}) => {
  return (
    <div className="pixel-box-gold p-5 sm:p-6 bg-gradient-to-b from-[#1a1230] via-[#22183d] to-[#140e24] text-center relative overflow-hidden">
      {/* Decorative Pixel Stars */}
      <div className="flex items-center justify-between text-[10px] text-[#ffd541] mb-3">
        <span className="px-2 py-0.5 bg-[#120d1e] border border-[#ffd541]">
          💍 16-BIT WEDDING RPG
        </span>
        <span className="text-[#38d9a9] font-bold">{config.versionTag}</span>
      </div>

      {/* Main Game Logo */}
      <div className="my-3 space-y-1">
        <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#ff87ab]">
          <Sparkles className="w-3.5 h-3.5 text-[#ffd541]" />
          <span>새로운 월드맵을 여는 두 사람의 모험</span>
          <Sparkles className="w-3.5 h-3.5 text-[#ffd541]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#ffd541] drop-shadow-[0_3px_0_#0b0714]">
          {config.gameTitle}
        </h1>
        <p className="text-xs text-[#e9ecef]">
          신랑 <strong className="text-[#4dabf7]">{config.groom.fullName}</strong> ♥ 신부{' '}
          <strong className="text-[#ff5277]">{config.bride.fullName}</strong>
        </p>
      </div>

      {/* Hero Pixel Character Stage */}
      <div className="relative my-5 py-6 px-4 bg-[#120d1e] border-2 border-[#ffd541] overflow-hidden">
        {/* Background Moon & Stars */}
        <div className="absolute top-3 left-5 w-2 h-2 bg-[#ffd541] animate-ping" />
        <div className="absolute top-6 right-8 w-1.5 h-1.5 bg-[#ff87ab] animate-pulse" />
        <div className="absolute top-3 right-1/4 w-6 h-6 rounded-full bg-[#ffd541]/20 border border-[#ffd541]" />

        <div className="relative z-10 flex items-end justify-center gap-3 sm:gap-5">
          <div className="flex flex-col items-center">
            <span className="text-[10px] px-1.5 py-0.5 bg-[#4dabf7] text-[#120d1e] font-extrabold mb-1">
              LV.99 신랑 {config.groom.name}
            </span>
            <GroomSprite
              size={76}
              primaryColor={config.groom.suitColor}
              hairColor={config.groom.hairColor}
              bounce
            />
          </div>

          <div className="flex flex-col items-center pb-4">
            <PixelRing size={26} className="animate-bounce" />
            <PixelHeart size={18} className="mt-1" />
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] px-1.5 py-0.5 bg-[#ff5277] text-white font-extrabold mb-1">
              LV.99 신부 {config.bride.name}
            </span>
            <BrideSprite
              size={76}
              primaryColor={config.bride.dressColor}
              hairColor={config.bride.hairColor}
              bounce
            />
          </div>

          <div className="hidden xs:flex flex-col items-center pb-1">
            <span className="text-[9px] text-[#ffa94d] font-bold mb-0.5">
              {config.pet.name}
            </span>
            <PetCatSprite size={46} className="animate-floatSlow" />
          </div>
        </div>

        {/* Pixel Grass Floor */}
        <div className="mt-3 h-3 w-full bg-[#2d6a4f] border-t-2 border-[#38d9a9]" />
      </div>

      {/* Wedding Date & Venue Info Box */}
      <div className="bg-[#151024] border-2 border-[#4c3d75] p-3.5 mb-5 space-y-1">
        <div className="text-xs sm:text-sm font-extrabold text-[#ffd541]">
          📅 {config.wedding.dateDisplay} {config.wedding.timeDisplay}
        </div>
        <div className="text-xs text-[#38d9a9] font-bold">
          🏰 {config.wedding.venueName} · {config.wedding.hallName}
        </div>
        <div className="text-[11px] text-[#a599b8]">{config.wedding.addressRoad}</div>
      </div>

      {/* Action Buttons: RPG World Mode vs Classic Scroll Mode */}
      <div className="space-y-2.5">
        <button
          onClick={() => {
            soundEngine.playFanfare();
            onStartWorldMode(true);
          }}
          className="pixel-btn w-full bg-[#ff5277] hover:bg-[#ff3864] text-white py-3.5 px-4 text-sm sm:text-base font-extrabold flex items-center justify-center gap-2"
        >
          <Gamepad2 className="w-5 h-5 shrink-0" />
          <span className="animate-pulse">▶ PRESS START : 웨딩빌리지 모험 입장</span>
          <Volume2 className="w-4 h-4 text-[#ffd541] shrink-0" />
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              soundEngine.playSelect();
              onStartWorldMode(false);
            }}
            className="pixel-btn bg-[#2e2448] text-[#e9ecef] py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <span>🔇 조용히 게임 입장</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playSelect();
              onStartScrollMode();
            }}
            className="pixel-btn bg-[#ffd541] text-[#120d1e] py-2.5 px-3 text-xs font-extrabold flex items-center justify-center gap-1.5"
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>한눈에 보기 (스크롤)</span>
          </button>
        </div>
      </div>

      <p className="mt-4 text-[11px] text-[#a599b8]">
        💡 마을의 6개 건물을 탐험하거나 상단 <strong className="text-[#ffd541]">[한눈에 보기]</strong>로 언제든 전환할 수 있습니다.
      </p>
    </div>
  );
};
