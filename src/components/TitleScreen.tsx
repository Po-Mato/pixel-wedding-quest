import React from 'react';
import { ChevronRight } from 'lucide-react';
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
import { CoupleSide, useCoupleOrder } from '../utils/coupleOrder';

interface TitleScreenProps {
  config: WeddingConfig;
  onSelectEntry: (mode: 'classic' | 'parents', side: CoupleSide) => void;
  onSecretTap?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  config,
  onSelectEntry,
  onSecretTap,
}) => {
  const { primary, sides, pair } = useCoupleOrder();
  const [firstName, secondName] = pair(config.groom.fullName, config.bride.fullName);
  const groomOrder = primary === 'bride' ? 3 : 1;
  const brideOrder = primary === 'bride' ? 1 : 3;

  const friendOptions: Record<
    CoupleSide,
    {
      badge: string;
      title: string;
      subtitle: string;
      buttonClass: string;
      badgeClass: string;
    }
  > = {
    groom: {
      badge: '신랑 지인용',
      title: `${config.groom.fullName} 지인`,
      subtitle: '모바일 청첩장 보기',
      buttonClass:
        'bg-[#3b2f2f] hover:bg-[#2a2121] text-[#fffdf9] border-[#3b2f2f]',
      badgeClass: 'bg-white/15 text-[#f5e7d0]',
    },
    bride: {
      badge: '신부 지인용',
      title: `${config.bride.fullName} 지인`,
      subtitle: '모바일 청첩장 보기',
      buttonClass:
        'bg-[#d97b84] hover:bg-[#c56871] text-white border-[#c56871]',
      badgeClass: 'bg-white/20 text-white',
    },
  };

  const parentOptions: Record<
    CoupleSide,
    {
      title: string;
      parentsLine: string;
      buttonClass: string;
      pillClass: string;
    }
  > = {
    groom: {
      title: '신랑측 부모님 지인 · 어르신용',
      parentsLine: `혼주 ${config.groom.fatherName} · ${config.groom.motherName}님 지인`,
      buttonClass:
        'bg-[#faf5ec] hover:bg-[#f2e8d8] text-[#2d221e] border-[#cbb79b]',
      pillClass: 'bg-[#3b2f2f] text-[#fffdf9]',
    },
    bride: {
      title: '신부측 부모님 지인 · 어르신용',
      parentsLine: `혼주 ${config.bride.fatherName} · ${config.bride.motherName}님 지인`,
      buttonClass:
        'bg-[#fcf4f5] hover:bg-[#f8e6e8] text-[#2d221e] border-[#dfb0b6]',
      pillClass: 'bg-[#b35c66] text-white',
    },
  };

  return (
    <div className="pixel-card px-5 py-6 sm:px-7 sm:py-7 bg-[#fffdf9] text-center relative overflow-hidden animate-fadeIn">
      {/* Compact Editorial Header */}
      <div className="space-y-0.5 mb-3.5">
        <div className="text-[11px] tracking-[0.3em] text-[#c59b6d] font-engSerif uppercase">
          WEDDING INVITATION
        </div>
        <div className="text-xs text-[#8c7a70] font-engSerif italic">
          {config.wedding.year}. {String(config.wedding.month).padStart(2, '0')}.{' '}
          {String(config.wedding.day).padStart(2, '0')} · {config.wedding.timeDisplay}
        </div>
      </div>

      {/* Compact Arched Bridal Cover Frame */}
      <div className="relative mx-auto max-w-[205px] sm:max-w-[230px] aspect-[4/3.6] rounded-t-full rounded-b-2xl border-2 border-[#d4b48c] bg-[#faf5ec] p-1.5 shadow-sm overflow-hidden">
        <div className="relative w-full h-full rounded-t-full rounded-b-xl overflow-hidden bg-[#f3ede2]">
          <img
            src={PIXEL_ASSETS.weddingCover}
            alt={`${firstName} ♥ ${secondName} 웨딩 표지`}
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>

      {/* Couple Portrait Badge overlapping arch */}
      <div className="relative z-10 -mt-5 flex justify-center">
        <div className="bg-[#fffdf9] border border-[#e6d5b8] rounded-full py-1 px-3 flex items-center justify-center gap-2 shadow-sm">
          <div
            style={{ order: groomOrder }}
            className="w-10 h-10 rounded-full bg-[#faf5ec] border border-[#d4b48c] overflow-hidden flex items-center justify-center shrink-0"
          >
            <GroomSprite size={38} variant="portrait" bounce />
          </div>
          <div style={{ order: 2 }} className="flex flex-col items-center">
            <PixelRing size={16} />
            <PixelHeart size={10} color="#d97b84" className="mt-0.5" />
          </div>
          <div
            style={{ order: brideOrder }}
            className="w-10 h-10 rounded-full bg-[#fcf5f5] border border-[#e2a3a9] overflow-hidden flex items-center justify-center shrink-0"
          >
            <BrideSprite size={38} variant="portrait" bounce />
          </div>
          <div style={{ order: 4 }} className="-ml-0.5">
            <PetCatSprite size={26} />
          </div>
        </div>
      </div>

      {/* Couple Names & Compact Date/Venue */}
      <div
        onClick={onSecretTap}
        className="mt-4 space-y-1 select-none"
      >
        <h1 className="text-xl sm:text-2xl font-bold tracking-[0.18em] text-[#3b2f2f]">
          {firstName}{' '}
          <span className="text-[#d97b84] text-base align-middle mx-1">♥</span>{' '}
          {secondName}
        </h1>
        <p className="text-xs text-[#6e5d53] font-sans">
          {config.wedding.dateDisplay} {config.wedding.timeDisplay}
        </p>
        <p className="text-[11px] text-[#8c7a70] font-sans">
          {config.wedding.venueName} · {config.wedding.hallName}
        </p>
      </div>

      <div className="my-4 border-t border-[#efe6d8]" />

      {/* 4 Tailored Audience Buttons (Random Groom/Bride Order, Unified) */}
      <div className="space-y-2.5 font-sans text-left">
        <p className="text-center text-xs font-semibold text-[#6e5d53] mb-1">
          초대받으신 분에 맞춰 청첩장을 열어주세요
        </p>

        {/* Row 1: Groom / Bride Friends (2-Column Grid) */}
        <div className="grid grid-cols-2 gap-2">
          {sides.map((side) => {
            const opt = friendOptions[side];
            return (
              <button
                key={`friend-${side}`}
                type="button"
                onClick={() => {
                  soundEngine.playSelect();
                  onSelectEntry('classic', side);
                }}
                className={`rounded-2xl border p-3.5 text-center flex flex-col items-center justify-center gap-1 shadow-sm transition-all active:scale-[0.98] ${opt.buttonClass}`}
              >
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${opt.badgeClass}`}
                >
                  {opt.badge}
                </span>
                <span className="text-sm sm:text-[15px] font-bold mt-0.5">
                  {opt.title}
                </span>
                <span className="text-[11px] opacity-85">{opt.subtitle}</span>
              </button>
            );
          })}
        </div>

        {/* Row 2: Groom / Bride Parents & Elders (Full-width Senior-friendly Cards) */}
        <div className="space-y-2 pt-0.5">
          {sides.map((side) => {
            const opt = parentOptions[side];
            return (
              <button
                key={`parent-${side}`}
                type="button"
                onClick={() => {
                  soundEngine.playSelect();
                  onSelectEntry('parents', side);
                }}
                className={`w-full rounded-2xl border-2 px-4 py-3.5 flex items-center justify-between gap-2 shadow-sm transition-all active:scale-[0.99] ${opt.buttonClass}`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[15px] sm:text-base font-bold leading-snug">
                      {opt.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${opt.pillClass}`}
                    >
                      큰글씨
                    </span>
                  </div>
                  <div className="text-xs text-[#69584f] mt-0.5 truncate">
                    {opt.parentsLine}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#8c7a70] shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
