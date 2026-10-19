import React, { useState } from 'react';
import { MapPin, Copy, Check, Train, Bus, Car, Navigation } from 'lucide-react';
import { WeddingConfig } from '../../data/weddingConfig';
import { soundEngine } from '../../utils/soundEngine';

interface LocationSectionProps {
  config: WeddingConfig;
}

export const LocationSection: React.FC<LocationSectionProps> = ({ config }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    soundEngine.playCoin();
    navigator.clipboard?.writeText(config.wedding.addressRoad).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const encodedVenue = encodeURIComponent(config.wedding.venueName);
  const encodedAddr = encodeURIComponent(config.wedding.addressRoad);

  const navLinks = [
    {
      name: '네이버 지도',
      bg: 'bg-[#03c75a] text-white',
      url: `https://map.naver.com/p/search/${encodedAddr}`,
    },
    {
      name: '카카오맵',
      bg: 'bg-[#fee500] text-[#191919]',
      url: `https://map.kakao.com/link/search/${encodedAddr}`,
    },
    {
      name: '티맵 (T-Map)',
      bg: 'bg-[#4dabf7] text-[#120d1e]',
      url: `https://apis.openapi.sk.com/tmap/app/routes?appKey=l7xx&name=${encodedVenue}&lon=${config.wedding.lng}&lat=${config.wedding.lat}`,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Venue Banner & Copy Address */}
      <div className="pixel-box p-4 bg-[#1f1833]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold px-2 py-0.5 bg-[#69db7c] text-[#120d1e]">
            MAIN QUEST 04 · 마법 정류장
          </span>
          <a
            href={`tel:${config.wedding.tel}`}
            className="text-xs text-[#ffd541] underline"
          >
            ☎️ 웨딩홀 {config.wedding.tel}
          </a>
        </div>

        <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-[#ff5277] shrink-0" />
          <span>
            {config.wedding.venueName} · {config.wedding.hallName}
          </span>
        </h3>

        <p className="text-xs text-[#e9ecef] mt-1">{config.wedding.addressRoad}</p>
        <p className="text-[11px] text-[#a599b8] mt-0.5">
          (지번 : {config.wedding.addressJibun})
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyAddress}
            className="pixel-btn bg-[#ffd541] text-[#120d1e] px-3 py-1.5 text-xs font-extrabold flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" /> 주소 복사 완료! (+100 EXP)
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> 도로명 주소 복사하기
              </>
            )}
          </button>
        </div>
      </div>

      {/* Illustrated 16-Bit Pixel World Map of Venue */}
      <div className="pixel-box-gold p-3 bg-[#151024]">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-[#ffd541] font-bold">🗺️ 월드맵 던전 약도 (PIXEL RADAR)</span>
          <span className="text-[10px] text-[#38d9a9]">GPS: {config.wedding.lat}, {config.wedding.lng}</span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-[#1e3a2f] border-2 border-[#ffd541] overflow-hidden">
          <svg
            viewBox="0 0 160 90"
            shapeRendering="crispEdges"
            className="w-full h-full pixelated"
          >
            {/* Grass & Blocks */}
            <rect x="0" y="0" width="160" height="90" fill="#234d3c" />
            <rect x="10" y="8" width="40" height="25" fill="#2b5d49" />
            <rect x="105" y="55" width="45" height="25" fill="#2b5d49" />

            {/* Teheran-ro Main Road (Horizontal) */}
            <rect x="0" y="52" width="160" height="14" fill="#495057" />
            <rect x="8" y="58" width="10" height="2" fill="#ffd541" />
            <rect x="30" y="58" width="10" height="2" fill="#ffd541" />
            <rect x="52" y="58" width="10" height="2" fill="#ffd541" />
            <rect x="74" y="58" width="10" height="2" fill="#ffd541" />
            <rect x="96" y="58" width="10" height="2" fill="#ffd541" />
            <rect x="118" y="58" width="10" height="2" fill="#ffd541" />
            <rect x="140" y="58" width="10" height="2" fill="#ffd541" />

            {/* Vertical Avenue to Wedding Hall */}
            <rect x="72" y="18" width="16" height="72" fill="#495057" />
            <rect x="79" y="28" width="2" height="8" fill="#ffffff" />
            <rect x="79" y="42" width="2" height="6" fill="#ffffff" />

            {/* Subway Line 2 (Green Line) at Bottom */}
            <rect x="0" y="76" width="160" height="6" fill="#2f9e44" />
            {/* Samsung Station Exit 4 */}
            <rect x="66" y="71" width="28" height="12" fill="#120d1e" />
            <rect x="68" y="73" width="24" height="8" fill="#38d9a9" />

            {/* Dotted Quest Path from Subway to Castle */}
            <rect x="86" y="44" width="2" height="3" fill="#ff5277" />
            <rect x="86" y="37" width="2" height="3" fill="#ff5277" />
            <rect x="86" y="30" width="2" height="3" fill="#ff5277" />

            {/* Wedding Castle Icon at Center-Top */}
            <rect x="62" y="10" width="36" height="18" fill="#f8f9fa" />
            <rect x="58" y="6" width="10" height="22" fill="#dee2e6" />
            <rect x="92" y="6" width="10" height="22" fill="#dee2e6" />
            <rect x="64" y="4" width="32" height="6" fill="#ff5277" />
            <rect x="76" y="18" width="8" height="10" fill="#ffd541" />
          </svg>

          {/* Overlay Labels */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#ff5277] text-white border border-white px-2.5 py-0.5 text-[11px] font-extrabold shadow animate-bounce">
            🏰 {config.wedding.venueName}
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#120d1e]/90 border border-[#38d9a9] text-[#38d9a9] px-2 py-0.5 text-[10px] font-bold">
            🚇 2호선 삼성역 4번 출구 (도보 4분 직진)
          </div>
        </div>

        {/* 1-Tap Navigation App Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {navLinks.map((nav) => (
            <a
              key={nav.name}
              href={nav.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => soundEngine.playSelect()}
              className={`pixel-btn py-2 px-2 text-xs font-extrabold flex items-center justify-center gap-1 ${nav.bg}`}
            >
              <Navigation className="w-3.5 h-3.5 shrink-0" />
              <span>{nav.name}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Transport Strategy Guide Cards */}
      <div className="grid grid-cols-1 gap-3">
        <div className="pixel-box p-3.5 bg-[#1f1833]">
          <div className="text-xs font-extrabold text-[#38d9a9] flex items-center gap-1.5 mb-2">
            <Train className="w-4 h-4" /> 지하철 & 셔틀 마차 공략
          </div>
          <ul className="space-y-1.5 text-xs text-[#e9ecef]">
            {config.wedding.subwayGuide.map((line, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-[#ffd541]">▶</span>
                <span>{line}</span>
              </li>
            ))}
            <li className="flex items-start gap-1.5 text-[#ffd541] font-bold pt-1">
              <span>🚐</span>
              <span>{config.wedding.shuttleGuide}</span>
            </li>
          </ul>
        </div>

        <div className="pixel-box p-3.5 bg-[#1f1833]">
          <div className="text-xs font-extrabold text-[#4dabf7] flex items-center gap-1.5 mb-2">
            <Bus className="w-4 h-4" /> 버스 정류장 공략
          </div>
          <ul className="space-y-1.5 text-xs text-[#e9ecef]">
            {config.wedding.busGuide.map((line, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-[#4dabf7]">▶</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pixel-box p-3.5 bg-[#1f1833]">
          <div className="text-xs font-extrabold text-[#ffa94d] flex items-center gap-1.5 mb-2">
            <Car className="w-4 h-4" /> 자가용 & 주차 던전 안내
          </div>
          <ul className="space-y-1.5 text-xs text-[#e9ecef]">
            {config.wedding.parkingGuide.map((line, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-[#ffa94d]">▶</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
