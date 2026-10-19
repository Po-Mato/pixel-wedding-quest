import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Copy, Check, Coins, Sparkles } from 'lucide-react';
import { WeddingConfig, BankAccount } from '../../data/weddingConfig';
import { soundEngine } from '../../utils/soundEngine';

interface GiftSectionProps {
  config: WeddingConfig;
}

export const GiftSection: React.FC<GiftSectionProps> = ({ config }) => {
  const [activeSide, setActiveSide] = useState<'groom' | 'bride'>('groom');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyAccount = (acc: BankAccount, key: string) => {
    soundEngine.playCoin();
    const textToCopy = `${acc.bank} ${acc.accountNumber}`;
    navigator.clipboard?.writeText(textToCopy).catch(() => {});
    setCopiedKey(key);

    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#ffd541', '#ff5277', '#38d9a9'],
      });
    } catch {
      // ignore if canvas-confetti fails
    }

    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 3000);
  };

  const accounts =
    activeSide === 'groom' ? config.accounts.groomSide : config.accounts.brideSide;

  return (
    <div className="space-y-4">
      {/* Guild Bank Header */}
      <div className="pixel-box-gold p-4 bg-[#1f1833] text-center">
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#ffa94d] text-[#120d1e] text-[10px] font-extrabold mb-2">
          <Coins className="w-3.5 h-3.5" /> MAIN QUEST 05 · 길드 골드 은행
        </div>
        <h3 className="text-base sm:text-lg font-extrabold text-[#ffd541]">
          🏦 마음 전하실 곳 (축복의 골드 전송)
        </h3>
        <p className="text-xs text-[#e9ecef] mt-1.5 leading-relaxed break-keep">
          참석이 어려우신 분들도 축복의 마음을 전하실 수 있도록 길드 계좌를 안내해 드립니다.
          계좌 복사 시 <strong className="text-[#38d9a9]">행운 버프(LUCK +999)</strong>가 발동됩니다!
        </p>
      </div>

      {/* Groom / Bride Side Selector Tabs */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            soundEngine.playBlip(580);
            setActiveSide('groom');
          }}
          className={`pixel-btn py-2.5 text-xs sm:text-sm font-extrabold ${
            activeSide === 'groom'
              ? 'bg-[#4dabf7] text-[#120d1e]'
              : 'bg-[#19132b] text-[#a599b8]'
          }`}
        >
          ⚔️ 신랑측 계좌 ({config.accounts.groomSide.length})
        </button>

        <button
          onClick={() => {
            soundEngine.playBlip(680);
            setActiveSide('bride');
          }}
          className={`pixel-btn py-2.5 text-xs sm:text-sm font-extrabold ${
            activeSide === 'bride'
              ? 'bg-[#ff5277] text-white'
              : 'bg-[#19132b] text-[#a599b8]'
          }`}
        >
          🪄 신부측 계좌 ({config.accounts.brideSide.length})
        </button>
      </div>

      {/* Account Treasure Chest Cards */}
      <div className="space-y-2.5">
        {accounts.map((acc, idx) => {
          const key = `${activeSide}-${idx}`;
          const isCopied = copiedKey === key;

          return (
            <div
              key={key}
              className="pixel-box p-3.5 bg-[#161124] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 ${
                      activeSide === 'groom'
                        ? 'bg-[#4dabf7] text-[#120d1e]'
                        : 'bg-[#ff5277] text-white'
                    }`}
                  >
                    {acc.role}
                  </span>
                  <span className="text-sm font-extrabold text-white">
                    예금주 : {acc.name}
                  </span>
                </div>

                <div className="mt-1.5 text-xs sm:text-sm text-[#ffd541] font-bold tracking-wide">
                  [{acc.bank}] {acc.accountNumber}
                </div>
              </div>

              <button
                onClick={() => handleCopyAccount(acc, key)}
                className={`pixel-btn px-3.5 py-2 text-xs font-extrabold flex items-center justify-center gap-1.5 shrink-0 ${
                  isCopied
                    ? 'bg-[#38d9a9] text-[#120d1e]'
                    : 'bg-[#ffd541] text-[#120d1e]'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>복사 완료! (+999 LUCK)</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>계좌번호 복사</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Toast Notification when copied */}
      {copiedKey && (
        <div className="bg-[#2b4c3f] border-2 border-[#38d9a9] p-3 text-center text-xs font-extrabold text-[#fff8e7] flex items-center justify-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-[#ffd541]" />
          <span>
            🪙 띠링! 클립보드에 계좌번호가 복사되었습니다. 따뜻한 축복에 감사드립니다!
          </span>
        </div>
      )}
    </div>
  );
};
