import React from 'react';
import {
  GARDEN_MAPS,
  COMMUTE_MAP_ORDER,
  VENUE_MAP_ORDER,
  AVATAR_CLASSES,
  GardenMapId,
  AvatarClassId,
  WeddingConfig,
} from '../data/weddingConfig';
import {
  WORLD_SECRET_PROPS,
  SECRET_AURA_REWARDS,
  SecretPropItem,
  SecretRewardId,
  ZoneMiniQuestItem,
} from '../data/worldExtras';
import { GUEST_SPRITES } from './PixelSprites';
import { soundEngine } from '../utils/soundEngine';
import { fillCoupleText } from '../utils/coupleText';
import type { WalkMode } from './VillageCanvas';

interface WorldMapSheetModalProps {
  currentMapId: GardenMapId;
  visitedMaps: Record<GardenMapId, boolean>;
  exploredMapCount: number;
  activeMiniQuest: { title: string; steps: ZoneMiniQuestItem[] };
  completedMiniQuestCount: number;
  isMiniQuestStepDone: (step: ZoneMiniQuestItem) => boolean;
  onSelectMap: (mapId: GardenMapId) => void;
  onSelectMiniQuestStep: (step: ZoneMiniQuestItem) => void;
  onClose: () => void;
}

export const WorldMapSheetModal: React.FC<WorldMapSheetModalProps> = ({
  currentMapId,
  visitedMaps,
  exploredMapCount,
  activeMiniQuest,
  completedMiniQuestCount,
  isMiniQuestStepDone,
  onSelectMap,
  onSelectMiniQuestStep,
  onClose,
}) => (
  <div
    onClick={onClose}
    className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 font-sans"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="pixel-card w-full max-w-[440px] bg-[#fffdf9] overflow-hidden animate-fadeIn"
    >
      <div className="p-3.5 bg-[#faf5ec] border-b border-[#e6d5b8] flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold text-[#c59b6d] tracking-wider">
            WEDDING WORLD MAP ({exploredMapCount}/9 MAPS)
          </div>
          <h3 className="text-sm font-bold text-[#3b2f2f] font-serif">
            🗺️ 웨딩 여정 전체 맵 & 미션 안내
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="px-2.5 py-1 rounded-full bg-[#fffdf9] border border-[#d4b48c] text-xs font-bold text-[#5c4d47]"
        >
          닫기 ✕
        </button>
      </div>

      <div className="p-3.5 space-y-3.5 max-h-[75vh] overflow-y-auto">
        {/* Stage 1: Commute Maps */}
        <div className="space-y-1.5">
          <div className="text-xs font-bold text-[#3b2f2f] flex items-center justify-between">
            <span>🏠 1막. 설레는 출발·이동길 (4맵)</span>
            <span className="text-[10px] text-[#8c7a70] font-normal">
              터치 시 해당 맵으로 즉시 이동
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {COMMUTE_MAP_ORDER.map((mapId) => {
              const m = GARDEN_MAPS[mapId];
              const isActive = currentMapId === mapId;
              const isVisited = visitedMaps[mapId];
              return (
                <button
                  key={mapId}
                  type="button"
                  onClick={() => onSelectMap(mapId)}
                  className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                    isActive
                      ? 'bg-[#d97b84] text-white border-[#b85d67] font-bold shadow-xs'
                      : isVisited
                      ? 'bg-[#faf5ec] text-[#3b2f2f] border-[#c59b6d] font-semibold'
                      : 'bg-[#fcfaf5] text-[#7d6e65] border-[#e2d4c0]'
                  }`}
                >
                  <span className="text-base">{m.icon}</span>
                  <span className="text-[11px] truncate w-full">{m.tabLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stage 2: Venue Maps */}
        <div className="space-y-1.5">
          <div className="text-xs font-bold text-[#3b2f2f]">
            🏛️ 2막. 웨딩홀 도착·본식·피로연 (5맵)
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {VENUE_MAP_ORDER.map((mapId) => {
              const m = GARDEN_MAPS[mapId];
              const isActive = currentMapId === mapId;
              const isVisited = visitedMaps[mapId];
              return (
                <button
                  key={mapId}
                  type="button"
                  onClick={() => onSelectMap(mapId)}
                  className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                    isActive
                      ? 'bg-[#d97b84] text-white border-[#b85d67] font-bold shadow-xs'
                      : isVisited
                      ? 'bg-[#faf5ec] text-[#3b2f2f] border-[#c59b6d] font-semibold'
                      : 'bg-[#fcfaf5] text-[#7d6e65] border-[#e2d4c0]'
                  }`}
                >
                  <span className="text-base">{m.icon}</span>
                  <span className="text-[10px] truncate w-full">{m.tabLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Map Mini-Quest Checklist */}
        <div className="p-3 rounded-xl bg-[#faf5ec] border border-[#e6d5b8] space-y-2">
          <div className="text-xs font-bold text-[#3b2f2f]">
            🎯 {activeMiniQuest.title} ({completedMiniQuestCount}/
            {activeMiniQuest.steps.length})
          </div>
          <div className="space-y-1.5">
            {activeMiniQuest.steps.map((step) => {
              const done = isMiniQuestStepDone(step);
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => onSelectMiniQuestStep(step)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all ${
                    done
                      ? 'bg-[#edf3ee] text-[#4d6b53] border-[#a3bfa8]'
                      : 'bg-[#fffdf9] text-[#3b2f2f] border-[#e2d4c0] hover:border-[#c59b6d]'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{done ? '✓' : step.icon}</span>
                    <span>{step.label}</span>
                  </span>
                  <span className="text-[10px] text-[#d97b84] font-bold">
                    {done ? '완료' : '이동하기 ▶'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  </div>
);

interface AvatarPickerModalProps {
  walkMode: WalkMode;
  guestNickname: string;
  guestAvatar: AvatarClassId;
  onChangeWalkMode: (mode: WalkMode) => void;
  onChangeNickname: (name: string) => void;
  onSelectAvatar: (avatar: AvatarClassId) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  walkMode,
  guestNickname,
  guestAvatar,
  onChangeWalkMode,
  onChangeNickname,
  onSelectAvatar,
  onConfirm,
  onClose,
}) => (
  <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 font-sans">
    <div className="pixel-card w-full max-w-[440px] bg-[#fffdf9] overflow-hidden animate-fadeIn">
      <div className="p-3.5 bg-[#faf5ec] border-b border-[#e6d5b8] flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold text-[#c59b6d] tracking-wider">
            CHARACTER & WALK MODE
          </div>
          <h3 className="text-sm font-bold text-[#3b2f2f] font-serif">
            🪞 하객 캐릭터 스타일링 & 산책 모드 선택
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="px-2.5 py-1 rounded-full bg-[#fffdf9] border border-[#d4b48c] text-xs font-bold text-[#5c4d47]"
        >
          닫기 ✕
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Walk Mode Switch */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playSelect();
              onChangeWalkMode('guest');
            }}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              walkMode === 'guest'
                ? 'bg-[#d97b84] text-white border-[#b85d67] font-bold shadow-xs'
                : 'bg-[#faf5ec] text-[#3b2f2f] border-[#e2d4c0]'
            }`}
          >
            <div className="text-xs font-bold">🎒 하객 주인공 모드 (기본)</div>
            <div className="text-[10px] opacity-85 mt-0.5">
              집에서 출발해 웨딩홀의 신랑·신부를 만나러 갑니다
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSelect();
              onChangeWalkMode('couple');
            }}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              walkMode === 'couple'
                ? 'bg-[#d97b84] text-white border-[#b85d67] font-bold shadow-xs'
                : 'bg-[#faf5ec] text-[#3b2f2f] border-[#e2d4c0]'
            }`}
          >
            <div className="text-xs font-bold">👫 신랑·신부 & 크림·꼬미 산책</div>
            <div className="text-[10px] opacity-85 mt-0.5">
              신랑·신부와 반려견 크림(엄마)·꼬미(딸)가 함께 산책합니다
            </div>
          </button>
        </div>

        {/* Nickname Input */}
        <div className="bg-[#faf5ec] p-3 rounded-xl border border-[#e6d5b8] space-y-1.5">
          <label className="block text-[11px] font-bold text-[#3b2f2f]">
            하객 캐릭터 머리 위 닉네임
          </label>
          <input
            type="text"
            maxLength={12}
            value={guestNickname}
            onChange={(e) => onChangeNickname(e.target.value)}
            placeholder="예: 축복의 하객, 지훈"
            className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded-lg px-3 py-1.5 text-xs text-[#3b2f2f]"
          />
        </div>

        {/* 6 Chibi Guest Avatars */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-[#3b2f2f]">
            나만의 하객 캐릭터 아바타 선택 (6종)
          </div>
          <div className="grid grid-cols-3 gap-2">
            {AVATAR_CLASSES.map((cls) => {
              const selected = guestAvatar === cls.id;
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playCoin();
                    onSelectAvatar(cls.id);
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    selected
                      ? 'bg-[#fcf0f1] border-2 border-[#d97b84] shadow-xs scale-[1.02]'
                      : 'bg-[#faf5ec] border-[#e2d4c0] hover:border-[#c59b6d]'
                  }`}
                >
                  <img
                    src={GUEST_SPRITES[cls.id].sprite}
                    alt={cls.name}
                    className="w-12 h-12 object-contain pixelated"
                  />
                  <span className="text-[11px] font-bold text-[#3b2f2f] truncate w-full text-center">
                    {cls.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className="w-full py-2.5 rounded-xl bg-[#3b2f2f] text-white text-xs font-bold shadow-sm"
        >
          이 모습으로 웨딩 여정 출발하기 ✨
        </button>
      </div>
    </div>
  </div>
);

interface SecretArchiveModalProps {
  config: WeddingConfig;
  discoveredSecrets: Record<string, boolean>;
  discoveredCount: number;
  equippedAura: SecretRewardId;
  onSelectAura: (aura: SecretRewardId) => void;
  onNavigateToSecret: (prop: SecretPropItem) => void;
  onClose: () => void;
}

export const SecretArchiveModal: React.FC<SecretArchiveModalProps> = ({
  config,
  discoveredSecrets,
  discoveredCount,
  equippedAura,
  onSelectAura,
  onNavigateToSecret,
  onClose,
}) => (
  <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
    <div className="pixel-card w-full max-w-[480px] max-h-[88vh] bg-[#f7f2e9] flex flex-col overflow-hidden animate-fadeIn font-sans">
      <div className="p-3.5 bg-[#fffdf9] border-b border-[#e6d5b8] flex items-center justify-between">
        <div>
          <div className="text-[10px] tracking-widest font-bold text-[#c59b6d]">
            WORLD SECRET ARCHIVE · {discoveredCount}/9 발견
          </div>
          <h3 className="text-sm sm:text-base font-bold text-[#3b2f2f] font-serif">
            ✨ 웨딩 월드 비밀 소품 도감 & 오라 장착
          </h3>
        </div>
        <button
          onClick={onClose}
          className="px-2.5 py-1 rounded-full bg-[#faf5ec] border border-[#d4b48c] text-xs font-bold text-[#5c4d47]"
        >
          닫기 ✕
        </button>
      </div>

      <div className="p-3.5 overflow-y-auto flex-1 space-y-4">
        {/* Equipable Aura Rewards */}
        <div className="bg-[#fffdf9] p-3 rounded-xl border border-[#e6d5b8] space-y-2">
          <div className="text-xs font-bold text-[#3b2f2f]">
            👑 캐릭터 코스메틱 오라 장착 (발견 수에 따라 해금)
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => {
                soundEngine.playSelect();
                onSelectAura('none');
              }}
              className={`p-2 rounded-lg border text-left text-xs font-bold ${
                equippedAura === 'none'
                  ? 'bg-[#3b2f2f] text-white border-[#3b2f2f]'
                  : 'bg-[#faf5ec] text-[#5c4d47] border-[#e2d4c0]'
              }`}
            >
              기본 모습 (오라 해제)
            </button>

            {SECRET_AURA_REWARDS.map((reward) => {
              const unlocked = discoveredCount >= reward.requiredCount;
              const active = equippedAura === reward.id;
              return (
                <button
                  key={reward.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => {
                    if (!unlocked) return;
                    soundEngine.playFanfare();
                    onSelectAura(reward.id);
                  }}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    active
                      ? 'bg-[#d97b84] text-white border-[#b85d67] font-bold'
                      : unlocked
                      ? 'bg-[#faf5ec] text-[#3b2f2f] border-[#c59b6d] hover:bg-[#f3e9d8] font-semibold'
                      : 'bg-[#f5efe6] text-[#b0a298] border-[#e2d4c0] opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="text-xs truncate">{reward.name}</div>
                  <div className="text-[10px] opacity-85 truncate">
                    {unlocked
                      ? '장착 가능'
                      : `비밀 ${reward.requiredCount}개 발견 필요`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 9 Secret Props List */}
        <div className="space-y-2">
          {WORLD_SECRET_PROPS.map((prop) => {
            const found = !!discoveredSecrets[prop.id];
            const mapMeta = GARDEN_MAPS[prop.mapId];
            return (
              <div
                key={prop.id}
                className={`p-3 rounded-xl border flex items-start justify-between gap-2.5 ${
                  found
                    ? 'bg-[#fffdf9] border-[#c59b6d]'
                    : 'bg-[#faf5ec] border-[#e2d4c0]'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-[#c59b6d]">
                    {mapMeta.icon} {mapMeta.tabLabel} ·{' '}
                    {found ? '✓ 발견 완료' : '미발견 힌트'}
                  </div>
                  <div className="text-xs font-bold text-[#3b2f2f] mt-0.5">
                    {prop.icon} {found ? prop.title : '??? (반짝이는 소품)'}
                  </div>
                  <p className="text-[11px] text-[#6e5d53] mt-1 leading-relaxed font-serif">
                    {found ? fillCoupleText(prop.storyText, config) : `힌트: ${prop.clueLabel}`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateToSecret(prop)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#fcf0f1] hover:bg-[#f9dfe2] border border-[#e2a3a9] text-[#b85d67] text-[10px] font-bold shrink-0"
                >
                  찾아가기 ▶
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);
