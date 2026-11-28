import React, { useState, useEffect, useRef, Suspense } from 'react';
import {
  Eye,
  Grid,
  ChevronLeft,
  ChevronRight,
  Camera,
  Maximize2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { WeddingConfig, GalleryItem } from '../../data/weddingConfig';
import { PixelHeart, PixelSceneBanner } from '../PixelSprites';
import { soundEngine } from '../../utils/soundEngine';
import { incrementReactionCounter } from '../../utils/weddingCloudSync';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';

const PhotoBoothModal = React.lazy(() =>
  import('./PhotoBoothModal').then((m) => ({ default: m.PhotoBoothModal }))
);

const STORAGE_GALLERY_LIKES_KEY = 'pixel_wedding_quest_gallery_likes_v1';

interface GallerySectionProps {
  config: WeddingConfig;
  onUnlockTitle?: (title: string) => void;
}

export const GallerySection: React.FC<GallerySectionProps> = ({
  config,
  onUnlockTitle,
}) => {
  const [viewMode, setViewMode] = useState<'photo' | 'pixel'>('photo');
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [showPhotoBooth, setShowPhotoBooth] = useState<boolean>(false);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lightboxZoomed, setLightboxZoomed] = useState<boolean>(false);
  const [lightboxHideChrome, setLightboxHideChrome] = useState<boolean>(false);
  const [lightboxDragY, setLightboxDragY] = useState<number>(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const singleTapTimerRef = useRef<number | null>(null);
  useBodyScrollLock(lightboxOpen);
  const [likesMap, setLikesMap] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    config.gallery.forEach((g) => {
      init[g.id] = g.initialLikes;
    });
    try {
      const saved = localStorage.getItem(STORAGE_GALLERY_LIKES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, number>;
        config.gallery.forEach((g) => {
          if (typeof parsed[g.id] === 'number' && parsed[g.id] >= g.initialLikes) {
            init[g.id] = parsed[g.id];
          }
        });
      }
    } catch {
      // ignore
    }
    return init;
  });
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});
  const [imgLoadedMap, setImgLoadedMap] = useState<Record<string, boolean>>({});

  // Preload adjacent gallery images so swiping/stepping feels instant
  useEffect(() => {
    if (viewMode !== 'photo' || config.gallery.length <= 1) return;
    const prevIdx = (selectedIdx - 1 + config.gallery.length) % config.gallery.length;
    const nextIdx = (selectedIdx + 1) % config.gallery.length;
    [prevIdx, nextIdx].forEach((idx) => {
      const target = config.gallery[idx];
      if (!target?.imageUrl || imgLoadedMap[target.imageUrl]) return;
      const preloader = new Image();
      preloader.onload = () => {
        setImgLoadedMap((prev) =>
          prev[target.imageUrl] ? prev : { ...prev, [target.imageUrl]: true }
        );
      };
      preloader.src = target.imageUrl;
    });
  }, [selectedIdx, viewMode, config.gallery, imgLoadedMap]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_GALLERY_LIKES_KEY, JSON.stringify(likesMap));
    } catch {
      // ignore
    }
  }, [likesMap]);

  const activeItem: GalleryItem = config.gallery[selectedIdx] || config.gallery[0];

  const handleLike = (id: string) => {
    soundEngine.playCoin();
    setLikesMap((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
    incrementReactionCounter('blessing').catch(() => {});
  };

  const handlePrev = () => {
    soundEngine.playBlip(560);
    setSelectedIdx((prev) => (prev - 1 + config.gallery.length) % config.gallery.length);
  };

  const handleNext = () => {
    soundEngine.playBlip(720);
    setSelectedIdx((prev) => (prev + 1) % config.gallery.length);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxZoomed(false);
    setLightboxHideChrome(false);
    setLightboxDragY(0);
    if (singleTapTimerRef.current) {
      window.clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = null;
    }
  };

  useEffect(() => {
    setLightboxZoomed(false);
  }, [selectedIdx]);

  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current) {
        window.clearTimeout(singleTapTimerRef.current);
      }
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  const handleLightboxTouchStart = (e: React.TouchEvent) => {
    if (lightboxZoomed) return;
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setLightboxDragY(0);
  };

  const handleLightboxTouchMove = (e: React.TouchEvent) => {
    if (lightboxZoomed || !touchStartRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    if (dy > 12 && dy > Math.abs(dx) * 1.25) {
      setLightboxDragY(Math.min(180, dy));
    } else if (lightboxDragY !== 0) {
      setLightboxDragY(0);
    }
  };

  const handleLightboxTouchEnd = (e: React.TouchEvent) => {
    if (lightboxZoomed) {
      touchStartRef.current = null;
      setLightboxDragY(0);
      return;
    }
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (dy > 75 && dy > Math.abs(dx) * 1.3) {
      soundEngine.playBlip(440);
      closeLightbox();
      return;
    }
    setLightboxDragY(0);

    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  const handleLightboxImageClick = () => {
    const now = Date.now();
    if (now - lastTapTimeRef.current < 280) {
      if (singleTapTimerRef.current) {
        window.clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapTimeRef.current = 0;
      soundEngine.playBlip(lightboxZoomed ? 520 : 720);
      setLightboxZoomed((prev) => !prev);
      return;
    }
    lastTapTimeRef.current = now;
    singleTapTimerRef.current = window.setTimeout(() => {
      setLightboxHideChrome((prev) => !prev);
      singleTapTimerRef.current = null;
    }, 280);
  };

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        setSelectedIdx((prev) => (prev - 1 + config.gallery.length) % config.gallery.length);
      } else if (e.key === 'ArrowRight') {
        setSelectedIdx((prev) => (prev + 1) % config.gallery.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxOpen, config.gallery.length]);

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
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#9c897e]">좌우 스와이프 · 탭하여 확대</span>
            <span className="font-semibold text-[#5c4d47]">
              {selectedIdx + 1} / {config.gallery.length}
            </span>
          </div>
        </div>

        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative aspect-[4/3] w-full bg-[#f3ede2] rounded-lg border border-[#d4b48c] overflow-hidden shadow-sm select-none"
        >
          {viewMode === 'pixel' || imgErrorMap[activeItem.id] ? (
            <div
              onClick={() => {
                soundEngine.playSelect();
                setLightboxOpen(true);
              }}
              className="w-full h-full relative cursor-zoom-in"
            >
              <PixelSceneBanner theme={activeItem.pixelTheme} />
              <div className="absolute top-2.5 right-2.5 bg-[#fffdf9]/90 border border-[#d4b48c] px-2.5 py-0.5 rounded-full text-[10px] text-[#5c4d47] font-sans">
                🎨 Pastel Pixel Art
              </div>
            </div>
          ) : (
            <div
              onClick={() => {
                soundEngine.playSelect();
                setLightboxOpen(true);
              }}
              className="w-full h-full relative cursor-zoom-in"
            >
              {!imgLoadedMap[activeItem.imageUrl] && (
                <div className="absolute inset-0 bg-[#efe6d8] animate-pulse" />
              )}
              <img
                src={activeItem.imageUrl}
                alt={activeItem.title}
                loading="eager"
                decoding="async"
                onLoad={() =>
                  setImgLoadedMap((prev) =>
                    prev[activeItem.imageUrl]
                      ? prev
                      : { ...prev, [activeItem.imageUrl]: true }
                  )
                }
                onError={() =>
                  setImgErrorMap((prev) => ({ ...prev, [activeItem.id]: true }))
                }
                className={`w-full h-full object-cover object-[50%_25%] transition-opacity duration-300 ${
                  imgLoadedMap[activeItem.imageUrl] ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>
          )}

          {/* Fullscreen Zoom Button */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playSelect();
              setLightboxOpen(true);
            }}
            aria-label="사진 크게 보기"
            className="absolute bottom-2.5 right-2.5 px-2.5 py-1.5 rounded-full bg-[#3b2f2f]/75 hover:bg-[#3b2f2f] text-white text-[10px] font-sans font-semibold flex items-center gap-1 backdrop-blur-sm shadow"
          >
            <Maximize2 className="w-3 h-3" />
            <span>크게 보기</span>
          </button>

          {/* Left / Right Navigation (40px touch target) */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="이전 사진"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#fffdf9]/90 border border-[#d4b48c] text-[#3b2f2f] flex items-center justify-center hover:bg-white shadow"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="다음 사진"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#fffdf9]/90 border border-[#d4b48c] text-[#3b2f2f] flex items-center justify-center hover:bg-white shadow"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Slide Dot Indicator */}
        {config.gallery.length > 1 && (
          <div
            role="tablist"
            aria-label="사진 순서 선택"
            className="mt-2.5 flex items-center justify-center gap-1.5"
          >
            {config.gallery.map((item, idx) => {
              const active = idx === selectedIdx;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`${idx + 1}번째 사진 보기`}
                  onClick={() => {
                    soundEngine.playBlip(640);
                    setSelectedIdx(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    active ? 'w-5 bg-[#d97b84]' : 'w-1.5 bg-[#d4b48c]/65 hover:bg-[#c59b6d]'
                  }`}
                />
              );
            })}
          </div>
        )}

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
                  loading="lazy"
                  decoding="async"
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

      {/* Pixel Wedding Polaroid Photo Booth CTA Banner */}
      <div className="bg-gradient-to-r from-[#fff5f6] via-[#faf5ec] to-[#fff5f6] p-4 rounded-xl border border-[#e2a3a9] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-center sm:text-left">
          <div className="text-[10px] tracking-[0.2em] font-sans font-bold text-[#d97b84]">
            SPECIAL KEEPSAKE · PIXEL PHOTO BOOTH
          </div>
          <div className="text-xs sm:text-sm font-bold text-[#3b2f2f] mt-0.5">
            📸 신랑·신부 3등신 캐릭터와 기념 폴라로이드 찍기
          </div>
          <p className="text-[11px] text-[#7d6e65] font-sans mt-0.5">
            내 하객 캐릭터와 배경 맵을 골라 나만의 웨딩 폴라로이드 카드를 저장해 보세요!
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playSelect();
            setShowPhotoBooth(true);
          }}
          className="px-4 py-2 rounded-full bg-[#d97b84] hover:bg-[#c56871] text-white text-xs font-sans font-bold shrink-0 flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>포토부스 촬영하기</span>
        </button>
      </div>

      {showPhotoBooth && (
        <Suspense fallback={null}>
          <PhotoBoothModal
            config={config}
            onClose={() => setShowPhotoBooth(false)}
            onUnlockTitle={onUnlockTitle}
          />
        </Suspense>
      )}

      {/* Fullscreen Lightbox Modal with Double-Tap Zoom, Tap-to-Hide Chrome & Swipe-Down Dismiss */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="웨딩 갤러리 확대 보기"
          onClick={closeLightbox}
          onTouchStart={handleLightboxTouchStart}
          onTouchMove={handleLightboxTouchMove}
          onTouchEnd={handleLightboxTouchEnd}
          style={{
            backgroundColor: `rgba(0, 0, 0, ${Math.max(0.45, 0.92 - lightboxDragY / 320)})`,
          }}
          className="fixed inset-0 z-50 backdrop-blur-sm overscroll-contain flex flex-col items-center justify-center p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:p-6 animate-fadeIn select-none transition-colors"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              transform: lightboxDragY > 0 ? `translateY(${lightboxDragY}px)` : undefined,
            }}
            className="w-full max-w-xl flex flex-col gap-3 transition-transform duration-150"
          >
            {/* Top Bar */}
            <div
              className={`flex items-center justify-between text-white font-sans text-xs px-1 transition-opacity duration-200 ${
                lightboxHideChrome ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2.5 py-0.5 rounded-full bg-white/15 border border-white/25 font-bold shrink-0">
                  {selectedIdx + 1} / {config.gallery.length}
                </span>
                <span className="text-[#f4acb7] font-semibold truncate">
                  {activeItem.seasonTag}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playBlip(lightboxZoomed ? 520 : 720);
                    setLightboxZoomed((prev) => !prev);
                  }}
                  aria-label={lightboxZoomed ? '원래 크기로 보기' : '2배 확대'}
                  className="px-2.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold flex items-center gap-1"
                >
                  {lightboxZoomed ? (
                    <>
                      <ZoomOut className="w-3.5 h-3.5" />
                      <span>1×</span>
                    </>
                  ) : (
                    <>
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>2×</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeLightbox}
                  className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  <span>닫기</span>
                </button>
              </div>
            </div>

            {/* Image Container */}
            <div
              onClick={handleLightboxImageClick}
              className={`relative w-full aspect-[4/3] sm:aspect-[16/11] bg-[#1f1917] rounded-xl border border-white/20 flex items-center justify-center ${
                lightboxZoomed ? 'overflow-auto cursor-zoom-out' : 'overflow-hidden cursor-zoom-in'
              }`}
            >
              {viewMode === 'pixel' || imgErrorMap[activeItem.id] ? (
                <div
                  className={`w-full h-full transition-transform duration-200 ${
                    lightboxZoomed ? 'scale-150 origin-center' : 'scale-100'
                  }`}
                >
                  <PixelSceneBanner theme={activeItem.pixelTheme} />
                </div>
              ) : (
                <>
                  {!imgLoadedMap[activeItem.imageUrl] && (
                    <div className="absolute inset-0 bg-[#2d2420] animate-pulse" />
                  )}
                  <img
                    src={activeItem.imageUrl}
                    alt={activeItem.title}
                    onLoad={() =>
                      setImgLoadedMap((prev) =>
                        prev[activeItem.imageUrl]
                          ? prev
                          : { ...prev, [activeItem.imageUrl]: true }
                      )
                    }
                    className={`max-w-full max-h-[72vh] w-full h-full object-contain transition-transform duration-200 ${
                      lightboxZoomed ? 'scale-[2] origin-center' : 'scale-100'
                    }`}
                  />
                </>
              )}

              {!lightboxHideChrome && !lightboxZoomed && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrev();
                    }}
                    aria-label="이전 사진"
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 hover:bg-black/75 border border-white/30 text-white flex items-center justify-center shadow-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNext();
                    }}
                    aria-label="다음 사진"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 hover:bg-black/75 border border-white/30 text-white flex items-center justify-center shadow-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Gesture Hint & Caption in Lightbox */}
            <div
              className={`space-y-2 transition-opacity duration-200 ${
                lightboxHideChrome ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              <div className="text-center text-[10px] text-white/65 font-sans">
                더블탭 확대 · 탭하여 UI 숨김 · 아래로 스와이프 닫기
              </div>
              <div className="bg-[#fffdf9] rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] text-[#8c7a70] font-sans">
                    {activeItem.subtitle}
                  </div>
                  <div className="text-sm font-bold text-[#3b2f2f]">
                    {activeItem.title}
                  </div>
                  <div className="text-xs text-[#5c4d47] mt-0.5">
                    {activeItem.description}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleLike(activeItem.id)}
                  className="px-3.5 py-2 rounded-full bg-[#fcf0f1] border border-[#e2a3a9] text-[#b85d67] text-xs font-sans font-bold shrink-0 flex items-center gap-1.5"
                >
                  <PixelHeart size={14} color="#d97b84" />
                  <span>{likesMap[activeItem.id] || 0}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
