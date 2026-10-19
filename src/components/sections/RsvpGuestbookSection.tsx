import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Send, Sparkles, Users, MessageCircleHeart } from 'lucide-react';
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
        particleCount: 50,
        spread: 70,
        origin: { y: 0.65 },
      });
    } catch {
      // ignore
    }

    const newEntry: GuestbookEntry = {
      id: `gb-${Date.now()}`,
      name: name.trim(),
      avatar,
      side,
      titleBadge: earnedTitle || `✨ ${selectedClassInfo.name}`,
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
    <div className="space-y-5">
      {/* Header */}
      <div className="pixel-box p-4 bg-[#1f1833]">
        <span className="text-[10px] font-bold px-2 py-0.5 bg-[#da77f2] text-[#120d1e]">
          FINAL QUEST 06 · 모험가 주점 & 파티 등록소
        </span>
        <h3 className="text-base sm:text-lg font-extrabold text-[#ffd541] mt-1">
          🏕️ 하객 캐릭터 생성 & 참석 의사(RSVP) · 방명록
        </h3>
        <p className="text-xs text-[#c3b8d9] mt-1 leading-relaxed">
          나만의 도트 아바타 클래스를 선택하고 축하 메시지를 남겨주세요! 등록된 캐릭터는{' '}
          <strong className="text-[#38d9a9]">웨딩빌리지 중앙 광장</strong>에 실시간 NPC로 소환됩니다.
        </p>
      </div>

      {/* Character Creator + RSVP Form */}
      <form onSubmit={handleSubmit} className="pixel-box-gold p-4 bg-[#171128] space-y-4">
        {/* Step 1: Choose Avatar Class */}
        <div>
          <label className="block text-xs font-extrabold text-[#ffd541] mb-2">
            STEP 1. 나의 하객 아바타 클래스 선택
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
                  className={`p-2 border-2 flex flex-col items-center gap-1 transition-transform ${
                    isSelected
                      ? 'bg-[#2e2448] border-[#ffd541] scale-105 shadow-[0_0_8px_rgba(255,213,65,0.6)]'
                      : 'bg-[#120d1e] border-[#362b52] opacity-75 hover:opacity-100'
                  }`}
                >
                  <GuestAvatarSprite avatar={cls.id} size={40} />
                  <span className="text-[10px] font-extrabold text-white text-center leading-tight">
                    {cls.name}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 bg-[#120d1e] border border-[#362b52] px-3 py-1.5 text-[11px] flex items-center justify-between">
            <span className="text-[#38d9a9] font-bold">
              선택 클래스 : {selectedClassInfo.name} ({selectedClassInfo.roleDesc})
            </span>
            {earnedTitle && (
              <span className="px-2 py-0.5 bg-[#ff5277] text-white text-[10px] font-extrabold">
                칭호 장착됨: {earnedTitle}
              </span>
            )}
          </div>
        </div>

        {/* Step 2: RSVP Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-[#c3b8d9] mb-1">
              어느 쪽 하객이신가요?
            </label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'groom', label: `신랑측` },
                { id: 'bride', label: `신부측` },
                { id: 'both', label: `공통친구` },
              ].map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => {
                    soundEngine.playBlip();
                    setSide(s.id as 'groom' | 'bride' | 'both');
                  }}
                  className={`py-1.5 text-xs font-bold border ${
                    side === s.id
                      ? 'bg-[#ffd541] text-[#120d1e] border-white'
                      : 'bg-[#120d1e] text-[#a599b8] border-[#362b52]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#c3b8d9] mb-1">
              예식 참석 여부 (RSVP)
            </label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'attend', label: '참석가능' },
                { id: 'maybe', label: '미정' },
                { id: 'unable', label: '마음만전달' },
              ].map((a) => (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => {
                    soundEngine.playBlip();
                    setAttendance(a.id as 'attend' | 'maybe' | 'unable');
                  }}
                  className={`py-1.5 text-[11px] font-bold border ${
                    attendance === a.id
                      ? 'bg-[#38d9a9] text-[#120d1e] border-white'
                      : 'bg-[#120d1e] text-[#a599b8] border-[#362b52]'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#c3b8d9] mb-1">
              식사 여부 & 인원
            </label>
            <div className="flex gap-1.5">
              <select
                value={meal}
                onChange={(e) => setMeal(e.target.value as 'yes' | 'no' | 'undecided')}
                className="flex-1 bg-[#120d1e] border border-[#362b52] text-xs text-white px-2 py-1.5"
              >
                <option value="yes">식사 예정</option>
                <option value="no">식사 안함</option>
                <option value="undecided">미정</option>
              </select>
              <select
                value={companions}
                onChange={(e) => setCompanions(Number(e.target.value))}
                className="w-20 bg-[#120d1e] border border-[#362b52] text-xs text-white px-2 py-1.5"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    총 {n}명
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Name & Message */}
        <div className="space-y-2.5">
          <div>
            <label className="block text-[11px] font-bold text-[#c3b8d9] mb-1">
              모험가 닉네임 (성함 / 관계) *
            </label>
            <input
              type="text"
              required
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 민준이 대학동기 지훈 / 서연이 베프 수빈"
              className="w-full bg-[#120d1e] border-2 border-[#4c3d75] focus:border-[#ffd541] outline-none px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#c3b8d9] mb-1">
              축하 방명록 메시지 (마을 광장 말풍선에 표시됩니다!) *
            </label>
            <textarea
              required
              rows={2}
              maxLength={120}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`${config.groom.name} & ${config.bride.name} 두 사람에게 따뜻한 축복의 한마디를 남겨주세요!`}
              className="w-full bg-[#120d1e] border-2 border-[#4c3d75] focus:border-[#ffd541] outline-none px-3 py-2 text-xs text-white resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="pixel-btn w-full bg-[#ff5277] hover:bg-[#ff3864] text-white py-3 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>파티 참가 등록 & 광장에 내 캐릭터 소환하기! (+500 EXP)</span>
        </button>

        {submittedToast && (
          <div className="bg-[#2b4c3f] border-2 border-[#38d9a9] p-3 text-center text-xs font-bold text-white flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#ffd541]" />
            <span>
              🎉 등록 완료! 웨딩빌리지 광장에 회원님의 캐릭터와 말풍선이 소환되었습니다!
            </span>
          </div>
        )}
      </form>

      {/* Guestbook Feed */}
      <div className="pixel-box p-4 bg-[#1f1833] space-y-3">
        <div className="flex items-center justify-between border-b border-[#362b52] pb-2">
          <div className="flex items-center gap-1.5 text-sm font-extrabold text-[#ffd541]">
            <MessageCircleHeart className="w-4 h-4 text-[#ff5277]" />
            <span>모험가 축하 방명록 ({guestbook.length}명 참여중)</span>
          </div>
          <span className="text-[11px] text-[#38d9a9] flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> 실시간 광장 연동
          </span>
        </div>

        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {guestbook.map((item) => (
            <div
              key={item.id}
              className="bg-[#151024] border border-[#3d315e] p-3 flex items-start gap-3"
            >
              <div className="w-12 h-12 bg-[#221b36] border border-[#ffd541] flex items-center justify-center shrink-0">
                <GuestAvatarSprite avatar={item.avatar} size={40} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-white">
                      {item.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-[#2e2448] text-[#ffd541] border border-[#ffd541]/40 font-bold">
                      {item.titleBadge}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#a599b8]">{item.createdAt}</span>
                </div>

                <p className="text-xs text-[#e9ecef] mt-1.5 leading-relaxed break-keep">
                  “{item.message}”
                </p>

                {item.attendance && (
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-[#38d9a9]">
                    <span>
                      • {item.side === 'groom' ? '신랑측' : item.side === 'bride' ? '신부측' : '공통하객'}
                    </span>
                    <span>
                      • {item.attendance === 'attend' ? '참석 예정' : item.attendance === 'maybe' ? '참석 미정' : '마음 전달'}
                    </span>
                    {item.companions && <span>• {item.companions}명</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
