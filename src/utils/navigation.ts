import { BankAccount, WeddingConfig } from '../data/weddingConfig';
import { copyTextToClipboard } from './clipboard';
import { showToast } from './toast';

export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

const LEGACY_SOSA_STATION_LAT = 37.4828;
const LEGACY_SOSA_STATION_LNG = 126.7956;
const MJ_CONVENTION_LAT = 37.481793;
const MJ_CONVENTION_LNG = 126.798484;

export function resolveWeddingCoords(wedding: WeddingConfig['wedding']): {
  lat: number;
  lng: number;
} {
  const lat = Number(wedding.lat);
  const lng = Number(wedding.lng);
  const isMjVenue =
    /MJ\s*컨벤션/i.test(wedding.venueName || '') ||
    /경인로\s*386/.test(wedding.addressRoad || '');
  const isLegacySosaPin =
    Math.abs(lat - LEGACY_SOSA_STATION_LAT) < 0.0002 &&
    Math.abs(lng - LEGACY_SOSA_STATION_LNG) < 0.0002;

  if (isMjVenue && isLegacySosaPin) {
    return { lat: MJ_CONVENTION_LAT, lng: MJ_CONVENTION_LNG };
  }
  return { lat, lng };
}

export function hasValidWeddingCoords(wedding: WeddingConfig['wedding']): boolean {
  const { lat, lng } = resolveWeddingCoords(wedding);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;
}

export function getOsmEmbedUrl(wedding: WeddingConfig['wedding']): string {
  const { lat, lng } = resolveWeddingCoords(wedding);
  const deltaLng = 0.0028;
  const deltaLat = 0.0018;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${
    lng - deltaLng
  }%2C${lat - deltaLat}%2C${lng + deltaLng}%2C${
    lat + deltaLat
  }&layer=mapnik&marker=${lat}%2C${lng}`;
}

export function getNaverMapWebUrl(wedding: WeddingConfig['wedding']): string {
  const encodedAddr = encodeURIComponent(wedding.addressRoad || wedding.venueName);
  return `https://map.naver.com/p/search/${encodedAddr}`;
}

export function getKakaoMapUrl(wedding: WeddingConfig['wedding']): string {
  const encodedVenue = encodeURIComponent(wedding.venueName);
  const encodedAddr = encodeURIComponent(wedding.addressRoad || wedding.venueName);
  if (hasValidWeddingCoords(wedding)) {
    const { lat, lng } = resolveWeddingCoords(wedding);
    return `https://map.kakao.com/link/to/${encodedVenue},${lat},${lng}`;
  }
  return `https://map.kakao.com/link/search/${encodedAddr}`;
}

export function getTmapDeepLink(wedding: WeddingConfig['wedding']): string {
  const encodedVenue = encodeURIComponent(wedding.venueName);
  if (hasValidWeddingCoords(wedding)) {
    const { lat, lng } = resolveWeddingCoords(wedding);
    return `tmap://route?goalname=${encodedVenue}&goalx=${lng}&goaly=${lat}`;
  }
  return `tmap://search?name=${encodedVenue}`;
}

export function openNaverMap(
  wedding: WeddingConfig['wedding'],
  e?: React.MouseEvent<HTMLAnchorElement>
): void {
  const webUrl = getNaverMapWebUrl(wedding);
  if (!isMobileDevice()) {
    return;
  }

  e?.preventDefault();
  const encodedVenue = encodeURIComponent(wedding.venueName);
  const appName = encodeURIComponent(window.location.origin);
  const { lat, lng } = resolveWeddingCoords(wedding);
  const appUrl = hasValidWeddingCoords(wedding)
    ? `nmap://place?lat=${lat}&lng=${lng}&name=${encodedVenue}&appname=${appName}`
    : `nmap://search?query=${encodeURIComponent(wedding.addressRoad || wedding.venueName)}&appname=${appName}`;

  const startedAt = Date.now();
  let didHide = false;
  const onVisibility = () => {
    if (document.hidden) didHide = true;
  };
  document.addEventListener('visibilitychange', onVisibility);

  window.location.href = appUrl;

  window.setTimeout(() => {
    document.removeEventListener('visibilitychange', onVisibility);
    if (!didHide && !document.hidden && Date.now() - startedAt < 2200) {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }
  }, 900);
}

export function openTmap(
  wedding: WeddingConfig['wedding'],
  e?: React.MouseEvent<HTMLAnchorElement>
): void {
  if (!isMobileDevice()) {
    e?.preventDefault();
    window.open(getNaverMapWebUrl(wedding), '_blank', 'noopener,noreferrer');
  }
}

export async function openTossTransfer(acc: BankAccount): Promise<{
  cleanAccountNumber: string;
  openedApp: boolean;
} | null> {
  const digitsOnly = acc.accountNumber.replace(/[^0-9]/g, '');
  const cleanAccountNumber =
    acc.accountNumber.replace(/[^0-9-]/g, '').trim() || acc.accountNumber.trim();
  if (!cleanAccountNumber) return null;

  await copyTextToClipboard(cleanAccountNumber);

  if (isMobileDevice() && digitsOnly) {
    showToast('계좌번호 복사 완료 · 토스 송금 앱을 연결합니다', 'info');
    const tossUrl = `supertoss://send?bank=${encodeURIComponent(acc.bank)}&accountNo=${digitsOnly}`;
    window.location.href = tossUrl;
    return { cleanAccountNumber, openedApp: true };
  }

  showToast(
    `${acc.bank} 계좌번호가 복사되었습니다 (토스 바로 송금은 모바일에서 지원)`,
    'info',
    3600
  );
  return { cleanAccountNumber, openedApp: false };
}
