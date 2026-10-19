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
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="pixel-box-parchment w-full max-w-md p-5 text-center relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 pixel-btn bg-[#ff5277] text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="inline-flex items-center gap-1 px-3 py-0.5 bg-[#2b1e16] text-[#ffd541] text-[11px] font-extrabold mb-2">
          <Award className="w-3.5 h-3.5" /> QUEST STAMP COMPLETE ({stampCount}/7)
        </div>

        <h3 className="text-lg font-extrabold text-[#2b1e16]">
          🏆 명예 웨딩 파티원 인증서
        </h3>
        <p className="text-xs text-[#6c462c] mt-1">
          HONORARY PARTY MEMBER CERTIFICATE
        </p>

        <div className="my-4 py-4 px-3 bg-[#f5e8c7] border-2 border-[#4a3222] flex items-center justify-center gap-4">
          <GroomSprite
            size={54}
            primaryColor={config.groom.suitColor}
            hairColor={config.groom.hairColor}
            bounce
          />
          <PixelRing size={24} />
          <BrideSprite
            size={54}
            primaryColor={config.bride.dressColor}
            hairColor={config.bride.hairColor}
            bounce
          />
        </div>

        <div className="space-y-2 text-xs text-[#2b1e16] leading-relaxed">
          <p className="font-bold">
            위 모험가는 <span className="text-[#d9385a]">{config.groom.fullName}</span> ♥{' '}
            <span className="text-[#d9385a]">{config.bride.fullName}</span>의 웨딩빌리지를
            성실히 탐험하며 두 사람의 앞날에 축복 버프를 내려주셨기에 이 증서를 수여합니다!
          </p>
          {earnedTitle && (
            <div className="inline-block px-3 py-1 bg-[#2b1e16] text-[#ffd541] font-extrabold text-xs">
              부여 칭호 : {earnedTitle}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-[#c9b182] text-[11px] text-[#5c3c24] font-bold">
          📅 본식 집결일 : {config.wedding.dateDisplay} {config.wedding.timeDisplay}
          <br />
          🏰 집결 장소 : {config.wedding.venueName} {config.wedding.hallName}
        </div>

        <button
          onClick={onClose}
          className="mt-4 pixel-btn w-full bg-[#ff5277] text-white py-2.5 text-xs font-extrabold flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-4 h-4" /> 그날 예식장에서 만나요!
        </button>
      </div>
    </div>
  );
};
