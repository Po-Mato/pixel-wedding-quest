import React from 'react';
import {
  MapPin,
  Clock,
  Heart,
  Camera,
  Car,
  Train,
  Navigation,
  Sparkles,
  MessageCircleHeart,
} from 'lucide-react';
import { WeddingConfig, QuestBuildingId } from '../data/weddingConfig';
import { WeddingPhase } from '../utils/weddingPhase';
import { soundEngine } from '../utils/soundEngine';

interface WeddingPhaseBannerProps {
  config: WeddingConfig;
  phase: WeddingPhase;
  onJumpToSection: (sectionId: QuestBuildingId) => void;
  onResetPreview?: () => void;
  isPreviewOverride?: boolean;
}

export const WeddingPhaseBanner: React.FC<WeddingPhaseBannerProps> = ({
  config,
  phase,
  onJumpToSection,
  onResetPreview,
  isPreviewOverride,
}) => {
  if (phase === 'upcoming') return null;

  const encodedAddr = encodeURIComponent(config.wedding.addressRoad);
  const encodedVenue = encodeURIComponent(config.wedding.venueName);
  const hasValidCoords =
    Number.isFinite(config.wedding.lat) &&
    Number.isFinite(config.wedding.lng) &&
    config.wedding.lat !== 0 &&
    config.wedding.lng !== 0;

  const kakaoNavUrl = hasValidCoords
    ? `https://map.kakao.com/link/to/${encodedVenue},${config.wedding.lat},${config.wedding.lng}`
    : `https://map.kakao.com/link/search/${encodedAddr}`;

  if (phase === 'dday') {
    return (
      <div className="pixel-card-rose p-4 sm:p-5 bg-[#fffafa] space-y-3.5 font-sans animate-fadeIn">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#d97b84] text-white text-[10px] font-bold tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>WEDDING DAY · 오늘 결혼합니다</span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-[#3b2f2f] mt-1.5 font-serif">
              💍 {config.groom.fullName} ♥ {config.bride.fullName} 본식 당일 빠른 안내
            </h2>
          </div>

          {isPreviewOverride && onResetPreview && (
            <button
              type="button"
              onClick={onResetPreview}
              className="px-2 py-1 rounded-full bg-[#fffdf9] border border-[#e2a3a9] text-[10px] font-bold text-[#b85d67] shrink-0"
            >
              미리보기 닫기 ✕
            </button>
          )}
        </div>

        {/* Essential Venue & Parking Box */}
        <div className="bg-[#fffdf9] border border-[#e6d5b8] rounded-xl p-3 space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[#3b2f2f]">
            <Clock className="w-3.5 h-3.5 text-[#d97b84] shrink-0" />
            <span>
              오늘 {config.wedding.timeDisplay} · {config.wedding.venueName}{' '}
              <strong className="text-[#b85d67]">{config.wedding.hallName}</strong>
            </span>
          </div>
          {config.wedding.subwayGuide[0] && (
            <div className="flex items-start gap-1.5 text-[#5c4d47] text-[11px]">
              <Train className="w-3.5 h-3.5 text-[#6b9071] shrink-0 mt-0.5" />
              <span>{config.wedding.subwayGuide[0]}</span>
            </div>
          )}
          {config.wedding.parkingGuide[0] && (
            <div className="flex items-start gap-1.5 text-[#5c4d47] text-[11px]">
              <Car className="w-3.5 h-3.5 text-[#c59b6d] shrink-0 mt-0.5" />
              <span>{config.wedding.parkingGuide[0]}</span>
            </div>
          )}
        </div>

        {/* 1-Tap Quick Section & Map Shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => {
              soundEngine.playSelect();
              onJumpToSection('location');
            }}
            className="py-2 px-2.5 rounded-lg bg-[#3b2f2f] text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs"
          >
            <MapPin className="w-3.5 h-3.5 text-[#e6d5b8]" />
            <span>오시는 길·주차</span>
          </button>

          <a
            href={kakaoNavUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => soundEngine.playSelect()}
            className="py-2 px-2.5 rounded-lg bg-[#fee500] text-[#191919] border border-[#dfca00] text-xs font-bold flex items-center justify-center gap-1 shadow-xs"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>카카오맵 길찾기</span>
          </a>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSelect();
              onJumpToSection('ceremony');
            }}
            className="py-2 px-2.5 rounded-lg bg-[#fffdf9] text-[#3b2f2f] border border-[#d4b48c] text-xs font-bold flex items-center justify-center gap-1"
          >
            <Clock className="w-3.5 h-3.5 text-[#c59b6d]" />
            <span>예식 시간·식순</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSelect();
              onJumpToSection('gift');
            }}
            className="py-2 px-2.5 rounded-lg bg-[#fffdf9] text-[#3b2f2f] border border-[#d4b48c] text-xs font-bold flex items-center justify-center gap-1"
          >
            <Heart className="w-3.5 h-3.5 text-[#d97b84]" />
            <span>축의금 계좌</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pixel-card p-4 sm:p-5 bg-[#fffdf9] space-y-3.5 font-sans animate-fadeIn">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#6b9071] text-white text-[10px] font-bold tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>THANK YOU · 감사 인사드립니다</span>
          </div>
          <h2 className="text-sm sm:text-base font-bold text-[#3b2f2f] mt-1.5 font-serif">
            💐 따뜻한 축복으로 함께해 주셔서 진심으로 감사합니다
          </h2>
        </div>

        {isPreviewOverride && onResetPreview && (
          <button
            type="button"
            onClick={onResetPreview}
            className="px-2 py-1 rounded-full bg-[#faf5ec] border border-[#d4b48c] text-[10px] font-bold text-[#5c4d47] shrink-0"
          >
            미리보기 닫기 ✕
          </button>
        )}
      </div>

      <p className="text-xs text-[#5c4d47] leading-relaxed font-serif break-keep bg-[#faf5ec] p-3.5 rounded-xl border border-[#e6d5b8]">
        바쁘신 가운데 귀한 걸음으로 자리를 빛내주신 분들, 그리고 멀리서도 따뜻한 마음으로 축복해 주신 모든 분들께 깊이 감사드립니다. 보내주신 사랑을 잊지 않고{' '}
        <strong>{config.groom.fullName} · {config.bride.fullName}</strong> 두 사람 서로 아끼며 행복하게 잘 살겠습니다.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            soundEngine.playSelect();
            onJumpToSection('gallery');
          }}
          className="py-2.5 px-3 rounded-lg bg-[#3b2f2f] text-white text-xs font-bold flex items-center justify-center gap-1.5"
        >
          <Camera className="w-3.5 h-3.5 text-[#e6d5b8]" />
          <span>웨딩 사진 & 스냅 보기</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundEngine.playSelect();
            onJumpToSection('rsvp');
          }}
          className="py-2.5 px-3 rounded-lg bg-[#fcf0f1] text-[#b85d67] border border-[#e2a3a9] text-xs font-bold flex items-center justify-center gap-1.5"
        >
          <MessageCircleHeart className="w-3.5 h-3.5" />
          <span>축하 방명록 보기·남기기</span>
        </button>
      </div>
    </div>
  );
};
