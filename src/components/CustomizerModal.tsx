import React, { useState } from 'react';
import { X, Save, RotateCcw, Copy, Check, Wrench } from 'lucide-react';
import { WeddingConfig, DEFAULT_WEDDING_CONFIG } from '../data/weddingConfig';
import { soundEngine } from '../utils/soundEngine';

interface CustomizerModalProps {
  config: WeddingConfig;
  onUpdateConfig: (newConfig: WeddingConfig) => void;
  onClose: () => void;
}

export const CustomizerModal: React.FC<CustomizerModalProps> = ({
  config,
  onUpdateConfig,
  onClose,
}) => {
  const [draft, setDraft] = useState<WeddingConfig>(config);
  const [copiedJson, setCopiedJson] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playFanfare();
    onUpdateConfig(draft);
    onClose();
  };

  const handleReset = () => {
    soundEngine.playBlip(400);
    setDraft(DEFAULT_WEDDING_CONFIG);
    onUpdateConfig(DEFAULT_WEDDING_CONFIG);
  };

  const handleCopyJson = () => {
    soundEngine.playCoin();
    navigator.clipboard?.writeText(JSON.stringify(draft, null, 2)).catch(() => {});
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto font-sans">
      <div className="pixel-card w-full max-w-lg bg-[#fffdf9] max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 bg-[#faf5ec] border-b border-[#e6d5b8] flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-[#3b2f2f]">
            <Wrench className="w-4 h-4 text-[#c59b6d]" />
            <span>청첩장 정보 실시간 편집</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#fffdf9] border border-[#e2d4c0] text-[#7d6e65]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-4 overflow-y-auto text-xs">
          <p className="text-[#5c4d47] bg-[#faf5ec] p-3 rounded-lg border border-[#e6d5b8]">
            💡 신랑·신부 성함, 예식일, 웨딩홀 정보를 수정하면 일반 청첩장과 픽셀 정원 모두에 즉시 반영됩니다.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#faf5ec] p-3 rounded-lg border border-[#e6d5b8] space-y-2">
              <div className="font-bold text-[#3b2f2f]">신랑 정보</div>
              <div>
                <label className="block text-[10px] text-[#8c7a70]">이름 (약칭)</label>
                <input
                  type="text"
                  value={draft.groom.name}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      groom: { ...draft.groom, name: e.target.value },
                    })
                  }
                  className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 text-[#3b2f2f] mt-0.5"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#8c7a70]">전체 성함</label>
                <input
                  type="text"
                  value={draft.groom.fullName}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      groom: { ...draft.groom, fullName: e.target.value },
                    })
                  }
                  className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 text-[#3b2f2f] mt-0.5"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#8c7a70]">턱시도 컬러</label>
                <input
                  type="color"
                  value={draft.groom.suitColor}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      groom: { ...draft.groom, suitColor: e.target.value },
                    })
                  }
                  className="w-full h-7 bg-[#fffdf9] border border-[#d4b48c] rounded mt-0.5 cursor-pointer"
                />
              </div>
            </div>

            <div className="bg-[#faf5ec] p-3 rounded-lg border border-[#e6d5b8] space-y-2">
              <div className="font-bold text-[#b85d67]">신부 정보</div>
              <div>
                <label className="block text-[10px] text-[#8c7a70]">이름 (약칭)</label>
                <input
                  type="text"
                  value={draft.bride.name}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      bride: { ...draft.bride, name: e.target.value },
                    })
                  }
                  className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 text-[#3b2f2f] mt-0.5"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#8c7a70]">전체 성함</label>
                <input
                  type="text"
                  value={draft.bride.fullName}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      bride: { ...draft.bride, fullName: e.target.value },
                    })
                  }
                  className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 text-[#3b2f2f] mt-0.5"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#8c7a70]">헤어 컬러</label>
                <input
                  type="color"
                  value={draft.bride.hairColor}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      bride: { ...draft.bride, hairColor: e.target.value },
                    })
                  }
                  className="w-full h-7 bg-[#fffdf9] border border-[#d4b48c] rounded mt-0.5 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#faf5ec] p-3 rounded-lg border border-[#e6d5b8] space-y-2.5">
            <div className="font-bold text-[#3b2f2f]">예식 일시 & 웨딩홀</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[#8c7a70]">표시 날짜</label>
                <input
                  type="text"
                  value={draft.wedding.dateDisplay}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      wedding: { ...draft.wedding, dateDisplay: e.target.value },
                    })
                  }
                  className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 text-[#3b2f2f] mt-0.5"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#8c7a70]">표시 시간</label>
                <input
                  type="text"
                  value={draft.wedding.timeDisplay}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      wedding: { ...draft.wedding, timeDisplay: e.target.value },
                    })
                  }
                  className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 text-[#3b2f2f] mt-0.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[#8c7a70]">웨딩홀 이름</label>
                <input
                  type="text"
                  value={draft.wedding.venueName}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      wedding: { ...draft.wedding, venueName: e.target.value },
                    })
                  }
                  className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 text-[#3b2f2f] mt-0.5"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#8c7a70]">단독홀/층수</label>
                <input
                  type="text"
                  value={draft.wedding.hallName}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      wedding: { ...draft.wedding, hallName: e.target.value },
                    })
                  }
                  className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 text-[#3b2f2f] mt-0.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#8c7a70]">도로명 주소</label>
              <input
                type="text"
                value={draft.wedding.addressRoad}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    wedding: { ...draft.wedding, addressRoad: e.target.value },
                  })
                }
                className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 text-[#3b2f2f] mt-0.5"
              />
            </div>
          </div>

          <div className="bg-[#faf5ec] p-3 rounded-lg border border-[#e6d5b8] space-y-2">
            <div className="font-bold text-[#3b2f2f]">초대장 메인 문구</div>
            <input
              type="text"
              value={draft.invitationMessage.headline}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  invitationMessage: {
                    ...draft.invitationMessage,
                    headline: e.target.value,
                  },
                })
              }
              className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1.5 text-[#3b2f2f]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 rounded-lg bg-[#faf5ec] border border-[#d4b48c] text-[#7d6e65] font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 기본값 복원
              </button>
              <button
                type="button"
                onClick={handleCopyJson}
                className="px-3 py-2 rounded-lg bg-[#faf5ec] border border-[#d4b48c] text-[#5c4d47] font-semibold flex items-center gap-1"
              >
                {copiedJson ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#6b9071]" /> 복사 완료
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> JSON 복사
                  </>
                )}
              </button>
            </div>

            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#d97b84] text-white font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" /> 적용하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
