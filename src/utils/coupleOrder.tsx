import React, { createContext, useContext } from 'react';
import type { WeddingConfig } from '../data/weddingConfig';

export type CoupleSide = 'groom' | 'bride';
export type CoupleSideFilter = 'all' | CoupleSide;

/**
 * 일반(기본) 모드에서는 접속 시 신랑 우선 / 신부 우선 중 하나를 50:50 무작위로 결정하되,
 * 한 화면 내의 모든 섹션(표지·인사말·혼주·소개·연락처·계좌·방명록·푸터)에서 동일한 순서로 통일합니다.
 */
let sessionRandomPrimary: CoupleSide = Math.random() < 0.5 ? 'groom' : 'bride';

export function getRandomPrimarySide(): CoupleSide {
  return sessionRandomPrimary;
}

export function rollRandomPrimarySide(): CoupleSide {
  sessionRandomPrimary = Math.random() < 0.5 ? 'groom' : 'bride';
  return sessionRandomPrimary;
}

/** 신랑측 링크 → 신랑 우선, 신부측 링크 → 신부 우선, 일반 링크 → 무작위(전 섹션 통일) */
export function resolvePrimarySide(
  filter: CoupleSideFilter,
  randomFallback: CoupleSide = sessionRandomPrimary
): CoupleSide {
  if (filter === 'groom' || filter === 'bride') return filter;
  return randomFallback;
}

export function orderedSides(primary: CoupleSide): [CoupleSide, CoupleSide] {
  return primary === 'bride' ? ['bride', 'groom'] : ['groom', 'bride'];
}

export function orderPair<T>(primary: CoupleSide, groomValue: T, brideValue: T): [T, T] {
  return primary === 'bride' ? [brideValue, groomValue] : [groomValue, brideValue];
}

/** 예: joinCoupleNames(config, 'bride', 'name', ' ♥ ') → "이건희 ♥ 이승재" */
export function joinCoupleNames(
  config: WeddingConfig,
  primary: CoupleSide,
  key: 'name' | 'fullName' = 'fullName',
  separator = ' ♥ '
): string {
  const [a, b] = orderPair(primary, config.groom[key], config.bride[key]);
  return `${a}${separator}${b}`;
}

const CoupleOrderContext = createContext<CoupleSide>('groom');

export const CoupleOrderProvider: React.FC<{
  primary: CoupleSide;
  children: React.ReactNode;
}> = ({ primary, children }) => (
  <CoupleOrderContext.Provider value={primary}>{children}</CoupleOrderContext.Provider>
);

export function useCoupleOrder() {
  const primary = useContext(CoupleOrderContext);
  return {
    primary,
    sides: orderedSides(primary),
    pair: <T,>(groomValue: T, brideValue: T) => orderPair(primary, groomValue, brideValue),
    names: (
      config: WeddingConfig,
      key: 'name' | 'fullName' = 'fullName',
      separator = ' ♥ '
    ) => joinCoupleNames(config, primary, key, separator),
  };
}
