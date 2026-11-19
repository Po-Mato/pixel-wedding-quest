import React, { useState, useEffect } from 'react';
import { Copy, Check, Heart, Sparkles, ExternalLink, Send } from 'lucide-react';
import { WeddingConfig, BankAccount } from '../../data/weddingConfig';
import { soundEngine } from '../../utils/soundEngine';
import { copyTextToClipboard } from '../../utils/clipboard';
import { fireCelebrationConfetti } from '../../utils/motion';
import { showToast } from '../../utils/toast';

interface GiftSectionProps {
  config: WeddingConfig;
  initialSide?: 'groom' | 'bride';
}

export const GiftSection: React.FC<GiftSectionProps> = ({
  config,
  initialSide = 'groom',
}) => {
  const [activeSide, setActiveSide] = useState<'groom' | 'bride'>(initialSide);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState<string | null>(null);

  useEffect(() => {
    setActiveSide(initialSide);
  }, [initialSide]);

  const handleCopyAccount = async (acc: BankAccount, key: string) => {
    const cleanAccountNumber =
      acc.accountNumber.replace(/[^0-9-]/g, '').trim() || acc.accountNumber.trim();
    if (!cleanAccountNumber) return;

    soundEngine.playCoin();
    await copyTextToClipboard(cleanAccountNumber);
    setCopiedKey(key);
    setCopiedSummary(`${acc.bank} ${cleanAccountNumber} (예금주: ${acc.name})`);
    showToast(`${acc.bank} 계좌번호(${acc.name})가 복사되었습니다`);

    fireCelebrationConfetti({
      particleCount: 28,
      spread: 55,
      origin: { y: 0.75 },
    });

    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 3500);
  };

  const handleOpenToss = async (acc: BankAccount, key: string) => {
    const digitsOnly = acc.accountNumber.replace(/[^0-9]/g, '');
    const cleanAccountNumber =
      acc.accountNumber.replace(/[^0-9-]/g, '').trim() || acc.accountNumber.trim();
    if (!cleanAccountNumber) return;

    soundEngine.playCoin();
    await copyTextToClipboard(cleanAccountNumber);
    setCopiedKey(key);
    setCopiedSummary(`${acc.bank} ${cleanAccountNumber} (예금주: ${acc.name})`);
    showToast(`계좌번호 복사 완료 · 토스 송금 앱을 연결합니다`, 'info');

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile && digitsOnly) {
      const tossUrl = `supertoss://send?bank=${encodeURIComponent(acc.bank)}&accountNo=${digitsOnly}`;
      window.location.href = tossUrl;
    }
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
          style={{ order: initialSide === 'bride' ? 2 : 1 }}
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
          style={{ order: initialSide === 'bride' ? 1 : 2 }}
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
          const hasNumber = Boolean(acc.accountNumber?.trim());

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
                </div>

                <div className="mt-1.5 text-xs sm:text-sm text-[#5c4d47] font-medium tracking-wide">
                  {acc.bank} ·{' '}
                  <strong className="text-[#3b2f2f]">
                    {hasNumber ? acc.accountNumber : '계좌 정보 불러오는 중'}
                  </strong>
                </div>
              </div>

              {hasNumber && (
                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                  {acc.kakaoPayUrl && (
                    <a
                      href={acc.kakaoPayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => soundEngine.playCoin()}
                      className="px-3 py-2 rounded-lg text-xs font-bold border bg-[#fee500] hover:bg-[#f5dc00] text-[#191919] border-[#dfca00] flex items-center justify-center gap-1 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>카카오페이</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenToss(acc, key)}
                    title="계좌번호 복사 후 토스 앱 송금 화면 열기"
                    className="px-3 py-2 rounded-lg text-xs font-bold border bg-[#eef4ff] hover:bg-[#dfeaff] text-[#1b64da] border-[#bdd4ff] flex items-center justify-center gap-1 transition-all"
                  >
                    <Send className="w-3 h-3" />
                    <span>토스 송금</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyAccount(acc, key)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all flex-1 sm:flex-initial ${
                      isCopied
                        ? 'bg-[#6b9071] text-white border-[#587a5e]'
                        : 'bg-[#fffdf9] hover:bg-[#f3e9d8] text-[#5c4d47] border-[#d4b48c]'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>번호 복사됨</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#c59b6d]" />
                        <span>계좌번호 복사</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {copiedKey && (
        <div className="bg-[#edf3ee] border border-[#a3bfa8] rounded-lg p-3 text-center text-xs font-sans font-medium text-[#3b5249] flex flex-col items-center justify-center gap-1 animate-fadeIn">
          <div className="flex items-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#6b9071]" />
            <span>은행 앱에 바로 붙여넣을 수 있도록 계좌번호만 복사되었습니다.</span>
          </div>
          {copiedSummary && (
            <span className="text-[11px] text-[#4d6b53]">{copiedSummary}</span>
          )}
        </div>
      )}
    </div>
  );
};
