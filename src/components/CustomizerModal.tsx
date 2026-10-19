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
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 overflow-y-auto">
      <div className="pixel-box-gold w-full max-w-lg bg-[#19132b] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-3.5 bg-[#261e3d] border-b-2 border-[#ffd541] flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#ffd541]">
            <Wrench className="w-4 h-4" />
            <span>🛠️ 청첩장 실시간 커스텀 에디터 (DEV MODE)</span>
          </div>
          <button
            onClick={onClose}
            className="pixel-btn bg-[#ff5277] text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 space-y-4 overflow-y-auto text-xs">
          <p className="text-[#c3b8d9] bg-[#120d1e] p-2.5 border border-[#362b52]">
            💡 신랑·신부 성함, 예식일, 웨딩홀 정보를 수정하면 맵과 청첩장 전체에 즉시 반영되며 브라우저에 자동 저장됩니다. (영구 반영은 <code>src/data/weddingConfig.ts</code> 수정)
          </p>

          {/* Groom & Bride Names */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#120d1e] p-3 border border-[#4dabf7]/50 space-y-2">
              <div className="font-extrabold text-[#4dabf7]">⚔️ 신랑 정보</div>
              <div>
                <label className="block text-[10px] text-[#a599b8]">이름 (약칭)</label>
                <input
                  type="text"
                  value={draft.groom.name}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      groom: { ...draft.groom, name: e.target.value },
                    })
                  }
                  className="w-full bg-[#1f1833] border border-[#3d315e] px-2 py-1 text-white mt-0.5"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#a599b8]">전체 성함</label>
                <input
                  type="text"
                  value={draft.groom.fullName}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      groom: { ...draft.groom, fullName: e.target.value },
                    })
                  }
                  className="w-full bg-[#1f1833] border border-[#3d315e] px-2 py-1 text-white mt-0.5"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#a599b8]">턱시도 컬러</label>
                <input
                  type="color"
                  value={draft.groom.suitColor}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      groom: { ...draft.groom, suitColor: e.target.value },
                    })
                  }
                  className="w-full h-7 bg-[#1f1833] border border-[#3d315e] mt-0.5 cursor-pointer"
                />
              </div>
            </div>

            <div className="bg-[#120d1e] p-3 border border-[#ff5277]/50 space-y-2">
              <div className="font-extrabold text-[#ff5277]">🪄 신부 정보</div>
              <div>
                <label className="block text-[10px] text-[#a599b8]">이름 (약칭)</label>
                <input
                  type="text"
                  value={draft.bride.name}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      bride: { ...draft.bride, name: e.target.value },
                    })
                  }
                  className="w-full bg-[#1f1833] border border-[#3d315e] px-2 py-1 text-white mt-0.5"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#a599b8]">전체 성함</label>
                <input
                  type="text"
                  value={draft.bride.fullName}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      bride: { ...draft.bride, fullName: e.target.value },
                    })
                  }
                  className="w-full bg-[#1f1833] border border-[#3d315e] px-2 py-1 text-white mt-0.5"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#a599b8]">헤어 컬러</label>
                <input
                  type="color"
                  value={draft.bride.hairColor}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      bride: { ...draft.bride, hairColor: e.target.value },
                    })
                  }
                  className="w-full h-7 bg-[#1f1833] border border-[#3d315e] mt-0.5 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Wedding Date & Venue */}
          <div className="bg-[#120d1e] p-3 border border-[#ffd541]/40 space-y-2.5">
            <div className="font-extrabold text-[#ffd541]">🏰 예식 일시 & 장소</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[#a599b8]">표시 날짜</label>
                <input
                  type="text"
                  value={draft.wedding.dateDisplay}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      wedding: { ...draft.wedding, dateDisplay: e.target.value },
                    })
                  }
                  className="w-full bg-[#1f1833] border border-[#3d315e] px-2 py-1 text-white mt-0.5"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#a599b8]">표시 시간</label>
                <input
                  type="text"
                  value={draft.wedding.timeDisplay}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      wedding: { ...draft.wedding, timeDisplay: e.target.value },
                    })
                  }
                  className="w-full bg-[#1f1833] border border-[#3d315e] px-2 py-1 text-white mt-0.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[#a599b8]">웨딩홀 이름</label>
                <input
                  type="text"
                  value={draft.wedding.venueName}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      wedding: { ...draft.wedding, venueName: e.target.value },
                    })
                  }
                  className="w-full bg-[#1f1833] border border-[#3d315e] px-2 py-1 text-white mt-0.5"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#a599b8]">단독홀/층수</label>
                <input
                  type="text"
                  value={draft.wedding.hallName}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      wedding: { ...draft.wedding, hallName: e.target.value },
                    })
                  }
                  className="w-full bg-[#1f1833] border border-[#3d315e] px-2 py-1 text-white mt-0.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#a599b8]">도로명 주소</label>
              <input
                type="text"
                value={draft.wedding.addressRoad}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    wedding: { ...draft.wedding, addressRoad: e.target.value },
                  })
                }
                className="w-full bg-[#1f1833] border border-[#3d315e] px-2 py-1 text-white mt-0.5"
              />
            </div>
          </div>

          {/* Headline */}
          <div className="bg-[#120d1e] p-3 border border-[#38d9a9]/40 space-y-2">
            <div className="font-extrabold text-[#38d9a9]">📜 초대장 메인 타이틀</div>
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
              className="w-full bg-[#1f1833] border border-[#3d315e] px-2 py-1.5 text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="pixel-btn bg-[#2e2448] text-[#ff8787] px-3 py-2 font-bold flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 기본값 복원
              </button>
              <button
                type="button"
                onClick={handleCopyJson}
                className="pixel-btn bg-[#2e2448] text-[#ffd541] px-3 py-2 font-bold flex items-center gap-1"
              >
                {copiedJson ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> JSON 복사됨
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
              className="pixel-btn bg-[#38d9a9] text-[#120d1e] px-5 py-2 font-extrabold flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> 변경사항 적용하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
