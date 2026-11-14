import React, { useState } from 'react';
import { Copy, Check, Heart, Sparkles, ExternalLink, AlertCircle } from 'lucide-react';
import { WeddingConfig, BankAccount } from '../../data/weddingConfig';
import { soundEngine } from '../../utils/soundEngine';
import { copyTextToClipboard } from '../../utils/clipboard';
import { fireCelebrationConfetti } from '../../utils/motion';
import { isSampleAccountNumber } from '../../utils/weddingPhase';

interface GiftSectionProps {
  config: WeddingConfig;
}

export const GiftSection: React.FC<GiftSectionProps> = ({ config }) => {
  const [activeSide, setActiveSide] = useState<'groom' | 'bride'>('groom');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyAccount = async (acc: BankAccount, key: string) => {
    if (
      isSampleAccountNumber(acc.accountNumber) &&
      !window.confirm(
        '현재 표시된 계좌번호는 청첩장 제작용 예시 번호입니다.\n실제 송금 전 예금주와 계좌번호를 꼭 확인해 주세요. 번호를 복사하시겠습니까?'
      )
    ) {
      return;
    }
    soundEngine.playCoin();
    const textToCopy = `${acc.bank} ${acc.accountNumber}`;
    await copyTextToClipboard(textToCopy);
    setCopiedKey(key);

    fireCelebrationConfetti({
      particleCount: 28,
      spread: 55,
      origin: { y: 0.75 },
    });

    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 3000);
  };

  const accounts =
    activeSide === 'groom' ? config.accounts.groomSide : config.accounts.brideSide;
  const hasAnySample = accounts.some((a) => isSampleAccountNumber(a.accountNumber));

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
      {hasAnySample && (
        <div className="bg-[#fff8ed] border border-[#e6c994] rounded-xl p-3 text-[11px] font-sans text-[#7a5824] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-[#c88a2e] shrink-0 mt-0.5" />
          <span>
            현재 일부 계좌번호가 <strong>예시 번호</strong>로 표시되어 있습니다. 실제 계좌번호는 예식 전 순차적으로 업데이트될 예정입니다.
          </span>
        </div>
      )}

      <div className="space-y-2.5 font-sans">
        {accounts.map((acc, idx) => {
          const key = `${activeSide}-${idx}`;
          const isCopied = copiedKey === key;
          const isSample = isSampleAccountNumber(acc.accountNumber);

          return (
            <div
              key={key}
              className="bg-[#faf5ec] border border-[#e6d5b8] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
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
                  {isSample && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#fff3dc] border border-[#e6c994] text-[#8a6220] font-semibold">
                      예시 번호
                    </span>
                  )}
                </div>

                <div className="mt-1.5 text-xs sm:text-sm text-[#5c4d47] font-medium tracking-wide">
                  {acc.bank} · <strong className="text-[#3b2f2f]">{acc.accountNumber}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {acc.kakaoPayUrl && (
                  <a
                    href={acc.kakaoPayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => soundEngine.playCoin()}
                    className="px-3.5 py-2 rounded-lg text-xs font-bold border bg-[#fee500] hover:bg-[#f5dc00] text-[#191919] border-[#dfca00] flex items-center justify-center gap-1 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>카카오페이</span>
                  </a>
                )}

                <button
                  onClick={() => handleCopyAccount(acc, key)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all flex-1 sm:flex-initial ${
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
