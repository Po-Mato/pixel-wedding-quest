import { WeddingConfig } from '../data/weddingConfig';
import { PIXEL_ASSETS } from '../components/PixelSprites';
import { copyTextToClipboard } from './clipboard';

interface KakaoSDK {
  init: (key: string) => void;
  isInitialized: () => boolean;
  Share?: {
    sendDefault: (options: Record<string, unknown>) => void;
  };
}

declare global {
  interface Window {
    Kakao?: KakaoSDK;
  }
}

let kakaoLoadPromise: Promise<boolean> | null = null;

function loadKakaoSdk(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Kakao) return Promise.resolve(true);
  if (kakaoLoadPromise) return kakaoLoadPromise;

  kakaoLoadPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
    script.async = true;
    script.onload = () => resolve(Boolean(window.Kakao));
    script.onerror = () => {
      kakaoLoadPromise = null;
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return kakaoLoadPromise;
}

export type KakaoShareResult = 'kakao_sdk' | 'web_share' | 'copied_card';

export async function shareViaKakaoTalk(
  config: WeddingConfig,
  customShareUrl?: string,
  customTitlePrefix?: string
): Promise<KakaoShareResult> {
  const shareUrl = customShareUrl || window.location.href;
  const dateDot = `${config.wedding.year}. ${String(config.wedding.month).padStart(
    2,
    '0'
  )}. ${String(config.wedding.day).padStart(2, '0')}`;
  const title = customTitlePrefix
    ? `${customTitlePrefix} | ${config.groom.fullName} ♥ ${config.bride.fullName}`
    : `${config.groom.fullName} ♥ ${config.bride.fullName} 결혼합니다 (${dateDot})`;
  const description = `${config.wedding.dateDisplay} ${config.wedding.timeDisplay}\n${config.wedding.venueName} ${config.wedding.hallName}`;

  const envKey = (
    import.meta as unknown as { env?: { VITE_KAKAO_JS_KEY?: string } }
  ).env?.VITE_KAKAO_JS_KEY;
  const kakaoKey = (config.kakaoJsKey || envKey || '').trim();

  if (kakaoKey) {
    const loaded = await loadKakaoSdk();
    if (loaded && window.Kakao?.Share) {
      try {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(kakaoKey);
        }
        const ogImageUrl = new URL(PIXEL_ASSETS.weddingOgThumb, window.location.href).href;
        const mapUrl = `https://map.naver.com/p/search/${encodeURIComponent(
          config.wedding.addressRoad
        )}`;

        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title,
            description,
            imageUrl: ogImageUrl,
            imageWidth: 1200,
            imageHeight: 630,
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl,
            },
          },
          buttons: [
            {
              title: '모바일 청첩장 보기',
              link: {
                mobileWebUrl: shareUrl,
                webUrl: shareUrl,
              },
            },
            {
              title: '오시는 길 안내',
              link: {
                mobileWebUrl: mapUrl,
                webUrl: mapUrl,
              },
            },
          ],
        });
        return 'kakao_sdk';
      } catch {
        // Fall through to Web Share / Clipboard Card
      }
    }
  }

  const cardText = [
    `💍 ${title}`,
    `📅 ${config.wedding.dateDisplay} ${config.wedding.timeDisplay}`,
    `📍 ${config.wedding.venueName} ${config.wedding.hallName} (${config.wedding.addressRoad})`,
    `소중한 분들을 초대합니다.`,
  ].join('\n');

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text: cardText,
        url: shareUrl,
      });
      return 'web_share';
    } catch {
      // Fall through if user cancelled or Web Share failed
    }
  }

  await copyTextToClipboard(`${cardText}\n👉 청첩장 보기: ${shareUrl}`);
  return 'copied_card';
}
