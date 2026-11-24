import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  MessageSquare,
  MapPin,
  Copy,
  Check,
  Calendar,
  Download,
  Train,
  Bus,
  Car,
  Heart,
  Share2,
  Type,
  Navigation,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  ExternalLink,
  ShieldCheck,
  ArrowUp,
  CheckCircle2,
  Send,
  Lock,
  Hand,
  Volume2,
  Square,
  ZoomIn,
} from 'lucide-react';
import {
  WeddingConfig,
  GuestbookEntry,
  BankAccount,
  QuestBuildingId,
} from '../data/weddingConfig';
import { WeddingPhaseBanner } from './WeddingPhaseBanner';
import {
  canEditOwnGuestbookEntry,
  deleteOwnGuestbookEntry,
} from '../utils/weddingCloudSync';
import { copyTextToClipboard } from '../utils/clipboard';
import { fillCoupleText } from '../utils/coupleText';
import { fireCelebrationConfetti, prefersReducedMotion } from '../utils/motion';
import { getWeddingDayDiff, WeddingPhase } from '../utils/weddingPhase';
import { formatKoreanPhoneInput, cleanPhoneForHref } from '../utils/phone';
import { useBodyScrollLock } from '../utils/useBodyScrollLock';
import { useEscapeKey } from '../utils/useEscapeKey';
import { shareViaKakaoTalk } from '../utils/kakaoShare';
import { joinCoupleNames, useCoupleOrder } from '../utils/coupleOrder';
import { openGoogleCalendar, downloadWeddingIcs } from '../utils/calendar';
import {
  hasValidWeddingCoords,
  getOsmEmbedUrl,
  getKakaoMapUrl,
  getNaverMapWebUrl,
  getTmapDeepLink,
  openNaverMap,
  openTmap,
  openTossTransfer,
} from '../utils/navigation';
import { showToast } from '../utils/toast';

export type ParentsSideFilter = 'all' | 'groom' | 'bride';
type FontScaleMode = 'normal' | 'large' | 'xlarge';
const STORAGE_PARENTS_FONT_KEY = 'pixel_wedding_quest_parents_font_v1';
const PARENTS_QUICK_BLESSING_CHIPS = [
  '결혼을 진심으로 축하드립니다. 늘 행복하세요.',
  '두 사람의 아름다운 앞날을 축복합니다.',
  '예식 날 기쁜 마음으로 참석하여 축하드리겠습니다.',
  '멀리서나마 두 분의 새 출발을 진심으로 응원합니다.',
];
const PARENTS_NAV_IDS = [
  'parents-greeting',
  'parents-contact',
  'parents-location',
  'parents-gift',
  'parents-rsvp',
] as const;
type ParentsNavId = (typeof PARENTS_NAV_IDS)[number];

interface ParentsWeddingViewProps {
  config: WeddingConfig;
  guestbook: GuestbookEntry[];
  initialSide?: ParentsSideFilter;
  phase?: WeddingPhase;
  isPreviewPhase?: boolean;
  onResetPhasePreview?: () => void;
  onAddGuestbook: (entry: GuestbookEntry) => Promise<boolean> | boolean | void;
  onDeleteGuestbook?: (id: string) => void;
}

export const ParentsWeddingView: React.FC<ParentsWeddingViewProps> = ({
  config,
  guestbook,
  initialSide = 'all',
  phase = 'upcoming',
  isPreviewPhase = false,
  onResetPhasePreview,
  onAddGuestbook,
  onDeleteGuestbook,
}) => {
  const [fontScale, setFontScale] = useState<FontScaleMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PARENTS_FONT_KEY);
      if (saved === 'normal' || saved === 'large' || saved === 'xlarge') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'large';
  });
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PARENTS_FONT_KEY, fontScale);
    } catch {
      // ignore
    }
  }, [fontScale]);

  // 신랑측 링크 → 신랑 우선 / 신부측 링크 → 신부 우선 / 일반 링크 → 기기별 무작위(고정)
  const { primary } = useCoupleOrder();
  const [activeContactSide, setActiveContactSide] = useState<'groom' | 'bride'>(primary);
  const [activeAccountSide, setActiveAccountSide] = useState<'groom' | 'bride'>(primary);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedPhoneKey, setCopiedPhoneKey] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedShare, setCopiedShare] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [showTaxiCard, setShowTaxiCard] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [activeNavId, setActiveNavId] = useState<ParentsNavId | null>(null);
  const [isCompactTopBar, setIsCompactTopBar] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mapInteractive, setMapInteractive] = useState(false);
  const [showSideShareLinks, setShowSideShareLinks] = useState(false);
  const [imgLoadedMap, setImgLoadedMap] = useState<Record<string, boolean>>({});
  const guestNameInputRef = useRef<HTMLInputElement | null>(null);
  const supportsSpeech =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined';

  useEffect(() => {
    return () => {
      if (supportsSpeech) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [supportsSpeech]);

  const jumpToParentsSection = (sectionId: QuestBuildingId) => {
    const idMap: Record<QuestBuildingId, string> = {
      story: 'parents-greeting',
      ceremony: 'parents-ceremony',
      gallery: 'parents-gallery',
      minigame: 'parents-greeting',
      location: 'parents-location',
      gift: 'parents-gift',
      rsvp: 'parents-rsvp',
    };
    const targetId = idMap[sectionId] || 'parents-greeting';
    document.getElementById(targetId)?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };
  const lightboxTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isLightboxOpen = lightboxIdx !== null && Boolean(config.gallery[lightboxIdx]);
  useBodyScrollLock(isLightboxOpen || showTaxiCard);
  useEscapeKey(showTaxiCard, () => setShowTaxiCard(false));

  // Simple Senior-Friendly RSVP + Guestbook Form State
  const [guestName, setGuestName] = useState('');
  const [nameError, setNameError] = useState(false);
  const [guestPhone, setGuestPhone] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [privacyError, setPrivacyError] = useState(false);
  const [guestSide, setGuestSide] = useState<'groom' | 'bride'>(primary);
  const [attendance, setAttendance] = useState<'attend' | 'unable' | 'maybe'>('attend');
  const [companions, setCompanions] = useState<number>(1);
  const [meal, setMeal] = useState<'yes' | 'no' | 'undecided'>('yes');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedBanner, setSubmittedBanner] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [guestbookFilter, setGuestbookFilter] = useState<'all' | 'groom' | 'bride'>('all');
  const [visibleGuestbookCount, setVisibleGuestbookCount] = useState<number>(5);

  useEffect(() => {
    setActiveContactSide(primary);
    setActiveAccountSide(primary);
    setGuestSide(primary);
  }, [primary]);

  // Scroll spy for sticky quick-jump bar + floating "back to top" button
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsCompactTopBar(scrollY > 220);
      setShowScrollTop(scrollY > 420);
      if (scrollY < 260) {
        setActiveNavId(null);
        return;
      }
      const triggerLine = window.innerHeight * 0.34;
      let current: ParentsNavId | null = 'parents-greeting';
      for (const id of PARENTS_NAV_IDS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= triggerLine) {
          current = id;
        }
      }
      setActiveNavId(current);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Preload adjacent gallery photos & keyboard navigation when lightbox is open
  useEffect(() => {
    if (lightboxIdx === null || config.gallery.length === 0) return;
    const prevIdx = (lightboxIdx - 1 + config.gallery.length) % config.gallery.length;
    const nextIdx = (lightboxIdx + 1) % config.gallery.length;
    [prevIdx, nextIdx].forEach((idx) => {
      const target = config.gallery[idx];
      if (!target?.imageUrl || imgLoadedMap[target.imageUrl]) return;
      const preloader = new Image();
      preloader.onload = () => {
        setImgLoadedMap((prev) =>
          prev[target.imageUrl] ? prev : { ...prev, [target.imageUrl]: true }
        );
      };
      preloader.src = target.imageUrl;
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIdx(null);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIdx((prev) =>
          prev === null ? null : (prev - 1 + config.gallery.length) % config.gallery.length
        );
      } else if (e.key === 'ArrowRight') {
        setLightboxIdx((prev) =>
          prev === null ? null : (prev + 1) % config.gallery.length
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIdx, config.gallery, imgLoadedMap]);

  const handleLightboxTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    lightboxTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleLightboxTouchEnd = (e: React.TouchEvent) => {
    if (!lightboxTouchStartRef.current || lightboxIdx === null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - lightboxTouchStartRef.current.x;
    const dy = touch.clientY - lightboxTouchStartRef.current.y;
    lightboxTouchStartRef.current = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0) {
        setLightboxIdx((lightboxIdx + 1) % config.gallery.length);
      } else {
        setLightboxIdx((lightboxIdx - 1 + config.gallery.length) % config.gallery.length);
      }
    }
  };

  const myLatestEntry = guestbook.find((item) => canEditOwnGuestbookEntry(item.id));

  const groomOrder = primary === 'bride' ? 3 : 1;
  const brideOrder = primary === 'bride' ? 1 : 3;

  // Dynamic font-size classes tailored for senior readability across ALL interactive elements
  const textScale = {
    normal: {
      body: 'text-[16px] leading-[1.85]',
      sub: 'text-[14px] leading-[1.7]',
      heading: 'text-[22px] leading-[1.35]',
      heroTitle: 'text-[26px] sm:text-[30px] leading-[1.3]',
      nameLarge: 'text-[20px]',
      btn: 'text-[15px] py-3 px-4',
      label: 'text-[13px] leading-[1.5]',
      chip: 'text-[13px] sm:text-[14px] py-2.5 px-2',
      caption: 'text-[13px] leading-[1.5]',
      calHead: 'text-sm sm:text-base',
      calDay: 'text-base sm:text-lg',
      calCell: 'h-10',
      calCircle: 'w-9 h-9',
    },
    large: {
      body: 'text-[18px] leading-[1.9]',
      sub: 'text-[16px] leading-[1.75]',
      heading: 'text-[24px] leading-[1.35]',
      heroTitle: 'text-[28px] sm:text-[32px] leading-[1.3]',
      nameLarge: 'text-[22px]',
      btn: 'text-[17px] py-3.5 px-4',
      label: 'text-[15px] leading-[1.5]',
      chip: 'text-[15px] py-3 px-2.5',
      caption: 'text-[15px] leading-[1.55]',
      calHead: 'text-base sm:text-lg',
      calDay: 'text-lg sm:text-xl',
      calCell: 'h-10',
      calCircle: 'w-10 h-10',
    },
    xlarge: {
      body: 'text-[20px] leading-[1.95]',
      sub: 'text-[18px] leading-[1.8]',
      heading: 'text-[27px] leading-[1.35]',
      heroTitle: 'text-[31px] sm:text-[35px] leading-[1.3]',
      nameLarge: 'text-[24px]',
      btn: 'text-[19px] py-4 px-5',
      label: 'text-[17px] leading-[1.55]',
      chip: 'text-[17px] py-3.5 px-3',
      caption: 'text-[17px] leading-[1.6]',
      calHead: 'text-lg sm:text-xl',
      calDay: 'text-xl sm:text-2xl',
      calCell: 'h-11',
      calCircle: 'w-11 h-11',
    },
  }[fontScale];

  const year = config.wedding.year;
  const month = config.wedding.month;
  const weddingDay = config.wedding.day;
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const weddingDayDiff = getWeddingDayDiff(config.wedding.dateISO) ?? 0;

  const hasValidCoords = hasValidWeddingCoords(config.wedding);
  const kakaoNavUrl = getKakaoMapUrl(config.wedding);
  const naverNavUrl = getNaverMapWebUrl(config.wedding);
  const tmapDeepLink = getTmapDeepLink(config.wedding);

  const handleOpenNaver = (e: React.MouseEvent<HTMLAnchorElement>) => {
    openNaverMap(config.wedding, e);
  };

  const handleOpenTmap = (e: React.MouseEvent<HTMLAnchorElement>) => {
    openTmap(config.wedding, e);
  };

  const handleCopyAddress = async () => {
    await copyTextToClipboard(config.wedding.addressRoad);
    setCopiedAddress(true);
    showToast('예식장 주소가 복사되었습니다');
    setTimeout(() => setCopiedAddress(false), 3000);
  };

  const handleCopyPhone = async (role: string, name: string, phone: string, key: string) => {
    await copyTextToClipboard(phone.trim());
    setCopiedPhoneKey(key);
    showToast(`${role} ${name}님 연락처가 복사되었습니다`);
    window.setTimeout(() => {
      setCopiedPhoneKey((prev) => (prev === key ? null : prev));
    }, 2500);
  };

  const handleOpenTossAccount = async (acc: BankAccount, key: string) => {
    const res = await openTossTransfer(acc);
    if (!res) return;
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 6000);
  };

  const handleCopyAccount = async (acc: BankAccount, key: string) => {
    const cleanAccountNumber =
      acc.accountNumber.replace(/[^0-9-]/g, '').trim() || acc.accountNumber.trim();
    if (!cleanAccountNumber) return;

    await copyTextToClipboard(cleanAccountNumber);
    setCopiedKey(key);
    showToast(`${acc.bank} 계좌번호(${acc.name})가 복사되었습니다`);
    fireCelebrationConfetti({
      particleCount: 24,
      spread: 50,
      origin: { y: 0.78 },
      colors: ['#c96f78', '#c59b6d', '#6b9071'],
    });
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 6000);
  };

  const fontScaleLabelMap: Record<FontScaleMode, string> = {
    normal: '보통',
    large: '크게',
    xlarge: '아주 크게',
  };

  const handleCycleFontScale = () => {
    const order: FontScaleMode[] = ['normal', 'large', 'xlarge'];
    const next = order[(order.indexOf(fontScale) + 1) % order.length];
    setFontScale(next);
    showToast(`글씨 크기: ${fontScaleLabelMap[next]}`, 'info');
  };

  const handleToggleSpeech = () => {
    if (!supportsSpeech) return;
    try {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      window.speechSynthesis.cancel();
      const coupleIntro =
        primary === 'bride'
          ? `신부측 혼주 ${config.bride.fatherName}, ${config.bride.motherName}님의 ${config.bride.relation} ${config.bride.fullName}, 신랑측 혼주 ${config.groom.fatherName}, ${config.groom.motherName}님의 ${config.groom.relation} ${config.groom.fullName} 결혼식에 초대합니다.`
          : `신랑측 혼주 ${config.groom.fatherName}, ${config.groom.motherName}님의 ${config.groom.relation} ${config.groom.fullName}, 신부측 혼주 ${config.bride.fatherName}, ${config.bride.motherName}님의 ${config.bride.relation} ${config.bride.fullName} 결혼식에 초대합니다.`;
      const dateVenueIntro = `예식 일시는 ${config.wedding.dateDisplay} ${config.wedding.timeDisplay}이며, 장소는 ${config.wedding.venueName} ${config.wedding.hallName}입니다.`;
      const messageBody = [
        config.invitationMessage.headline,
        ...config.invitationMessage.paragraphs,
      ]
        .filter(Boolean)
        .join(' ');
      const addressTail = `오시는 길 주소는 ${config.wedding.addressRoad} 입니다.`;

      const utterance = new SpeechSynthesisUtterance(
        `${coupleIntro} ${dateVenueIntro} ${messageBody} ${addressTail}`
      );
      utterance.lang = 'ko-KR';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const koVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('ko'));
      if (koVoice) {
        utterance.voice = koVoice;
      }
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  const buildShareUrl = (sideParam?: ParentsSideFilter) => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'parents');
    url.searchParams.delete('admin');
    if (sideParam && sideParam !== 'all') {
      url.searchParams.set('side', sideParam);
    } else if (initialSide !== 'all' && !sideParam) {
      url.searchParams.set('side', initialSide);
    } else {
      url.searchParams.delete('side');
    }
    url.hash = '';
    return url.toString();
  };

  const handleShareParentsPage = async (sideParam?: ParentsSideFilter, label = 'main') => {
    const shareUrl = buildShareUrl(sideParam);
    const sideTitle =
      sideParam === 'groom'
        ? `[신랑측 혼주 초청] `
        : sideParam === 'bride'
        ? `[신부측 혼주 초청] `
        : '';

    if (navigator.share && label === 'main') {
      navigator
        .share({
          title: `${sideTitle}${joinCoupleNames(
            config,
            sideParam === 'groom' || sideParam === 'bride' ? sideParam : primary,
            'fullName',
            ' · '
          )} 결혼식에 초대합니다`,
          text: `${config.wedding.dateDisplay} ${config.wedding.timeDisplay}\n${config.wedding.venueName} ${config.wedding.hallName}`,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      await copyTextToClipboard(shareUrl);
      setCopiedShare(label);
      showToast('청첩장 링크가 복사되었습니다');
      setTimeout(() => setCopiedShare(null), 3000);
    }
  };

  const handleShareKakaoParents = async () => {
    const shareUrl = buildShareUrl(initialSide !== 'all' ? initialSide : undefined);
    const prefix =
      initialSide === 'groom'
        ? '[신랑측 혼주 초청]'
        : initialSide === 'bride'
        ? '[신부측 혼주 초청]'
        : '[혼주 초청장]';
    const res = await shareViaKakaoTalk(config, shareUrl, prefix, primary);
    if (res === 'copied_card') {
      setCopiedShare('kakao');
      showToast('카카오톡 초대 문구가 복사되었습니다');
      setTimeout(() => setCopiedShare(null), 3500);
    }
  };

  const handleSubmitGuestbook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!guestName.trim()) {
      setNameError(true);
      showToast('성함을 먼저 입력해 주세요', 'info');
      guestNameInputRef.current?.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'center',
      });
      guestNameInputRef.current?.focus();
      return;
    }
    setNameError(false);
    if (guestPhone.trim() && !privacyAgreed) {
      setPrivacyError(true);
      showToast('연락처 수집·이용 동의란에 체크해 주세요', 'info');
      return;
    }
    setPrivacyError(false);
    setIsSubmitting(true);

    const defaultBlessingByAttendance: Record<'attend' | 'unable' | 'maybe', string> = {
      attend: '결혼을 진심으로 축하드립니다. 예식 날 기쁜 마음으로 참석하겠습니다.',
      maybe: '결혼을 진심으로 축하드립니다. 두 사람의 앞날을 축복합니다.',
      unable: '결혼을 진심으로 축하드립니다. 멀리서나마 두 분의 새 출발을 응원합니다.',
    };
    const finalMessage = message.trim() || defaultBlessingByAttendance[attendance];

    const newEntry: GuestbookEntry = {
      id: `gb-${Date.now()}`,
      name: guestName.trim(),
      avatar: 'healer',
      side: guestSide,
      titleBadge: guestSide === 'groom' ? '신랑측 귀빈' : '신부측 귀빈',
      message: finalMessage,
      createdAt: '방금 전',
      attendance,
      companions: attendance === 'unable' ? 0 : companions,
      meal: attendance === 'unable' ? 'no' : meal,
      phone: guestPhone.trim(),
    };

    try {
      await onAddGuestbook(newEntry);
      setGuestName('');
      setNameError(false);
      setGuestPhone('');
      setPrivacyAgreed(false);
      setMessage('');
      setSubmittedBanner(true);
      showToast('소중한 축하 말씀과 참석 의사가 전달되었습니다');
      setTimeout(() => setSubmittedBanner(false), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm('작성하신 축하 글을 삭제하시겠습니까?')) return;
    setDeletingId(entryId);
    const ok = await deleteOwnGuestbookEntry(entryId);
    setDeletingId(null);
    if (ok && onDeleteGuestbook) {
      onDeleteGuestbook(entryId);
      showToast('작성하신 축하 글이 삭제되었습니다', 'info');
    }
  };

  const activeAccounts =
    activeAccountSide === 'groom'
      ? config.accounts.groomSide
      : config.accounts.brideSide;

  const isContactGroom = activeContactSide === 'groom';
  const activeContactPerson = isContactGroom ? config.groom : config.bride;
  const activeContacts = [
    {
      role: isContactGroom ? '신랑 아버지' : '신부 아버지',
      name: activeContactPerson.fatherName,
      phone: activeContactPerson.fatherPhone,
    },
    {
      role: isContactGroom ? '신랑 어머니' : '신부 어머니',
      name: activeContactPerson.motherName,
      phone: activeContactPerson.motherPhone,
    },
    {
      role: isContactGroom ? '신랑 본인' : '신부 본인',
      name: activeContactPerson.fullName,
      phone: activeContactPerson.phone,
    },
  ];

  const visibleGallery = showAllPhotos ? config.gallery : config.gallery.slice(0, 4);
  const hiddenPhotoCount = Math.max(0, config.gallery.length - 4);

  return (
    <div className="w-full max-w-[540px] mx-auto space-y-6 pb-[calc(2.5rem+env(safe-area-inset-bottom))] font-serif text-[#2d221e]">
      {/* 0. Sticky Top Accessibility Font-Size Bar & Quick Jump (Auto-slims on scroll) */}
      <div
        className={`sticky top-2 z-30 bg-[#fffdf9]/95 backdrop-blur-md border border-[#d8c7b0] rounded-2xl shadow-[0_8px_24px_-10px_rgba(45,34,30,0.16)] font-sans transition-all ${
          isCompactTopBar ? 'px-2.5 py-2' : 'px-3.5 py-2.5 space-y-2'
        }`}
      >
        {!isCompactTopBar && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[#4a3a33] font-bold text-sm">
              <Type className="w-4 h-4 text-[#b35c66]" />
              <span>글씨 크기 조절</span>
            </div>

            <div className="inline-flex rounded-xl bg-[#f5efe6] p-1 border border-[#dfd2be]">
              {(
                [
                  { id: 'normal', label: '보통' },
                  { id: 'large', label: '크게(권장)' },
                  { id: 'xlarge', label: '아주 크게' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFontScale(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
                    fontScale === opt.id
                      ? 'bg-[#2d221e] text-[#fffdf9]'
                      : 'text-[#69584f] hover:text-[#2d221e]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Big Quick-Jump Anchor Buttons with Active Scroll Spy (5 Sections) */}
        <div
          className={`grid grid-cols-5 gap-1 text-center ${
            isCompactTopBar ? '' : 'pt-1 border-t border-[#efe6d8]'
          }`}
        >
          {(
            [
              { id: 'parents-greeting', label: '모시는 글' },
              { id: 'parents-contact', label: '연락처' },
              { id: 'parents-location', label: '오시는 길' },
              { id: 'parents-gift', label: '계좌' },
              { id: 'parents-rsvp', label: '참석전달' },
            ] as const
          ).map((nav) => {
            const isActive = activeNavId === nav.id;
            return (
              <button
                key={nav.id}
                type="button"
                onClick={() => {
                  setActiveNavId(nav.id);
                  document.getElementById(nav.id)?.scrollIntoView({
                    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
                  });
                }}
                className={`py-2.5 px-0.5 rounded-xl border text-[12px] sm:text-sm font-bold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#2d221e] text-[#fffdf9] border-[#2d221e] shadow-sm'
                    : 'bg-[#faf5ec] hover:bg-[#f1e7d6] border-[#e2d4c0] text-[#3b2f2f]'
                }`}
              >
                {nav.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Wedding Day / Post-Wedding Banner for Parents & Elders */}
      {phase !== 'upcoming' && (
        <WeddingPhaseBanner
          config={config}
          phase={phase}
          isPreviewOverride={isPreviewPhase}
          onResetPreview={onResetPhasePreview}
          onJumpToSection={jumpToParentsSection}
        />
      )}

      {/* 1. Dignified Formal Hero Cover */}
      <section className="bg-[#fffdf9] border border-[#dfd2be] rounded-3xl overflow-hidden shadow-[0_12px_32px_-14px_rgba(45,34,30,0.12)] text-center">
        <div className="pt-8 pb-5 px-6 bg-gradient-to-b from-[#faf4ea] to-[#fffdf9] border-b border-[#efe6d8]">
          <h1 className={`${textScale.heroTitle} font-bold text-[#2d221e] tracking-wide`}>
            {primary === 'bride' ? config.bride.fullName : config.groom.fullName}
            <span className="text-[#b35c66] mx-2.5 font-normal">·</span>
            {primary === 'bride' ? config.groom.fullName : config.bride.fullName}
          </h1>

          {/* Prominent Parents Names Banner right on the cover for elders */}
          <div className="mt-5 inline-flex flex-col gap-1.5 bg-[#faf5ec] border border-[#e2d4c0] rounded-2xl px-5 py-3.5 text-left">
            <div style={{ order: groomOrder }} className={`${textScale.sub} text-[#3b2f2f]`}>
              <span className="font-sans font-bold text-[#5c4d47] mr-2">신랑측 혼주</span>
              <strong>{config.groom.fatherName}</strong> ·{' '}
              <strong>{config.groom.motherName}</strong>
              <span className="text-[#69584f]">의 {config.groom.relation} </span>
              <strong className="text-[#2d221e]">{config.groom.name}</strong>
            </div>
            <div style={{ order: brideOrder }} className={`${textScale.sub} text-[#3b2f2f]`}>
              <span className="font-sans font-bold text-[#b35c66] mr-2">신부측 혼주</span>
              <strong>{config.bride.fatherName}</strong> ·{' '}
              <strong>{config.bride.motherName}</strong>
              <span className="text-[#69584f]">의 {config.bride.relation} </span>
              <strong className="text-[#2d221e]">{config.bride.name}</strong>
            </div>
          </div>
        </div>

        {/* Main Wedding Photograph (Tap to open Fullscreen Lightbox) */}
        <div className="p-5 sm:p-7 bg-[#fffdf9]">
          <button
            type="button"
            onClick={() => config.gallery[0] && setLightboxIdx(0)}
            aria-label="대표 웨딩 사진 크게 보기"
            className="group relative block mx-auto w-full max-w-[420px] aspect-[4/4.6] rounded-2xl overflow-hidden border border-[#dfd2be] shadow-sm bg-[#faf5ec]"
          >
            <img
              src={config.gallery[0]?.imageUrl}
              alt={`${joinCoupleNames(config, primary, 'fullName', ' · ')} 웨딩 사진`}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
            {config.gallery[0] && (
              <span className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-[#2d221e]/80 text-white text-xs sm:text-sm font-sans font-bold backdrop-blur-sm flex items-center gap-1.5 shadow-md">
                <ZoomIn className="w-3.5 h-3.5" />
                <span>크게 보기</span>
              </span>
            )}
          </button>
        </div>

        {/* Essential Date, Time & Venue Box + D-Day Badge + Voice Read-Aloud */}
        <div className="px-6 pb-8 pt-2 space-y-3">
          <div className="bg-[#faf5ec] border-2 border-[#d8c4a8] rounded-2xl p-5 space-y-2">
            <div className="pb-1">
              <span className={`inline-block px-3.5 py-1 rounded-full font-sans font-bold ${textScale.label} tabular-nums ${
                weddingDayDiff === 0
                  ? 'bg-[#b35c66] text-white'
                  : weddingDayDiff < 0
                  ? 'bg-[#e6ebe8] text-[#2f453c]'
                  : 'bg-[#fcf0f1] border border-[#e5b8be] text-[#9e3f4a]'
              }`}>
                {weddingDayDiff === 0
                  ? '오늘이 결혼식 날입니다 💍'
                  : weddingDayDiff < 0
                  ? `결혼 +${Math.abs(weddingDayDiff)}일째 💐`
                  : `예식까지 D-${weddingDayDiff}일`}
              </span>
            </div>
            <div className={`${textScale.nameLarge} font-bold text-[#2d221e] tabular-nums`}>
              {config.wedding.dateDisplay}
            </div>
            <div className={`${textScale.nameLarge} font-bold text-[#b35c66] tabular-nums`}>
              {config.wedding.timeDisplay}
            </div>
            <div className="pt-2 border-t border-[#e5d8c5] mt-2">
              <div className={`${textScale.nameLarge} font-bold text-[#2d221e]`}>
                {config.wedding.venueName}
              </div>
              <div className={`${textScale.body} font-semibold text-[#56463f] mt-0.5`}>
                {config.wedding.hallName}
              </div>
            </div>
          </div>

          {supportsSpeech && (
            <button
              type="button"
              onClick={handleToggleSpeech}
              aria-pressed={isSpeaking}
              className={`w-full ${textScale.btn} rounded-2xl font-sans font-bold border-2 flex items-center justify-center gap-2 shadow-sm transition-colors ${
                isSpeaking
                  ? 'bg-[#b35c66] hover:bg-[#9f4c56] text-white border-[#9f4c56]'
                  : 'bg-[#fffdf9] hover:bg-[#faf5ec] text-[#2d221e] border-[#c9b69c]'
              }`}
            >
              {isSpeaking ? (
                <>
                  <Square className="w-4 h-4 fill-current shrink-0" />
                  <span>음성 읽기 멈추기</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5 text-[#b35c66] shrink-0" />
                  <span>청첩장 음성으로 듣기</span>
                </>
              )}
            </button>
          )}
        </div>
      </section>

      {/* 2. Formal Invitation Message & Family Introduction */}
      <section
        id="parents-greeting"
        className="scroll-mt-32 bg-[#fffdf9] border border-[#dfd2be] rounded-3xl p-6 sm:p-8 shadow-[0_12px_32px_-14px_rgba(45,34,30,0.1)] space-y-6"
      >
        <div className="text-center border-b border-[#efe6d8] pb-4">
          <h2 className={`${textScale.heading} font-bold text-[#2d221e]`}>모시는 글</h2>
        </div>

        <p
          className={`${textScale.nameLarge} font-bold text-[#8c584c] text-center leading-snug break-keep`}
        >
          “{config.invitationMessage.headline}”
        </p>

        <div className={`${textScale.body} text-[#2d221e] space-y-5 text-center break-keep`}>
          {config.invitationMessage.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {/* Clear Family Lineage Box */}
        <div className="bg-[#faf5ec] border border-[#dfd2be] rounded-2xl p-5 flex flex-col gap-3.5 text-center">
          <div style={{ order: groomOrder }} className={`${textScale.nameLarge} text-[#2d221e]`}>
            <strong>{config.groom.fatherName}</strong> ·{' '}
            <strong>{config.groom.motherName}</strong>
            <span className={`${textScale.sub} text-[#69584f] mx-2`}>
              의 {config.groom.relation}
            </span>
            <strong className="text-[#2d221e]">{config.groom.fullName}</strong>
          </div>

          <div style={{ order: 2 }} className="border-t border-[#e8dccb]" />

          <div style={{ order: brideOrder }} className={`${textScale.nameLarge} text-[#2d221e]`}>
            <strong>{config.bride.fatherName}</strong> ·{' '}
            <strong>{config.bride.motherName}</strong>
            <span className={`${textScale.sub} text-[#69584f] mx-2`}>
              의 {config.bride.relation}
            </span>
            <strong className="text-[#2d221e]">{config.bride.fullName}</strong>
          </div>
        </div>
      </section>

      {/* 3. Large One-Touch Contact Buttons for Parents (혼주) & Couple (2-Tab Switcher) */}
      <section
        id="parents-contact"
        className="scroll-mt-32 bg-[#fffdf9] border border-[#dfd2be] rounded-3xl p-6 sm:p-8 shadow-[0_12px_32px_-14px_rgba(45,34,30,0.1)] space-y-5 font-sans"
      >
        <div className="text-center border-b border-[#efe6d8] pb-4">
          <h2 className={`${textScale.heading} font-serif font-bold text-[#2d221e]`}>
            혼주 및 신랑·신부 연락처
          </h2>
          <p className={`${textScale.sub} text-[#69584f] mt-1 break-keep`}>
            신랑측·신부측을 선택하신 뒤 버튼을 누르면 바로 연결됩니다.
          </p>
        </div>

        {/* Groom / Bride Contact Side Tabs */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setActiveContactSide('groom')}
            style={{ order: groomOrder }}
            className={`${textScale.btn} rounded-2xl font-bold border transition-colors ${
              activeContactSide === 'groom'
                ? 'bg-[#2d221e] text-white border-[#2d221e] shadow-sm'
                : 'bg-[#faf5ec] text-[#56463f] border-[#dfd2be]'
            }`}
          >
            신랑측 연락처
          </button>
          <button
            type="button"
            onClick={() => setActiveContactSide('bride')}
            style={{ order: brideOrder }}
            className={`${textScale.btn} rounded-2xl font-bold border transition-colors ${
              activeContactSide === 'bride'
                ? 'bg-[#b35c66] text-white border-[#b35c66] shadow-sm'
                : 'bg-[#faf5ec] text-[#56463f] border-[#dfd2be]'
            }`}
          >
            신부측 연락처
          </button>
        </div>

        <div className="bg-[#faf5ec] border border-[#dfd2be] rounded-2xl p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#e5d8c5] pb-2.5">
            <span
              className={`px-3.5 py-1 rounded-full ${textScale.label} font-bold ${
                isContactGroom
                  ? 'bg-[#2d221e] text-[#fffdf9]'
                  : 'bg-[#b35c66] text-white'
              }`}
            >
              {isContactGroom ? '신랑측 연락처' : '신부측 연락처'}
            </span>
          </div>

          <div className="space-y-3">
            {activeContacts.map((c) => {
              const dialHref = cleanPhoneForHref(c.phone);
              const phoneKey = `${activeContactSide}-${c.role}`;
              return (
                <div
                  key={phoneKey}
                  className="bg-[#fffdf9] border border-[#e5d8c5] rounded-xl p-4 flex flex-col gap-3"
                >
                  <div>
                    <div className={`${textScale.label} font-semibold text-[#69584f]`}>
                      {c.role}
                    </div>
                    <div className={`${textScale.nameLarge} font-bold text-[#2d221e] mt-0.5`}>
                      {c.name}
                    </div>
                    <div className={`${textScale.sub} text-[#56463f] tabular-nums mt-0.5`}>
                      {c.phone || '연락처 확인 중'}
                    </div>
                  </div>

                  {dialHref && (
                    <div
                      className={`grid gap-2 ${
                        fontScale === 'xlarge'
                          ? 'grid-cols-2'
                          : 'grid-cols-3'
                      }`}
                    >
                      <a
                        href={`tel:${dialHref}`}
                        className={`${textScale.chip} rounded-xl bg-[#2d221e] hover:bg-[#1e1613] text-[#fffdf9] font-bold flex items-center justify-center gap-1.5 whitespace-nowrap`}
                      >
                        <Phone className="w-4 h-4 shrink-0" />
                        <span>전화걸기</span>
                      </a>
                      <a
                        href={`sms:${dialHref}`}
                        className={`${textScale.chip} rounded-xl bg-[#faf5ec] hover:bg-[#efe5d4] border border-[#c9b69c] text-[#2d221e] font-bold flex items-center justify-center gap-1.5 whitespace-nowrap`}
                      >
                        <MessageSquare className="w-4 h-4 shrink-0 text-[#8c6747]" />
                        <span>문자하기</span>
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyPhone(c.role, c.name, c.phone, phoneKey)
                        }
                        className={`${textScale.chip} rounded-xl bg-[#fffdf9] hover:bg-[#faf5ec] border border-[#c9b69c] text-[#2d221e] font-bold flex items-center justify-center gap-1.5 whitespace-nowrap ${
                          fontScale === 'xlarge' ? 'col-span-2' : ''
                        }`}
                      >
                        {copiedPhoneKey === phoneKey ? (
                          <>
                            <Check className="w-4 h-4 shrink-0 text-[#355e40]" />
                            <span className="text-[#355e40]">복사됨</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 shrink-0 text-[#8c6747]" />
                            <span>
                              {fontScale === 'xlarge' ? '전화번호 복사하기' : '번호복사'}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. High-Contrast Wedding Date & Large Calendar */}
      <section
        id="parents-ceremony"
        className="scroll-mt-32 bg-[#fffdf9] border border-[#dfd2be] rounded-3xl p-6 sm:p-8 shadow-[0_12px_32px_-14px_rgba(45,34,30,0.1)] space-y-6 text-center"
      >
        <div className="border-b border-[#efe6d8] pb-4">
          <h2 className={`${textScale.heading} font-bold text-[#2d221e]`}>예식 일시 안내</h2>
          <p className={`${textScale.nameLarge} font-bold text-[#b35c66] mt-2 tabular-nums`}>
            {config.wedding.dateDisplay} {config.wedding.timeDisplay}
          </p>
        </div>

        {/* High-Visibility Calendar */}
        <div className="py-5 px-4 bg-[#faf5ec] rounded-2xl border border-[#dfd2be] max-w-md mx-auto font-sans">
          <div className={`${textScale.nameLarge} font-bold text-[#2d221e] mb-4 tabular-nums`}>
            {year}년 {month}월
          </div>

          <div className={`grid grid-cols-7 text-center ${textScale.calHead} font-bold mb-3`}>
            {['일', '월', '화', '수', '목', '금', '토'].map((d, idx) => (
              <div
                key={d}
                className={
                  idx === 0
                    ? 'text-[#c04854]'
                    : idx === 6
                    ? 'text-[#3d6b99]'
                    : 'text-[#56463f]'
                }
              >
                {d}
              </div>
            ))}
          </div>

          <div className={`grid grid-cols-7 gap-y-2.5 text-center ${textScale.calDay} font-bold tabular-nums`}>
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className={textScale.calCell} />;
              }
              const isWeddingDay = day === weddingDay;
              const dayOfWeekIdx = idx % 7;

              return (
                <div key={day} className={`${textScale.calCell} flex items-center justify-center`}>
                  <span
                    className={`${textScale.calCircle} rounded-full flex items-center justify-center ${
                      isWeddingDay
                        ? 'bg-[#b35c66] text-white font-extrabold ring-4 ring-[#f2cbd0]'
                        : dayOfWeekIdx === 0
                        ? 'text-[#c04854]'
                        : dayOfWeekIdx === 6
                        ? 'text-[#3d6b99]'
                        : 'text-[#2d221e]'
                    }`}
                  >
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`${textScale.body} bg-[#faf5ec] border border-[#dfd2be] rounded-2xl py-3.5 px-4 font-sans font-bold text-[#2d221e]`}>
          <Calendar className="w-5 h-5 inline-block mr-1.5 text-[#b35c66] -mt-0.5" />
          {weddingDayDiff === 0 ? (
            <span className="text-[#b35c66]">오늘이 바로 두 사람의 결혼식 날입니다 💍</span>
          ) : weddingDayDiff < 0 ? (
            <span>
              함께 축복해 주셔서 감사합니다{' '}
              <span className="text-[#b35c66] tabular-nums">
                (결혼 +{Math.abs(weddingDayDiff)}일째)
              </span>{' '}
              💐
            </span>
          ) : (
            <span>
              예식일까지 <span className="text-[#b35c66] tabular-nums">{weddingDayDiff}일</span> 남았습니다.
            </span>
          )}
        </div>

        {/* Senior-Friendly Calendar Save Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-sans">
          <button
            type="button"
            onClick={() => openGoogleCalendar(config, primary)}
            className={`${textScale.btn} rounded-2xl bg-[#2d221e] hover:bg-[#1e1613] text-[#fffdf9] font-bold flex items-center justify-center gap-2`}
          >
            <Calendar className="w-5 h-5 text-[#e6d5b8] shrink-0" />
            <span>구글 캘린더에 저장</span>
          </button>
          <button
            type="button"
            onClick={() => downloadWeddingIcs(config, primary)}
            className={`${textScale.btn} rounded-2xl bg-[#faf5ec] hover:bg-[#f0e5d4] border border-[#c9b69c] text-[#2d221e] font-bold flex items-center justify-center gap-2`}
          >
            <Download className="w-5 h-5 text-[#b35c66] shrink-0" />
            <span>휴대폰 일정(.ics) 저장</span>
          </button>
        </div>
      </section>

      {/* 5. Location, Map & Large Navigation / Transport Guide */}
      <section
        id="parents-location"
        className="scroll-mt-32 bg-[#fffdf9] border border-[#dfd2be] rounded-3xl p-6 sm:p-8 shadow-[0_12px_32px_-14px_rgba(45,34,30,0.1)] space-y-6 font-sans"
      >
        <div className="text-center border-b border-[#efe6d8] pb-5">
          <h2 className={`${textScale.heading} font-serif font-bold text-[#2d221e]`}>
            오시는 길
          </h2>
          <div className={`${textScale.nameLarge} font-bold text-[#2d221e] mt-3 flex items-center justify-center gap-1.5`}>
            <MapPin className="w-6 h-6 text-[#b35c66] shrink-0" />
            <span>{config.wedding.venueName}</span>
          </div>
          <p className={`${textScale.body} font-bold text-[#b35c66] mt-1`}>
            {config.wedding.hallName}
          </p>

          <div className="mt-4 bg-[#faf5ec] border border-[#dfd2be] rounded-2xl p-4 text-left space-y-1.5">
            <div className={`${textScale.body} font-bold text-[#2d221e] break-keep`}>
              도로명 : {config.wedding.addressRoad}
            </div>
            <div className={`${textScale.sub} text-[#56463f] break-keep`}>
              지번 : {config.wedding.addressJibun}
            </div>
            <div className={`${textScale.sub} text-[#56463f] tabular-nums`}>
              예식장 전화 : {config.wedding.tel}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
            <button
              type="button"
              onClick={handleCopyAddress}
              className={`${textScale.btn} rounded-2xl bg-[#2d221e] hover:bg-[#1e1613] text-[#fffdf9] font-bold flex items-center justify-center gap-2`}
            >
              {copiedAddress ? (
                <>
                  <Check className="w-5 h-5 text-[#93c9a2]" />
                  <span>주소가 복사되었습니다</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 text-[#e6d5b8]" />
                  <span>예식장 주소 복사하기</span>
                </>
              )}
            </button>

            <a
              href={`tel:${cleanPhoneForHref(config.wedding.tel)}`}
              className={`${textScale.btn} rounded-2xl bg-[#faf5ec] hover:bg-[#f0e5d4] border border-[#c9b69c] text-[#2d221e] font-bold flex items-center justify-center gap-2`}
            >
              <Phone className="w-5 h-5 text-[#8c6747]" />
              <span>예식장 전화걸기</span>
            </a>
          </div>

          <button
            type="button"
            onClick={() => setShowTaxiCard(true)}
            className={`w-full mt-2.5 ${textScale.btn} rounded-2xl bg-[#fef3c7] hover:bg-[#fde68a] border-2 border-[#d97706] text-[#2d221e] font-extrabold flex items-center justify-center gap-2 shadow-sm transition-colors`}
          >
            <span aria-hidden="true">🚕</span>
            <span>택시 기사님께 보여드리기 (큰 화면)</span>
          </button>
        </div>

        {/* Interactive Map Preview (Scroll-Safe Toggle) & Large 1-Tap Navigation Buttons */}
        <div className="space-y-3">
          {hasValidCoords && (
            <div
              className={`relative w-full aspect-[16/9] rounded-2xl overflow-hidden border-2 bg-[#e9f0e8] transition-colors ${
                mapInteractive ? 'border-[#b35c66]' : 'border-[#dfd2be]'
              }`}
            >
              <iframe
                title={`${config.wedding.venueName} 약도`}
                src={getOsmEmbedUrl(config.wedding)}
                loading="lazy"
                className={`w-full h-full border-0 ${
                  mapInteractive ? 'pointer-events-auto' : 'pointer-events-none'
                }`}
              />
              {!mapInteractive && (
                <button
                  type="button"
                  onClick={() => setMapInteractive(true)}
                  aria-label="지도 확대 및 이동 활성화"
                  className="absolute inset-0 bg-transparent cursor-pointer"
                />
              )}
              <div className="pointer-events-none absolute top-2.5 left-1/2 -translate-x-1/2 bg-[#fffdf9]/95 text-[#2d221e] border border-[#b35c66] px-3.5 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm whitespace-nowrap">
                📍 {config.wedding.venueName} ({config.wedding.hallName})
              </div>
              <button
                type="button"
                onClick={() => setMapInteractive((prev) => !prev)}
                className={`absolute bottom-2.5 right-2.5 z-10 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-md border flex items-center gap-1.5 backdrop-blur-sm transition-colors ${
                  mapInteractive
                    ? 'bg-[#2d221e]/95 text-[#fffdf9] border-[#d4b48c]'
                    : 'bg-[#fffdf9]/95 text-[#2d221e] border-[#c9b69c] hover:bg-[#faf5ec]'
                }`}
              >
                {mapInteractive ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-[#f0d29c]" />
                    <span>스크롤 고정</span>
                  </>
                ) : (
                  <>
                    <Hand className="w-3.5 h-3.5 text-[#b35c66]" />
                    <span>지도 움직이기</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div className={`${textScale.sub} font-bold text-[#4a3a33] text-center`}>
            아래 버튼을 누르시면 길찾기 앱으로 바로 안내됩니다
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <a
              href={kakaoNavUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${textScale.btn} rounded-2xl bg-[#fee500] text-[#191919] border border-[#dfca00] font-bold flex items-center justify-center gap-2 shadow-sm`}
            >
              <Navigation className="w-5 h-5 shrink-0" />
              <span>카카오맵 길찾기</span>
            </a>
            <a
              href={naverNavUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOpenNaver}
              className={`${textScale.btn} rounded-2xl bg-[#03c75a] text-white border border-[#02b04f] font-bold flex items-center justify-center gap-2 shadow-sm`}
            >
              <Navigation className="w-5 h-5 shrink-0" />
              <span>네이버 지도 보기</span>
            </a>
            <a
              href={tmapDeepLink}
              onClick={handleOpenTmap}
              className={`${textScale.btn} rounded-2xl bg-[#2d221e] text-white border border-[#1d1513] font-bold flex items-center justify-center gap-2 shadow-sm`}
            >
              <Navigation className="w-5 h-5 shrink-0" />
              <span>티맵(T map) 내비</span>
            </a>
          </div>
        </div>

        {/* Large Transport Details */}
        <div className="space-y-4 pt-2">
          <div className="bg-[#faf5ec] border border-[#dfd2be] rounded-2xl p-5 space-y-2.5">
            <div className={`${textScale.nameLarge} font-bold text-[#355e40] flex items-center gap-2`}>
              <Train className="w-5 h-5 shrink-0" />
              <span>
                {/셔틀/.test(config.wedding.shuttleGuide || '')
                  ? '지하철 및 셔틀버스 안내'
                  : '지하철 및 도보 안내'}
              </span>
            </div>
            <ul className={`${textScale.body} space-y-2 text-[#2d221e] break-keep`}>
              {config.wedding.subwayGuide.map((line, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-bold text-[#8c6747]">•</span>
                  <span>{line}</span>
                </li>
              ))}
              {config.wedding.shuttleGuide && (
                <li className="flex items-start gap-2 font-bold text-[#b35c66] pt-1">
                  <span>•</span>
                  <span>{config.wedding.shuttleGuide}</span>
                </li>
              )}
            </ul>
          </div>

          <div className="bg-[#faf5ec] border border-[#dfd2be] rounded-2xl p-5 space-y-2.5">
            <div className={`${textScale.nameLarge} font-bold text-[#2d221e] flex items-center gap-2`}>
              <Bus className="w-5 h-5 text-[#8c6747] shrink-0" />
              <span>버스 이용 안내</span>
            </div>
            <ul className={`${textScale.body} space-y-2 text-[#2d221e] break-keep`}>
              {config.wedding.busGuide.map((line, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-bold text-[#8c6747]">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#faf5ec] border border-[#dfd2be] rounded-2xl p-5 space-y-2.5">
            <div className={`${textScale.nameLarge} font-bold text-[#2d221e] flex items-center gap-2`}>
              <Car className="w-5 h-5 text-[#8c6747] shrink-0" />
              <span>자가용 및 주차 안내</span>
            </div>
            <ul className={`${textScale.body} space-y-2 text-[#2d221e] break-keep`}>
              {config.wedding.parkingGuide.map((line, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-bold text-[#8c6747]">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 6. Large-Print Bank Accounts (마음 전하실 곳) */}
      <section
        id="parents-gift"
        className="scroll-mt-32 bg-[#fffdf9] border border-[#dfd2be] rounded-3xl p-6 sm:p-8 shadow-[0_12px_32px_-14px_rgba(45,34,30,0.1)] space-y-6 font-sans"
      >
        <div className="text-center border-b border-[#efe6d8] pb-4">
          <h2 className={`${textScale.heading} font-serif font-bold text-[#2d221e] flex items-center justify-center gap-2`}>
            <Heart className="w-6 h-6 text-[#b35c66]" />
            <span>마음 전하실 곳</span>
          </h2>
          <p className={`${textScale.sub} text-[#56463f] mt-2 break-keep`}>
            참석이 어려우신 분들을 위해 계좌번호를 안내해 드립니다.
            <br />
            <strong>[계좌번호 복사]</strong> 버튼을 누르시면 번호가 바로 복사됩니다.
          </p>
        </div>

        {/* Groom / Bride Account Side Tabs */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setActiveAccountSide('groom')}
            style={{ order: groomOrder }}
            className={`${textScale.btn} rounded-2xl font-bold border transition-colors ${
              activeAccountSide === 'groom'
                ? 'bg-[#2d221e] text-white border-[#2d221e]'
                : 'bg-[#faf5ec] text-[#56463f] border-[#dfd2be]'
            }`}
          >
            신랑측 계좌 보기
          </button>
          <button
            type="button"
            onClick={() => setActiveAccountSide('bride')}
            style={{ order: brideOrder }}
            className={`${textScale.btn} rounded-2xl font-bold border transition-colors ${
              activeAccountSide === 'bride'
                ? 'bg-[#b35c66] text-white border-[#b35c66]'
                : 'bg-[#faf5ec] text-[#56463f] border-[#dfd2be]'
            }`}
          >
            신부측 계좌 보기
          </button>
        </div>

        {/* Large Account Cards */}
        <div className="space-y-3.5">
          {activeAccounts.map((acc, idx) => {
            const key = `${activeAccountSide}-${idx}`;
            const isCopied = copiedKey === key;
            const hasNumber = Boolean(acc.accountNumber?.trim());

            return (
              <div
                key={key}
                className="bg-[#faf5ec] border-2 border-[#dfd2be] rounded-2xl p-5 space-y-3.5"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span
                    className={`px-3 py-1 rounded-full ${textScale.label} font-bold ${
                      activeAccountSide === 'groom'
                        ? 'bg-[#e6ebe8] text-[#2f453c]'
                        : 'bg-[#f9ebea] text-[#9e4751]'
                    }`}
                  >
                    {acc.role}
                  </span>
                  <span className={`${textScale.nameLarge} font-bold text-[#2d221e]`}>
                    예금주 : {acc.name}
                  </span>
                </div>

                <div className="bg-[#fffdf9] border border-[#e5d8c5] rounded-xl p-3.5 text-center">
                  <div className={`${textScale.sub} font-semibold text-[#56463f]`}>
                    {acc.bank}
                  </div>
                  <div className={`${textScale.nameLarge} font-extrabold text-[#2d221e] tabular-nums tracking-wider mt-0.5 select-all`}>
                    {hasNumber ? acc.accountNumber : '계좌 정보 불러오는 중'}
                  </div>
                </div>

                {hasNumber && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleCopyAccount(acc, key)}
                      className={`w-full ${textScale.btn} rounded-xl font-bold border flex items-center justify-center gap-2 transition-colors ${
                        isCopied
                          ? 'bg-[#355e40] text-white border-[#2a4c33]'
                          : 'bg-[#2d221e] hover:bg-[#1e1613] text-white border-[#2d221e]'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-5 h-5 shrink-0" />
                          <span>복사 완료 ({acc.bank} {acc.name})</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5 text-[#e6d5b8] shrink-0" />
                          <span>계좌번호 복사하기</span>
                        </>
                      )}
                    </button>

                    {isCopied && (
                      <div
                        role="status"
                        className={`rounded-xl bg-[#eef7f0] border border-[#9ac4a3] px-3.5 py-2.5 ${textScale.label} font-semibold text-[#22472f] break-keep animate-fadeIn`}
                      >
                        💡 쓰시는 은행 앱을 열고, 계좌번호 입력칸을 길게 눌러 <strong>[붙여넣기]</strong> 하세요.
                      </div>
                    )}

                    <div className={`grid ${acc.kakaoPayUrl ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                      <button
                        type="button"
                        onClick={() => handleOpenTossAccount(acc, key)}
                        className={`w-full ${textScale.btn} rounded-xl font-bold border bg-[#eef4ff] hover:bg-[#dfeaff] text-[#1b64da] border-[#bdd4ff] flex items-center justify-center gap-2 transition-colors`}
                      >
                        <Send className="w-4 h-4 shrink-0" />
                        <span>토스 송금</span>
                      </button>

                      {acc.kakaoPayUrl && (
                        <a
                          href={acc.kakaoPayUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full ${textScale.btn} rounded-xl font-bold border bg-[#fee500] hover:bg-[#f5dc00] text-[#191919] border-[#dfca00] flex items-center justify-center gap-2 transition-colors`}
                        >
                          <ExternalLink className="w-4 h-4 shrink-0" />
                          <span>카카오페이</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Easy-to-Browse Wedding Photo Album (Compact 2-Col Grid + Expand Toggle) */}
      <section
        id="parents-gallery"
        className="scroll-mt-32 bg-[#fffdf9] border border-[#dfd2be] rounded-3xl p-6 sm:p-8 shadow-[0_12px_32px_-14px_rgba(45,34,30,0.1)] space-y-5"
      >
        <div className="text-center border-b border-[#efe6d8] pb-4">
          <h2 className={`${textScale.heading} font-bold text-[#2d221e]`}>
            신랑 · 신부 웨딩 사진
          </h2>
          <p className={`${textScale.sub} text-[#69584f] mt-1 font-sans`}>
            사진을 누르시면 화면 가득 크게 보실 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          {visibleGallery.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLightboxIdx(idx)}
              className="group text-left bg-[#faf5ec] border border-[#dfd2be] rounded-2xl overflow-hidden shadow-sm flex flex-col"
            >
              <div className="relative aspect-[4/4.5] w-full overflow-hidden bg-[#efe6d8]">
                {!imgLoadedMap[item.imageUrl] && (
                  <div className="absolute inset-0 bg-[#efe6d8] animate-pulse" />
                )}
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  onLoad={() =>
                    setImgLoadedMap((prev) =>
                      prev[item.imageUrl] ? prev : { ...prev, [item.imageUrl]: true }
                    )
                  }
                  className={`w-full h-full object-cover group-hover:scale-[1.03] transition-all duration-300 ${
                    imgLoadedMap[item.imageUrl] ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </div>
              <div className="p-2.5 sm:p-3.5 font-sans">
                <div className={`font-bold text-[#2d221e] ${textScale.label} line-clamp-1`}>
                  {item.title}
                </div>
                <div className={`${textScale.caption} text-[#69584f] mt-0.5 line-clamp-2`}>
                  {item.description}
                </div>
              </div>
            </button>
          ))}
        </div>

        {hiddenPhotoCount > 0 && (
          <div className="pt-1 font-sans">
            <button
              type="button"
              onClick={() => setShowAllPhotos((prev) => !prev)}
              aria-expanded={showAllPhotos}
              className={`w-full ${textScale.btn} rounded-2xl border-2 font-bold transition-colors ${
                showAllPhotos
                  ? 'bg-[#fffdf9] hover:bg-[#faf5ec] border-[#dfd2be] text-[#56463f]'
                  : 'bg-[#faf5ec] hover:bg-[#f0e5d4] border-[#c9b69c] text-[#2d221e]'
              }`}
            >
              {showAllPhotos
                ? '대표 사진 4장만 간략히 보기 ▲'
                : `웨딩 사진 모두 보기 (+${hiddenPhotoCount}장 더 보기)`}
            </button>
          </div>
        )}
      </section>

      {/* 8. Simple Senior-Friendly RSVP & Guestbook (D1 Synced) */}
      <section
        id="parents-rsvp"
        className="scroll-mt-32 bg-[#fffdf9] border border-[#dfd2be] rounded-3xl p-6 sm:p-8 shadow-[0_12px_32px_-14px_rgba(45,34,30,0.1)] space-y-6 font-sans"
      >
        <div className="text-center border-b border-[#efe6d8] pb-4">
          <h2 className={`${textScale.heading} font-serif font-bold text-[#2d221e]`}>
            참석 의사 전달 및 축하 말씀
          </h2>
          <p className={`${textScale.sub} text-[#56463f] mt-1 break-keep`}>
            정성스러운 식사 대접을 위해 참석 여부나 축하의 말씀을 남겨주시면 감사하겠습니다.
          </p>
        </div>

        {/* My Registered RSVP Summary Card (for Elders' Peace of Mind) */}
        {myLatestEntry && (
          <div className="bg-[#edf5ef] border-2 border-[#a3bfa8] rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#2d6340] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className={`${textScale.sub} font-bold text-[#22472f]`}>
                등록하신 참석 의사 확인 · {myLatestEntry.name}님
              </div>
              <div className="text-sm text-[#355e40] font-semibold">
                {myLatestEntry.side === 'bride'
                  ? '신부측'
                  : myLatestEntry.side === 'groom'
                  ? '신랑측'
                  : '하객'}{' '}
                ·{' '}
                {myLatestEntry.attendance === 'attend'
                  ? `참석 (${myLatestEntry.companions || 1}명 · ${
                      myLatestEntry.meal === 'yes'
                        ? '식사 예정'
                        : myLatestEntry.meal === 'no'
                        ? '식사 안 함'
                        : '식사 미정'
                    })`
                  : myLatestEntry.attendance === 'unable'
                  ? '마음만 전함'
                  : '참석 미정'}
              </div>
            </div>
          </div>
        )}

        <form noValidate onSubmit={handleSubmitGuestbook} className="space-y-4 bg-[#faf5ec] p-5 rounded-2xl border border-[#dfd2be]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="parents-guest-name"
                className={`block ${textScale.sub} font-bold text-[#2d221e] mb-1.5`}
              >
                성함 (또는 직함/모임명) *
              </label>
              <input
                id="parents-guest-name"
                ref={guestNameInputRef}
                type="text"
                value={guestName}
                onChange={(e) => {
                  setGuestName(e.target.value);
                  if (e.target.value.trim()) setNameError(false);
                }}
                placeholder="예: 홍길동 (신랑 아버지 친구)"
                aria-invalid={nameError}
                className={`w-full bg-[#fffdf9] border-2 outline-none rounded-xl px-4 py-3 ${textScale.body} text-[#2d221e] ${
                  nameError
                    ? 'border-[#b35c66] bg-[#fff5f6]'
                    : 'border-[#c9b69c] focus:border-[#b35c66]'
                }`}
              />
              {nameError && (
                <div role="alert" className={`${textScale.label} font-bold text-[#b35c66] mt-1.5`}>
                  ⚠️ 성함을 입력해 주세요.
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="parents-guest-phone"
                className={`block ${textScale.sub} font-bold text-[#2d221e] mb-1.5`}
              >
                연락처 (선택 · 혼주에게만 전달)
              </label>
              <input
                id="parents-guest-phone"
                type="tel"
                inputMode="numeric"
                maxLength={13}
                value={guestPhone}
                onChange={(e) => {
                  const formatted = formatKoreanPhoneInput(e.target.value);
                  setGuestPhone(formatted);
                  if (!formatted.trim()) setPrivacyError(false);
                }}
                placeholder="010-1234-5678 (비공개)"
                className={`w-full bg-[#fffdf9] border-2 border-[#c9b69c] focus:border-[#b35c66] outline-none rounded-xl px-4 py-3 ${textScale.body} text-[#2d221e]`}
              />
            </div>
          </div>

          {guestPhone.trim().length > 0 && (
            <div
              className={`p-4 rounded-xl border-2 space-y-1.5 ${
                privacyError
                  ? 'bg-[#fff2f3] border-[#b35c66] text-[#8f3540]'
                  : 'bg-[#fffdf9] border-[#c9b69c] text-[#2d221e]'
              }`}
            >
              <label className={`flex items-start gap-2.5 cursor-pointer font-bold ${textScale.sub}`}>
                <input
                  type="checkbox"
                  checked={privacyAgreed}
                  onChange={(e) => {
                    setPrivacyAgreed(e.target.checked);
                    if (e.target.checked) setPrivacyError(false);
                  }}
                  className="mt-1.5 w-5 h-5 accent-[#b35c66] shrink-0"
                />
                <span className="flex-1 break-keep">
                  <ShieldCheck className="w-4 h-4 inline-block mr-1 text-[#355e40] align-text-bottom" />
                  [필수] 예식 참석 확인을 위한 연락처 수집·이용에 동의합니다 (예식 종료 후 30일 이내 파기)
                </span>
              </label>
              {privacyError && (
                <div role="alert" className={`${textScale.label} font-bold text-[#b35c66] pl-7`}>
                  ⚠️ 연락처를 함께 전달하시려면 위 동의란에 체크해 주세요.
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className={`block ${textScale.sub} font-bold text-[#2d221e] mb-1.5`}>
                어느 측 하객이신가요?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGuestSide('groom')}
                  style={{ order: groomOrder }}
                  className={`${textScale.chip} rounded-xl font-bold border-2 transition-colors ${
                    guestSide === 'groom'
                      ? 'bg-[#2d221e] text-white border-[#2d221e] shadow-sm'
                      : 'bg-[#fffdf9] text-[#56463f] border-[#c9b69c]'
                  }`}
                >
                  신랑측
                </button>
                <button
                  type="button"
                  onClick={() => setGuestSide('bride')}
                  style={{ order: brideOrder }}
                  className={`${textScale.chip} rounded-xl font-bold border-2 transition-colors ${
                    guestSide === 'bride'
                      ? 'bg-[#b35c66] text-white border-[#b35c66] shadow-sm'
                      : 'bg-[#fffdf9] text-[#56463f] border-[#c9b69c]'
                  }`}
                >
                  신부측
                </button>
              </div>
            </div>

            <div>
              <label className={`block ${textScale.sub} font-bold text-[#2d221e] mb-1.5`}>
                참석 여부
              </label>
              <div
                className={`grid gap-2 ${
                  fontScale === 'xlarge' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-3'
                }`}
              >
                {(
                  [
                    { id: 'attend', label: '참석합니다' },
                    { id: 'maybe', label: '미정입니다' },
                    { id: 'unable', label: '마음만 전함' },
                  ] as const
                ).map((opt) => {
                  const active = attendance === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAttendance(opt.id)}
                      className={`${textScale.chip} rounded-xl font-bold border-2 transition-colors ${
                        active
                          ? opt.id === 'attend'
                            ? 'bg-[#b35c66] text-white border-[#b35c66] shadow-sm'
                            : 'bg-[#2d221e] text-white border-[#2d221e] shadow-sm'
                          : 'bg-[#fffdf9] text-[#56463f] border-[#c9b69c]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {attendance !== 'unable' && (
            <div className="space-y-4">
              <div>
                <label className={`block ${textScale.sub} font-bold text-[#2d221e] mb-1.5`}>
                  방문 인원 (본인 포함)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((n) => {
                    const active = companions === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setCompanions(n)}
                        className={`${textScale.chip} rounded-xl font-bold border-2 tabular-nums transition-colors ${
                          active
                            ? 'bg-[#2d221e] text-white border-[#2d221e] shadow-sm'
                            : 'bg-[#fffdf9] text-[#56463f] border-[#c9b69c]'
                        }`}
                      >
                        {n}명
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={`block ${textScale.sub} font-bold text-[#2d221e] mb-1.5`}>
                  식사 여부
                </label>
                <div
                  className={`grid gap-2 ${
                    fontScale === 'xlarge' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-3'
                  }`}
                >
                  {(
                    [
                      { id: 'yes', label: '식사 예정' },
                      { id: 'no', label: '식사 안 함' },
                      { id: 'undecided', label: '미정' },
                    ] as const
                  ).map((opt) => {
                    const active = meal === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setMeal(opt.id)}
                        className={`${textScale.chip} rounded-xl font-bold border-2 transition-colors ${
                          active
                            ? 'bg-[#2d221e] text-white border-[#2d221e] shadow-sm'
                            : 'bg-[#fffdf9] text-[#56463f] border-[#c9b69c]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label
                htmlFor="parents-guest-message"
                className={`block ${textScale.sub} font-bold text-[#2d221e]`}
              >
                축하 말씀 <span className="font-normal text-[#69584f]">(선택 · 비워두셔도 등록됩니다)</span>
              </label>
              <span className={`${textScale.caption} text-[#69584f] tabular-nums shrink-0`}>
                ({message.length}/120)
              </span>
            </div>

            {/* Senior-Friendly 1-Tap Quick Blessing Chips */}
            <div className="flex flex-wrap gap-2 mb-2.5">
              {PARENTS_QUICK_BLESSING_CHIPS.map((chip) => {
                const selected = message === chip;
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setMessage(chip)}
                    className={`px-3.5 py-2 rounded-xl ${textScale.label} font-semibold border text-left transition-colors break-keep ${
                      selected
                        ? 'bg-[#fcf0f1] border-[#b35c66] text-[#9e3f4a] font-bold'
                        : 'bg-[#fffdf9] hover:bg-[#f5efe6] border-[#d8c7b0] text-[#4a3a33]'
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>

            <textarea
              id="parents-guest-message"
              rows={3}
              maxLength={120}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="따뜻한 말씀을 남겨주시거나, 비워두고 바로 등록하셔도 됩니다."
              className={`w-full bg-[#fffdf9] border-2 border-[#c9b69c] focus:border-[#b35c66] outline-none rounded-xl px-4 py-3 ${textScale.body} text-[#2d221e]`}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full ${textScale.btn} rounded-2xl bg-[#b35c66] hover:bg-[#9f4c56] disabled:opacity-65 text-white font-bold shadow-sm`}
          >
            {isSubmitting ? '전달하는 중...' : '참석 의사 및 축하 글 등록하기'}
          </button>

          {submittedBanner && (
            <div className={`p-3.5 rounded-xl bg-[#eef7f0] border border-[#a9d1b2] text-[#285233] font-bold text-center ${textScale.body}`}>
              ✓ 소중한 축하 말씀과 참석 의사가 전달되었습니다. 감사합니다!
            </div>
          )}
        </form>

        {/* Recent Guestbook Messages (No Scroll Trap + Side Filter + Load More) */}
        {(() => {
          const filteredParentsGuestbook =
            guestbookFilter === 'all'
              ? guestbook
              : guestbook.filter((item) => item.side === guestbookFilter);
          const visibleParentsGuestbook = filteredParentsGuestbook.slice(
            0,
            visibleGuestbookCount
          );
          const remainingParentsCount = Math.max(
            0,
            filteredParentsGuestbook.length - visibleGuestbookCount
          );
          const groomTotal = guestbook.filter((item) => item.side === 'groom').length;
          const brideTotal = guestbook.filter((item) => item.side === 'bride').length;
          const filterTabs =
            primary === 'bride'
              ? [
                  { id: 'all' as const, label: `전체 (${guestbook.length})` },
                  { id: 'bride' as const, label: `신부측 (${brideTotal})` },
                  { id: 'groom' as const, label: `신랑측 (${groomTotal})` },
                ]
              : [
                  { id: 'all' as const, label: `전체 (${guestbook.length})` },
                  { id: 'groom' as const, label: `신랑측 (${groomTotal})` },
                  { id: 'bride' as const, label: `신부측 (${brideTotal})` },
                ];

          return (
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className={`${textScale.sub} font-bold text-[#4a3a33]`}>
                  남겨주신 축하 말씀 ({guestbook.length}건)
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {filterTabs.map((tab) => {
                    const active = guestbookFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setGuestbookFilter(tab.id);
                          setVisibleGuestbookCount(5);
                        }}
                        className={`px-3.5 py-1.5 rounded-full ${textScale.label} font-bold border transition-colors ${
                          active
                            ? tab.id === 'bride'
                              ? 'bg-[#b35c66] text-white border-[#b35c66]'
                              : 'bg-[#2d221e] text-white border-[#2d221e]'
                            : 'bg-[#faf5ec] text-[#56463f] border-[#d8c7b0] hover:bg-[#f0e5d4]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                {visibleParentsGuestbook.length === 0 ? (
                  <div className={`bg-[#faf5ec] border border-[#dfd2be] rounded-2xl p-5 text-center ${textScale.sub} text-[#69584f]`}>
                    아직 등록된 축하 말씀이 없습니다. 첫 번째 축복의 말씀을 남겨주세요.
                  </div>
                ) : (
                  visibleParentsGuestbook.map((item) => {
                    const isMine = canEditOwnGuestbookEntry(item.id);
                    return (
                      <div
                        key={item.id}
                        className="bg-[#faf5ec] border border-[#dfd2be] rounded-2xl p-4 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className={`${textScale.body} text-[#2d221e]`}>
                              {item.name}
                            </strong>
                            <span className={`${textScale.caption} px-2.5 py-0.5 rounded-full bg-[#fffdf9] border border-[#dfd2be] text-[#69584f] font-semibold`}>
                              {item.side === 'bride'
                                ? '신부측'
                                : item.side === 'groom'
                                ? '신랑측'
                                : '하객'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`${textScale.caption} text-[#7d6e65]`}>{item.createdAt}</span>
                            {isMine && (
                              <button
                                type="button"
                                disabled={deletingId === item.id}
                                onClick={() => handleDeleteEntry(item.id)}
                                className={`px-2.5 py-1 rounded-lg bg-[#fcf0f1] border border-[#e2a3a9] text-[#c04854] ${textScale.caption} font-bold flex items-center gap-1`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>삭제</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <p className={`${textScale.body} text-[#2d221e] break-keep`}>
                          {fillCoupleText(item.message, config)}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {filteredParentsGuestbook.length > 5 && (
                <div className="pt-1">
                  {remainingParentsCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => setVisibleGuestbookCount((prev) => prev + 5)}
                      className={`w-full ${textScale.btn} rounded-2xl bg-[#faf5ec] hover:bg-[#f0e5d4] border-2 border-[#c9b69c] text-[#2d221e] font-bold`}
                    >
                      축하 말씀 더보기 (+{Math.min(5, remainingParentsCount)}건 · 총 {remainingParentsCount}건 남음)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setVisibleGuestbookCount(5)}
                      className="w-full py-3 rounded-2xl bg-[#fffdf9] hover:bg-[#faf5ec] border border-[#dfd2be] text-[#69584f] text-sm font-bold"
                    >
                      최근 5건만 간략히 보기 ▲
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </section>

      {/* 9. Share Parents Invitation Link Box */}
      <section className="bg-[#fffdf9] border border-[#dfd2be] rounded-3xl p-6 shadow-[0_12px_32px_-14px_rgba(45,34,30,0.1)] space-y-3.5 font-sans text-center">
        <div className={`${textScale.body} font-bold text-[#2d221e]`}>
          지인분들께 청첩장 전달하기
        </div>

        <button
          type="button"
          onClick={handleShareKakaoParents}
          className={`w-full ${textScale.btn} rounded-2xl bg-[#fee500] hover:bg-[#f5dc00] text-[#191919] border border-[#dfca00] font-bold flex items-center justify-center gap-2 shadow-sm`}
        >
          {copiedShare === 'kakao' ? (
            <>
              <Check className="w-5 h-5 text-[#2d5a36]" />
              <span>카카오톡에 붙여넣을 초대 문구가 복사되었습니다</span>
            </>
          ) : (
            <>
              <MessageSquare className="w-5 h-5" />
              <span>카카오톡으로 청첩장 보내기</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleShareParentsPage(undefined, 'main')}
          className={`w-full ${textScale.btn} rounded-2xl bg-[#2d221e] hover:bg-[#1e1613] text-white font-bold flex items-center justify-center gap-2`}
        >
          {copiedShare === 'main' ? (
            <>
              <Check className="w-5 h-5 text-[#93c9a2]" />
              <span>청첩장 주소가 복사되었습니다</span>
            </>
          ) : (
            <>
              <Share2 className="w-5 h-5 text-[#e6d5b8]" />
              <span>이 청첩장 공유 / 주소 복사하기</span>
            </>
          )}
        </button>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowSideShareLinks((prev) => !prev)}
            aria-expanded={showSideShareLinks}
            className="text-xs sm:text-sm font-bold text-[#69584f] hover:text-[#2d221e] underline underline-offset-4 py-1"
          >
            {showSideShareLinks
              ? '혼주별 전용 링크 접기 ▲'
              : '혼주별 전용 링크 복사 (신랑측 · 신부측) ▾'}
          </button>

          {showSideShareLinks && (
            <div className="grid grid-cols-2 gap-2 pt-2.5 animate-fadeIn">
              <button
                type="button"
                onClick={() => handleShareParentsPage('groom', 'groom')}
                style={{ order: groomOrder }}
                className="py-2.5 px-3 rounded-xl bg-[#faf5ec] hover:bg-[#f0e5d4] border border-[#d8c7b0] text-xs sm:text-sm font-bold text-[#3b2f2f]"
              >
                {copiedShare === 'groom'
                  ? '✓ 신랑측 혼주용 복사됨'
                  : '🤵 신랑측 혼주용 링크 복사'}
              </button>
              <button
                type="button"
                onClick={() => handleShareParentsPage('bride', 'bride')}
                style={{ order: brideOrder }}
                className="py-2.5 px-3 rounded-xl bg-[#faf5ec] hover:bg-[#f0e5d4] border border-[#d8c7b0] text-xs sm:text-sm font-bold text-[#b35c66]"
              >
                {copiedShare === 'bride'
                  ? '✓ 신부측 혼주용 복사됨'
                  : '👰 신부측 혼주용 링크 복사'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Fullscreen Photo Lightbox for Elders with Swipe & Keyboard Navigation */}
      {lightboxIdx !== null && config.gallery[lightboxIdx] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="웨딩 사진 크게 보기"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm overscroll-contain flex flex-col items-center justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] font-sans select-none"
          onClick={() => setLightboxIdx(null)}
          onTouchStart={handleLightboxTouchStart}
          onTouchEnd={handleLightboxTouchEnd}
        >
          <div
            className="relative max-w-lg w-full bg-[#fffdf9] rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 bg-[#2d221e] text-white flex items-center justify-between gap-2">
              <span className={`font-bold ${textScale.sub} truncate`}>
                {config.gallery[lightboxIdx].title} ({lightboxIdx + 1} /{' '}
                {config.gallery.length})
              </span>
              <button
                type="button"
                onClick={() => setLightboxIdx(null)}
                className={`px-3.5 py-1.5 rounded-lg bg-white/15 text-white ${textScale.label} font-bold flex items-center gap-1 shrink-0`}
              >
                <X className="w-4 h-4" /> 닫기
              </button>
            </div>

            <div className="bg-black flex items-center justify-center max-h-[70vh] min-h-[260px]">
              <img
                src={config.gallery[lightboxIdx].imageUrl}
                alt={config.gallery[lightboxIdx].title}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            <div className={`px-4 pt-2.5 pb-1 bg-[#fffdf9] text-center ${textScale.caption} text-[#7d6e65]`}>
              사진을 좌우로 밀거나 아래 버튼으로 넘겨 보실 수 있습니다
            </div>

            <div className="p-4 pt-2 bg-[#fffdf9] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  setLightboxIdx(
                    (lightboxIdx - 1 + config.gallery.length) % config.gallery.length
                  )
                }
                className={`px-4 py-3 rounded-xl bg-[#faf5ec] border border-[#d8c7b0] font-bold ${textScale.label} text-[#2d221e] flex items-center gap-1`}
              >
                <ChevronLeft className="w-4 h-4" /> 이전 사진
              </button>
              <button
                type="button"
                onClick={() =>
                  setLightboxIdx((lightboxIdx + 1) % config.gallery.length)
                }
                className={`px-4 py-3 rounded-xl bg-[#faf5ec] border border-[#d8c7b0] font-bold ${textScale.label} text-[#2d221e] flex items-center gap-1`}
              >
                다음 사진 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen High-Contrast Taxi Driver Destination Card for Elders */}
      {showTaxiCard && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="택시 기사님 목적지 안내"
          onClick={() => setShowTaxiCard(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm overscroll-contain flex items-center justify-center p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] font-sans"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white text-[#111111] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#d97706] animate-fadeIn"
          >
            <div className="bg-[#2d221e] text-white px-5 py-4 flex items-center justify-between gap-2">
              <div className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                <span aria-hidden="true">🚕</span>
                <span>기사님께 이 화면을 보여주세요</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTaxiCard(false)}
                aria-label="택시 안내 닫기"
                className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold flex items-center gap-1 shrink-0"
              >
                <X className="w-4 h-4" /> 닫기
              </button>
            </div>

            <div className="p-6 space-y-5 text-center">
              <div className="space-y-1.5">
                <div className="inline-block px-3.5 py-1 rounded-full bg-[#fef3c7] border border-[#f59e0b] text-[#92400e] text-sm font-extrabold">
                  목적지 (예식장)
                </div>
                <h3 className="text-[32px] sm:text-[38px] font-extrabold text-[#111111] leading-tight tracking-tight break-keep">
                  {config.wedding.venueName}
                </h3>
                <div className="text-[20px] sm:text-[24px] font-bold text-[#b35c66]">
                  {config.wedding.hallName}
                </div>
              </div>

              <div className="bg-[#f8f5ef] border-2 border-[#d4c4ac] rounded-2xl p-4 space-y-2 text-left">
                <div className="text-xs font-bold text-[#69584f]">도로명 주소</div>
                <div className="text-[22px] sm:text-[26px] font-extrabold text-[#111111] leading-snug break-keep">
                  {config.wedding.addressRoad}
                </div>
                {config.wedding.addressJibun && (
                  <div className="pt-2 border-t border-[#e5dac8] text-[16px] sm:text-[18px] font-semibold text-[#444444] break-keep">
                    지번 : {config.wedding.addressJibun}
                  </div>
                )}
              </div>

              {(config.wedding.subwayGuide[0] || config.wedding.shuttleGuide) && (
                <div className="bg-[#eef6f0] border-2 border-[#8cb596] rounded-2xl px-4 py-3 text-[17px] sm:text-[19px] font-bold text-[#1f472a] break-keep">
                  📍 {config.wedding.shuttleGuide || config.wedding.subwayGuide[0]}
                </div>
              )}

              {config.wedding.tel && (
                <div className="text-[17px] font-bold text-[#333333] tabular-nums">
                  예식장 전화 : {config.wedding.tel}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {config.wedding.tel && (
                  <a
                    href={`tel:${cleanPhoneForHref(config.wedding.tel)}`}
                    className="py-4 px-4 rounded-2xl bg-[#faf5ec] hover:bg-[#f0e5d4] border-2 border-[#c9b69c] text-[#2d221e] text-lg font-extrabold flex items-center justify-center gap-2"
                  >
                    <Phone className="w-5 h-5 text-[#8c6747]" />
                    <span>예식장 전화</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setShowTaxiCard(false)}
                  className={`py-4 px-4 rounded-2xl bg-[#2d221e] hover:bg-[#1e1613] text-white text-lg font-extrabold ${
                    config.wedding.tel ? '' : 'sm:col-span-2'
                  }`}
                >
                  큰 화면 닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Senior-Friendly Floating Quick-Font & Scroll-To-Top Stack */}
      {(isCompactTopBar || showScrollTop) && (
        <div
          style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
          className="fixed right-4 z-40 flex flex-col items-end gap-2 font-sans"
        >
          {isCompactTopBar && (
            <button
              type="button"
              onClick={handleCycleFontScale}
              aria-label="글씨 크기 변경"
              title="글씨 크기 바꾸기 (보통 → 크게 → 아주 크게)"
              className="px-3.5 py-2 rounded-full bg-[#fffdf9]/95 hover:bg-[#faf5ec] text-[#2d221e] border-2 border-[#c9b69c] shadow-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 backdrop-blur-sm transition-all active:scale-95"
            >
              <Type className="w-3.5 h-3.5 text-[#b35c66]" />
              <span>글씨: {fontScaleLabelMap[fontScale]}</span>
            </button>
          )}
          {showScrollTop && (
            <button
              type="button"
              onClick={() => {
                window.scrollTo({
                  top: 0,
                  behavior: prefersReducedMotion() ? 'auto' : 'smooth',
                });
              }}
              aria-label="맨 위로 이동"
              className="px-4 py-2.5 rounded-full bg-[#2d221e]/95 hover:bg-[#1e1613] text-[#fffdf9] border-2 border-[#d4b48c] shadow-lg text-sm font-bold flex items-center gap-1.5 backdrop-blur-sm transition-all active:scale-95"
            >
              <ArrowUp className="w-4 h-4 text-[#f0d29c]" />
              <span>맨 위로</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
