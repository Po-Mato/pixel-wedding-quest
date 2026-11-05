import type { WeddingConfig } from '../data/weddingConfig';

/**
 * 청첩장 문구 템플릿 치환 유틸
 *
 * 데이터 파일(대사·퀴즈·샘플 방명록 등)에 신랑·신부 이름을 하드코딩하지 않고
 * 토큰으로 작성해 두면, 관리자 콘솔에서 입력한 이름이 렌더링 시점에 자동 반영됩니다.
 *
 * 지원 토큰
 *   {groom}      신랑 약칭 (예: 승재)
 *   {bride}      신부 약칭 (예: 건희)
 *   {groomFull}  신랑 전체 성함 (예: 이승재)
 *   {brideFull}  신부 전체 성함 (예: 이건희)
 *   {date}       예식 월/일 (예: 5월 1일)
 *
 * 조사 자동 선택: {토큰|받침있을때/받침없을때}
 *   {bride|이/가}  → 건희가 / 서연이
 *   {bride|과/와}  → 건희와 / 서연과
 *   {groom|아/야}  → 승재야 / 민준아
 *   {bride|이/}    → 건희 / 서연이 (받침이 있을 때만 '이'를 붙임)
 */

const hasFinalConsonant = (word: string): boolean => {
  const last = word.trim().slice(-1);
  if (!last) return false;
  const code = last.charCodeAt(0);
  // 한글 음절(가~힣)만 받침 판정, 그 외(영문·숫자)는 받침 없음으로 처리
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
};

export const withJosa = (word: string, batchimForm: string, vowelForm: string): string =>
  `${word}${hasFinalConsonant(word) ? batchimForm : vowelForm}`;

export const getCoupleTokens = (config: WeddingConfig): Record<string, string> => ({
  groom: config.groom.name || config.groom.fullName,
  bride: config.bride.name || config.bride.fullName,
  groomFull: config.groom.fullName || config.groom.name,
  brideFull: config.bride.fullName || config.bride.name,
  date: `${config.wedding.month}월 ${config.wedding.day}일`,
});

const TOKEN_PATTERN = /\{(groom|bride|groomFull|brideFull|date)(?:\|([^/{}]*)\/([^/{}]*))?\}/g;

export const fillCoupleText = (text: string | undefined | null, config: WeddingConfig): string => {
  if (!text) return '';
  const tokens = getCoupleTokens(config);
  return text.replace(TOKEN_PATTERN, (_match, key: string, batchimForm?: string, vowelForm?: string) => {
    const value = tokens[key] ?? '';
    if (batchimForm === undefined && vowelForm === undefined) return value;
    return withJosa(value, batchimForm ?? '', vowelForm ?? '');
  });
};
