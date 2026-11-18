import type React from 'react';
import { isSamplePhoneNumber } from './weddingPhase';

/**
 * Formats Korean mobile or landline phone numbers automatically with hyphens as the user types.
 */
export function formatKoreanPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';

  if (digits.startsWith('02')) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 9) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    }
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

export function cleanPhoneForHref(phone: string): string {
  return (phone || '').replace(/[^0-9+]/g, '');
}

/**
 * Prevents accidental outgoing calls/SMS to placeholder sample phone numbers unless confirmed.
 */
export function guardSamplePhoneAction(
  e: React.MouseEvent<HTMLAnchorElement>,
  phone: string,
  actionLabel = '연결'
): boolean {
  if (!isSamplePhoneNumber(phone)) return true;
  const ok = window.confirm(
    `현재 표시된 연락처(${phone})는 청첩장 제작용 예시 번호입니다.\n실제 번호로 ${actionLabel}하시는 경우 발신 전 수신 대상을 꼭 확인해 주세요. 계속 진행하시겠습니까?`
  );
  if (!ok) {
    e.preventDefault();
    return false;
  }
  return true;
}
