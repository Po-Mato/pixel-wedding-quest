import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Phone,
  MessageSquare,
  MapPin,
  Copy,
  Check,
  Calendar,
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
} from 'lucide-react';
import { WeddingConfig, GuestbookEntry, BankAccount } from '../data/weddingConfig';
import {
  canEditOwnGuestbookEntry,
  deleteOwnGuestbookEntry,
} from '../utils/weddingCloudSync';
import { copyTextToClipboard } from '../utils/clipboard';
import { fillCoupleText } from '../utils/coupleText';

export type ParentsSideFilter = 'all' | 'groom' | 'bride';
type FontScaleMode = 'normal' | 'large' | 'xlarge';

interface ParentsWeddingViewProps {
  config: WeddingConfig;
  guestbook: GuestbookEntry[];
  initialSide?: ParentsSideFilter;
  onAddGuestbook: (entry: GuestbookEntry) => void;
  onDeleteGuestbook?: (id: string) => void;
}

export const ParentsWeddingView: React.FC<ParentsWeddingViewProps> = ({
  config,
  guestbook,
  initialSide = 'all',
  onAddGuestbook,
  onDeleteGuestbook,
}) => {
  const [fontScale, setFontScale] = useState<FontScaleMode>('large');
  const [activeAccountSide, setActiveAccountSide] = useState<'groom' | 'bride'>(
    initialSide === 'bride' ? 'bride' : 'groom'
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedShare, setCopiedShare] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // Simple Senior-Friendly RSVP + Guestbook Form State
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestSide, setGuestSide] = useState<'groom' | 'bride'>(
    initialSide === 'bride' ? 'bride' : 'groom'
  );
  const [attendance, setAttendance] = useState<'attend' | 'unable' | 'maybe'>('attend');
  const [companions, setCompanions] = useState<number>(1);
  const [meal, setMeal] = useState<'yes' | 'no' | 'undecided'>('yes');
  const [message, setMessage] = useState('');
  const [submittedBanner, setSubmittedBanner] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (initialSide === 'bride') {
      setActiveAccountSide('bride');
      setGuestSide('bride');
    } else if (initialSide === 'groom') {
      setActiveAccountSide('groom');
      setGuestSide('groom');
    }
  }, [initialSide]);

  // Dynamic font-size classes tailored for senior readability
  const textScale = {
    normal: {
      body: 'text-[16px] leading-[1.85]',
      sub: 'text-[14px] leading-[1.7]',
      heading: 'text-[22px] leading-[1.35]',
      heroTitle: 'text-[26px] sm:text-[30px] leading-[1.3]',
      nameLarge: 'text-[20px]',
      btn: 'text-[15px] py-3 px-4',
    },
    large: {
      body: 'text-[18px] leading-[1.9]',
      sub: 'text-[16px] leading-[1.75]',
      heading: 'text-[24px] leading-[1.35]',
      heroTitle: 'text-[28px] sm:text-[32px] leading-[1.3]',
      nameLarge: 'text-[22px]',
      btn: 'text-[17px] py-3.5 px-4',
    },
    xlarge: {
      body: 'text-[20px] leading-[1.95]',
      sub: 'text-[18px] leading-[1.8]',
      heading: 'text-[27px] leading-[1.35]',
      heroTitle: 'text-[31px] sm:text-[35px] leading-[1.3]',
      nameLarge: 'text-[24px]',
      btn: 'text-[19px] py-4 px-5',
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

  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (new Date(config.wedding.dateISO).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );

  const encodedVenue = encodeURIComponent(config.wedding.venueName);
  const encodedAddr = encodeURIComponent(config.wedding.addressRoad);
  const hasValidCoords =
    Number.isFinite(config.wedding.lat) &&
    Number.isFinite(config.wedding.lng) &&
    config.wedding.lat !== 0 &&
    config.wedding.lng !== 0;

  const kakaoNavUrl = hasValidCoords
    ? `https://map.kakao.com/link/to/${encodedVenue},${config.wedding.lat},${config.wedding.lng}`
    : `https://map.kakao.com/link/search/${encodedAddr}`;

  const tmapDeepLink = hasValidCoords
    ? `tmap://route?goalname=${encodedVenue}&goalx=${config.wedding.lng}&goaly=${config.wedding.lat}`
    : `tmap://search?name=${encodedVenue}`;

  const handleOpenTmap = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) {
      e.preventDefault();
      window.open(
        `https://map.naver.com/p/search/${encodedAddr}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  const handleCopyAddress = async () => {
    await copyTextToClipboard(config.wedding.addressRoad);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 3000);
  };

  const handleCopyAccount = async (acc: BankAccount, key: string) => {
    const textToCopy = `${acc.bank} ${acc.accountNumber}`;
    await copyTextToClipboard(textToCopy);
    setCopiedKey(key);
    try {
      confetti({
        particleCount: 24,
        spread: 50,
        origin: { y: 0.78 },
        colors: ['#c96f78', '#c59b6d', '#6b9071'],
      });
    } catch {
      // ignore
    }
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 3500);
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
          title: `${sideTitle}${config.groom.fullName} · ${config.bride.fullName} 결혼식에 초대합니다`,
          text: `${config.wedding.dateDisplay} ${config.wedding.timeDisplay}\n${config.wedding.venueName} ${config.wedding.hallName}`,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      await copyTextToClipboard(shareUrl);
      setCopiedShare(label);
      setTimeout(() => setCopiedShare(null), 3000);
    }
  };

  const handleSubmitGuestbook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !message.trim()) return;

    const newEntry: GuestbookEntry = {
      id: `gb-${Date.now()}`,
      name: guestName.trim(),
      avatar: 'healer',
      side: guestSide,
      titleBadge: guestSide === 'groom' ? '신랑측 귀빈' : '신부측 귀빈',
      message: message.trim(),
      createdAt: '방금 전',
      attendance,
      companions: attendance === 'unable' ? 0 : companions,
      meal: attendance === 'unable' ? 'no' : meal,
      phone: guestPhone.trim(),
    };

    onAddGuestbook(newEntry);
    setGuestName('');
    setGuestPhone('');
    setMessage('');
    setSubmittedBanner(true);
    setTimeout(() => setSubmittedBanner(false), 5000);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm('작성하신 축하 글을 삭제하시겠습니까?')) return;
    setDeletingId(entryId);
    const ok = await deleteOwnGuestbookEntry(entryId);
    setDeletingId(null);
    if (ok && onDeleteGuestbook) {
      onDeleteGuestbook(entryId);
    }
  };

  const orderedParentGroups =
    initialSide === 'bride'
      ? (['bride', 'groom'] as const)
      : (['groom', 'bride'] as const);

  const activeAccounts =
    activeAccountSide === 'groom'
      ? config.accounts.groomSide
      : config.accounts.brideSide;

  return (
    <div className="w-full max-w-[540px] mx-auto space-y-6 pb-10 font-serif text-[#2d221e]">
      {/* 0. Sticky Top Accessibility Font-Size Bar & Quick Jump */}
      <div className="sticky top-2 z-30 bg-[#fffdf9]/95 backdrop-blur-md border border-[#d8c7b0] rounded-2xl px-3.5 py-2.5 shadow-[0_8px_24px_-10px_rgba(45,34,30,0.16)] font-sans space-y-2">
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

        {/* Big Quick-Jump Anchor Buttons */}
        <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-[#efe6d8] text-center">
          {[
            { id: 'parents-greeting', label: '모시는 글' },
            { id: 'parents-contact', label: '혼주 연락처' },
            { id: 'parents-location', label: '오시는 길' },
            { id: 'parents-gift', label: '마음 전할 곳' },
          ].map((nav) => (
            <button
              key={nav.id}
              type="button"
              onClick={() =>
                document.getElementById(nav.id)?.scrollIntoView({ behavior: 'smooth' })
              }
              className="py-2 px-1 rounded-xl bg-[#faf5ec] hover:bg-[#f1e7d6] border border-[#e2d4c0] text-[#3b2f2f] text-xs sm:text-sm font-bold"
            >
              {nav.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Dignified Formal Hero Cover */}
      <section className="bg-[#fffdf9] border border-[#dfd2be] rounded-3xl overflow-hidden shadow-[0_12px_32px_-14px_rgba(45,34,30,0.12)] text-center">
        <div className="pt-8 pb-5 px-6 bg-gradient-to-b from-[#faf4ea] to-[#fffdf9] border-b border-[#efe6d8]">
          <h1 className={`${textScale.heroTitle} font-bold text-[#2d221e] tracking-wide`}>
            {config.groom.fullName}
            <span className="text-[#b35c66] mx-2.5 font-normal">·</span>
            {config.bride.fullName}
          </h1>

          {/* Prominent Parents Names Banner right on the cover for elders */}
          <div className="mt-5 inline-flex flex-col gap-1.5 bg-[#faf5ec] border border-[#e2d4c0] rounded-2xl px-5 py-3.5 text-left">
            <div className={`${textScale.sub} text-[#3b2f2f]`}>
              <span className="font-sans font-bold text-[#5c4d47] mr-2">신랑측 혼주</span>
              <strong>{config.groom.fatherName}</strong> ·{' '}
              <strong>{config.groom.motherName}</strong>
              <span className="text-[#69584f]">의 {config.groom.relation} </span>
              <strong className="text-[#2d221e]">{config.groom.name}</strong>
            </div>
            <div className={`${textScale.sub} text-[#3b2f2f]`}>
              <span className="font-sans font-bold text-[#b35c66] mr-2">신부측 혼주</span>
              <strong>{config.bride.fatherName}</strong> ·{' '}
              <strong>{config.bride.motherName}</strong>
              <span className="text-[#69584f]">의 {config.bride.relation} </span>
              <strong className="text-[#2d221e]">{config.bride.name}</strong>
            </div>
          </div>
        </div>

        {/* Main Wedding Photograph */}
        <div className="p-5 sm:p-7 bg-[#fffdf9]">
          <div className="relative mx-auto max-w-[420px] aspect-[4/4.6] rounded-2xl overflow-hidden border border-[#dfd2be] shadow-sm bg-[#faf5ec]">
            <img
              src={config.gallery[0]?.imageUrl}
              alt={`${config.groom.fullName} · ${config.bride.fullName} 웨딩 사진`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Essential Date, Time & Venue Box */}
        <div className="px-6 pb-8 pt-2">
          <div className="bg-[#faf5ec] border-2 border-[#d8c4a8] rounded-2xl p-5 space-y-2">
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
        <div className="bg-[#faf5ec] border border-[#dfd2be] rounded-2xl p-5 space-y-3.5 text-center">
          <div className={`${textScale.nameLarge} text-[#2d221e]`}>
            <strong>{config.groom.fatherName}</strong> ·{' '}
            <strong>{config.groom.motherName}</strong>
            <span className={`${textScale.sub} text-[#69584f] mx-2`}>
              의 {config.groom.relation}
            </span>
            <strong className="text-[#2d221e]">{config.groom.fullName}</strong>
          </div>

          <div className="border-t border-[#e8dccb]" />

          <div className={`${textScale.nameLarge} text-[#2d221e]`}>
            <strong>{config.bride.fatherName}</strong> ·{' '}
            <strong>{config.bride.motherName}</strong>
            <span className={`${textScale.sub} text-[#69584f] mx-2`}>
              의 {config.bride.relation}
            </span>
            <strong className="text-[#2d221e]">{config.bride.fullName}</strong>
          </div>
        </div>
      </section>

      {/* 3. Large One-Touch Contact Buttons for Parents (혼주) & Couple */}
      <section
        id="parents-contact"
        className="scroll-mt-32 bg-[#fffdf9] border border-[#dfd2be] rounded-3xl p-6 sm:p-8 shadow-[0_12px_32px_-14px_rgba(45,34,30,0.1)] space-y-6 font-sans"
      >
        <div className="text-center border-b border-[#efe6d8] pb-4">
          <h2 className={`${textScale.heading} font-serif font-bold text-[#2d221e]`}>
            혼주 및 신랑·신부 연락처
          </h2>
          <p className={`${textScale.sub} text-[#69584f] mt-1`}>
            버튼을 누르시면 바로 전화나 문자로 연결됩니다.
          </p>
        </div>

        <div className="space-y-5">
          {orderedParentGroups.map((side) => {
            const isGroom = side === 'groom';
            const person = isGroom ? config.groom : config.bride;
            const sideTitle = isGroom ? '신랑측 연락처' : '신부측 연락처';
            const badgeColor = isGroom
              ? 'bg-[#2d221e] text-[#fffdf9]'
              : 'bg-[#b35c66] text-white';

            const contacts = [
              {
                role: isGroom ? '신랑 아버지' : '신부 아버지',
                name: person.fatherName,
                phone: person.fatherPhone,
              },
              {
                role: isGroom ? '신랑 어머니' : '신부 어머니',
                name: person.motherName,
                phone: person.motherPhone,
              },
              {
                role: isGroom ? '신랑 본인' : '신부 본인',
                name: person.fullName,
                phone: person.phone,
              },
            ];

            return (
              <div
                key={side}
                className="bg-[#faf5ec] border border-[#dfd2be] rounded-2xl p-4 sm:p-5 space-y-3.5"
              >
                <div className="flex items-center justify-between border-b border-[#e5d8c5] pb-2.5">
                  <span
                    className={`px-3.5 py-1 rounded-full text-sm font-bold ${badgeColor}`}
                  >
                    {sideTitle}
                  </span>
                </div>

                <div className="space-y-3">
                  {contacts.map((c) => (
                    <div
                      key={c.role}
                      className="bg-[#fffdf9] border border-[#e5d8c5] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-[#69584f]">
                          {c.role}
                        </div>
                        <div className={`${textScale.nameLarge} font-bold text-[#2d221e] mt-0.5`}>
                          {c.name}
                        </div>
                        <div className="text-sm text-[#56463f] tabular-nums mt-0.5">
                          {c.phone}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 shrink-0">
                        <a
                          href={`tel:${c.phone.replace(/[^0-9+]/g, '')}`}
                          className="px-4 py-3 rounded-xl bg-[#2d221e] hover:bg-[#1e1613] text-[#fffdf9] font-bold text-sm sm:text-base flex items-center justify-center gap-1.5"
                        >
                          <Phone className="w-4 h-4 shrink-0" />
                          <span>전화걸기</span>
                        </a>
                        <a
                          href={`sms:${c.phone.replace(/[^0-9+]/g, '')}`}
                          className="px-4 py-3 rounded-xl bg-[#faf5ec] hover:bg-[#efe5d4] border border-[#c9b69c] text-[#2d221e] font-bold text-sm sm:text-base flex items-center justify-center gap-1.5"
                        >
                          <MessageSquare className="w-4 h-4 shrink-0 text-[#8c6747]" />
                          <span>문자하기</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. High-Contrast Wedding Date & Large Calendar */}
      <section className="bg-[#fffdf9] border border-[#dfd2be] rounded-3xl p-6 sm:p-8 shadow-[0_12px_32px_-14px_rgba(45,34,30,0.1)] space-y-6 text-center">
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

          <div className="grid grid-cols-7 text-center text-sm sm:text-base font-bold mb-3">
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

          <div className="grid grid-cols-7 gap-y-2.5 text-center text-base sm:text-lg font-bold tabular-nums">
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-10" />;
              }
              const isWeddingDay = day === weddingDay;
              const dayOfWeekIdx = idx % 7;

              return (
                <div key={day} className="h-10 flex items-center justify-center">
                  <span
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
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
          예식일까지 <span className="text-[#b35c66] tabular-nums">{daysRemaining}일</span> 남았습니다.
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
              href={`tel:${config.wedding.tel.replace(/[^0-9+]/g, '')}`}
              className={`${textScale.btn} rounded-2xl bg-[#faf5ec] hover:bg-[#f0e5d4] border border-[#c9b69c] text-[#2d221e] font-bold flex items-center justify-center gap-2`}
            >
              <Phone className="w-5 h-5 text-[#8c6747]" />
              <span>예식장 전화걸기</span>
            </a>
          </div>
        </div>

        {/* Large 1-Tap Map / Navigation Buttons */}
        <div className="space-y-2.5">
          <div className={`${textScale.sub} font-bold text-[#4a3a33] text-center`}>
            아래 버튼을 누르시면 길찾기 앱으로 바로 안내됩니다
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <a
              href={kakaoNavUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${textScale.btn} rounded-2xl bg-[#fee500] text-[#191919] border border-[#dfca00] font-bold flex items-center justify-center gap-2 shadow-xs`}
            >
              <Navigation className="w-5 h-5 shrink-0" />
              <span>카카오맵 길찾기</span>
            </a>
            <a
              href={`https://map.naver.com/p/search/${encodedAddr}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${textScale.btn} rounded-2xl bg-[#03c75a] text-white border border-[#02b04f] font-bold flex items-center justify-center gap-2 shadow-xs`}
            >
              <Navigation className="w-5 h-5 shrink-0" />
              <span>네이버 지도 보기</span>
            </a>
            <a
              href={tmapDeepLink}
              onClick={handleOpenTmap}
              className={`${textScale.btn} rounded-2xl bg-[#2d221e] text-white border border-[#1d1513] font-bold flex items-center justify-center gap-2 shadow-xs`}
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
              <span>지하철 및 셔틀버스 안내</span>
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

            return (
              <div
                key={key}
                className="bg-[#faf5ec] border-2 border-[#dfd2be] rounded-2xl p-5 space-y-3.5"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold ${
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
                    {acc.accountNumber}
                  </div>
                </div>

                <div className={`grid ${acc.kakaoPayUrl ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-2`}>
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
                        <Check className="w-5 h-5" />
                        <span>복사 완료 ({acc.bank} {acc.name})</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 text-[#e6d5b8]" />
                        <span>계좌번호 복사하기</span>
                      </>
                    )}
                  </button>

                  {acc.kakaoPayUrl && (
                    <a
                      href={acc.kakaoPayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full ${textScale.btn} rounded-xl font-bold border bg-[#fee500] hover:bg-[#f5dc00] text-[#191919] border-[#dfca00] flex items-center justify-center gap-2 transition-colors`}
                    >
                      <ExternalLink className="w-5 h-5 shrink-0" />
                      <span>카카오페이 송금</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Easy-to-Browse Wedding Photo Album */}
      <section className="bg-[#fffdf9] border border-[#dfd2be] rounded-3xl p-6 sm:p-8 shadow-[0_12px_32px_-14px_rgba(45,34,30,0.1)] space-y-5">
        <div className="text-center border-b border-[#efe6d8] pb-4">
          <h2 className={`${textScale.heading} font-bold text-[#2d221e]`}>
            신랑 · 신부 웨딩 사진
          </h2>
          <p className={`${textScale.sub} text-[#69584f] mt-1 font-sans`}>
            사진을 누르시면 더 크게 보실 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {config.gallery.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLightboxIdx(idx)}
              className="group text-left bg-[#faf5ec] border border-[#dfd2be] rounded-2xl overflow-hidden shadow-xs"
            >
              <div className="aspect-[4/4.5] w-full overflow-hidden bg-[#f0e8da]">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                />
              </div>
              <div className="p-3.5 font-sans">
                <div className="font-bold text-[#2d221e] text-base">{item.title}</div>
                <div className="text-sm text-[#69584f] mt-0.5">{item.description}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 8. Simple Senior-Friendly RSVP & Guestbook (D1 Synced) */}
      <section className="bg-[#fffdf9] border border-[#dfd2be] rounded-3xl p-6 sm:p-8 shadow-[0_12px_32px_-14px_rgba(45,34,30,0.1)] space-y-6 font-sans">
        <div className="text-center border-b border-[#efe6d8] pb-4">
          <h2 className={`${textScale.heading} font-serif font-bold text-[#2d221e]`}>
            참석 의사 전달 및 축하 말씀
          </h2>
          <p className={`${textScale.sub} text-[#56463f] mt-1 break-keep`}>
            정성스러운 식사 대접을 위해 참석 여부나 축하의 말씀을 남겨주시면 감사하겠습니다.
          </p>
        </div>

        <form onSubmit={handleSubmitGuestbook} className="space-y-4 bg-[#faf5ec] p-5 rounded-2xl border border-[#dfd2be]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block ${textScale.sub} font-bold text-[#2d221e] mb-1.5`}>
                성함 (또는 직함/모임명) *
              </label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="예: 홍길동 (신랑 아버지 친구)"
                className={`w-full bg-[#fffdf9] border-2 border-[#c9b69c] focus:border-[#b35c66] outline-none rounded-xl px-4 py-3 ${textScale.body} text-[#2d221e]`}
              />
            </div>

            <div>
              <label className={`block ${textScale.sub} font-bold text-[#2d221e] mb-1.5`}>
                연락처 (선택 · 혼주에게만 전달)
              </label>
              <input
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="예: 010-1234-5678 (비공개)"
                className={`w-full bg-[#fffdf9] border-2 border-[#c9b69c] focus:border-[#b35c66] outline-none rounded-xl px-4 py-3 ${textScale.body} text-[#2d221e]`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={`block ${textScale.sub} font-bold text-[#2d221e] mb-1.5`}>
                어느 측 하객이신가요?
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setGuestSide('groom')}
                  className={`py-3 rounded-xl font-bold border text-sm sm:text-base ${
                    guestSide === 'groom'
                      ? 'bg-[#2d221e] text-white border-[#2d221e]'
                      : 'bg-[#fffdf9] text-[#56463f] border-[#c9b69c]'
                  }`}
                >
                  신랑측
                </button>
                <button
                  type="button"
                  onClick={() => setGuestSide('bride')}
                  className={`py-3 rounded-xl font-bold border text-sm sm:text-base ${
                    guestSide === 'bride'
                      ? 'bg-[#b35c66] text-white border-[#b35c66]'
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
              <select
                value={attendance}
                onChange={(e) =>
                  setAttendance(e.target.value as 'attend' | 'unable' | 'maybe')
                }
                className="w-full bg-[#fffdf9] border-2 border-[#c9b69c] rounded-xl px-3 py-3 font-bold text-sm sm:text-base text-[#2d221e]"
              >
                <option value="attend">참석합니다</option>
                <option value="maybe">미정입니다</option>
                <option value="unable">마음만 전합니다</option>
              </select>
            </div>
          </div>

          {attendance !== 'unable' && (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className={`block ${textScale.sub} font-bold text-[#2d221e] mb-1.5`}>
                  방문 인원 (본인 포함)
                </label>
                <select
                  value={companions}
                  onChange={(e) => setCompanions(Number(e.target.value))}
                  className="w-full bg-[#fffdf9] border-2 border-[#c9b69c] rounded-xl px-3 py-3 font-bold text-sm sm:text-base text-[#2d221e]"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}명
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block ${textScale.sub} font-bold text-[#2d221e] mb-1.5`}>
                  식사 여부
                </label>
                <select
                  value={meal}
                  onChange={(e) =>
                    setMeal(e.target.value as 'yes' | 'no' | 'undecided')
                  }
                  className="w-full bg-[#fffdf9] border-2 border-[#c9b69c] rounded-xl px-3 py-3 font-bold text-sm sm:text-base text-[#2d221e]"
                >
                  <option value="yes">식사 예정</option>
                  <option value="no">식사 안 함</option>
                  <option value="undecided">미정</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className={`block ${textScale.sub} font-bold text-[#2d221e] mb-1.5`}>
              축하 말씀
            </label>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="두 사람의 앞날을 축복하는 따뜻한 말씀을 남겨주세요."
              className={`w-full bg-[#fffdf9] border-2 border-[#c9b69c] focus:border-[#b35c66] outline-none rounded-xl px-4 py-3 ${textScale.body} text-[#2d221e]`}
            />
          </div>

          <button
            type="submit"
            className={`w-full ${textScale.btn} rounded-2xl bg-[#b35c66] hover:bg-[#9f4c56] text-white font-bold shadow-sm`}
          >
            참석 의사 및 축하 글 등록하기
          </button>

          {submittedBanner && (
            <div className="p-3.5 rounded-xl bg-[#eef7f0] border border-[#a9d1b2] text-[#285233] font-bold text-center text-base">
              ✓ 소중한 축하 말씀과 참석 의사가 전달되었습니다. 감사합니다!
            </div>
          )}
        </form>

        {/* Recent Guestbook Messages */}
        <div className="space-y-3 pt-2">
          <div className={`${textScale.sub} font-bold text-[#4a3a33]`}>
            남겨주신 축하 말씀 ({guestbook.length}건)
          </div>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {guestbook.map((item) => {
              const isMine = canEditOwnGuestbookEntry(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-[#faf5ec] border border-[#dfd2be] rounded-2xl p-4 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className={`${textScale.body} text-[#2d221e]`}>
                        {item.name}
                      </strong>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#fffdf9] border border-[#dfd2be] text-[#69584f] font-semibold">
                        {item.side === 'bride'
                          ? '신부측'
                          : item.side === 'groom'
                          ? '신랑측'
                          : '하객'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#7d6e65]">{item.createdAt}</span>
                      {isMine && (
                        <button
                          type="button"
                          disabled={deletingId === item.id}
                          onClick={() => handleDeleteEntry(item.id)}
                          className="px-2 py-1 rounded-lg bg-[#fcf0f1] border border-[#e2a3a9] text-[#c04854] text-xs font-bold flex items-center gap-1"
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
            })}
          </div>
        </div>
      </section>

      {/* 9. Share Parents Invitation Link Box */}
      <section className="bg-[#fffdf9] border border-[#dfd2be] rounded-3xl p-6 shadow-[0_12px_32px_-14px_rgba(45,34,30,0.1)] space-y-4 font-sans text-center">
        <div className={`${textScale.body} font-bold text-[#2d221e]`}>
          지인분들께 청첩장 전달하기
        </div>
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

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleShareParentsPage('groom', 'groom')}
            className="py-2.5 px-3 rounded-xl bg-[#faf5ec] hover:bg-[#f0e5d4] border border-[#d8c7b0] text-xs sm:text-sm font-bold text-[#3b2f2f]"
          >
            {copiedShare === 'groom'
              ? '✓ 신랑측 혼주용 복사됨'
              : '🤵 신랑측 혼주용 링크 복사'}
          </button>
          <button
            type="button"
            onClick={() => handleShareParentsPage('bride', 'bride')}
            className="py-2.5 px-3 rounded-xl bg-[#faf5ec] hover:bg-[#f0e5d4] border border-[#d8c7b0] text-xs sm:text-sm font-bold text-[#b35c66]"
          >
            {copiedShare === 'bride'
              ? '✓ 신부측 혼주용 복사됨'
              : '👰 신부측 혼주용 링크 복사'}
          </button>
        </div>
      </section>

      {/* Fullscreen Photo Lightbox for Elders */}
      {lightboxIdx !== null && config.gallery[lightboxIdx] && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-4 font-sans"
          onClick={() => setLightboxIdx(null)}
        >
          <div
            className="relative max-w-lg w-full bg-[#fffdf9] rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 bg-[#2d221e] text-white flex items-center justify-between">
              <span className="font-bold text-base">
                {config.gallery[lightboxIdx].title} ({lightboxIdx + 1} /{' '}
                {config.gallery.length})
              </span>
              <button
                type="button"
                onClick={() => setLightboxIdx(null)}
                className="px-3 py-1 rounded-lg bg-white/15 text-white text-sm font-bold flex items-center gap-1"
              >
                <X className="w-4 h-4" /> 닫기
              </button>
            </div>

            <div className="bg-black flex items-center justify-center max-h-[70vh]">
              <img
                src={config.gallery[lightboxIdx].imageUrl}
                alt={config.gallery[lightboxIdx].title}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            <div className="p-4 bg-[#fffdf9] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  setLightboxIdx(
                    (lightboxIdx - 1 + config.gallery.length) % config.gallery.length
                  )
                }
                className="px-4 py-2.5 rounded-xl bg-[#faf5ec] border border-[#d8c7b0] font-bold text-sm text-[#2d221e] flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> 이전 사진
              </button>
              <button
                type="button"
                onClick={() =>
                  setLightboxIdx((lightboxIdx + 1) % config.gallery.length)
                }
                className="px-4 py-2.5 rounded-xl bg-[#faf5ec] border border-[#d8c7b0] font-bold text-sm text-[#2d221e] flex items-center gap-1"
              >
                다음 사진 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
