import React from 'react';
import { Award, X, Sparkles } from 'lucide-react';
import { WeddingConfig } from '../data/weddingConfig';
import { GroomSprite, BrideSprite, PixelRing } from './PixelSprites';

interface CertificateModalProps {
  config: WeddingConfig;
  earnedTitle: string | null;
  stampCount: number;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  config,
  earnedTitle,
  stampCount,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="pixel-card w-full max-w-md p-6 bg-[#fffdf9] text-center relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-[#faf5ec] text-[#7d6e65] hover:text-[#3b2f2f] border border-[#e2d4c0]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#faf5ec] border border-[#d4b48c] text-[#c59b6d] text-[11px] font-sans font-bold mb-2">
          <Award className="w-3.5 h-3.5" /> GARDEN INVITATION ({stampCount}/7)
        </div>

        <h3 className="text-lg font-bold text-[#3b2f2f]">
          🌸 봄날의 정원 산책 초대권
        </h3>
        <p className="text-[11px] tracking-widest text-[#9c897e] font-engSerif uppercase mt-0.5">
          WEDDING GARDEN INVITATION CARD
        </p>

        <div className="my-5 py-4 px-3 bg-[#faf5ec] rounded-xl border border-[#e6d5b8] flex items-center justify-center gap-4">
          <GroomSprite
            size={52}
            primaryColor={config.groom.suitColor}
            hairColor={config.groom.hairColor}
            bounce
          />
          <PixelRing size={22} />
          <BrideSprite
            size={52}
            primaryColor={config.bride.dressColor}
            hairColor={config.bride.hairColor}
            bounce
          />
        </div>

        <div className="space-y-2.5 text-xs text-[#5c4d47] leading-relaxed">
          <p className="break-keep">
            <strong className="text-[#3b2f2f]">{config.groom.fullName}</strong> ♥{' '}
            <strong className="text-[#3b2f2f]">{config.bride.fullName}</strong>의 웨딩 정원을
            따뜻한 시선으로 둘러보아 주셔서 진심으로 감사드립니다.
          </p>
          {earnedTitle && (
            <div className="inline-block px-3.5 py-1 rounded-full bg-[#fcf0f1] border border-[#e2a3a9] text-[#b85d67] font-sans font-bold text-xs">
              기념 타이틀 : {earnedTitle}
            </div>
          )}
        </div>

        <div className="mt-5 pt-3.5 border-t border-[#efe6d8] text-xs text-[#5c4d47]">
          <div className="font-bold text-[#3b2f2f]">
            {config.wedding.dateDisplay} {config.wedding.timeDisplay}
          </div>
          <div className="text-[11px] text-[#8c7a70] mt-0.5">
            {config.wedding.venueName} · {config.wedding.hallName}
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-lg bg-[#d97b84] hover:bg-[#c96a73] text-white text-xs font-sans font-bold flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" /> 설레는 마음으로 예식장에서 뵙겠습니다
        </button>
      </div>
    </div>
  );
};
