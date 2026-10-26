import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Send, Sparkles, MessageCircleHeart } from 'lucide-react';
import {
  AVATAR_CLASSES,
  AvatarClassId,
  GuestbookEntry,
  WeddingConfig,
} from '../../data/weddingConfig';
import { GuestAvatarSprite } from '../PixelSprites';
import { soundEngine } from '../../utils/soundEngine';

interface RsvpGuestbookSectionProps {
  config: WeddingConfig;
  guestbook: GuestbookEntry[];
  earnedTitle: string | null;
  onAddGuestbook: (entry: GuestbookEntry) => void;
}

export const RsvpGuestbookSection: React.FC<RsvpGuestbookSectionProps> = ({
  config,
  guestbook,
  earnedTitle,
  onAddGuestbook,
}) => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<AvatarClassId>('knight');
  const [side, setSide] = useState<'groom' | 'bride' | 'both'>('groom');
  const [attendance, setAttendance] = useState<'attend' | 'maybe' | 'unable'>('attend');
  const [companions, setCompanions] = useState<number>(1);
  const [meal, setMeal] = useState<'yes' | 'no' | 'undecided'>('yes');
  const [message, setMessage] = useState('');
  const [submittedToast, setSubmittedToast] = useState(false);

  const selectedClassInfo =
    AVATAR_CLASSES.find((c) => c.id === avatar) || AVATAR_CLASSES[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    soundEngine.playFanfare();
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#e899a0', '#d4af7a', '#84a98c'],
      });
    } catch {
      // ignore
    }

    const newEntry: GuestbookEntry = {
      id: `gb-${Date.now()}`,
      name: name.trim(),
      avatar,
      side,
      titleBadge: earnedTitle || `🌷 ${selectedClassInfo.name}`,
      message: message.trim(),
      createdAt: '방금 전',
      attendance,
      companions,
      meal,
    };

    onAddGuestbook(newEntry);
    setName('');
    setMessage('');
    setSubmittedToast(true);
    setTimeout(() => setSubmittedToast(false), 4000);
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

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-[#faf5ec] border border-[#e6d5b8] rounded-xl p-4 sm:p-5 space-y-4 font-sans"
      >
        {/* Avatar Picker */}
        <div>
          <label className="block text-xs font-bold text-[#5c4d47] mb-2">
            방명록 아이콘 선택 (픽셀 가든 광장에도 함께 산책합니다)
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {AVATAR_CLASSES.map((cls) => {
              const isSelected = avatar === cls.id;
              return (
                <button
                  type="button"
                  key={cls.id}
                  onClick={() => {
                    soundEngine.playBlip(660);
                    setAvatar(cls.id);
                  }}
                  className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-[#fffdf9] border-[#d97b84] ring-1 ring-[#d97b84] shadow-sm scale-105'
                      : 'bg-[#f4efe6] border-[#e2d4c0] opacity-75 hover:opacity-100'
                  }`}
                >
                  <GuestAvatarSprite avatar={cls.id} size={48} />
                  <span className="text-[10px] font-semibold text-[#3b2f2f] text-center leading-tight">
                    {cls.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RSVP Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#7d6e65] mb-1">
              하객 구분
            </label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'groom', label: '신랑측' },
                { id: 'bride', label: '신부측' },
                { id: 'both', label: '공통지인' },
              ].map((s) => (
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
                value={meal}
                onChange={(e) => setMeal(e.target.value as 'yes' | 'no' | 'undecided')}
                className="flex-1 bg-[#fffdf9] border border-[#e2d4c0] rounded text-xs text-[#3b2f2f] px-2 py-1.5"
              >
                <option value="yes">식사 예정</option>
                <option value="no">식사 안함</option>
                <option value="undecided">미정</option>
              </select>
              <select
                value={companions}
                onChange={(e) => setCompanions(Number(e.target.value))}
                className="w-20 bg-[#fffdf9] border border-[#e2d4c0] rounded text-xs text-[#3b2f2f] px-2 py-1.5"
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

        {/* Name & Message */}
        <div className="space-y-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-[#7d6e65] mb-1">
              성함 (또는 관계) *
            </label>
            <input
              type="text"
              required
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 이지훈 (대학동기) / 박수빈"
              className="w-full bg-[#fffdf9] border border-[#d4b48c] focus:border-[#d97b84] rounded-lg outline-none px-3 py-2 text-xs text-[#3b2f2f]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#7d6e65] mb-1">
              축하 메시지 *
            </label>
            <textarea
              required
              rows={2}
              maxLength={120}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`${config.groom.name} ♥ ${config.bride.name} 두 사람의 새로운 출발에 따뜻한 한마디를 남겨주세요.`}
              className="w-full bg-[#fffdf9] border border-[#d4b48c] focus:border-[#d97b84] rounded-lg outline-none px-3 py-2 text-xs text-[#3b2f2f] resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-[#d97b84] hover:bg-[#c96a73] text-white py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>참석 의사 및 축하 메시지 등록하기</span>
        </button>

        {submittedToast && (
          <div className="bg-[#edf3ee] border border-[#a3bfa8] rounded-lg p-3 text-center text-xs font-medium text-[#3b5249] flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#6b9071]" />
            <span>따뜻한 축하 메시지가 소중히 등록되었습니다. 감사합니다!</span>
          </div>
        )}
      </form>

      {/* Guestbook List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#efe6d8] pb-2">
          <div className="flex items-center gap-1.5 text-sm font-bold text-[#3b2f2f]">
            <MessageCircleHeart className="w-4 h-4 text-[#d97b84]" />
            <span>축하 방명록 ({guestbook.length})</span>
          </div>
          <span className="text-[11px] text-[#8c7a70] font-sans">
            따뜻한 마음에 감사드립니다
          </span>
        </div>

        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {guestbook.map((item) => (
            <div
              key={item.id}
              className="bg-[#faf5ec] border border-[#e6d5b8] rounded-xl p-3.5 flex items-start gap-3"
            >
              <GuestAvatarSprite avatar={item.avatar} size={46} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-1 font-sans">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#3b2f2f]">
                      {item.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fffdf9] text-[#8c7a70] border border-[#e2d4c0]">
                      {item.titleBadge}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#9c897e]">{item.createdAt}</span>
                </div>

                <p className="text-xs text-[#4a3b32] mt-1.5 leading-relaxed break-keep">
                  {item.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
