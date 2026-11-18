import { WeddingConfig } from '../data/weddingConfig';

const KNOWN_SAMPLE_ACCOUNTS = new Set([
  '3333-01-2345678',
  '123401-04-567890',
  '110-234-567890',
  '1000-1234-5678',
  '1002-345-678901',
  '302-1234-5678-91',
]);

const KNOWN_SAMPLE_PHONES = new Set([
  '010-1234-5678',
  '010-2345-6789',
  '010-3456-7890',
  '010-9876-5432',
  '010-8765-4321',
  '010-7654-3210',
  '010-1111-2222',
  '010-3333-4444',
  '010-5555-6666',
  '010-7777-8888',
  '010-0000-0000',
  '010-9999-0000',
]);

const SEQUENTIAL_FOUR_DIGITS = new Set([
  '0123',
  '1234',
  '2345',
  '3456',
  '4567',
  '5678',
  '6789',
  '7890',
  '9876',
  '8765',
  '7654',
  '6543',
  '5432',
  '4321',
  '3210',
]);

function isPlaceholderFourDigits(block: string): boolean {
  return /^(\d)\1{3}$/.test(block) || SEQUENTIAL_FOUR_DIGITS.has(block);
}

export function isSampleAccountNumber(accountNumber: string): boolean {
  const trimmed = (accountNumber || '').trim();
  if (!trimmed) return true;
  if (KNOWN_SAMPLE_ACCOUNTS.has(trimmed)) return true;
  if (/1234-?5678|123-?456|0000-?0000/.test(trimmed)) return true;
  return false;
}

export function isSamplePhoneNumber(phone: string): boolean {
  const trimmed = (phone || '').trim();
  if (!trimmed) return true;
  if (KNOWN_SAMPLE_PHONES.has(trimmed)) return true;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7) return true;
  if (digits.length >= 10 && digits.startsWith('01')) {
    const body = digits.slice(3);
    if (body.length === 8) {
      const mid = body.slice(0, 4);
      const last = body.slice(4, 8);
      if (mid === '0000' || last === '0000') return true;
      if (isPlaceholderFourDigits(mid) && isPlaceholderFourDigits(last)) return true;
    }
  }
  return false;
}

export function isSampleGalleryUrl(url: string): boolean {
  const trimmed = (url || '').trim();
  if (!trimmed) return true;
  return trimmed.includes('images.unsplash.com');
}

export interface SampleDataChecklist {
  hasSampleAccounts: boolean;
  sampleAccountCount: number;
  hasSamplePhones: boolean;
  hasSampleGallery: boolean;
  sampleGalleryCount: number;
}

export function getSampleDataChecklist(config: WeddingConfig): SampleDataChecklist {
  const allAccounts = [
    ...(config.accounts?.groomSide || []),
    ...(config.accounts?.brideSide || []),
  ];
  const sampleAccountCount = allAccounts.filter((a) =>
    isSampleAccountNumber(a.accountNumber)
  ).length;

  const phones = [
    config.groom.phone,
    config.groom.fatherPhone,
    config.groom.motherPhone,
    config.bride.phone,
    config.bride.fatherPhone,
    config.bride.motherPhone,
  ];
  const hasSamplePhones = phones.some((p) => isSamplePhoneNumber(p));

  const sampleGalleryCount = (config.gallery || []).filter((g) =>
    isSampleGalleryUrl(g.imageUrl)
  ).length;

  return {
    hasSampleAccounts: sampleAccountCount > 0,
    sampleAccountCount,
    hasSamplePhones,
    hasSampleGallery: sampleGalleryCount > 0,
    sampleGalleryCount,
  };
}

export type WeddingPhase = 'upcoming' | 'dday' | 'post';

/**
 * Returns calendar-day difference between today and wedding day:
 * > 0: days remaining, 0: wedding day, < 0: days elapsed since wedding day.
 */
export function getWeddingDayDiff(dateISO: string, now = new Date()): number | null {
  const parsed = new Date(dateISO);
  if (Number.isNaN(parsed.getTime())) return null;
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weddingStart = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate()
  ).getTime();
  return Math.round((weddingStart - todayStart) / (1000 * 60 * 60 * 24));
}

export function detectWeddingPhase(config: WeddingConfig, now = new Date()): WeddingPhase {
  const parsed = new Date(config.wedding.dateISO);
  if (Number.isNaN(parsed.getTime())) return 'upcoming';

  const sameCalendarDay =
    now.getFullYear() === parsed.getFullYear() &&
    now.getMonth() === parsed.getMonth() &&
    now.getDate() === parsed.getDate();

  if (sameCalendarDay) return 'dday';

  const diffHours = (now.getTime() - parsed.getTime()) / (1000 * 60 * 60);
  if (diffHours >= -6 && diffHours <= 6) return 'dday';
  if (diffHours > 6) return 'post';
  return 'upcoming';
}
