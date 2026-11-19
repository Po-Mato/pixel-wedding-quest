import { WeddingConfig } from '../data/weddingConfig';

export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function hasValidWeddingCoords(wedding: WeddingConfig['wedding']): boolean {
  return (
    Number.isFinite(wedding.lat) &&
    Number.isFinite(wedding.lng) &&
    wedding.lat !== 0 &&
    wedding.lng !== 0
  );
}

export function getNaverMapWebUrl(wedding: WeddingConfig['wedding']): string {
  const encodedAddr = encodeURIComponent(wedding.addressRoad || wedding.venueName);
  return `https://map.naver.com/p/search/${encodedAddr}`;
}

export function getKakaoMapUrl(wedding: WeddingConfig['wedding']): string {
  const encodedVenue = encodeURIComponent(wedding.venueName);
  const encodedAddr = encodeURIComponent(wedding.addressRoad || wedding.venueName);
  if (hasValidWeddingCoords(wedding)) {
    return `https://map.kakao.com/link/to/${encodedVenue},${wedding.lat},${wedding.lng}`;
  }
  return `https://map.kakao.com/link/search/${encodedAddr}`;
}

export function getTmapDeepLink(wedding: WeddingConfig['wedding']): string {
  const encodedVenue = encodeURIComponent(wedding.venueName);
  if (hasValidWeddingCoords(wedding)) {
    return `tmap://route?goalname=${encodedVenue}&goalx=${wedding.lng}&goaly=${wedding.lat}`;
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
  const appUrl = hasValidWeddingCoords(wedding)
    ? `nmap://place?lat=${wedding.lat}&lng=${wedding.lng}&name=${encodedVenue}&appname=${appName}`
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
