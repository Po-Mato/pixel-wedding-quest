import React, { useEffect, useRef, useState } from 'react';
import { Camera, Download, Sparkles, X, Check } from 'lucide-react';
import { fireCelebrationConfetti } from '../../utils/motion';
import {
  AVATAR_CLASSES,
  AvatarClassId,
  GARDEN_MAPS,
  GARDEN_MAP_ORDER,
  GardenMapId,
  WeddingConfig,
} from '../../data/weddingConfig';
import { PIXEL_ASSETS, GUEST_SPRITES } from '../PixelSprites';
import { soundEngine } from '../../utils/soundEngine';
import { incrementReactionCounter } from '../../utils/weddingCloudSync';

interface PhotoBoothModalProps {
  config: WeddingConfig;
  onClose: () => void;
  onUnlockTitle?: (title: string) => void;
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
  onClose,
  onUnlockTitle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [selectedMap, setSelectedMap] = useState<GardenMapId>('garden');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarClassId>('mage');
  const [selectedPose, setSelectedPose] = useState<PoseEffectId>('petal_shower');
  const [selectedFrame, setSelectedFrame] = useState<FrameStyleId>('ivory');
  const [guestName, setGuestName] = useState<string>('소중한 하객');
  const [blessingText, setBlessingText] = useState<string>(
    `${config.groom.name} ♥ ${config.bride.name} 두 사람의 찬란한 봄날을 축복합니다!`
  );
  const [flashActive, setFlashActive] = useState<boolean>(false);
  const [snappedCount, setSnappedCount] = useState<number>(0);
  const [downloadedToast, setDownloadedToast] = useState<boolean>(false);

  const loadedImagesRef = useRef<{
    maps: Partial<Record<GardenMapId, HTMLImageElement>>;
    groom: HTMLImageElement | null;
    bride: HTMLImageElement | null;
    dogCream: HTMLImageElement | null;
    dogKkomi: HTMLImageElement | null;
    cat: HTMLImageElement | null;
    guests: Partial<Record<AvatarClassId, HTMLImageElement>>;
  }>({
    maps: {},
    groom: null,
    bride: null,
    dogCream: null,
    dogKkomi: null,
    cat: null,
    guests: {},
  });

  const [assetsReadyTick, setAssetsReadyTick] = useState(0);

  useEffect(() => {
    const load = (src: string, cb: (img: HTMLImageElement) => void) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      img.onload = () => {
        cb(img);
        setAssetsReadyTick((t) => t + 1);
      };
    };

    load(PIXEL_ASSETS.weddingGardenMap, (i) => (loadedImagesRef.current.maps.garden = i));
    load(PIXEL_ASSETS.weddingChapelMap, (i) => (loadedImagesRef.current.maps.chapel = i));
    load(PIXEL_ASSETS.weddingMemoryMap, (i) => (loadedImagesRef.current.maps.memory = i));
    load(
      PIXEL_ASSETS.weddingReceptionMap,
      (i) => (loadedImagesRef.current.maps.reception = i)
    );
    load(PIXEL_ASSETS.groomSprite, (i) => (loadedImagesRef.current.groom = i));
    load(PIXEL_ASSETS.brideSprite, (i) => (loadedImagesRef.current.bride = i));
    load(PIXEL_ASSETS.dogCreamSprite, (i) => (loadedImagesRef.current.dogCream = i));
    load(PIXEL_ASSETS.dogKkomiSprite, (i) => (loadedImagesRef.current.dogKkomi = i));
    load(PIXEL_ASSETS.catSprite, (i) => (loadedImagesRef.current.cat = i));
    (Object.keys(GUEST_SPRITES) as AvatarClassId[]).forEach((id) =>
      load(GUEST_SPRITES[id].sprite, (i) => (loadedImagesRef.current.guests[id] = i))
    );
  }, []);

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
    ctx.imageSmoothingEnabled = false;

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

    const bgImg =
      loadedImagesRef.current.maps[selectedMap] || loadedImagesRef.current.maps.garden;
    if (bgImg) {
      // Draw a scenic zoomed crop of the map so landmarks/archways frame the characters
      const cropYRatio =
        selectedMap === 'chapel'
          ? 0.06
          : selectedMap === 'reception'
          ? 0.08
          : 0.14;
      const sx = bgImg.naturalWidth * 0.12;
      const sy = bgImg.naturalHeight * cropYRatio;
      const sw = bgImg.naturalWidth * 0.76;
      const sh = bgImg.naturalHeight * 0.66;
      ctx.drawImage(bgImg, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
    } else {
      ctx.fillStyle = '#dce8d6';
      ctx.fillRect(photoX, photoY, photoW, photoH);
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

    // Top-left Location Stamp Pill inside Photo
    ctx.fillStyle = 'rgba(255, 253, 249, 0.9)';
    ctx.fillRect(photoX + 16, photoY + 16, 210, 30);
    ctx.strokeStyle = frame.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(photoX + 16, photoY + 16, 210, 30);
    ctx.fillStyle = '#3b2f2f';
    ctx.font = 'bold 14px "Pretendard", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${mapMeta.icon} ${mapMeta.tabLabel} 스냅`, photoX + 28, photoY + 36);

    // Top-right Pose Tag Pill
    ctx.fillStyle = 'rgba(217, 123, 132, 0.92)';
    ctx.fillRect(photoX + photoW - 166, photoY + 16, 150, 30);
    ctx.fillStyle = '#fffdf9';
    ctx.font = 'bold 12px "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pose.tag, photoX + photoW - 91, photoY + 36);

    // 3. Draw Characters (Pet Dogs '크림' & '꼬미', Groom, Bride, and Guest Chibi Avatar!)
    const floorY = photoY + photoH - 64;
    const centerX = photoX + photoW / 2;

    const creamX = centerX - 196;
    const kkomiX = centerX - 134;
    const groomX = centerX - 52;
    const brideX = centerX + 42;
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
    // Draw Groom & Bride (3-head-tall chibi)
    drawSprite(loadedImagesRef.current.groom, groomX, floorY, 210);
    drawSprite(loadedImagesRef.current.bride, brideX, floorY + 2, 206);
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

    ctx.fillStyle = frame.accent;
    ctx.font = 'bold 14px "Cinzel", serif';
    ctx.textAlign = 'center';
    const dateFormatted = `${config.wedding.year}. ${String(config.wedding.month).padStart(2, '0')}. ${String(config.wedding.day).padStart(2, '0')}`;
    ctx.fillText(`OUR SPRING WEDDING MEMORIES · ${dateFormatted}`, W / 2, capCenterY);

    ctx.fillStyle = frame.textPrimary;
    ctx.font = 'bold 28px "Gowun Batang", serif';
    ctx.fillText(
      `${config.groom.fullName}  ♥  ${config.bride.fullName}`,
      W / 2,
      capCenterY + 42
    );

    // Guest Blessing Quote Box
    const msg = (blessingText || '결혼을 진심으로 축하합니다 ♥').trim().slice(0, 38);
    ctx.fillStyle = frame.textSecondary;
    ctx.font = 'italic 18px "Gowun Batang", serif';
    ctx.fillText(`“${msg}”`, W / 2, capCenterY + 86);

    // Bottom Signature & Venue Line
    ctx.fillStyle = frame.textSecondary;
    ctx.font = 'bold 14px "Pretendard", sans-serif';
    ctx.fillText(
      `With ${cleanGuestName} · ${config.wedding.venueName} ${config.wedding.hallName}`,
      W / 2,
      capCenterY + 132
    );
  }, [
    selectedMap,
    selectedAvatar,
    selectedPose,
    selectedFrame,
    guestName,
    blessingText,
    config,
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

  const handleDownloadPolaroid = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    handleTakeSnap();

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `pixel-wedding-polaroid-${config.groom.name}-${config.bride.name}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadedToast(true);
      window.setTimeout(() => setDownloadedToast(false), 3000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
      <div className="pixel-card w-full max-w-[520px] max-h-[92vh] bg-[#f7f2e9] flex flex-col overflow-hidden animate-fadeIn">
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
              className="py-2.5 px-3 rounded-xl bg-[#faf5ec] hover:bg-[#f3e9d8] border border-[#c59b6d] text-[#3b2f2f] text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-98"
            >
              <Camera className="w-4 h-4 text-[#d97b84]" />
              <span>📸 찰칵! 기념 촬영 {snappedCount > 0 ? `(${snappedCount})` : ''}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPolaroid}
              className="py-2.5 px-3 rounded-xl bg-[#d97b84] hover:bg-[#c56871] border border-[#b85d67] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-98"
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
            {/* 1. Background Map */}
            <div>
              <label className="block text-[11px] font-bold text-[#5c4d47] mb-1.5">
                1. 촬영 배경 맵 선택 (4개 웨딩 월드)
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {GARDEN_MAP_ORDER.map((mId) => {
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
                          ? 'bg-[#d97b84] text-white border-[#b85d67]'
                          : 'bg-[#faf5ec] text-[#5c4d47] border-[#e2d4c0]'
                      }`}
                    >
                      <span>{m.icon}</span>
                      <span className="truncate w-full text-center">{m.tabLabel}</span>
                    </button>
                  );
                })}
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
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#faf5ec] border border-[#d4b48c] text-xs text-[#3b2f2f]"
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
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#faf5ec] border border-[#d4b48c] text-xs text-[#3b2f2f]"
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
    </div>
  );
};
