import React, { useState } from 'react';
import { Phone, MessageSquare, Heart, Sparkles } from 'lucide-react';
import { WeddingConfig } from '../../data/weddingConfig';
import { GroomSprite, BrideSprite, PetCatSprite, PixelHeart } from '../PixelSprites';
import { soundEngine } from '../../utils/soundEngine';

interface StorySectionProps {
  config: WeddingConfig;
}

export const StorySection: React.FC<StorySectionProps> = ({ config }) => {
  const [showContacts, setShowContacts] = useState(false);

  return (
    <div className="space-y-6">
      {/* Main Invitation Letter Card */}
      <div className="pixel-card p-6 sm:p-8 text-center bg-[#fffdf9]">
        <div className="text-[11px] tracking-[0.25em] text-[#c59b6d] font-engSerif uppercase mb-2">
          INVITATION
        </div>
        <div className="w-8 h-[1px] bg-[#d4b48c] mx-auto mb-5" />

        <h3 className="text-base sm:text-lg font-bold text-[#3b2f2f] leading-relaxed mb-6 break-keep">
          “{config.invitationMessage.headline}”
        </h3>

        <div className="space-y-4 text-[13px] sm:text-sm leading-7 text-[#5c4d47] font-serif">
          {config.invitationMessage.paragraphs.map((p, idx) => (
            <p key={idx} className="break-keep">
              {p}
            </p>
          ))}
        </div>

        {/* Parents & Couple Names in Authentic Korean Wedding Format */}
        <div className="mt-8 pt-6 border-t border-[#efe6d8] flex flex-col items-center gap-2.5 text-sm text-[#3b2f2f]">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wide">
              {config.groom.fatherName} · {config.groom.motherName}
            </span>
            <span className="text-xs text-[#8c7a70]">의 {config.groom.relation}</span>
            <span className="font-bold text-base text-[#3b2f2f] ml-1">
              {config.groom.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wide">
              {config.bride.fatherName} · {config.bride.motherName}
            </span>
            <span className="text-xs text-[#8c7a70]">의 {config.bride.relation}</span>
            <span className="font-bold text-base text-[#3b2f2f] ml-1">
              {config.bride.name}
            </span>
          </div>
        </div>

        {/* Contact Accordion Trigger */}
        <div className="mt-6">
          <button
            onClick={() => {
              soundEngine.playSelect();
              setShowContacts(!showContacts);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#d4b48c] bg-[#faf5ec] hover:bg-[#f3e9d8] text-xs font-sans font-medium text-[#5c4d47] transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-[#c59b6d]" />
            <span>{showContacts ? '혼주 및 신랑·신부 연락처 닫기 ▲' : '신랑·신부 및 혼주에게 연락하기 ▼'}</span>
          </button>
        </div>

        {showContacts && (
          <div className="mt-4 pt-4 border-t border-[#efe6d8] grid grid-cols-1 sm:grid-cols-2 gap-3 text-left font-sans animate-fadeIn">
            {/* Groom Side */}
            <div className="bg-[#faf5ec] p-3.5 rounded-lg border border-[#e6d5b8] space-y-2">
              <div className="text-xs font-bold text-[#5c4d47] mb-1">
                신랑측 연락처
              </div>
              {[
                { label: `신랑 ${config.groom.fullName}`, phone: config.groom.phone },
                { label: `아버지 ${config.groom.fatherName}`, phone: config.groom.fatherPhone },
                { label: `어머니 ${config.groom.motherName}`, phone: config.groom.motherPhone },
              ].map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs bg-[#fffdf9] px-3 py-2 rounded border border-[#efe6d8]"
                >
                  <span className="text-[#3b2f2f] font-medium">{c.label}</span>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${c.phone}`}
                      className="p-1.5 rounded-full bg-[#edf3ee] text-[#4d6b53] hover:opacity-85"
                      title="전화 걸기"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`sms:${c.phone}`}
                      className="p-1.5 rounded-full bg-[#f9ebea] text-[#b85d67] hover:opacity-85"
                      title="문자 보내기"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Bride Side */}
            <div className="bg-[#faf5ec] p-3.5 rounded-lg border border-[#e6d5b8] space-y-2">
              <div className="text-xs font-bold text-[#b85d67] mb-1">
                신부측 연락처
              </div>
              {[
                { label: `신부 ${config.bride.fullName}`, phone: config.bride.phone },
                { label: `아버지 ${config.bride.fatherName}`, phone: config.bride.fatherPhone },
                { label: `어머니 ${config.bride.motherName}`, phone: config.bride.motherPhone },
              ].map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs bg-[#fffdf9] px-3 py-2 rounded border border-[#efe6d8]"
                >
                  <span className="text-[#3b2f2f] font-medium">{c.label}</span>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${c.phone}`}
                      className="p-1.5 rounded-full bg-[#f9ebea] text-[#b85d67] hover:opacity-85"
                      title="전화 걸기"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`sms:${c.phone}`}
                      className="p-1.5 rounded-full bg-[#edf3ee] text-[#4d6b53] hover:opacity-85"
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

      {/* Groom & Bride Charming Pixel Portrait Cards */}
      <div className="pixel-card p-5 sm:p-6 bg-[#fffdf9]">
        <div className="text-center mb-5">
          <div className="text-[11px] tracking-[0.2em] text-[#c59b6d] font-engSerif uppercase">
            BRIDE & GROOM
          </div>
          <h4 className="text-base font-bold text-[#3b2f2f] mt-1">
            신랑 · 신부 소개
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Groom Card */}
          <div className="bg-[#faf5ec] border border-[#e6d5b8] rounded-xl p-4 flex flex-col items-center text-center">
            <div className="w-32 h-36 rounded-t-full rounded-b-2xl bg-gradient-to-b from-[#fffdf9] to-[#f4ece0] border border-[#d4b48c] flex items-end justify-center pt-2 mb-3 shadow-xs overflow-hidden">
              <GroomSprite size={126} variant="portrait" bounce />
            </div>
            <span className="text-[11px] text-[#6b9071] font-sans font-semibold">
              GROOM · {config.groom.jobClass}
            </span>
            <div className="text-base font-bold text-[#3b2f2f] mt-0.5">
              신랑 {config.groom.fullName}
            </div>
            <div className="text-xs text-[#7d6e65] mt-1 font-sans">
              {config.groom.mbti}
            </div>
            <p className="mt-3 text-xs text-[#5c4d47] italic bg-[#fffdf9] p-2.5 rounded-lg border border-[#efe6d8] w-full">
              {config.groom.quote}
            </p>
          </div>

          {/* Bride Card */}
          <div className="bg-[#fcf5f5] border border-[#ebd2d4] rounded-xl p-4 flex flex-col items-center text-center">
            <div className="w-32 h-36 rounded-t-full rounded-b-2xl bg-gradient-to-b from-[#fffdf9] to-[#fae8eb] border border-[#e2a3a9] flex items-end justify-center pt-2 mb-3 shadow-xs overflow-hidden">
              <BrideSprite size={126} variant="portrait" bounce />
            </div>
            <span className="text-[11px] text-[#d97b84] font-sans font-semibold">
              BRIDE · {config.bride.jobClass}
            </span>
            <div className="text-base font-bold text-[#3b2f2f] mt-0.5">
              신부 {config.bride.fullName}
            </div>
            <div className="text-xs text-[#7d6e65] mt-1 font-sans">
              {config.bride.mbti}
            </div>
            <p className="mt-3 text-xs text-[#5c4d47] italic bg-[#fffdf9] p-2.5 rounded-lg border border-[#f5e1e3] w-full">
              {config.bride.quote}
            </p>
          </div>
        </div>

        {/* Little Pet Companion Note */}
        <div className="mt-4 bg-[#faf5ec] border border-[#e6d5b8] rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#fffdf9] border border-[#d4b48c] flex items-center justify-center shrink-0 overflow-hidden">
              <PetCatSprite size={48} />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-[#3b2f2f]">
                반려묘 {config.pet.name} · {config.pet.title}
              </div>
              <div className="text-[11px] text-[#7d6e65] font-sans mt-0.5">
                픽셀 정원에서 두 사람의 뒤를 졸졸 따라다니며 하객분들을 맞이합니다.
              </div>
            </div>
          </div>
          <PixelHeart size={16} />
        </div>
      </div>

      {/* Our Seasons Timeline */}
      <div className="pixel-card p-5 sm:p-6 bg-[#fffdf9]">
        <div className="text-center mb-5">
          <div className="text-[11px] tracking-[0.2em] text-[#c59b6d] font-engSerif uppercase">
            OUR STORY
          </div>
          <h4 className="text-base font-bold text-[#3b2f2f] mt-1 flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#c59b6d]" />
            <span>우리가 함께 걸어온 사계절</span>
          </h4>
        </div>

        <div className="space-y-4 relative before:absolute before:top-3 before:bottom-3 before:left-3.5 before:w-[1px] before:bg-[#d4b48c]">
          {config.storyLog.map((item, idx) => (
            <div key={idx} className="relative pl-9">
              <div className="absolute left-2 top-2 w-3 h-3 rounded-full bg-[#d97b84] border-2 border-[#fffdf9] shadow" />
              <div className="bg-[#faf5ec] border border-[#e6d5b8] rounded-lg p-3.5">
                <div className="flex items-center justify-between gap-2 mb-1 font-sans">
                  <span className="text-[11px] font-bold text-[#d97b84]">
                    {item.chapter}
                  </span>
                  <span className="text-xs text-[#8c7a70] font-medium">
                    {item.date}
                  </span>
                </div>
                <div className="text-sm font-bold text-[#3b2f2f] mb-1">
                  {item.title}
                </div>
                <p className="text-xs text-[#5c4d47] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
