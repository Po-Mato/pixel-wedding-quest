import { DEFAULT_WEDDING_CONFIG, type WeddingConfig } from '../data/weddingConfig';

/**
 * 신랑·신부·혼주 성함이 바뀌었을 때, 계좌 안내에 예전(샘플) 이름이 남지 않도록
 * 같은 역할(신랑/신랑 아버지/…)의 예금주 중 '이전 이름과 같거나 비어 있는 항목'만 새 이름으로 맞춥니다.
 * 계좌 탭에서 예금주를 직접 다르게 입력한 경우는 그대로 유지합니다.
 */
export const syncAccountHolderNames = (
  prev: WeddingConfig,
  next: WeddingConfig
): WeddingConfig => {
  const rules: Array<{
    side: 'groomSide' | 'brideSide';
    role: string;
    prevName: string;
    nextName: string;
  }> = [
    { side: 'groomSide', role: '신랑', prevName: prev.groom.fullName, nextName: next.groom.fullName },
    { side: 'groomSide', role: '신랑 아버지', prevName: prev.groom.fatherName, nextName: next.groom.fatherName },
    { side: 'groomSide', role: '신랑 어머니', prevName: prev.groom.motherName, nextName: next.groom.motherName },
    { side: 'brideSide', role: '신부', prevName: prev.bride.fullName, nextName: next.bride.fullName },
    { side: 'brideSide', role: '신부 아버지', prevName: prev.bride.fatherName, nextName: next.bride.fatherName },
    { side: 'brideSide', role: '신부 어머니', prevName: prev.bride.motherName, nextName: next.bride.motherName },
  ];

  const accounts = {
    groomSide: [...next.accounts.groomSide],
    brideSide: [...next.accounts.brideSide],
  };
  let changed = false;
  rules.forEach(({ side, role, prevName, nextName }) => {
    if (!nextName || prevName === nextName) return;
    accounts[side] = accounts[side].map((acc) => {
      if (acc.role === role && (acc.name === prevName || !acc.name)) {
        changed = true;
        return { ...acc, name: nextName };
      }
      return acc;
    });
  });
  return changed ? { ...next, accounts } : next;
};

/** 예전 버전 샘플 이름(김민준·이서연 / 이승재·이건희 하드코딩)이 남아 있는지 판별 */
const LEGACY_NAME_PATTERN = /민준|서연|승재|건희/;

/**
 * 관리자 편집 항목이 아닌 소개 문구(quote·specialSkill)에 예전 샘플 이름이 박혀 저장돼 있으면
 * 최신 템플릿({groom}/{bride} 토큰) 문구로 교체합니다.
 */
export const migrateLegacyProfileTexts = (config: WeddingConfig): WeddingConfig => {
  const pick = (value: string | undefined, fallback: string) =>
    !value || LEGACY_NAME_PATTERN.test(value) ? fallback : value;
  return {
    ...config,
    groom: {
      ...config.groom,
      quote: pick(config.groom.quote, DEFAULT_WEDDING_CONFIG.groom.quote),
      specialSkill: pick(config.groom.specialSkill, DEFAULT_WEDDING_CONFIG.groom.specialSkill),
    },
    bride: {
      ...config.bride,
      quote: pick(config.bride.quote, DEFAULT_WEDDING_CONFIG.bride.quote),
      specialSkill: pick(config.bride.specialSkill, DEFAULT_WEDDING_CONFIG.bride.specialSkill),
    },
  };
};
