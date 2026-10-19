import React, { useState } from 'react';
import { Phone, MessageSquare, Sparkles, Shield, Wand2 } from 'lucide-react';
import { WeddingConfig } from '../../data/weddingConfig';
import { GroomSprite, BrideSprite, PetCatSprite, PixelHeart } from '../PixelSprites';
import { soundEngine } from '../../utils/soundEngine';

interface StorySectionProps {
  config: WeddingConfig;
}

export const StorySection: React.FC<StorySectionProps> = ({ config }) => {
  const [showContacts, setShowContacts] = useState(false);
  const [activeTab, setActiveTab] = useState<'groom' | 'bride'>('groom');

  return (
    <div className="space-y-5">
      {/* Royal Quest Scroll Invitation Message */}
      <div className="pixel-box-parchment p-4 sm:p-5 relative">
        <div className="flex items-center justify-between border-b-2 border-[#c9b182] pb-2.5 mb-3">
          <span className="text-[11px] font-bold px-2 py-0.5 bg-[#4a3222] text-[#ffd541]">
            MAIN QUEST 01 · 초대의 서신
          </span>
          <span className="text-xs font-bold text-[#7c5836]">
            📜 {config.wedding.dateDisplay}
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-extrabold text-[#2b1e16] text-center mb-3 leading-snug">
          “{config.invitationMessage.headline}”
        </h3>

        <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-[#3d2b1f]">
          {config.invitationMessage.paragraphs.map((p, idx) => (
            <p key={idx} className="text-center break-keep">
              {p}
            </p>
          ))}
        </div>

        {/* Parents & Couple Names Block */}
        <div className="mt-5 pt-4 border-t-2 border-dashed border-[#c9b182] flex flex-col items-center gap-2 text-xs sm:text-sm font-bold text-[#2b1e16]">
          <div className="flex items-center gap-2">
            <span>
              {config.groom.fatherName} · {config.groom.motherName}
            </span>
            <span className="text-xs text-[#7c5836] font-normal">
              의 {config.groom.relation}
            </span>
            <span className="px-2 py-0.5 bg-[#2b3a67] text-white text-xs">
              신랑 {config.groom.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>
              {config.bride.fatherName} · {config.bride.motherName}
            </span>
            <span className="text-xs text-[#7c5836] font-normal">
              의 {config.bride.relation}
            </span>
            <span className="px-2 py-0.5 bg-[#ff5277] text-white text-xs">
              신부 {config.bride.name}
            </span>
          </div>
        </div>

        {/* Quest Objective Banner */}
        <div className="mt-4 bg-[#2b1e16] text-[#ffd541] p-2.5 text-center text-xs font-bold border-2 border-[#ffd541]">
          ⭐ {config.invitationMessage.questObjective}
        </div>
      </div>

      {/* Party Member Status Cards (Groom & Bride RPG Stats) */}
      <div className="pixel-box p-4 bg-[#1f1833]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#ffd541]" />
            <h4 className="text-sm font-bold text-[#ffd541]">
              파티원 스테이터스 (PARTY STATUS)
            </h4>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => {
                soundEngine.playBlip();
                setActiveTab('groom');
              }}
              className={`px-2.5 py-1 text-xs font-bold border ${
                activeTab === 'groom'
                  ? 'bg-[#4dabf7] text-[#120d1e] border-white'
                  : 'bg-[#140f21] text-[#a599b8] border-[#3d315e]'
              }`}
            >
              ⚔️ 신랑 {config.groom.name}
            </button>
            <button
              onClick={() => {
                soundEngine.playBlip();
                setActiveTab('bride');
              }}
              className={`px-2.5 py-1 text-xs font-bold border ${
                activeTab === 'bride'
                  ? 'bg-[#ff5277] text-white border-white'
                  : 'bg-[#140f21] text-[#a599b8] border-[#3d315e]'
              }`}
            >
              🪄 신부 {config.bride.name}
            </button>
          </div>
        </div>

        {activeTab === 'groom' ? (
          <div className="bg-[#161124] border-2 border-[#4dabf7] p-3.5 space-y-3">
            <div className="flex items-center gap-3.5">
              <div className="w-20 h-20 bg-[#221b36] border-2 border-[#ffd541] flex items-center justify-center shrink-0">
                <GroomSprite
                  size={64}
                  primaryColor={config.groom.suitColor}
                  hairColor={config.groom.hairColor}
                  bounce
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-[#4dabf7] text-[#120d1e] text-[10px] font-extrabold">
                    LV.{config.groom.level}
                  </span>
                  <span className="text-xs text-[#4dabf7] font-bold flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> {config.groom.jobClass}
                  </span>
                </div>
                <div className="text-base font-extrabold text-white mt-0.5">
                  {config.groom.fullName}
                </div>
                <div className="text-[11px] text-[#ffd541] mt-0.5">
                  특성 : {config.groom.mbti}
                </div>
                <div className="text-[11px] text-[#c3b8d9] mt-0.5">
                  고유 스킬 : {config.groom.specialSkill}
                </div>
              </div>
            </div>

            <div className="bg-[#221b36] p-2.5 text-xs text-[#fff8e7] border-l-4 border-[#4dabf7]">
              {config.groom.quote}
            </div>

            {/* Stat Bars */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {config.groom.stats.map((st, i) => (
                <div key={i} className="bg-[#221b36] p-2 border border-[#362b52]">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-[#c3b8d9]">{st.label}</span>
                    <span className="text-[#ffd541] font-bold">
                      {st.value}/{st.max}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#120d1e] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#4dabf7] to-[#38d9a9]"
                      style={{ width: `${Math.min(100, (st.value / st.max) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-[#161124] border-2 border-[#ff5277] p-3.5 space-y-3">
            <div className="flex items-center gap-3.5">
              <div className="w-20 h-20 bg-[#221b36] border-2 border-[#ffd541] flex items-center justify-center shrink-0">
                <BrideSprite
                  size={64}
                  primaryColor={config.bride.dressColor}
                  hairColor={config.bride.hairColor}
                  bounce
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-[#ff5277] text-white text-[10px] font-extrabold">
                    LV.{config.bride.level}
                  </span>
                  <span className="text-xs text-[#ff87ab] font-bold flex items-center gap-1">
                    <Wand2 className="w-3.5 h-3.5" /> {config.bride.jobClass}
                  </span>
                </div>
                <div className="text-base font-extrabold text-white mt-0.5">
                  {config.bride.fullName}
                </div>
                <div className="text-[11px] text-[#ffd541] mt-0.5">
                  특성 : {config.bride.mbti}
                </div>
                <div className="text-[11px] text-[#c3b8d9] mt-0.5">
                  고유 스킬 : {config.bride.specialSkill}
                </div>
              </div>
            </div>

            <div className="bg-[#221b36] p-2.5 text-xs text-[#fff8e7] border-l-4 border-[#ff5277]">
              {config.bride.quote}
            </div>

            {/* Stat Bars */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {config.bride.stats.map((st, i) => (
                <div key={i} className="bg-[#221b36] p-2 border border-[#362b52]">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-[#c3b8d9]">{st.label}</span>
                    <span className="text-[#ffd541] font-bold">
                      {st.value}/{st.max}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#120d1e] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#ff5277] to-[#ffd541]"
                      style={{ width: `${Math.min(100, (st.value / st.max) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Companion Pet Badge */}
        <div className="mt-3 bg-[#161124] border border-[#3d315e] p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <PetCatSprite size={36} />
            <div>
              <div className="text-xs font-bold text-[#ffa94d]">
                🐾 동행 펫 : {config.pet.name} ({config.pet.title})
              </div>
              <div className="text-[11px] text-[#a599b8]">
                웨딩빌리지 광장과 분수대에서 하객 여러분을 반겨주고 있어요!
              </div>
            </div>
          </div>
          <PixelHeart size={18} />
        </div>
      </div>

      {/* Direct Call / SMS Contact Accordion */}
      <div className="pixel-box p-3.5 bg-[#1f1833]">
        <button
          onClick={() => {
            soundEngine.playSelect();
            setShowContacts(!showContacts);
          }}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="text-xs sm:text-sm font-bold text-[#38d9a9] flex items-center gap-2">
            📞 신랑·신부 및 혼주에게 연락하기 (텔레파시 포탈)
          </span>
          <span className="pixel-btn bg-[#2e2448] text-[#ffd541] px-2.5 py-1 text-xs font-bold">
            {showContacts ? '접기 ▲' : '연락처 열기 ▼'}
          </span>
        </button>

        {showContacts && (
          <div className="mt-3 pt-3 border-t border-[#3d315e] grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Groom Side */}
            <div className="bg-[#151024] p-3 border border-[#4dabf7]/50 space-y-2">
              <div className="text-xs font-bold text-[#4dabf7] mb-1">
                ⚔️ 신랑측 연락처
              </div>
              {[
                { label: `신랑 ${config.groom.fullName}`, phone: config.groom.phone },
                { label: `아버지 ${config.groom.fatherName}`, phone: config.groom.fatherPhone },
                { label: `어머니 ${config.groom.motherName}`, phone: config.groom.motherPhone },
              ].map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs bg-[#221b36] px-2.5 py-1.5"
                >
                  <span>{c.label}</span>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${c.phone}`}
                      className="p-1.5 bg-[#4dabf7] text-[#120d1e] hover:opacity-90"
                      title="전화 걸기"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`sms:${c.phone}`}
                      className="p-1.5 bg-[#38d9a9] text-[#120d1e] hover:opacity-90"
                      title="문자 보내기"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Bride Side */}
            <div className="bg-[#151024] p-3 border border-[#ff5277]/50 space-y-2">
              <div className="text-xs font-bold text-[#ff5277] mb-1">
                🪄 신부측 연락처
              </div>
              {[
                { label: `신부 ${config.bride.fullName}`, phone: config.bride.phone },
                { label: `아버지 ${config.bride.fatherName}`, phone: config.bride.fatherPhone },
                { label: `어머니 ${config.bride.motherName}`, phone: config.bride.motherPhone },
              ].map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs bg-[#221b36] px-2.5 py-1.5"
                >
                  <span>{c.label}</span>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${c.phone}`}
                      className="p-1.5 bg-[#ff5277] text-white hover:opacity-90"
                      title="전화 걸기"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`sms:${c.phone}`}
                      className="p-1.5 bg-[#ffd541] text-[#120d1e] hover:opacity-90"
                      title="문자 보내기"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Adventure Storyline Log */}
      <div className="pixel-box p-4 bg-[#1f1833]">
        <div className="text-sm font-bold text-[#ffd541] mb-3 flex items-center gap-2">
          <span>📖 우리가 파티를 맺기까지 (QUEST LOG)</span>
        </div>
        <div className="space-y-3 relative before:absolute before:top-2 before:bottom-2 before:left-3 before:w-0.5 before:bg-[#ffd541]/40">
          {config.storyLog.map((item, idx) => (
            <div key={idx} className="relative pl-8">
              <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 bg-[#ffd541] border-2 border-[#120d1e]" />
              <div className="bg-[#161124] border border-[#3d315e] p-3">
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-[#ff5277] text-white">
                    {item.chapter} · {item.badge}
                  </span>
                  <span className="text-xs text-[#ffd541] font-bold">{item.date}</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-white mb-1">
                  {item.title}
                </div>
                <p className="text-xs text-[#c3b8d9] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
