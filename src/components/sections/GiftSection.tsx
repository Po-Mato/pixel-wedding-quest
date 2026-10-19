import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Copy, Check, Heart, Sparkles } from 'lucide-react';
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
        particleCount: 28,
        spread: 55,
        origin: { y: 0.75 },
        colors: ['#e899a0', '#d4af7a', '#84a98c'],
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 3000);
  };

  const accounts =
    activeSide === 'groom' ? config.accounts.groomSide : config.accounts.brideSide;

  return (
    <div className="pixel-card p-5 sm:p-6 bg-[#fffdf9] space-y-5">
      {/* Header */}
      <div className="text-center border-b border-[#efe6d8] pb-4">
        <div className="text-[11px] tracking-[0.25em] text-[#c59b6d] font-engSerif uppercase">
          BLESSING
        </div>
        <h3 className="text-base sm:text-lg font-bold text-[#3b2f2f] mt-1 flex items-center justify-center gap-1.5">
          <Heart className="w-4 h-4 text-[#d97b84]" />
          <span>마음 전하실 곳</span>
        </h3>
        <p className="text-xs text-[#7d6e65] mt-2 leading-relaxed break-keep">
          참석이 어려우신 분들을 위해 감사히 계좌번호를 함께 안내해 드립니다.
          보내주시는 따뜻한 축복의 마음, 평생 소중히 간직하겠습니다.
        </p>
      </div>

      {/* Groom / Bride Tabs */}
      <div className="grid grid-cols-2 gap-2 font-sans">
        <button
          onClick={() => {
            soundEngine.playBlip(580);
            setActiveSide('groom');
          }}
          className={`py-2.5 rounded-lg text-xs sm:text-sm font-bold border transition-colors ${
            activeSide === 'groom'
              ? 'bg-[#3b2f2f] text-white border-[#3b2f2f]'
              : 'bg-[#faf5ec] text-[#7d6e65] border-[#e2d4c0]'
          }`}
        >
          신랑측 계좌번호 보기
        </button>

        <button
          onClick={() => {
            soundEngine.playBlip(680);
            setActiveSide('bride');
          }}
          className={`py-2.5 rounded-lg text-xs sm:text-sm font-bold border transition-colors ${
            activeSide === 'bride'
              ? 'bg-[#d97b84] text-white border-[#d97b84]'
              : 'bg-[#faf5ec] text-[#7d6e65] border-[#e2d4c0]'
          }`}
        >
          신부측 계좌번호 보기
        </button>
      </div>

      {/* Account List */}
      <div className="space-y-2.5 font-sans">
        {accounts.map((acc, idx) => {
          const key = `${activeSide}-${idx}`;
          const isCopied = copiedKey === key;

          return (
            <div
              key={key}
              className="bg-[#faf5ec] border border-[#e6d5b8] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      activeSide === 'groom'
                        ? 'bg-[#e6ebe8] text-[#3b5249]'
                        : 'bg-[#f9ebea] text-[#b85d67]'
                    }`}
                  >
                    {acc.role}
                  </span>
                  <span className="text-sm font-bold text-[#3b2f2f]">
                    예금주 : {acc.name}
                  </span>
                </div>

                <div className="mt-1.5 text-xs sm:text-sm text-[#5c4d47] font-medium tracking-wide">
                  {acc.bank} · <strong className="text-[#3b2f2f]">{acc.accountNumber}</strong>
                </div>
              </div>

              <button
                onClick={() => handleCopyAccount(acc, key)}
                className={`px-4 py-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 shrink-0 transition-all ${
                  isCopied
                    ? 'bg-[#6b9071] text-white border-[#587a5e]'
                    : 'bg-[#fffdf9] hover:bg-[#f3e9d8] text-[#5c4d47] border-[#d4b48c]'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>복사되었습니다</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#c59b6d]" />
                    <span>계좌번호 복사</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {copiedKey && (
        <div className="bg-[#edf3ee] border border-[#a3bfa8] rounded-lg p-3 text-center text-xs font-sans font-medium text-[#3b5249] flex items-center justify-center gap-1.5 animate-fadeIn">
          <Sparkles className="w-3.5 h-3.5 text-[#6b9071]" />
          <span>클립보드에 계좌번호가 복사되었습니다. 따뜻한 축복에 감사드립니다.</span>
        </div>
      )}
    </div>
  );
};
