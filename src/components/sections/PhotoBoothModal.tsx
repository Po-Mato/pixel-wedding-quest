import React, { useEffect, useRef, useState } from 'react';
import { Camera, Download, Sparkles, X, Check } from 'lucide-react';
import { fireCelebrationConfetti } from '../../utils/motion';
import {
  AVATAR_CLASSES,
  AvatarClassId,
  COMMUTE_MAP_ORDER,
  GARDEN_MAPS,
  GARDEN_MAP_ORDER,
  GardenMapId,
  VENUE_MAP_ORDER,
  WeddingConfig,
} from '../../data/weddingConfig';
import { PIXEL_ASSETS, GUEST_SPRITES, MAP_ASSET_BY_ID } from '../PixelSprites';
import { soundEngine } from '../../utils/soundEngine';
import { useCoupleOrder } from '../../utils/coupleOrder';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';
import { useEscapeKey } from '../../utils/useEscapeKey';
import { isInAppBrowser, isIOSDevice } from '../../utils/calendar';
import { showToast } from '../../utils/toast';
import { incrementReactionCounter } from '../../utils/weddingCloudSync';

const STORAGE_GUEST_AVATAR_KEY = 'pixel_wedding_quest_guest_avatar_v1';
const STORAGE_GUEST_NAME_KEY = 'pixel_wedding_quest_guest_name_v1';

interface PhotoBoothModalProps {
  config: WeddingConfig;
  initialMapId?: GardenMapId;
  initialAvatar?: AvatarClassId;
  initialGuestName?: string;
  onClose: () => void;
  onUnlockTitle?: (title: string) => void;
}

const PHOTOBOOTH_MAP_CROP: Record<
  GardenMapId,
  { sx: number; sy: number; sw: number; sh: number }
> = {
  home: { sx: 0.12, sy: 0.14, sw: 0.76, sh: 0.66 },
  neighborhood: { sx: 0.12, sy: 0.1, sw: 0.76, sh: 0.66 },
  station: { sx: 0.12, sy: 0.1, sw: 0.76, sh: 0.66 },
  train: { sx: 0.12, sy: 0.12, sw: 0.76, sh: 0.66 },
  bridal: { sx: 0.12, sy: 0.08, sw: 0.76, sh: 0.66 },
  garden: { sx: 0.12, sy: 0.14, sw: 0.76, sh: 0.66 },
  chapel: { sx: 0.12, sy: 0.06, sw: 0.76, sh: 0.66 },
  memory: { sx: 0.12, sy: 0.14, sw: 0.76, sh: 0.66 },
  reception: { sx: 0.12, sy: 0.08, sw: 0.76, sh: 0.66 },
};

function readSavedGuestAvatar(fallback: AvatarClassId): AvatarClassId {
  try {
    const saved = localStorage.getItem(STORAGE_GUEST_AVATAR_KEY) as AvatarClassId | null;
    if (saved && AVATAR_CLASSES.some((a) => a.id === saved)) {
      return saved;
    }
  } catch {
    // ignore
  }
  return fallback;
}

function readSavedGuestName(fallback: string): string {
  try {
    const saved = localStorage.getItem(STORAGE_GUEST_NAME_KEY);
    if (saved && saved.trim()) {
      return saved.trim().slice(0, 12);
    }
  } catch {
    // ignore
  }
  return fallback;
}

type PoseEffectId = 'petal_shower' | 'love_hearts' | 'champagne' | 'starlight';
type FrameStyleId = 'ivory' | 'blush' | 'champagne' | 'midnight';

const POSE_EFFECTS: { id: PoseEffectId; label: string; symbol: string; tag: string }[] = [
  { id: 'petal_shower', label: '🌸 벚꽃 샤워', symbol: '🌸', tag: 'SPRING BLOSSOM' },
  { id: 'love_hearts', label: '🫶 러브 하트', symbol: '♥', tag: 'FOREVER LOVE' },
  { id: 'champagne', label: '🥂 샴페인 건배', symbol: '🥂', tag: 'CHEERS TO US' },
  { id: 'starlight', label: '✨ 별빛 스파클', symbol: '✦', tag: 'STARLIGHT WISH' },
];

const FRAME_STYLES: {
  id: FrameStyleId;
  label: string;
  bg: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
}[] = [
  {
    id: 'ivory',
    label: '실크 아이보리',
    bg: '#fffdf9',
    border: '#d4b48c',
    textPrimary: '#3b2f2f',
    textSecondary: '#7d6e65',
    accent: '#d97b84',
  },
  {
    id: 'blush',
    label: '블러쉬 로즈',
    bg: '#fff5f6',
    border: '#e2a3a9',
    textPrimary: '#4a2c30',
    textSecondary: '#8c6267',
    accent: '#d97b84',
  },
  {
    id: 'champagne',
    label: '샴페인 골드',
    bg: '#fbf5ea',
    border: '#c59b6d',
    textPrimary: '#3b2f2f',
    textSecondary: '#7a654b',
    accent: '#b8864c',
  },
  {
    id: 'midnight',
    label: '미드나잇 가든',
    bg: '#2a2223',
    border: '#c59b6d',
    textPrimary: '#fffdf9',
    textSecondary: '#d8c8b8',
    accent: '#f2a6b0',
  },
];

export const PhotoBoothModal: React.FC<PhotoBoothModalProps> = ({
  config,
  initialMapId,
  initialAvatar,
  initialGuestName,
  onClose,
  onUnlockTitle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { primary, names } = useCoupleOrder();
  useBodyScrollLock(true);

  const [selectedMap, setSelectedMap] = useState<GardenMapId>(() =>
    initialMapId && GARDEN_MAPS[initialMapId] ? initialMapId : 'garden'
  );
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarClassId>(() =>
    initialAvatar && AVATAR_CLASSES.some((a) => a.id === initialAvatar)
      ? initialAvatar
      : readSavedGuestAvatar('mage')
  );
  const [selectedPose, setSelectedPose] = useState<PoseEffectId>('petal_shower');
  const [selectedFrame, setSelectedFrame] = useState<FrameStyleId>('ivory');
  const [guestName, setGuestName] = useState<string>(() =>
    initialGuestName && initialGuestName.trim()
      ? initialGuestName.trim().slice(0, 12)
      : readSavedGuestName('소중한 하객')
  );
  const [blessingText, setBlessingText] = useState<string>(
    `${names(config, 'name')} 두 사람의 찬란한 봄날을 축복합니다!`
  );
  const [flashActive, setFlashActive] = useState<boolean>(false);
  const [snappedCount, setSnappedCount] = useState<number>(0);
  const [downloadedToast, setDownloadedToast] = useState<boolean>(false);
  const [savePreviewDataUrl, setSavePreviewDataUrl] = useState<string | null>(null);

  useEscapeKey(true, () => {
    if (savePreviewDataUrl) {
      setSavePreviewDataUrl(null);
    } else {
      onClose();
    }
  });

  const loadedImagesRef = useRef<{
    maps: Partial<Record<GardenMapId, HTMLImageElement>>;
    groom: HTMLImageElement | null;
    bride: HTMLImageElement | null;
    dogCream: HTMLImageElement | null;
    dogKkomi: HTMLImageElement | null;
    guests: Partial<Record<AvatarClassId, HTMLImageElement>>;
  }>({
    maps: {},
    groom: null,
    bride: null,
    dogCream: null,
    dogKkomi: null,
    guests: {},
  });

  const [assetsReadyTick, setAssetsReadyTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = (src: string, cb: (img: HTMLImageElement) => void) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      img.onload = () => {
        if (cancelled) return;
        cb(img);
        setAssetsReadyTick((t) => t + 1);
      };
    };

    // Prioritize initial map first, then load all 9 maps from shared MAP_ASSET_BY_ID
    const startMap: GardenMapId =
      initialMapId && GARDEN_MAPS[initialMapId] ? initialMapId : 'garden';
    const orderedMaps: GardenMapId[] = [
      startMap,
      ...GARDEN_MAP_ORDER.filter((mId) => mId !== startMap),
    ];
    orderedMaps.forEach((mId) =>
      load(MAP_ASSET_BY_ID[mId], (i) => {
        loadedImagesRef.current.maps[mId] = i;
      })
    );

    load(PIXEL_ASSETS.groomSprite, (i) => (loadedImagesRef.current.groom = i));
    load(PIXEL_ASSETS.brideSprite, (i) => (loadedImagesRef.current.bride = i));
    load(PIXEL_ASSETS.dogCreamSprite, (i) => (loadedImagesRef.current.dogCream = i));
    load(PIXEL_ASSETS.dogKkomiSprite, (i) => (loadedImagesRef.current.dogKkomi = i));
    (Object.keys(GUEST_SPRITES) as AvatarClassId[]).forEach((id) =>
      load(GUEST_SPRITES[id].sprite, (i) => (loadedImagesRef.current.guests[id] = i))
    );

    return () => {
      cancelled = true;
    };
  }, [initialMapId]);

  // Render Polaroid Canvas whenever options or loaded images update
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 680;
    const H = 820;
    canvas.width = W;
    canvas.height = H;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const frame = FRAME_STYLES.find((f) => f.id === selectedFrame) || FRAME_STYLES[0];
    const pose = POSE_EFFECTS.find((p) => p.id === selectedPose) || POSE_EFFECTS[0];
    const mapMeta = GARDEN_MAPS[selectedMap];

    // 1. Polaroid Outer Card
    ctx.fillStyle = frame.bg;
    ctx.fillRect(0, 0, W, H);

    // Outer Decorative Double Border
    ctx.strokeStyle = frame.border;
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, W - 20, H - 20);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(18, 18, W - 36, H - 36);

    // 2. Inner Photo Frame Window
    const photoX = 38;
    const photoY = 38;
    const photoW = W - 76;
    const photoH = 520;

    ctx.save();
    ctx.beginPath();
    ctx.rect(photoX, photoY, photoW, photoH);
    ctx.clip();

    const bgImg = loadedImagesRef.current.maps[selectedMap];
    if (bgImg) {
      // Draw a scenic zoomed crop tuned for each of the 9 wedding world maps
      const crop = PHOTOBOOTH_MAP_CROP[selectedMap] || PHOTOBOOTH_MAP_CROP.garden;
      const sx = bgImg.naturalWidth * crop.sx;
      const sy = bgImg.naturalHeight * crop.sy;
      const sw = bgImg.naturalWidth * crop.sw;
      const sh = bgImg.naturalHeight * crop.sh;
      ctx.drawImage(bgImg, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
    } else {
      const placeholderGrad = ctx.createLinearGradient(
        photoX,
        photoY,
        photoX,
        photoY + photoH
      );
      placeholderGrad.addColorStop(0, '#f4ede1');
      placeholderGrad.addColorStop(1, '#e6dcc9');
      ctx.fillStyle = placeholderGrad;
      ctx.fillRect(photoX, photoY, photoW, photoH);
      ctx.fillStyle = '#7d6e65';
      ctx.font = 'bold 15px "Pretendard", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${mapMeta.icon} ${mapMeta.tabLabel} 배경을 불러오는 중...`,
        photoX + photoW / 2,
        photoY + photoH * 0.34
      );
    }

    // Soft romantic radial sunlight overlay inside photo
    const grad = ctx.createRadialGradient(
      photoX + photoW / 2,
      photoY + photoH * 0.45,
      40,
      photoX + photoW / 2,
      photoY + photoH * 0.5,
      photoW * 0.72
    );
    grad.addColorStop(0, 'rgba(255, 253, 245, 0.12)');
    grad.addColorStop(1, 'rgba(42, 30, 28, 0.26)');
    ctx.fillStyle = grad;
    ctx.fillRect(photoX, photoY, photoW, photoH);

    // Top-left Location Stamp Pill inside Photo (dynamically sized to map name)
    const stampLabel = `${mapMeta.icon} ${mapMeta.tabLabel} 스냅`;
    ctx.font = 'bold 14px "Pretendard", sans-serif';
    const stampPillW = Math.min(260, Math.max(150, Math.ceil(ctx.measureText(stampLabel).width) + 28));
    ctx.fillStyle = 'rgba(255, 253, 249, 0.9)';
    ctx.fillRect(photoX + 16, photoY + 16, stampPillW, 30);
    ctx.strokeStyle = frame.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(photoX + 16, photoY + 16, stampPillW, 30);
    ctx.fillStyle = '#3b2f2f';
    ctx.textAlign = 'left';
    ctx.fillText(stampLabel, photoX + 28, photoY + 36, stampPillW - 20);

    // Top-right Pose Tag Pill
    ctx.fillStyle = 'rgba(217, 123, 132, 0.92)';
    ctx.fillRect(photoX + photoW - 166, photoY + 16, 150, 30);
    ctx.fillStyle = '#fffdf9';
    ctx.font = 'bold 12px "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pose.tag, photoX + photoW - 91, photoY + 36);

    // 3. Draw Characters (Pet Dogs '크림' & '꼬미', Couple ordered by useCoupleOrder, and Guest Chibi Avatar!)
    const floorY = photoY + photoH - 64;
    const centerX = photoX + photoW / 2;

    const creamX = centerX - 196;
    const kkomiX = centerX - 134;
    const groomX = primary === 'bride' ? centerX + 42 : centerX - 52;
    const brideX = primary === 'bride' ? centerX - 52 : centerX + 42;
    const guestX = centerX + 158;

    // Ground shadows
    ctx.fillStyle = 'rgba(42, 30, 28, 0.26)';
    [
      { x: creamX, rx: 26, ry: 8 },
      { x: kkomiX, rx: 22, ry: 7 },
      { x: groomX, rx: 38, ry: 11 },
      { x: brideX, rx: 46, ry: 12 },
      { x: guestX, rx: 38, ry: 11 },
    ].forEach((s) => {
      ctx.beginPath();
      ctx.ellipse(s.x, floorY, s.rx, s.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    const drawSprite = (img: HTMLImageElement | null, cx: number, cy: number, targetH: number) => {
      if (!img) return;
      const w = Math.round((targetH * img.naturalWidth) / img.naturalHeight);
      ctx.drawImage(img, Math.round(cx - w / 2), Math.round(cy - targetH), w, targetH);
    };

    // Draw Pet Dogs '크림(엄마)' & '꼬미(딸)'
    drawSprite(loadedImagesRef.current.dogCream, creamX, floorY + 4, 102);
    drawSprite(loadedImagesRef.current.dogKkomi, kkomiX, floorY + 6, 88);
    // Draw Groom & Bride (3-head-tall chibi) respecting couple order
    if (primary === 'bride') {
      drawSprite(loadedImagesRef.current.bride, brideX, floorY + 2, 206);
      drawSprite(loadedImagesRef.current.groom, groomX, floorY, 210);
    } else {
      drawSprite(loadedImagesRef.current.groom, groomX, floorY, 210);
      drawSprite(loadedImagesRef.current.bride, brideX, floorY + 2, 206);
    }
    // Draw Selected Guest Avatar
    const guestImg = loadedImagesRef.current.guests[selectedAvatar];
    const guestH = selectedAvatar === 'cat' ? 128 : 192;
    drawSprite(guestImg || null, guestX, floorY, guestH);

    // Guest Name Tag above Guest Avatar
    const cleanGuestName = (guestName || '소중한 하객').trim().slice(0, 12);
    ctx.font = 'bold 14px "Pretendard", sans-serif';
    const tagW = Math.max(84, ctx.measureText(cleanGuestName).width + 24);
    const tagY = floorY - guestH - 36;
    ctx.fillStyle = 'rgba(255, 253, 249, 0.95)';
    ctx.fillRect(guestX - tagW / 2, tagY, tagW, 26);
    ctx.strokeStyle = '#d97b84';
    ctx.lineWidth = 2;
    ctx.strokeRect(guestX - tagW / 2, tagY, tagW, 26);
    ctx.fillStyle = '#3b2f2f';
    ctx.textAlign = 'center';
    ctx.fillText(cleanGuestName, guestX, tagY + 18);

    // Heart between Groom & Bride
    ctx.fillStyle = '#d97b84';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('♥', (groomX + brideX) / 2, floorY - 216);

    // 4. Decorative Pose Particles inside Photo
    const decoSeeds = [
      { x: 0.14, y: 0.22 },
      { x: 0.28, y: 0.16 },
      { x: 0.48, y: 0.14 },
      { x: 0.68, y: 0.18 },
      { x: 0.85, y: 0.24 },
      { x: 0.12, y: 0.48 },
      { x: 0.88, y: 0.46 },
      { x: 0.22, y: 0.34 },
      { x: 0.76, y: 0.32 },
    ];
    ctx.font = 'bold 22px sans-serif';
    decoSeeds.forEach((pt, i) => {
      const px = photoX + photoW * pt.x;
      const py = photoY + photoH * pt.y;
      ctx.fillStyle = i % 2 === 0 ? '#ffd6e0' : '#fffdf9';
      ctx.fillText(pose.symbol, px, py);
    });

    ctx.restore();

    // Inner Photo Frame Border
    ctx.strokeStyle = frame.border;
    ctx.lineWidth = 3;
    ctx.strokeRect(photoX, photoY, photoW, photoH);

    // 5. Polaroid Bottom Caption Area
    const capCenterY = photoY + photoH + 54;
    const maxCaptionWidth = W - 84;

    ctx.fillStyle = frame.accent;
    ctx.font = '600 15px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'center';
    const dateFormatted = `${config.wedding.year}. ${String(config.wedding.month).padStart(2, '0')}. ${String(config.wedding.day).padStart(2, '0')}`;
    ctx.fillText(
      `OUR SPRING WEDDING MEMORIES · ${dateFormatted}`,
      W / 2,
      capCenterY,
      maxCaptionWidth
    );

    ctx.fillStyle = frame.textPrimary;
    ctx.font = 'bold 28px "Gowun Batang", serif';
    ctx.fillText(
      names(config, 'fullName', '  ♥  '),
      W / 2,
      capCenterY + 42,
      maxCaptionWidth
    );

    // Guest Blessing Quote Box
    const msg = (blessingText || '결혼을 진심으로 축하합니다 ♥').trim().slice(0, 38);
    ctx.fillStyle = frame.textSecondary;
    ctx.font = 'italic 18px "Gowun Batang", serif';
    ctx.fillText(`“${msg}”`, W / 2, capCenterY + 86, maxCaptionWidth);

    // Bottom Signature & Venue Line
    ctx.fillStyle = frame.textSecondary;
    ctx.font = 'bold 14px "Pretendard", sans-serif';
    ctx.fillText(
      `With ${cleanGuestName} · ${config.wedding.venueName} ${config.wedding.hallName}`,
      W / 2,
      capCenterY + 132,
      maxCaptionWidth
    );
  }, [
    selectedMap,
    selectedAvatar,
    selectedPose,
    selectedFrame,
    guestName,
    blessingText,
    config,
    primary,
    names,
    assetsReadyTick,
  ]);

  const handleTakeSnap = () => {
    soundEngine.playFanfare();
    setFlashActive(true);
    window.setTimeout(() => setFlashActive(false), 260);
    setSnappedCount((c) => c + 1);
    incrementReactionCounter('snap')
      .then((res) => {
        if (res && typeof res.snapCount === 'number') {
          setSnappedCount(res.snapCount);
        }
      })
      .catch(() => {});

    if (onUnlockTitle) {
      onUnlockTitle('📸 오늘의 베스트 포토그래퍼');
    }

    fireCelebrationConfetti({
      particleCount: 45,
      spread: 65,
      origin: { y: 0.6 },
      colors: ['#e899a0', '#d4af7a', '#fffdf9'],
    });
  };

  const handleDownloadPolaroid = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    handleTakeSnap();

    const fileName = `pixel-wedding-polaroid-${config.groom.name}-${config.bride.name}.png`;
    try {
      const dataUrl = canvas.toDataURL('image/png');

      // 1. Mobile Web Share API (saves directly to Photos / shares to KakaoTalk cleanly)
      if (typeof navigator.share === 'function' && typeof File !== 'undefined') {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), 'image/png')
        );
        if (blob) {
          const file = new File([blob], fileName, { type: 'image/png' });
          const navWithFiles = navigator as Navigator & {
            canShare?: (data: { files?: File[] }) => boolean;
          };
          if (navWithFiles.canShare && navWithFiles.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: `${names(config, 'name')} 웨딩 포토부스 기념사진`,
              });
              setDownloadedToast(true);
              showToast('폴라로이드 사진 공유·저장 화면을 열었습니다');
              window.setTimeout(() => setDownloadedToast(false), 3000);
              return;
            } catch (err) {
              if (err instanceof Error && err.name === 'AbortError') {
                return;
              }
            }
          }
        }
      }

      // 2. iOS Safari or In-App Browser (KakaoTalk/Naver/Instagram): open long-press save preview
      if (isInAppBrowser() || isIOSDevice()) {
        setSavePreviewDataUrl(dataUrl);
        showToast('이미지를 길게 눌러 사진첩에 저장해 주세요', 'info', 3600);
        return;
      }

      // 3. Desktop & standard browsers: immediate PNG file download
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadedToast(true);
      showToast('폴라로이드 사진이 저장되었습니다');
      window.setTimeout(() => setDownloadedToast(false), 3000);
    } catch {
      showToast('저장에 실패했습니다. 화면을 캡처해 간직해 주세요', 'info');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="신랑 신부와 픽셀 기념 포토부스"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overscroll-contain flex items-center justify-center p-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="pixel-card w-full max-w-[520px] max-h-[92vh] bg-[#f7f2e9] flex flex-col overflow-hidden animate-fadeIn"
      >
        {/* Header */}
        <div className="p-3.5 bg-[#fffdf9] border-b border-[#e6d5b8] flex items-center justify-between gap-2 shrink-0">
          <div>
            <div className="text-[10px] tracking-widest font-sans font-bold text-[#d97b84]">
              PIXEL POLAROID STUDIO
            </div>
            <h2 className="text-sm sm:text-base font-bold text-[#3b2f2f] flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-[#d97b84]" />
              신랑·신부와 픽셀 기념 포토부스
            </h2>
          </div>

          <button
            onClick={() => {
              soundEngine.playBlip(440);
              onClose();
            }}
            className="px-3 py-1 rounded-full bg-[#faf5ec] hover:bg-[#f3e9d8] border border-[#d4b48c] text-[#5c4d47] text-xs font-sans font-bold flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> 닫기
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-3.5 sm:p-4 overflow-y-auto flex-1 space-y-4">
          {/* Live Polaroid Preview Canvas */}
          <div className="relative mx-auto max-w-[330px] rounded-xl overflow-hidden shadow-md border border-[#d4b48c] bg-[#fffdf9]">
            <canvas
              ref={canvasRef}
              className="w-full h-auto block"
            />
            {flashActive && (
              <div className="absolute inset-0 bg-white/90 pointer-events-none transition-opacity duration-200" />
            )}
          </div>

          {/* Shutter & Download Action Buttons */}
          <div className="grid grid-cols-2 gap-2 font-sans">
            <button
              type="button"
              onClick={handleTakeSnap}
              className="py-2.5 px-3 rounded-xl bg-[#faf5ec] hover:bg-[#f3e9d8] border border-[#c59b6d] text-[#3b2f2f] text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
            >
              <Camera className="w-4 h-4 text-[#d97b84]" />
              <span>📸 찰칵! 기념 촬영 {snappedCount > 0 ? `(${snappedCount})` : ''}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPolaroid}
              className="py-2.5 px-3 rounded-xl bg-[#d97b84] hover:bg-[#c56871] border border-[#b85d67] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
            >
              {downloadedToast ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>폴라로이드 저장 완료!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>폴라로이드 저장 (PNG)</span>
                </>
              )}
            </button>
          </div>

          {/* Customization Controls */}
          <div className="bg-[#fffdf9] p-3.5 rounded-xl border border-[#e6d5b8] space-y-3.5 font-sans">
            {/* 1. Background Map (All 9 Maps Grouped by Stage) */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-[#5c4d47]">
                1. 촬영 배경 맵 선택 ({GARDEN_MAP_ORDER.length}개 웨딩 월드)
              </label>

              <div>
                <div className="text-[10px] font-bold text-[#8c7a70] mb-1">
                  🏠 1막 · 출발·이동길 ({COMMUTE_MAP_ORDER.length}곳)
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {COMMUTE_MAP_ORDER.map((mId) => {
                    const m = GARDEN_MAPS[mId];
                    const active = selectedMap === mId;
                    return (
                      <button
                        key={mId}
                        type="button"
                        onClick={() => {
                          soundEngine.playBlip(620);
                          setSelectedMap(mId);
                        }}
                        className={`py-1.5 px-1 rounded-lg border text-[11px] font-semibold flex flex-col items-center gap-0.5 transition-all ${
                          active
                            ? 'bg-[#d97b84] text-white border-[#b85d67] shadow-sm'
                            : 'bg-[#faf5ec] text-[#5c4d47] border-[#e2d4c0] hover:bg-[#f3e9d8]'
                        }`}
                      >
                        <span>{m.icon}</span>
                        <span className="truncate w-full text-center">{m.tabLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-[#8c7a70] mb-1">
                  🌿 2막 · 보타닉 웨딩 가든 ({VENUE_MAP_ORDER.length}곳)
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {VENUE_MAP_ORDER.map((mId) => {
                    const m = GARDEN_MAPS[mId];
                    const active = selectedMap === mId;
                    return (
                      <button
                        key={mId}
                        type="button"
                        onClick={() => {
                          soundEngine.playBlip(620);
                          setSelectedMap(mId);
                        }}
                        className={`py-1.5 px-1 rounded-lg border text-[11px] font-semibold flex flex-col items-center gap-0.5 transition-all ${
                          active
                            ? 'bg-[#d97b84] text-white border-[#b85d67] shadow-sm'
                            : 'bg-[#faf5ec] text-[#5c4d47] border-[#e2d4c0] hover:bg-[#f3e9d8]'
                        }`}
                      >
                        <span>{m.icon}</span>
                        <span className="truncate w-full text-center">{m.tabLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Guest Chibi Character */}
            <div>
              <label className="block text-[11px] font-bold text-[#5c4d47] mb-1.5">
                2. 함께 설 하객 3등신 캐릭터 선택
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {AVATAR_CLASSES.map((av) => {
                  const active = selectedAvatar === av.id;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playBlip(680);
                        setSelectedAvatar(av.id);
                      }}
                      className={`p-1.5 rounded-lg border text-center flex flex-col items-center gap-1 transition-all ${
                        active
                          ? 'bg-[#fcf0f1] border-[#d97b84] ring-1 ring-[#d97b84]'
                          : 'bg-[#faf5ec] border-[#e2d4c0] opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={GUEST_SPRITES[av.id].portrait}
                        alt={av.name}
                        className="w-9 h-9 rounded-full object-cover border border-[#d4b48c] bg-white"
                      />
                      <span className="text-[10px] font-bold text-[#3b2f2f] truncate w-full">
                        {av.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Celebration Pose & Frame Theme */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#5c4d47] mb-1.5">
                  3. 축복 이펙트
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {POSE_EFFECTS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playBlip(640);
                        setSelectedPose(p.id);
                      }}
                      className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold truncate ${
                        selectedPose === p.id
                          ? 'bg-[#3b2f2f] text-white border-[#3b2f2f]'
                          : 'bg-[#faf5ec] text-[#5c4d47] border-[#e2d4c0]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5c4d47] mb-1.5">
                  4. 폴라로이드 프레임
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {FRAME_STYLES.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playBlip(600);
                        setSelectedFrame(f.id);
                      }}
                      className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold truncate ${
                        selectedFrame === f.id
                          ? 'bg-[#c59b6d] text-white border-[#a87e51]'
                          : 'bg-[#faf5ec] text-[#5c4d47] border-[#e2d4c0]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Guest Name & Blessing Message Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-[#5c4d47] mb-1">
                  하객 닉네임
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="소중한 하객"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#faf5ec] border border-[#d4b48c] text-base sm:text-xs text-[#3b2f2f]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#5c4d47] mb-1">
                  폴라로이드 한 줄 축복 메시지
                </label>
                <input
                  type="text"
                  maxLength={36}
                  value={blessingText}
                  onChange={(e) => setBlessingText(e.target.value)}
                  placeholder="결혼을 진심으로 축하합니다 ♥"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#faf5ec] border border-[#d4b48c] text-base sm:text-xs text-[#3b2f2f]"
                />
              </div>
            </div>

            <div className="text-[11px] text-[#8c7a70] flex items-center gap-1 pt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-[#d97b84] shrink-0" />
              <span>
                촬영 시 <strong>‘📸 오늘의 베스트 포토그래퍼’</strong> 칭호가 해금되어 방명록에 기록됩니다!
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Long-Press Save Fallback Sheet for iOS / KakaoTalk In-App Browsers */}
      {savePreviewDataUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="폴라로이드 사진 길게 눌러 저장하기"
          onClick={(e) => {
            e.stopPropagation();
            setSavePreviewDataUrl(null);
          }}
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 font-sans animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[360px] bg-[#fffdf9] border-2 border-[#d4b48c] rounded-2xl p-4 space-y-3 text-center shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#3b2f2f]">
                📸 사진 길게 눌러 저장하기
              </span>
              <button
                type="button"
                onClick={() => setSavePreviewDataUrl(null)}
                aria-label="닫기"
                className="px-2.5 py-1 rounded-full bg-[#faf5ec] border border-[#d4b48c] text-[11px] font-bold text-[#5c4d47]"
              >
                닫기 ✕
              </button>
            </div>
            <p className="text-[11px] text-[#7d6e65] leading-relaxed break-keep">
              아래 완성된 폴라로이드 이미지를 <strong>길게 눌러 [사진 저장]</strong>을 선택하시면
              휴대폰 사진첩에 바로 보관됩니다.
            </p>
            <div className="rounded-xl overflow-hidden border border-[#e6d5b8] bg-[#faf5ec]">
              <img
                src={savePreviewDataUrl}
                alt="완성된 웨딩 폴라로이드 사진"
                className="w-full h-auto block"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
