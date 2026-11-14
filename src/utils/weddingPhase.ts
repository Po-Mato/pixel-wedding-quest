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
]);

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
  return KNOWN_SAMPLE_PHONES.has(trimmed);
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
