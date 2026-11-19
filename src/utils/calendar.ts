import { WeddingConfig } from '../data/weddingConfig';
import { CoupleSide, joinCoupleNames } from './coupleOrder';
import { showToast } from './toast';

export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line/i.test(navigator.userAgent);
}

export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function formatUtcCalendarDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function getWeddingEventDates(config: WeddingConfig) {
  const start = new Date(config.wedding.dateISO);
  const safeStart = Number.isNaN(start.getTime())
    ? new Date('2027-05-01T17:10:00+09:00')
    : start;
  const end = new Date(safeStart.getTime() + 2 * 60 * 60 * 1000);
  return {
    startUtc: formatUtcCalendarDate(safeStart),
    endUtc: formatUtcCalendarDate(end),
    stampUtc: formatUtcCalendarDate(new Date()),
  };
}

export function openGoogleCalendar(
  config: WeddingConfig,
  primarySide: CoupleSide = 'groom'
): void {
  const { startUtc, endUtc } = getWeddingEventDates(config);
  const coupleFullNames = joinCoupleNames(config, primarySide, 'fullName', ' ♥ ');
  const title = `[결혼식] ${coupleFullNames}`;
  const location = `${config.wedding.venueName} ${config.wedding.hallName} (${config.wedding.addressRoad})`;
  const telLine = config.wedding.tel ? `\n문의: ${config.wedding.tel}` : '';
  const details = `${config.invitationMessage.headline}\n\n일시: ${config.wedding.dateDisplay} ${config.wedding.timeDisplay}\n장소: ${location}${telLine}`;
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title
  )}&dates=${startUtc}/${endUtc}&details=${encodeURIComponent(
    details
  )}&location=${encodeURIComponent(location)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  showToast('구글 캘린더 일정 추가 화면을 열었습니다', 'info');
}

export function downloadWeddingIcs(
  config: WeddingConfig,
  primarySide: CoupleSide = 'groom'
): void {
  const { startUtc, endUtc, stampUtc } = getWeddingEventDates(config);
  const coupleFullNames = joinCoupleNames(config, primarySide, 'fullName', ' ♥ ');
  const coupleShortNames = joinCoupleNames(config, primarySide, 'name', ' ♥ ');
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PixelWeddingQuest//KR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:wedding-${config.wedding.year}${String(config.wedding.month).padStart(2, '0')}${String(
      config.wedding.day
    ).padStart(2, '0')}@pixelweddingquest`,
    `DTSTAMP:${stampUtc}`,
    `SUMMARY:[결혼식] ${coupleFullNames}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `LOCATION:${config.wedding.venueName} ${config.wedding.hallName} (${config.wedding.addressRoad})`,
    `DESCRIPTION:${config.invitationMessage.questObjective}`,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:내일은 ${coupleShortNames}의 결혼식입니다.`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const inApp = isInAppBrowser();
  const ios = isIOSDevice();

  // iOS Safari에서는 data URI로 여는 편이 기본 캘린더 앱 연동 성공률이 높습니다.
  if (ios && !inApp) {
    const dataUri = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
    window.location.href = dataUri;
    showToast('캘린더 일정 추가 화면을 열었습니다', 'success');
    return;
  }

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `wedding-${config.groom.name}-${config.bride.name}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);

  if (inApp) {
    showToast(
      '인앱 브라우저에서 저장이 안 되면 [구글 캘린더] 또는 외부 브라우저로 열어주세요',
      'info',
      4200
    );
  } else {
    showToast('결혼식 일정(.ics) 파일이 저장되었습니다', 'success');
  }
}
