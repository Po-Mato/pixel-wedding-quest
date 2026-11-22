import React, { useState } from 'react';
import {
  MapPin,
  Copy,
  Check,
  Train,
  Bus,
  Car,
  Navigation,
  Phone,
  Lock,
  Hand,
} from 'lucide-react';
import { WeddingConfig } from '../../data/weddingConfig';
import { soundEngine } from '../../utils/soundEngine';
import { copyTextToClipboard } from '../../utils/clipboard';
import { cleanPhoneForHref } from '../../utils/phone';
import { showToast } from '../../utils/toast';
import {
  hasValidWeddingCoords,
  getOsmEmbedUrl,
  getKakaoMapUrl,
  getNaverMapWebUrl,
  getTmapDeepLink,
  openNaverMap,
  openTmap,
} from '../../utils/navigation';

interface LocationSectionProps {
  config: WeddingConfig;
}

function buildVenueSummaryBadges(wedding: WeddingConfig['wedding']) {
  const rawSubway = (wedding.subwayGuide[0] || '').split('(')[0].trim();
  const subwayParts = rawSubway.split('에서');
  const subwaySummary = subwayParts[0]?.trim() || '하단 상세 참고';

  const rawShuttle = (wedding.shuttleGuide || '').trim();
  const hasShuttle = /셔틀/.test(rawShuttle);
  let secondTitle = '도보 이용';
  let secondSummary = '역세권 도보 거리';

  if (hasShuttle) {
    secondTitle = '셔틀버스';
    const intervalMatch = rawShuttle.match(/(\d+분\s*간격[^,.]*)/);
    secondSummary = intervalMatch
      ? intervalMatch[1].trim()
      : rawShuttle.slice(0, 20).trim();
  } else {
    const walkMatch = (rawShuttle || rawSubway).match(
      /(직진\s*도보\s*(?:약\s*)?\d+분|도보\s*(?:약\s*)?\d+분)/
    );
    if (walkMatch) {
      secondSummary = walkMatch[1].trim();
    } else if (rawShuttle) {
      secondSummary = rawShuttle.split(/[.!]/)[0].slice(0, 22).trim();
    } else if (wedding.busGuide[0]) {
      secondTitle = '버스 이용';
      const stopMatch = wedding.busGuide[0].match(/\(([^)]+)\)/);
      secondSummary = stopMatch ? stopMatch[1].trim() : '인근 버스 정류장';
    }
  }

  const rawParking = (wedding.parkingGuide[0] || '').trim();
  const freeMatch = rawParking.match(/(\d+시간\s*무료|무료\s*주차)/);
  const capMatch = rawParking.match(/(\d{2,4}대)/);
  let parkingSummary = '주차 안내 참고';
  if (freeMatch && capMatch) {
    parkingSummary = `${freeMatch[1]} · ${capMatch[1]}`;
  } else if (freeMatch) {
    parkingSummary = freeMatch[1];
  } else if (rawParking) {
    parkingSummary = rawParking.split('·')[0].trim();
  }

  return {
    subwaySummary,
    hasShuttle,
    secondTitle,
    secondSummary,
    parkingSummary,
  };
}

export const LocationSection: React.FC<LocationSectionProps> = ({ config }) => {
  const [copied, setCopied] = useState(false);
  const [mapMode, setMapMode] = useState<'real' | 'pixel'>('real');
  const [mapInteractive, setMapInteractive] = useState(false);
  const venueSummary = buildVenueSummaryBadges(config.wedding);

  const handleCopyAddress = async () => {
    soundEngine.playCoin();
    await copyTextToClipboard(config.wedding.addressRoad);
    setCopied(true);
    showToast('예식장 도로명 주소가 복사되었습니다');
    setTimeout(() => setCopied(false), 2500);
  };

  const hasValidCoords = hasValidWeddingCoords(config.wedding);
  const tmapDeepLink = getTmapDeepLink(config.wedding);

  const handleOpenNaver = (e: React.MouseEvent<HTMLAnchorElement>) => {
    soundEngine.playSelect();
    openNaverMap(config.wedding, e);
  };

  const handleOpenTmap = (e: React.MouseEvent<HTMLAnchorElement>) => {
    soundEngine.playSelect();
    openTmap(config.wedding, e);
  };

  const navLinks = [
    {
      name: '네이버 지도',
      bg: 'bg-[#03c75a] text-white border-[#02b350]',
      url: getNaverMapWebUrl(config.wedding),
      external: true,
      onClick: handleOpenNaver,
    },
    {
      name: '카카오맵',
      bg: 'bg-[#fee500] text-[#191919] border-[#e6cf00]',
      url: getKakaoMapUrl(config.wedding),
      external: true,
    },
    {
      name: '티맵 (T-Map)',
      bg: 'bg-[#3b2f2f] text-white border-[#2a2121]',
      url: tmapDeepLink,
      external: false,
      onClick: handleOpenTmap,
    },
  ];

  return (
    <div className="pixel-card p-5 sm:p-6 bg-[#fffdf9] space-y-5">
      {/* Header & Address */}
      <div className="text-center border-b border-[#efe6d8] pb-5">
        <div className="text-[11px] tracking-[0.25em] text-[#c59b6d] font-engSerif uppercase">
          LOCATION
        </div>
        <h3 className="text-base sm:text-lg font-bold text-[#3b2f2f] mt-1 flex items-center justify-center gap-1.5">
          <MapPin className="w-4 h-4 text-[#d97b84]" />
          <span>{config.wedding.venueName}</span>
        </h3>
        <p className="text-sm text-[#5c4d47] font-semibold mt-0.5">
          {config.wedding.hallName}
        </p>

        <p className="text-xs text-[#7d6e65] mt-2 font-sans">
          {config.wedding.addressRoad}
        </p>
        <p className="text-[11px] text-[#9c897e] mt-0.5 font-sans">
          (지번 : {config.wedding.addressJibun} · Tel. {config.wedding.tel})
        </p>

        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleCopyAddress}
            className="px-4 py-1.5 rounded-full bg-[#faf5ec] hover:bg-[#f3e9d8] border border-[#d4b48c] text-xs font-sans font-medium text-[#5c4d47] flex items-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#6b9071]" />
                <span className="text-[#4d6b53] font-bold">주소가 복사되었습니다</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#c59b6d]" />
                <span>주소 복사하기</span>
              </>
            )}
          </button>

          {config.wedding.tel && (
            <a
              href={`tel:${cleanPhoneForHref(config.wedding.tel)}`}
              onClick={() => soundEngine.playBlip()}
              className="px-3.5 py-1.5 rounded-full bg-[#fffdf9] hover:bg-[#faf5ec] border border-[#d4b48c] text-xs font-sans font-medium text-[#5c4d47] flex items-center gap-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#d97b84]" />
              <span>웨딩홀 전화 ({config.wedding.tel})</span>
            </a>
          )}
        </div>

        {/* 3-Column Quick Venue Checkpoint Badges */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-left font-sans">
          <div className="bg-[#faf5ec] border border-[#e6d5b8] rounded-xl p-2.5">
            <div className="text-[10px] font-bold text-[#4d6b53] flex items-center gap-1">
              <Train className="w-3 h-3 shrink-0" />
              <span>지하철 안내</span>
            </div>
            <div className="text-[11px] font-bold text-[#3b2f2f] mt-1 leading-snug break-keep">
              {venueSummary.subwaySummary}
            </div>
          </div>

          <div className="bg-[#faf5ec] border border-[#e6d5b8] rounded-xl p-2.5">
            <div className="text-[10px] font-bold text-[#b85d67] flex items-center gap-1">
              <Bus className="w-3 h-3 shrink-0" />
              <span>{venueSummary.secondTitle}</span>
            </div>
            <div className="text-[11px] font-bold text-[#3b2f2f] mt-1 leading-snug break-keep">
              {venueSummary.secondSummary}
            </div>
          </div>

          <div className="bg-[#faf5ec] border border-[#e6d5b8] rounded-xl p-2.5">
            <div className="text-[10px] font-bold text-[#8a6220] flex items-center gap-1">
              <Car className="w-3 h-3 shrink-0" />
              <span>주차 안내</span>
            </div>
            <div className="text-[11px] font-bold text-[#3b2f2f] mt-1 leading-snug break-keep">
              {venueSummary.parkingSummary}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Real Map & Illustrated Pixel Map */}
      <div className="bg-[#faf5ec] p-3.5 rounded-xl border border-[#e6d5b8] space-y-2.5">
        <div className="flex items-center justify-between gap-2 font-sans">
          <span className="text-xs font-bold text-[#3b2f2f] flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#d97b84]" />
            <span>웨딩홀 위치 약도</span>
          </span>
          {hasValidCoords && (
            <div className="inline-flex rounded-full bg-[#fffdf9] p-0.5 border border-[#e2d4c0]">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playBlip();
                  setMapMode('real');
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                  mapMode === 'real'
                    ? 'bg-[#3b2f2f] text-white'
                    : 'text-[#7d6e65] hover:text-[#3b2f2f]'
                }`}
              >
                🗺️ 실제 지도
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playBlip();
                  setMapMode('pixel');
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                  mapMode === 'pixel'
                    ? 'bg-[#d97b84] text-white'
                    : 'text-[#7d6e65] hover:text-[#3b2f2f]'
                }`}
              >
                🎨 픽셀 약도
              </button>
            </div>
          )}
        </div>

        <div
          className={`relative w-full aspect-[16/10] bg-[#e9f0e8] rounded-lg border-2 overflow-hidden transition-colors ${
            mapMode === 'real' && mapInteractive
              ? 'border-[#d97b84]'
              : 'border-[#d4b48c]'
          }`}
        >
          {mapMode === 'real' && hasValidCoords ? (
            <>
              <iframe
                title={`${config.wedding.venueName} 지도 미리보기`}
                src={getOsmEmbedUrl(config.wedding)}
                loading="lazy"
                className={`w-full h-full border-0 ${
                  mapInteractive ? 'pointer-events-auto' : 'pointer-events-none'
                }`}
              />
              {!mapInteractive && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playBlip(640);
                    setMapInteractive(true);
                  }}
                  aria-label="지도 확대 및 이동 활성화"
                  className="absolute inset-0 bg-transparent cursor-pointer"
                />
              )}
              <div className="pointer-events-none absolute top-2.5 left-1/2 -translate-x-1/2 bg-[#fffdf9]/95 text-[#3b2f2f] border border-[#d97b84] px-3 py-0.5 rounded-full text-[11px] font-bold shadow-sm whitespace-nowrap">
                📍 {config.wedding.venueName} ({config.wedding.hallName})
              </div>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playBlip(mapInteractive ? 520 : 680);
                  setMapInteractive((prev) => !prev);
                }}
                className={`absolute bottom-2.5 right-2.5 z-10 px-2.5 py-1.5 rounded-full text-[11px] font-sans font-bold shadow-md border flex items-center gap-1 backdrop-blur-sm transition-colors ${
                  mapInteractive
                    ? 'bg-[#3b2f2f]/90 text-[#fffdf9] border-[#d4b48c]'
                    : 'bg-[#fffdf9]/95 text-[#3b2f2f] border-[#d4b48c] hover:bg-[#faf5ec]'
                }`}
              >
                {mapInteractive ? (
                  <>
                    <Lock className="w-3 h-3 text-[#f0d29c]" />
                    <span>스크롤 고정</span>
                  </>
                ) : (
                  <>
                    <Hand className="w-3 h-3 text-[#d97b84]" />
                    <span>지도 움직이기</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Authentic Sosa Station (Line 1 + Seohae Line) -> Gyeongin-ro -> MJ Convention Pixel Map */}
              <svg
                viewBox="0 0 180 112"
                shapeRendering="crispEdges"
                className="w-full h-full pixelated"
              >
                {/* Warm Pastel Neighborhood Base */}
                <rect x="0" y="0" width="180" height="112" fill="#edf2e9" />
                <rect x="6" y="76" width="44" height="28" fill="#dfead8" />
                <rect x="136" y="10" width="38" height="22" fill="#dfead8" />

                {/* Seohae Line (Soft Green #72b844) Vertical Rail at Sosa Station */}
                <rect x="34" y="0" width="4" height="112" fill="#72b844" />
                <rect x="35" y="0" width="2" height="112" fill="#9cd474" />

                {/* Line 1 Gyeongin Rail (Navy #263c96) Horizontal Track */}
                <rect x="0" y="28" width="180" height="6" fill="#263c96" />
                <rect x="0" y="30" width="180" height="2" fill="#4f67c2" />

                {/* Sosa Station Building (Line 1 & Seohae Transfer) */}
                <rect x="20" y="21" width="32" height="18" fill="#fffdf9" />
                <rect x="21" y="22" width="30" height="16" fill="#eef2ff" />
                <rect x="20" y="21" width="32" height="3" fill="#263c96" />
                <rect x="20" y="36" width="32" height="3" fill="#72b844" />

                {/* Exit 1 Marker */}
                <rect x="48" y="40" width="8" height="8" fill="#d97b84" />
                <rect x="50" y="42" width="4" height="4" fill="#fffdf9" />

                {/* Sosa-ro Vertical Road & Gyeongin-ro Main Boulevard */}
                <rect x="30" y="44" width="12" height="68" fill="#e6dfd5" />
                <rect x="0" y="46" width="180" height="16" fill="#e6dfd5" />
                <rect x="0" y="53" width="180" height="2" fill="#fffdf9" />

                {/* Sosa Eoulmadang 3-Way Junction South Branch */}
                <rect x="132" y="62" width="10" height="50" fill="#e6dfd5" />

                {/* Crosswalk Stripes near Sosa Station */}
                <rect x="46" y="48" width="2" height="12" fill="#ffffff" />
                <rect x="50" y="48" width="2" height="12" fill="#ffffff" />

                {/* 3-Min Straight Walking Path Dots (Exit 1 -> East along Gyeongin-ro -> MJ Convention) */}
                <rect x="60" y="64" width="4" height="2" fill="#d97b84" />
                <rect x="68" y="64" width="4" height="2" fill="#d97b84" />
                <rect x="76" y="64" width="4" height="2" fill="#d97b84" />
                <rect x="84" y="64" width="4" height="2" fill="#d97b84" />
                <rect x="92" y="64" width="4" height="2" fill="#d97b84" />
                <rect x="100" y="64" width="4" height="2" fill="#d97b84" />
                <rect x="108" y="64" width="4" height="2" fill="#d97b84" />

                {/* MJ Convention Wedding Hall Building (South side of Gyeongin-ro, West of Junction) */}
                <rect x="102" y="67" width="28" height="26" fill="#d4b48c" />
                <rect x="104" y="69" width="24" height="22" fill="#fffdf9" />
                <rect x="104" y="67" width="24" height="5" fill="#d97b84" />
                {/* Windows & Entrance */}
                <rect x="107" y="75" width="4" height="4" fill="#d7e8f5" />
                <rect x="114" y="75" width="4" height="4" fill="#d7e8f5" />
                <rect x="121" y="75" width="4" height="4" fill="#d7e8f5" />
                <rect x="112" y="83" width="8" height="8" fill="#e6d5b8" />
                {/* Heart Pin above MJ Convention */}
                <rect x="114" y="58" width="4" height="4" fill="#d97b84" />
                <rect x="115" y="62" width="2" height="2" fill="#d97b84" />
              </svg>

              {/* Crisp HTML Map Labels Overlay */}
              <div className="pointer-events-none absolute top-[18%] left-[11%] bg-[#fffdf9]/95 border border-[#263c96] text-[#263c96] px-2 py-0.5 rounded-full text-[9px] font-sans font-extrabold shadow-sm">
                1·서해 소사역
              </div>
              <div className="pointer-events-none absolute top-[41%] left-[25%] bg-[#d97b84] text-white px-1.5 py-0.5 rounded text-[8px] font-sans font-bold shadow-sm">
                1번출구
              </div>
              <div className="pointer-events-none absolute top-[55%] left-[44%] -translate-x-1/2 bg-[#fffdf9]/95 border border-[#e2a3a9] text-[#b85d67] px-2 py-0.5 rounded-full text-[9px] font-sans font-bold shadow-sm">
                경인로 직진 도보 3분 →
              </div>
              <div className="pointer-events-none absolute top-[35%] right-[12%] bg-[#fffdf9]/95 border-2 border-[#d97b84] text-[#3b2f2f] px-2.5 py-0.5 rounded-full text-[10px] font-sans font-extrabold shadow-sm">
                💐 {config.wedding.venueName}
              </div>
              <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#fffdf9]/95 border border-[#6b9071] text-[#4d6b53] px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold max-w-[92%] truncate">
                🚇 {config.wedding.subwayGuide[0] || config.wedding.addressRoad}
              </div>
            </>
          )}
        </div>

        {/* 1-Tap Navigation App Buttons */}
        <div className="grid grid-cols-3 gap-2 font-sans">
          {navLinks.map((nav) => (
            <a
              key={nav.name}
              href={nav.url}
              target={nav.external ? '_blank' : undefined}
              rel={nav.external ? 'noopener noreferrer' : undefined}
              onClick={(e) => {
                if (nav.onClick) {
                  nav.onClick(e);
                } else {
                  soundEngine.playSelect();
                }
              }}
              className={`py-2.5 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition-transform active:scale-95 ${nav.bg}`}
            >
              <Navigation className="w-3.5 h-3.5 shrink-0" />
              <span>{nav.name}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Transport Details */}
      <div className="space-y-3 text-xs font-sans">
        <div className="bg-[#faf5ec] border border-[#e6d5b8] rounded-lg p-4">
          <div className="font-bold text-[#4d6b53] flex items-center gap-1.5 mb-2">
            <Train className="w-4 h-4" />{' '}
            {venueSummary.hasShuttle ? '지하철 및 셔틀버스 안내' : '지하철 및 도보 안내'}
          </div>
          <ul className="space-y-1.5 text-[#5c4d47]">
            {config.wedding.subwayGuide.map((line, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-[#c59b6d]">•</span>
                <span>{line}</span>
              </li>
            ))}
            <li className="flex items-start gap-1.5 text-[#b85d67] font-medium pt-1">
              <span>•</span>
              <span>{config.wedding.shuttleGuide}</span>
            </li>
          </ul>
        </div>

        <div className="bg-[#faf5ec] border border-[#e6d5b8] rounded-lg p-4">
          <div className="font-bold text-[#5c4d47] flex items-center gap-1.5 mb-2">
            <Bus className="w-4 h-4 text-[#c59b6d]" /> 버스 이용 안내
          </div>
          <ul className="space-y-1.5 text-[#5c4d47]">
            {config.wedding.busGuide.map((line, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-[#c59b6d]">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#faf5ec] border border-[#e6d5b8] rounded-lg p-4">
          <div className="font-bold text-[#5c4d47] flex items-center gap-1.5 mb-2">
            <Car className="w-4 h-4 text-[#c59b6d]" /> 자가용 및 주차 안내
          </div>
          <ul className="space-y-1.5 text-[#5c4d47]">
            {config.wedding.parkingGuide.map((line, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-[#c59b6d]">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
