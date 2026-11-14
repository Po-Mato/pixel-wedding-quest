import React, { useState } from 'react';
import { MapPin, Copy, Check, Train, Bus, Car, Navigation } from 'lucide-react';
import { WeddingConfig } from '../../data/weddingConfig';
import { soundEngine } from '../../utils/soundEngine';
import { copyTextToClipboard } from '../../utils/clipboard';

interface LocationSectionProps {
  config: WeddingConfig;
}

export const LocationSection: React.FC<LocationSectionProps> = ({ config }) => {
  const [copied, setCopied] = useState(false);
  const [mapMode, setMapMode] = useState<'real' | 'pixel'>('real');

  const handleCopyAddress = async () => {
    soundEngine.playCoin();
    await copyTextToClipboard(config.wedding.addressRoad);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const encodedVenue = encodeURIComponent(config.wedding.venueName);
  const encodedAddr = encodeURIComponent(config.wedding.addressRoad);
  const hasValidCoords =
    Number.isFinite(config.wedding.lat) &&
    Number.isFinite(config.wedding.lng) &&
    config.wedding.lat !== 0 &&
    config.wedding.lng !== 0;

  const tmapDeepLink = hasValidCoords
    ? `tmap://route?goalname=${encodedVenue}&goalx=${config.wedding.lng}&goaly=${config.wedding.lat}`
    : `tmap://search?name=${encodedVenue}`;

  const handleOpenTmap = (e: React.MouseEvent<HTMLAnchorElement>) => {
    soundEngine.playSelect();
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) {
      e.preventDefault();
      window.open(
        `https://map.naver.com/p/search/${encodedAddr}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  const navLinks = [
    {
      name: '네이버 지도',
      bg: 'bg-[#03c75a] text-white border-[#02b350]',
      url: `https://map.naver.com/p/search/${encodedAddr}`,
      external: true,
    },
    {
      name: '카카오맵',
      bg: 'bg-[#fee500] text-[#191919] border-[#e6cf00]',
      url: hasValidCoords
        ? `https://map.kakao.com/link/to/${encodedVenue},${config.wedding.lat},${config.wedding.lng}`
        : `https://map.kakao.com/link/search/${encodedAddr}`,
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

        <div className="mt-3.5 flex justify-center">
          <button
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

        <div className="relative w-full aspect-[16/10] bg-[#e9f0e8] rounded-lg border border-[#d4b48c] overflow-hidden">
          {mapMode === 'real' && hasValidCoords ? (
            <>
              <iframe
                title={`${config.wedding.venueName} 지도 미리보기`}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                  config.wedding.lng - 0.0045
                }%2C${config.wedding.lat - 0.0028}%2C${
                  config.wedding.lng + 0.0045
                }%2C${config.wedding.lat + 0.0028}&layer=mapnik&marker=${
                  config.wedding.lat
                }%2C${config.wedding.lng}`}
                loading="lazy"
                className="w-full h-full border-0"
              />
              <div className="pointer-events-none absolute top-2.5 left-1/2 -translate-x-1/2 bg-[#fffdf9]/95 text-[#3b2f2f] border border-[#d97b84] px-3 py-0.5 rounded-full text-[11px] font-bold shadow-sm whitespace-nowrap">
                📍 {config.wedding.venueName} ({config.wedding.hallName})
              </div>
            </>
          ) : (
            <>
              <svg
                viewBox="0 0 160 90"
                shapeRendering="crispEdges"
                className="w-full h-full pixelated"
              >
                {/* Soft Sage Park Background */}
                <rect x="0" y="0" width="160" height="90" fill="#dce7dc" />
                <rect x="12" y="10" width="42" height="28" fill="#cde0cd" />
                <rect x="104" y="54" width="44" height="24" fill="#cde0cd" />

                {/* Warm Stone Roads */}
                <rect x="0" y="50" width="160" height="14" fill="#e6dfd5" />
                <rect x="72" y="18" width="16" height="72" fill="#e6dfd5" />

                {/* White Crosswalk Lines */}
                <rect x="75" y="45" width="10" height="2" fill="#ffffff" />
                <rect x="75" y="48" width="10" height="2" fill="#ffffff" />

                {/* Subway Line 2 (Soft Sage Green) */}
                <rect x="0" y="76" width="160" height="5" fill="#6b9071" />
                <rect x="64" y="71" width="32" height="12" fill="#fffdf9" />
                <rect x="66" y="73" width="28" height="8" fill="#6b9071" />

                {/* Walking Path Dots */}
                <rect x="84" y="42" width="2" height="2" fill="#d97b84" />
                <rect x="84" y="36" width="2" height="2" fill="#d97b84" />
                <rect x="84" y="30" width="2" height="2" fill="#d97b84" />

                {/* Glasshouse Chapel Building */}
                <rect x="62" y="10" width="36" height="18" fill="#fffdf9" />
                <rect x="64" y="5" width="32" height="5" fill="#d97b84" />
                <rect x="76" y="17" width="8" height="11" fill="#e6d5b8" />
              </svg>

              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 bg-[#fffdf9]/95 text-[#3b2f2f] border border-[#d97b84] px-3 py-0.5 rounded-full text-[11px] font-bold shadow-sm">
                🕊️ {config.wedding.venueName}
              </div>

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#fffdf9]/95 border border-[#6b9071] text-[#4d6b53] px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold max-w-[92%] truncate">
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
            <Train className="w-4 h-4" /> 지하철 및 셔틀버스 안내
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
