import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Sparkles, Download } from 'lucide-react';
import { WeddingConfig } from '../../data/weddingConfig';
import { PixelHeart, PixelRing } from '../PixelSprites';
import { soundEngine } from '../../utils/soundEngine';

interface CeremonySectionProps {
  config: WeddingConfig;
}

export const CeremonySection: React.FC<CeremonySectionProps> = ({ config }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });

  useEffect(() => {
    const updateTimer = () => {
      const target = new Date(config.wedding.dateISO).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    updateTimer();
    const interval = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(interval);
  }, [config.wedding.dateISO]);

  // Build calendar cells for wedding month/year
  const year = config.wedding.year;
  const month = config.wedding.month; // 1-based (e.g., 5 for May)
  const weddingDay = config.wedding.day;

  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const handleDownloadIcs = () => {
    soundEngine.playFanfare();
    const startDate = '20270522T040000Z';
    const endDate = '20270522T060000Z';
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:[결혼식] ${config.groom.name} ♥ ${config.bride.name} 웨딩 퀘스트`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `LOCATION:${config.wedding.venueName} ${config.wedding.hallName} (${config.wedding.addressRoad})`,
      `DESCRIPTION:${config.invitationMessage.questObjective}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `wedding-${config.groom.name}-${config.bride.name}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* D-Day Clock Tower Banner */}
      <div className="pixel-box-gold p-4 sm:p-5 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#ff5277] text-white text-[11px] font-bold mb-2">
          <Clock className="w-3.5 h-3.5" /> MAIN QUEST 02 · 대성당 시계탑
        </div>

        <h3 className="text-base sm:text-lg font-extrabold text-[#ffd541]">
          {config.wedding.dateDisplay} {config.wedding.timeDisplay}
        </h3>
        <p className="text-xs text-[#fff8e7] mt-1">
          {config.wedding.venueName} · {config.wedding.hallName}
        </p>

        {/* 4-Box Retro Digital Countdown */}
        <div className="grid grid-cols-4 gap-2 my-4 max-w-xs mx-auto">
          {[
            { label: 'DAYS', val: timeLeft.days },
            { label: 'HOURS', val: timeLeft.hours },
            { label: 'MINS', val: timeLeft.minutes },
            { label: 'SECS', val: timeLeft.seconds },
          ].map((box, i) => (
            <div
              key={i}
              className="bg-[#120d1e] border-2 border-[#ffd541] py-2.5 px-1 flex flex-col items-center justify-center"
            >
              <span className="text-lg sm:text-xl font-extrabold text-[#38d9a9] font-pixel">
                {String(box.val).padStart(2, '0')}
              </span>
              <span className="text-[9px] text-[#a599b8] font-bold mt-0.5">
                {box.label}
              </span>
            </div>
          ))}
        </div>

        <div className="text-xs text-[#fff8e7] bg-[#161124] py-2 px-3 border border-[#4c3d75] inline-flex items-center gap-2">
          <PixelRing size={16} />
          <span>
            {config.groom.name} ♥ {config.bride.name}의 본식 퀘스트 오픈까지{' '}
            <strong className="text-[#ffd541]">D-{timeLeft.days}일</strong> 남았습니다!
          </span>
        </div>
      </div>

      {/* Pixel Art Calendar Card */}
      <div className="pixel-box p-4 bg-[#1f1833]">
        <div className="flex items-center justify-between border-b-2 border-[#362b52] pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#ff5277]" />
            <span className="text-sm font-extrabold text-[#ffd541]">
              {year}. {String(month).padStart(2, '0')} CALENDAR
            </span>
          </div>
          <span className="text-xs text-[#38d9a9] font-bold">
            {month}월 {weddingDay}일 ({config.wedding.dayOfWeek})
          </span>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 text-center text-[11px] font-bold mb-2">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, idx) => (
            <div
              key={d}
              className={
                idx === 0
                  ? 'text-[#ff5277]'
                  : idx === 6
                  ? 'text-[#4dabf7]'
                  : 'text-[#a599b8]'
              }
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {calendarCells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-9" />;
            }
            const isWeddingDay = day === weddingDay;
            const dayOfWeekIdx = idx % 7;

            return (
              <div
                key={day}
                className={`relative h-9 flex flex-col items-center justify-center border ${
                  isWeddingDay
                    ? 'bg-[#ff5277] text-white font-extrabold border-[#ffd541] shadow-[0_0_10px_rgba(255,82,119,0.8)] scale-105 z-10'
                    : 'bg-[#151024] border-[#2c2247] ' +
                      (dayOfWeekIdx === 0
                        ? 'text-[#ff8787]'
                        : dayOfWeekIdx === 6
                        ? 'text-[#74c0fc]'
                        : 'text-[#e9ecef]')
                }`}
              >
                <span>{day}</span>
                {isWeddingDay && (
                  <span className="text-[8px] text-[#ffd541] leading-none">
                    ♥ D-DAY
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={handleDownloadIcs}
            className="pixel-btn bg-[#38d9a9] text-[#120d1e] px-4 py-2 text-xs font-extrabold flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> 내 스마트폰 캘린더에 일정 저장 (.ics)
          </button>
        </div>
      </div>

      {/* Wedding Ceremony Timetable */}
      <div className="pixel-box p-4 bg-[#1f1833]">
        <div className="flex items-center gap-1.5 text-sm font-bold text-[#ffd541] mb-3">
          <Sparkles className="w-4 h-4 text-[#ffd541]" />
          <span>예식 본식 레이드 타임테이블</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {[
            {
              time: '12:00 ~ 13:00',
              title: '포토부스 & 신부대기실 오픈',
              desc: '3층 로비 픽셀 영수증 포토부스 및 웰컴 드링크 제공',
            },
            {
              time: '13:00 ~ 13:40',
              title: '1부 : 영원의 서약 본식 진행',
              desc: '주례 없는 예식 · 성혼선언 · 축가 & 링베어러 이벤트',
            },
            {
              time: '13:40 ~ 14:00',
              title: '부케 던지기 & 기념 촬영',
              desc: '하객 모험가 전원 파티 기념 스냅 촬영',
            },
            {
              time: '12:30 ~ 15:30',
              title: '2부 : 연회장 프리미엄 뷔페 오픈',
              desc: 'B1 그랜드 뱅큇홀 · 스테이크 & 생맥주 무제한 제공',
            },
          ].map((step, i) => (
            <div key={i} className="bg-[#151024] border border-[#3d315e] p-3">
              <div className="text-[#38d9a9] font-extrabold text-[11px] flex items-center gap-1">
                <PixelHeart size={12} color="#38d9a9" /> {step.time}
              </div>
              <div className="text-white font-bold mt-1">{step.title}</div>
              <div className="text-[#a599b8] text-[11px] mt-0.5">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
