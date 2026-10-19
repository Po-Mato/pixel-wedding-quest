import React, { useState } from 'react';
import { Eye, Grid, ChevronLeft, ChevronRight } from 'lucide-react';
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
    <div className="pixel-card p-5 sm:p-6 bg-[#fffdf9] space-y-5">
      {/* Gallery Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#efe6d8] pb-4">
        <div className="text-center sm:text-left">
          <div className="text-[11px] tracking-[0.25em] text-[#c59b6d] font-engSerif uppercase">
            GALLERY
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#3b2f2f] mt-0.5">
            우리의 순간들
          </h3>
        </div>

        <div className="flex items-center justify-center gap-1.5 font-sans">
          <button
            onClick={() => {
              soundEngine.playSelect();
              setViewMode('photo');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1 transition-colors ${
              viewMode === 'photo'
                ? 'bg-[#3b2f2f] text-white border-[#3b2f2f]'
                : 'bg-[#faf5ec] text-[#7d6e65] border-[#e2d4c0]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> 웨딩 사진
          </button>
          <button
            onClick={() => {
              soundEngine.playSelect();
              setViewMode('pixel');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1 transition-colors ${
              viewMode === 'pixel'
                ? 'bg-[#d97b84] text-white border-[#d97b84]'
                : 'bg-[#faf5ec] text-[#7d6e65] border-[#e2d4c0]'
            }`}
          >
            <Grid className="w-3.5 h-3.5" /> 픽셀 일러스트
          </button>
        </div>
      </div>

      {/* Featured Photo Frame */}
      <div className="bg-[#faf5ec] p-3 sm:p-4 rounded-xl border border-[#e6d5b8]">
        <div className="flex items-center justify-between text-[11px] text-[#8c7a70] font-sans mb-2">
          <span className="font-semibold text-[#c59b6d]">{activeItem.seasonTag}</span>
          <span>
            {selectedIdx + 1} / {config.gallery.length}
          </span>
        </div>

        <div className="relative aspect-[4/3] w-full bg-[#f3ede2] rounded-lg border border-[#d4b48c] overflow-hidden shadow-sm">
          {viewMode === 'pixel' || imgErrorMap[activeItem.id] ? (
            <div className="w-full h-full relative">
              <PixelSceneBanner theme={activeItem.pixelTheme} />
              <div className="absolute top-2.5 right-2.5 bg-[#fffdf9]/90 border border-[#d4b48c] px-2.5 py-0.5 rounded-full text-[10px] text-[#5c4d47] font-sans">
                🎨 Pastel Pixel Art
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

          {/* Left / Right Navigation */}
          <button
            onClick={handlePrev}
            aria-label="이전 사진"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#fffdf9]/85 border border-[#d4b48c] text-[#3b2f2f] flex items-center justify-center hover:bg-white shadow"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            aria-label="다음 사진"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#fffdf9]/85 border border-[#d4b48c] text-[#3b2f2f] flex items-center justify-center hover:bg-white shadow"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Caption & Heart Button */}
        <div className="mt-3.5 flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] text-[#8c7a70] font-sans">
              {activeItem.subtitle}
            </div>
            <h4 className="text-sm sm:text-base font-bold text-[#3b2f2f] mt-0.5">
              {activeItem.title}
            </h4>
            <p className="text-xs text-[#5c4d47] mt-1 leading-relaxed">
              {activeItem.description}
            </p>
          </div>

          <button
            onClick={() => handleLike(activeItem.id)}
            className="px-3 py-1.5 rounded-full bg-[#fffdf9] hover:bg-[#fcf0f1] border border-[#e2a3a9] text-[#b85d67] text-xs font-sans font-semibold shrink-0 flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
          >
            <PixelHeart size={14} color="#d97b84" />
            <span>{likesMap[activeItem.id] || 0}</span>
          </button>
        </div>
      </div>

      {/* Thumbnail Strip */}
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
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                isSelected
                  ? 'border-[#d97b84] scale-105 shadow-md z-10'
                  : 'border-[#e6d5b8] opacity-70 hover:opacity-100'
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
            </button>
          );
        })}
      </div>
    </div>
  );
};
