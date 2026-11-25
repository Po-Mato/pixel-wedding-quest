import React, { useState, useEffect } from 'react';
import {
  Send,
  Sparkles,
  MessageCircleHeart,
  Trash2,
  Cloud,
  CloudOff,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  AVATAR_CLASSES,
  AvatarClassId,
  GuestbookEntry,
  WeddingConfig,
} from '../../data/weddingConfig';
import { GuestAvatarSprite } from '../PixelSprites';
import { soundEngine } from '../../utils/soundEngine';
import { fillCoupleText } from '../../utils/coupleText';
import { fireCelebrationConfetti } from '../../utils/motion';
import { joinCoupleNames } from '../../utils/coupleOrder';
import { formatKoreanPhoneInput } from '../../utils/phone';
import { showToast } from '../../utils/toast';
import {
  CloudSyncStatus,
  canEditOwnGuestbookEntry,
  deleteOwnGuestbookEntry,
} from '../../utils/weddingCloudSync';

interface RsvpGuestbookSectionProps {
  config: WeddingConfig;
  guestbook: GuestbookEntry[];
  syncStatus?: CloudSyncStatus | null;
  earnedTitle: string | null;
  initialSide?: 'groom' | 'bride';
  onAddGuestbook: (entry: GuestbookEntry) => Promise<boolean> | boolean | void;
  onDeleteGuestbook?: (id: string) => void;
}

const QUICK_BLESSING_CHIPS = [
  '결혼을 진심으로 축하합니다! 늘 행복하세요 💕',
  '두 분의 앞날에 따뜻한 봄날만 가득하길 바랍니다 🌸',
  '예식날 기쁜 마음으로 참석하겠습니다! 축하해요 🎉',
  '멀리서나마 두 분의 아름다운 출발을 진심으로 축복합니다 ✨',
];

const STORAGE_GUEST_AVATAR_KEY = 'pixel_wedding_quest_guest_avatar_v1';

function readInitialGuestAvatar(): AvatarClassId {
  try {
    const saved = localStorage.getItem(STORAGE_GUEST_AVATAR_KEY) as AvatarClassId | null;
    if (saved && AVATAR_CLASSES.some((c) => c.id === saved)) {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'knight';
}

export const RsvpGuestbookSection: React.FC<RsvpGuestbookSectionProps> = ({
  config,
  guestbook,
  syncStatus,
  earnedTitle,
  initialSide = 'groom',
  onAddGuestbook,
  onDeleteGuestbook,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [privacyError, setPrivacyError] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<AvatarClassId>(readInitialGuestAvatar);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [side, setSide] = useState<'groom' | 'bride' | 'both'>(initialSide);
  const [attendance, setAttendance] = useState<'attend' | 'maybe' | 'unable'>('attend');
  const [companions, setCompanions] = useState<number>(1);
  const [meal, setMeal] = useState<'yes' | 'no' | 'undecided'>('yes');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedToast, setSubmittedToast] = useState<'cloud' | 'local' | null>(null);
  const [listFilter, setListFilter] = useState<'all' | 'groom' | 'bride'>('all');
  const [visibleCount, setVisibleCount] = useState<number>(5);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredGuestbook =
    listFilter === 'all'
      ? guestbook
      : guestbook.filter((item) => item.side === listFilter);
  const visibleGuestbook = filteredGuestbook.slice(0, visibleCount);
  const remainingCount = Math.max(0, filteredGuestbook.length - visibleCount);
  const groomCount = guestbook.filter((item) => item.side === 'groom').length;
  const brideCount = guestbook.filter((item) => item.side === 'bride').length;

  useEffect(() => {
    setSide(initialSide);
  }, [initialSide]);

  const myLatestEntry = guestbook.find((item) => canEditOwnGuestbookEntry(item.id));

  const selectedClassInfo =
    AVATAR_CLASSES.find((c) => c.id === avatar) || AVATAR_CLASSES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!name.trim()) {
      setFormError('성함(또는 관계)을 입력해 주세요.');
      soundEngine.playBlip(360);
      return;
    }
    if (!message.trim()) {
      setFormError('축하 메시지를 입력하거나 상단 문구 칩을 눌러 선택해 주세요.');
      soundEngine.playBlip(360);
      return;
    }
    if (phone.trim() && !privacyAgreed) {
      setPrivacyError(true);
      setFormError('연락처를 함께 전달하시려면 수집·이용 동의에 체크해 주세요.');
      soundEngine.playBlip(360);
      return;
    }
    setFormError(null);
    setPrivacyError(false);
    setIsSubmitting(true);

    soundEngine.playFanfare();
    fireCelebrationConfetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
    });

    const newEntry: GuestbookEntry = {
      id: `gb-${Date.now()}`,
      name: name.trim(),
      avatar,
      side,
      titleBadge: earnedTitle || `🌷 ${selectedClassInfo.name}`,
      message: message.trim(),
      createdAt: '방금 전',
      attendance,
      companions: attendance === 'unable' ? 0 : companions,
      meal: attendance === 'unable' ? 'no' : meal,
      phone: phone.trim(),
    };

    try {
      const result = await onAddGuestbook(newEntry);
      setName('');
      setPhone('');
      setPrivacyAgreed(false);
      setMessage('');
      setSubmittedToast(result === false ? 'local' : 'cloud');
      showToast(
        result === false
          ? '현재 기기에 임시 저장되었습니다'
          : '소중한 축하 메시지와 참석 의사가 등록되었습니다'
      );
      setTimeout(() => setSubmittedToast(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pixel-card p-5 sm:p-6 bg-[#fffdf9] space-y-6">
      {/* Header */}
      <div className="text-center border-b border-[#efe6d8] pb-4">
        <div className="text-[11px] tracking-[0.25em] text-[#c59b6d] font-engSerif uppercase">
          RSVP & GUESTBOOK
        </div>
        <h3 className="text-base sm:text-lg font-bold text-[#3b2f2f] mt-1">
          참석 의사 전달 & 축하 방명록
        </h3>
        <p className="text-xs text-[#7d6e65] mt-1.5 leading-relaxed break-keep">
          소중한 걸음 해주시는 분들을 정성껏 모실 수 있도록 참석 여부와 따뜻한 축하 메시지를 남겨주세요.
        </p>
      </div>

      {/* My Registered RSVP Summary Badge (if already submitted on this device) */}
      {myLatestEntry && (
        <div className="bg-[#edf5ef] border border-[#a3bfa8] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 font-sans">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#3b6e4c] shrink-0 mt-0.5" />
            <div className="text-xs text-[#2f453c]">
              <div className="font-bold">
                내가 등록한 참석 의사 · {myLatestEntry.name}님
              </div>
              <div className="text-[11px] text-[#4d6b53] mt-0.5">
                {myLatestEntry.side === 'groom'
                  ? '신랑측'
                  : myLatestEntry.side === 'bride'
                  ? '신부측'
                  : '공통지인'}{' '}
                ·{' '}
                {myLatestEntry.attendance === 'attend'
                  ? `참석 가능 (총 ${myLatestEntry.companions || 1}명 · ${
                      myLatestEntry.meal === 'yes'
                        ? '식사 예정'
                        : myLatestEntry.meal === 'no'
                        ? '식사 안함'
                        : '식사 미정'
                    })`
                  : myLatestEntry.attendance === 'unable'
                  ? '마음 전달 (불참)'
                  : '참석 미정'}
              </div>
            </div>
          </div>
          <span className="text-[10px] text-[#4d6b53] bg-white/80 px-2.5 py-1 rounded-full border border-[#b7d9c0] self-start sm:self-center shrink-0">
            아래 방명록에서 본인 글 삭제 후 재등록 가능
          </span>
        </div>
      )}

      {/* Form */}
      <form
        noValidate
        onSubmit={handleSubmit}
        className="bg-[#faf5ec] border border-[#e6d5b8] rounded-xl p-4 sm:p-5 space-y-4 font-sans"
      >
        {/* Compact Collapsible Avatar Picker (keeps RSVP form concise) */}
        <div className="bg-[#fffdf9] border border-[#e2d4c0] rounded-xl p-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#faf5ec] border border-[#e6d5b8] flex items-center justify-center shrink-0 overflow-hidden">
                <GuestAvatarSprite avatar={avatar} size={38} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-[#3b2f2f] truncate">
                  방명록 아이콘 · {selectedClassInfo.name}
                </div>
                <div className="text-[10px] text-[#8c7a70] truncate">
                  픽셀 가든 광장에도 함께 산책합니다
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playBlip(620);
                setShowAvatarPicker((prev) => !prev);
              }}
              aria-expanded={showAvatarPicker}
              className="px-2.5 py-1.5 rounded-full bg-[#faf5ec] hover:bg-[#f2e8d8] border border-[#d4b48c] text-[11px] font-bold text-[#5c4d47] shrink-0 transition-colors"
            >
              {showAvatarPicker ? '접기 ▲' : '아이콘 변경 ▾'}
            </button>
          </div>

          {showAvatarPicker && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2.5 pt-2.5 border-t border-[#efe6d8] animate-fadeIn">
              {AVATAR_CLASSES.map((cls) => {
                const isSelected = avatar === cls.id;
                return (
                  <button
                    type="button"
                    key={cls.id}
                    onClick={() => {
                      soundEngine.playBlip(660);
                      setAvatar(cls.id);
                      setShowAvatarPicker(false);
                    }}
                    className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-[#fcf0f1] border-[#d97b84] ring-1 ring-[#d97b84] shadow-sm'
                        : 'bg-[#faf5ec] border-[#e2d4c0] opacity-80 hover:opacity-100'
                    }`}
                  >
                    <GuestAvatarSprite avatar={cls.id} size={42} />
                    <span className="text-[10px] font-semibold text-[#3b2f2f] text-center leading-tight">
                      {cls.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RSVP Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#7d6e65] mb-1">
              하객 구분
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(initialSide === 'bride'
                ? [
                    { id: 'bride', label: '신부측' },
                    { id: 'groom', label: '신랑측' },
                    { id: 'both', label: '공통지인' },
                  ]
                : [
                    { id: 'groom', label: '신랑측' },
                    { id: 'bride', label: '신부측' },
                    { id: 'both', label: '공통지인' },
                  ]
              ).map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => {
                    soundEngine.playBlip();
                    setSide(s.id as 'groom' | 'bride' | 'both');
                  }}
                  className={`py-1.5 rounded text-xs font-medium border ${
                    side === s.id
                      ? 'bg-[#3b2f2f] text-white border-[#3b2f2f]'
                      : 'bg-[#fffdf9] text-[#7d6e65] border-[#e2d4c0]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#7d6e65] mb-1">
              참석 여부
            </label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'attend', label: '참석가능' },
                { id: 'maybe', label: '미정' },
                { id: 'unable', label: '마음전달' },
              ].map((a) => (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => {
                    soundEngine.playBlip();
                    setAttendance(a.id as 'attend' | 'maybe' | 'unable');
                  }}
                  className={`py-1.5 rounded text-[11px] font-medium border ${
                    attendance === a.id
                      ? 'bg-[#d97b84] text-white border-[#d97b84]'
                      : 'bg-[#fffdf9] text-[#7d6e65] border-[#e2d4c0]'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#7d6e65] mb-1">
              식사 여부 및 인원
            </label>
            <div className="flex gap-1.5">
              <select
                value={attendance === 'unable' ? 'no' : meal}
                disabled={attendance === 'unable'}
                onChange={(e) => setMeal(e.target.value as 'yes' | 'no' | 'undecided')}
                className="flex-1 bg-[#fffdf9] disabled:opacity-60 border border-[#e2d4c0] rounded text-base sm:text-xs text-[#3b2f2f] px-2 py-2 sm:py-1.5"
              >
                <option value="yes">식사 예정</option>
                <option value="no">식사 안함</option>
                <option value="undecided">미정</option>
              </select>
              <select
                value={companions}
                disabled={attendance === 'unable'}
                onChange={(e) => setCompanions(Number(e.target.value))}
                className="w-24 sm:w-20 bg-[#fffdf9] disabled:opacity-60 border border-[#e2d4c0] rounded text-base sm:text-xs text-[#3b2f2f] px-2 py-2 sm:py-1.5"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    외 {n - 1}명
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Name, Phone & Message */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-[#7d6e65] mb-1">
                성함 (또는 관계) *
              </label>
              <input
                type="text"
                required
                maxLength={20}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder={
                  side === 'bride'
                    ? '예: 박수빈 (신부 대학동기)'
                    : side === 'both'
                    ? '예: 현우 · 미소 (공통지인)'
                    : '예: 이지훈 (신랑 대학동기)'
                }
                className="w-full bg-[#fffdf9] border border-[#d4b48c] focus:border-[#d97b84] rounded-lg outline-none px-3 py-2 text-base sm:text-xs text-[#3b2f2f]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#7d6e65] mb-1">
                연락처 (선택 · 신랑신부에게만 전달)
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={13}
                value={phone}
                onChange={(e) => {
                  const formatted = formatKoreanPhoneInput(e.target.value);
                  setPhone(formatted);
                  if (!formatted.trim()) setPrivacyError(false);
                }}
                placeholder="010-1234-5678 (비공개)"
                className="w-full bg-[#fffdf9] border border-[#d4b48c] focus:border-[#d97b84] rounded-lg outline-none px-3 py-2 text-base sm:text-xs text-[#3b2f2f]"
              />
            </div>
          </div>

          {phone.trim().length > 0 && (
            <div
              className={`p-3 rounded-lg border text-[11px] space-y-1.5 transition-colors ${
                privacyError
                  ? 'bg-[#fff2f3] border-[#d97b84] text-[#9e3f49]'
                  : 'bg-[#fffdf9] border-[#e2d4c0] text-[#5c4d47]'
              }`}
            >
              <label className="flex items-start gap-2 cursor-pointer font-semibold">
                <input
                  type="checkbox"
                  checked={privacyAgreed}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setPrivacyAgreed(checked);
                    if (checked) {
                      setPrivacyError(false);
                      if (formError) setFormError(null);
                    }
                  }}
                  className="mt-0.5 accent-[#d97b84] rounded"
                />
                <span className="flex-1">
                  <ShieldCheck className="w-3.5 h-3.5 inline-block mr-1 text-[#6b9071] align-text-bottom" />
                  [필수] 예식 참석 확인 및 안내를 위한 연락처 수집·이용에 동의합니다.
                </span>
              </label>
              <div className="text-[10px] text-[#8c7a70] pl-5 leading-relaxed">
                • 수집 항목: 성함, 연락처 (공개 방명록에는 절대 노출되지 않습니다)
                <br />• 보유 및 이용 기간: <strong>예식 종료 후 30일 이내 즉시 파기</strong>
              </div>
              {privacyError && (
                <div className="text-[11px] font-bold text-[#b85d67] pl-5">
                  ⚠️ 연락처를 함께 전달하시려면 수집·이용 동의에 체크해 주세요.
                </div>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="block text-[11px] font-semibold text-[#7d6e65]">
                축하 메시지 *{' '}
                <span className="text-[10px] font-normal text-[#9c897e] tabular-nums">
                  ({message.length} / 120)
                </span>
              </label>
              <span className="text-[10px] text-[#9c897e]">
                문구 칩을 누르면 바로 입력됩니다
              </span>
            </div>

            {/* 1-Tap Quick Blessing Chips */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {QUICK_BLESSING_CHIPS.map((chip, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    soundEngine.playBlip(700);
                    setMessage(chip);
                    if (formError) setFormError(null);
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] border transition-all text-left ${
                    message === chip
                      ? 'bg-[#fcf0f1] border-[#d97b84] text-[#b85d67] font-bold'
                      : 'bg-[#fffdf9] hover:bg-[#f5efe6] border-[#e2d4c0] text-[#5c4d47]'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>

            <textarea
              required
              rows={2}
              maxLength={120}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder={`${joinCoupleNames(config, initialSide, 'name')} 두 사람의 새로운 출발에 따뜻한 한마디를 남겨주세요.`}
              className="w-full bg-[#fffdf9] border border-[#d4b48c] focus:border-[#d97b84] rounded-lg outline-none px-3 py-2 text-base sm:text-xs text-[#3b2f2f] resize-none"
            />
          </div>
        </div>

        {formError && (
          <div
            role="alert"
            className="bg-[#fff2f3] border border-[#d97b84] rounded-lg px-3 py-2 text-xs font-bold text-[#9e3f49] animate-fadeIn"
          >
            ⚠️ {formError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-[#d97b84] hover:bg-[#c96a73] disabled:opacity-65 text-white py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>
            {isSubmitting
              ? '참석 의사 및 메시지를 등록하는 중...'
              : '참석 의사 및 축하 메시지 등록하기'}
          </span>
        </button>

        {submittedToast === 'cloud' && (
          <div className="bg-[#edf3ee] border border-[#a3bfa8] rounded-lg p-3 text-center text-xs font-medium text-[#3b5249] flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#6b9071]" />
            <span>따뜻한 축하 메시지가 서버에 소중히 등록되었습니다. 감사합니다!</span>
          </div>
        )}

        {submittedToast === 'local' && (
          <div className="bg-[#fff8ed] border border-[#e6c994] rounded-lg p-3 text-center text-xs font-medium text-[#7a5824] flex items-center justify-center gap-1.5">
            <CloudOff className="w-4 h-4 text-[#c88a2e] shrink-0" />
            <span>
              네트워크 연결이 불안정해 현재 기기에만 임시 저장되었습니다. 잠시 후 다시 확인해 주세요.
            </span>
          </div>
        )}
      </form>

      {/* Guestbook List (No Scroll Trap + Side Filter + Progressive Load More) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-[#efe6d8] pb-2">
          <div className="flex items-center gap-1.5 text-sm font-bold text-[#3b2f2f]">
            <MessageCircleHeart className="w-4 h-4 text-[#d97b84]" />
            <span>축하 방명록 ({guestbook.length})</span>
          </div>
          {syncStatus?.mode === 'local' ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fff8ed] text-[#8a6220] border border-[#e6c994] font-sans font-semibold flex items-center gap-1 shrink-0">
              <CloudOff className="w-3 h-3" />
              <span>기기 임시 저장</span>
            </span>
          ) : syncStatus?.mode === 'cloud' ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#edf5ef] text-[#3b6e4c] border border-[#b7d9c0] font-sans font-semibold flex items-center gap-1 shrink-0">
              <Cloud className="w-3 h-3" />
              <span>실시간 반영됨</span>
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#faf5ec] text-[#8c7a70] border border-[#e2d4c0] font-sans font-semibold flex items-center gap-1 shrink-0">
              <Cloud className="w-3 h-3" />
              <span>불러오는 중...</span>
            </span>
          )}
        </div>

        {/* Groom / Bride Filter Chips */}
        <div className="flex items-center gap-1.5 font-sans">
          {(
            initialSide === 'bride'
              ? [
                  { id: 'all' as const, label: `전체 (${guestbook.length})` },
                  { id: 'bride' as const, label: `신부측 (${brideCount})` },
                  { id: 'groom' as const, label: `신랑측 (${groomCount})` },
                ]
              : [
                  { id: 'all' as const, label: `전체 (${guestbook.length})` },
                  { id: 'groom' as const, label: `신랑측 (${groomCount})` },
                  { id: 'bride' as const, label: `신부측 (${brideCount})` },
                ]
          ).map((tab) => {
            const active = listFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  soundEngine.playBlip(640);
                  setListFilter(tab.id);
                  setVisibleCount(5);
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                  active
                    ? tab.id === 'bride'
                      ? 'bg-[#d97b84] text-white border-[#d97b84]'
                      : 'bg-[#3b2f2f] text-white border-[#3b2f2f]'
                    : 'bg-[#faf5ec] text-[#6e5d53] border-[#e2d4c0] hover:bg-[#f3e9d8]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-2.5">
          {visibleGuestbook.length === 0 ? (
            <div className="bg-[#faf5ec] border border-[#e6d5b8] rounded-xl p-5 text-center text-xs text-[#8c7a70] font-sans">
              아직 등록된 축하 메시지가 없습니다. 첫 번째 축복의 한마디를 남겨주세요!
            </div>
          ) : (
            visibleGuestbook.map((item) => {
              const isMine = canEditOwnGuestbookEntry(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-[#faf5ec] border border-[#e6d5b8] rounded-xl p-3.5 flex items-start gap-3"
                >
                  <GuestAvatarSprite avatar={item.avatar} size={46} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1 font-sans">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-[#3b2f2f]">
                          {item.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fffdf9] text-[#8c7a70] border border-[#e2d4c0]">
                          {item.titleBadge}
                        </span>
                        {item.attendance === 'attend' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#fcf0f1] text-[#b85d67] border border-[#e8b8be]">
                            참석{item.companions && item.companions > 1 ? ` · ${item.companions}명` : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#9c897e]">{item.createdAt}</span>
                        {isMine &&
                          (confirmDeleteId === item.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={async () => {
                                  const ok = await deleteOwnGuestbookEntry(item.id);
                                  setConfirmDeleteId(null);
                                  if (ok && onDeleteGuestbook) {
                                    onDeleteGuestbook(item.id);
                                    showToast('작성하신 방명록이 삭제되었습니다', 'info');
                                  }
                                }}
                                className="text-[10px] font-bold text-white bg-[#b85d67] hover:bg-[#9e4751] px-2 py-0.5 rounded"
                              >
                                정말 삭제
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-[10px] font-semibold text-[#6e5d53] bg-[#fffdf9] border border-[#d4b48c] px-1.5 py-0.5 rounded"
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                soundEngine.playBlip(460);
                                setConfirmDeleteId(item.id);
                              }}
                              title="내 방명록 삭제"
                              className="text-[10px] text-[#b85d67] hover:text-[#d97b84] flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#fffdf9] border border-[#e2d4c0]"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                              <span>삭제</span>
                            </button>
                          ))}
                      </div>
                    </div>

                    <p className="text-xs text-[#4a3b32] mt-1.5 leading-relaxed break-keep">
                      {fillCoupleText(item.message, config)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Progressive Load More / Collapse */}
        {filteredGuestbook.length > 5 && (
          <div className="pt-1 font-sans">
            {remainingCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playBlip(680);
                  setVisibleCount((prev) => prev + 5);
                }}
                className="w-full py-2.5 rounded-xl bg-[#faf5ec] hover:bg-[#f2e8d8] border border-[#d4b48c] text-[#5c4d47] text-xs font-bold transition-colors"
              >
                축하 메시지 더보기 (+{Math.min(5, remainingCount)}건 · 총 {remainingCount}건 남음)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playBlip(520);
                  setVisibleCount(5);
                }}
                className="w-full py-2 rounded-xl bg-[#fffdf9] hover:bg-[#faf5ec] border border-[#e2d4c0] text-[#8c7a70] text-xs font-semibold transition-colors"
              >
                최근 5건만 간략히 보기 ▲
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
