import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Download } from 'lucide-react';
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

  const year = config.wedding.year;
  const month = config.wedding.month;
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
      `SUMMARY:[결혼식] ${config.groom.name} ♥ ${config.bride.name}`,
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
    <div className="space-y-6">
      {/* Elegant Bridal Calendar & Countdown Card */}
      <div className="pixel-card p-6 sm:p-7 text-center bg-[#fffdf9]">
        <div className="text-[11px] tracking-[0.25em] text-[#c59b6d] font-engSerif uppercase mb-1">
          WEDDING CALENDAR
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-[#3b2f2f] mt-1">
          {config.wedding.dateDisplay}
        </h3>
        <p className="text-xs sm:text-sm text-[#7d6e65] mt-1">
          {config.wedding.timeDisplay} · {config.wedding.venueName} {config.wedding.hallName}
        </p>

        {/* Minimalist Bridal Calendar */}
        <div className="my-6 py-5 px-4 bg-[#faf5ec] rounded-xl border border-[#e6d5b8] max-w-sm mx-auto">
          <div className="text-base font-engSerif font-semibold tracking-widest text-[#5c4d47] mb-4">
            {year}. {String(month).padStart(2, '0')}
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] font-sans font-semibold mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((d, idx) => (
              <div
                key={d}
                className={
                  idx === 0
                    ? 'text-[#d97b84]'
                    : idx === 6
                    ? 'text-[#6c8ebf]'
                    : 'text-[#8c7a70]'
                }
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-serif">
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-8" />;
              }
              const isWeddingDay = day === weddingDay;
              const dayOfWeekIdx = idx % 7;

              return (
                <div
                  key={day}
                  className="relative h-8 flex items-center justify-center"
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      isWeddingDay
                        ? 'bg-[#d97b84] text-white font-bold shadow-sm ring-2 ring-[#f4acb7]'
                        : dayOfWeekIdx === 0
                        ? 'text-[#d97b84]'
                        : dayOfWeekIdx === 6
                        ? 'text-[#6c8ebf]'
                        : 'text-[#3b2f2f]'
                    }`}
                  >
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clean 4-Box Countdown */}
        <div className="grid grid-cols-4 gap-2.5 max-w-xs mx-auto my-5 font-sans">
          {[
            { label: 'DAYS', val: timeLeft.days },
            { label: 'HOURS', val: timeLeft.hours },
            { label: 'MIN', val: timeLeft.minutes },
            { label: 'SEC', val: timeLeft.seconds },
          ].map((box, i) => (
            <div
              key={i}
              className="bg-[#faf5ec] border border-[#e2d4c0] rounded-lg py-2.5 px-1 flex flex-col items-center justify-center"
            >
              <span className="text-lg sm:text-xl font-bold text-[#3b2f2f] font-serif">
                {String(box.val).padStart(2, '0')}
              </span>
              <span className="text-[9px] tracking-wider text-[#9c897e] mt-0.5">
                {box.label}
              </span>
            </div>
          ))}
        </div>

        <div className="text-xs sm:text-sm text-[#5c4d47] inline-flex items-center gap-1.5">
          <PixelHeart size={14} color="#d97b84" />
          <span>
            {config.groom.name} ♥ {config.bride.name}의 결혼식이{' '}
            <strong className="text-[#d97b84] font-bold">{timeLeft.days}일</strong> 남았습니다.
          </span>
        </div>

        <div className="mt-5">
          <button
            onClick={handleDownloadIcs}
            className="pixel-btn bg-[#faf5ec] hover:bg-[#f3e9d8] text-[#5c4d47] px-4 py-2 text-xs font-sans font-medium flex items-center gap-1.5 mx-auto"
          >
            <Download className="w-3.5 h-3.5 text-[#c59b6d]" />
            <span>캘린더에 예식 일정 저장하기 (.ics)</span>
          </button>
        </div>
      </div>

      {/* Ceremony Program */}
      <div className="pixel-card p-5 sm:p-6 bg-[#fffdf9]">
        <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-[#3b2f2f] mb-4">
          <Clock className="w-4 h-4 text-[#c59b6d]" />
          <span>예식 및 피로연 안내</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            {
              time: '12:00 ~ 13:00',
              title: '포토부스 & 신부대기실 맞이',
              desc: '3층 가든 로비에서 웰컴 티와 기념 포토부스를 이용하실 수 있습니다.',
            },
            {
              time: '13:00 ~ 13:40',
              title: '1부 · 본식 예식 진행',
              desc: '따뜻한 축가와 성혼선언으로 두 사람의 서약식이 진행됩니다.',
            },
            {
              time: '13:40 ~ 14:00',
              title: '부케 토스 & 기념 사진 촬영',
              desc: '가족, 친지 및 하객분들과 함께 소중한 순간을 사진으로 남깁니다.',
            },
            {
              time: '12:30 ~ 15:30',
              title: '2부 · 연회장 식사 대접',
              desc: '정성껏 준비한 코스 및 뷔페 식사로 감사의 마음을 대접합니다.',
            },
          ].map((step, i) => (
            <div
              key={i}
              className="bg-[#faf5ec] border border-[#e6d5b8] rounded-lg p-3.5"
            >
              <div className="text-[#c59b6d] font-sans font-bold text-[11px] flex items-center gap-1">
                <PixelRing size={13} /> {step.time}
              </div>
              <div className="text-[#3b2f2f] font-bold mt-1">{step.title}</div>
              <div className="text-[#7d6e65] text-[11px] mt-1 leading-relaxed">
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
