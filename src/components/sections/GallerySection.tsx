import React, { useState } from 'react';
import { Sparkles, Eye, Grid, ChevronLeft, ChevronRight } from 'lucide-react';
import { WeddingConfig, GalleryItem } from '../../data/weddingConfig';
import { PixelHeart, PixelSceneBanner } from '../PixelSprites';
import { soundEngine } from '../../utils/soundEngine';

interface GallerySectionProps {
  config: WeddingConfig;
}

export const GallerySection: React.FC<GallerySectionProps> = ({ config }) => {
  const [viewMode, setViewMode] = useState<'photo' | 'pixel'>('photo');
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [likesMap, setLikesMap] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    config.gallery.forEach((g) => {
      init[g.id] = g.initialLikes;
    });
    return init;
  });
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});

  const activeItem: GalleryItem = config.gallery[selectedIdx] || config.gallery[0];

  const handleLike = (id: string) => {
    soundEngine.playCoin();
    setLikesMap((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const handlePrev = () => {
    soundEngine.playBlip(560);
    setSelectedIdx((prev) => (prev - 1 + config.gallery.length) % config.gallery.length);
  };

  const handleNext = () => {
    soundEngine.playBlip(720);
    setSelectedIdx((prev) => (prev + 1) % config.gallery.length);
  };

  return (
    <div className="space-y-4">
      {/* Museum Header & 8-Bit Filter Toggle */}
      <div className="pixel-box p-3.5 bg-[#1f1833] flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-[#4dabf7] text-[#120d1e]">
            MAIN QUEST 03 · 기억의 박물관
          </span>
          <h3 className="text-sm sm:text-base font-extrabold text-[#ffd541] mt-1">
            🖼️ 웨딩 스냅 & 16-Bit 도트 전시관
          </h3>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              soundEngine.playSelect();
              setViewMode('photo');
            }}
            className={`pixel-btn px-2.5 py-1.5 text-xs font-bold flex items-center gap-1 ${
              viewMode === 'photo'
                ? 'bg-[#ffd541] text-[#120d1e]'
                : 'bg-[#151024] text-[#a599b8]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> HD 스냅사진
          </button>
          <button
            onClick={() => {
              soundEngine.playSelect();
              setViewMode('pixel');
            }}
            className={`pixel-btn px-2.5 py-1.5 text-xs font-bold flex items-center gap-1 ${
              viewMode === 'pixel'
                ? 'bg-[#ff5277] text-white'
                : 'bg-[#151024] text-[#a599b8]'
            }`}
          >
            <Grid className="w-3.5 h-3.5" /> 16-Bit 도트화
          </button>
        </div>
      </div>

      {/* Featured Exhibition Frame */}
      <div className="pixel-box-gold p-3 sm:p-4 bg-[#181229]">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-[#38d9a9] font-extrabold">
            {activeItem.seasonTag} · {activeItem.questExp}
          </span>
          <span className="text-[#ffd541] font-bold">
            STAGE {selectedIdx + 1} / {config.gallery.length}
          </span>
        </div>

        {/* Main Image / Pixel Scene Viewport */}
        <div className="relative aspect-[16/11] w-full bg-[#120d1e] border-2 border-[#ffd541] overflow-hidden">
          {viewMode === 'pixel' || imgErrorMap[activeItem.id] ? (
            <div className="w-full h-full relative">
              <PixelSceneBanner theme={activeItem.pixelTheme} />
              <div className="absolute top-2 right-2 bg-[#120d1e]/85 border border-[#ffd541] px-2 py-0.5 text-[10px] text-[#ffd541]">
                👾 16-BIT PIXEL SCENE
              </div>
            </div>
          ) : (
            <img
              src={activeItem.imageUrl}
              alt={activeItem.title}
              onError={() =>
                setImgErrorMap((prev) => ({ ...prev, [activeItem.id]: true }))
              }
              className="w-full h-full object-cover transition-all duration-300"
            />
          )}

          {/* Left / Right Arcade Arrows */}
          <button
            onClick={handlePrev}
            aria-label="이전 사진"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#120d1e]/80 border border-[#ffd541] text-[#ffd541] flex items-center justify-center hover:bg-[#ffd541] hover:text-[#120d1e]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            aria-label="다음 사진"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#120d1e]/80 border border-[#ffd541] text-[#ffd541] flex items-center justify-center hover:bg-[#ffd541] hover:text-[#120d1e]"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Caption & Like Button */}
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] text-[#a599b8]">{activeItem.subtitle}</div>
            <h4 className="text-sm sm:text-base font-extrabold text-white">
              {activeItem.title}
            </h4>
            <p className="text-xs text-[#c3b8d9] mt-1 leading-relaxed">
              {activeItem.description}
            </p>
          </div>

          <button
            onClick={() => handleLike(activeItem.id)}
            className="pixel-btn bg-[#2e2448] hover:bg-[#ff5277] text-white px-3 py-2 text-xs font-extrabold shrink-0 flex items-center gap-1.5"
          >
            <PixelHeart size={15} />
            <span>{likesMap[activeItem.id] || 0}</span>
          </button>
        </div>
      </div>

      {/* Thumbnail Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {config.gallery.map((item, idx) => {
          const isSelected = idx === selectedIdx;
          return (
            <button
              key={item.id}
              onClick={() => {
                soundEngine.playBlip(640);
                setSelectedIdx(idx);
              }}
              className={`relative aspect-square overflow-hidden border-2 transition-transform ${
                isSelected
                  ? 'border-[#ffd541] scale-105 shadow-[0_0_8px_rgba(255,213,65,0.7)] z-10'
                  : 'border-[#362b52] opacity-75 hover:opacity-100'
              }`}
            >
              {viewMode === 'pixel' || imgErrorMap[item.id] ? (
                <PixelSceneBanner theme={item.pixelTheme} />
              ) : (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  onError={() =>
                    setImgErrorMap((prev) => ({ ...prev, [item.id]: true }))
                  }
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute bottom-0 inset-x-0 bg-[#120d1e]/80 text-[9px] text-center py-0.5 text-[#ffd541] font-bold">
                #{idx + 1}
              </div>
            </button>
          );
        })}
      </div>

      {/* Curator Tip */}
      <div className="bg-[#151024] border border-[#3d315e] p-2.5 text-center text-[11px] text-[#a599b8] flex items-center justify-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-[#ffd541] shrink-0" />
        <span>
          우측 상단 <strong>[16-Bit 도트화]</strong> 버튼을 누르면 각 사진의 계절 테마에 맞춘 도트 아트로 감상할 수 있습니다!
        </span>
      </div>
    </div>
  );
};
