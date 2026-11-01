import { AvatarClassId, GardenMapId } from './weddingConfig';

export type SecretRewardId = 'none' | 'petal_aura' | 'lantern_aura' | 'wedding_crown';

export interface SecretPropItem {
  id: string;
  mapId: GardenMapId;
  icon: string;
  title: string;
  clueLabel: string;
  storyText: string;
  x: number;
  y: number;
}

export interface SecretAuraReward {
  id: SecretRewardId;
  name: string;
  icon: string;
  requiredCount: number;
  description: string;
}

export const WORLD_SECRET_PROPS: SecretPropItem[] = [
  // 1. Garden (2 secrets)
  {
    id: 'secret-garden-mailbox',
    mapId: 'garden',
    icon: '📮',
    title: '로즈 가든 우체통의 첫 청첩장',
    clueLabel: '우체통이 은은하게 반짝여요',
    storyText:
      '우체통 안에 첫 청첩장 교정본이 들어있어요! 문구를 고르며 밤새 설레어하던 두 사람의 메모가 적혀 있습니다.',
    x: 31,
    y: 25,
  },
  {
    id: 'secret-garden-bench',
    mapId: 'garden',
    icon: '🌿',
    title: '벚꽃 나무 아래 M ♥ S 이니셜',
    clueLabel: '나무 그늘 아래 무언가 빛나요',
    storyText:
      '웨딩 스냅 촬영 날 잠시 쉬어가던 정원 쉼터예요. 작은 나무 팻말에 “민준 ♥ 서연, 늘 봄날처럼”이라고 적혀 있어요.',
    x: 69,
    y: 71,
  },
  // 2. Chapel (2 secrets)
  {
    id: 'secret-chapel-sheetmusic',
    mapId: 'chapel',
    icon: '🎼',
    title: '피아노 위의 손글씨 악보',
    clueLabel: '악보 가장자리가 금빛으로 빛나요',
    storyText:
      '화이트 그랜드 피아노 악보 귀퉁이에 “떨지 말고 천천히 걸어오기 ♥”라는 신랑의 다정한 응원 메모가 적혀 있어요.',
    x: 32,
    y: 33,
  },
  {
    id: 'secret-chapel-bouquet',
    mapId: 'chapel',
    icon: '💐',
    title: '신부의 피치 로즈 부케 리본함',
    clueLabel: '부케 리본함이 향기롭게 반짝여요',
    storyText:
      '신부가 직접 고른 실크 리본과 생화 부토니에 보관함이에요. 은은한 장미 향기가 온실 가득 퍼집니다.',
    x: 68,
    y: 33,
  },
  // 3. Memory Lane (2 secrets)
  {
    id: 'secret-memory-receipt',
    mapId: 'memory',
    icon: '📔',
    title: '2023년 첫 봄날의 카페 책갈피',
    clueLabel: '작은 다이어리가 빛나고 있어요',
    storyText:
      '처음 만나 6시간 동안 수다를 떨었던 날의 영수증이 코팅되어 책갈피로 끼워져 있어요! 잊지 못할 첫 페이지입니다.',
    x: 35,
    y: 38,
  },
  {
    id: 'secret-memory-snowglobe',
    mapId: 'memory',
    icon: '🔮',
    title: '겨울밤 프로포즈 오르골 스노우볼',
    clueLabel: '눈꽃 스노우볼이 반짝여요',
    storyText:
      '반지를 건네던 겨울밤 테이블 위에 놓여 있던 스노우볼이에요. 살짝 흔들면 하얀 눈꽃과 별빛이 춤을 춥니다.',
    x: 65,
    y: 38,
  },
  // 4. Reception (2 secrets)
  {
    id: 'secret-reception-lantern',
    mapId: 'reception',
    icon: '🏮',
    title: '소원나무 아래 첫 번째 소원등',
    clueLabel: '황금빛 소원등이 따뜻하게 빛나요',
    storyText:
      '두 사람이 가장 먼저 걸어둔 소원 쪽지: “오늘 귀한 걸음 해주신 모든 분들의 사계절이 늘 행복하기를 바랍니다.”',
    x: 36,
    y: 26,
  },
  {
    id: 'secret-reception-macaron',
    mapId: 'reception',
    icon: '🧁',
    title: '반려묘 모찌 모양 수제 마카롱',
    clueLabel: '디저트 트레이가 달콤하게 반짝여요',
    storyText:
      '파티시에가 반려묘 ‘모찌’ 얼굴 모양으로 구워준 스페셜 마카롱이에요! 쫑긋한 귀와 핑크 리본까지 똑 닮았어요.',
    x: 64,
    y: 44,
  },
];

export const SECRET_AURA_REWARDS: SecretAuraReward[] = [
  {
    id: 'petal_aura',
    name: '🌸 봄날 꽃잎 오라',
    icon: '🌸',
    requiredCount: 1,
    description: '비밀 소품 1개 발견 보상 · 캐릭터 주변에 분홍 벚꽃잎이 빙글빙글 춤춥니다',
  },
  {
    id: 'lantern_aura',
    name: '🏮 별빛 등불 오라',
    icon: '🏮',
    requiredCount: 3,
    description: '비밀 소품 3개 발견 보상 · 발밑에 따뜻한 황금빛 마법진과 등불 구체가 감돕니다',
  },
  {
    id: 'wedding_crown',
    name: '👑 로얄 웨딩 화관',
    icon: '👑',
    requiredCount: 5,
    description: '비밀 소품 5개 발견 보상 · 신랑·신부 머리 위에 찬란한 웨딩 왕관과 하트가 빛납니다',
  },
];

export type NpcChoiceId = 'greet' | 'heart' | 'celebrate';

export interface NpcDialogueChoice {
  id: NpcChoiceId;
  label: string;
  emoji: string;
}

export const NPC_DIALOGUE_CHOICES: NpcDialogueChoice[] = [
  { id: 'greet', label: '👋 반갑게 인사하기', emoji: '👋' },
  { id: 'heart', label: '💗 따뜻한 덕담하기', emoji: '❤️' },
  { id: 'celebrate', label: '🥂 힘찬 축하 건배', emoji: '🥂' },
];

export interface ActiveNpcTarget {
  id: string;
  name: string;
  roleTitle: string;
  avatar: AvatarClassId | 'mochi';
  initialMessage: string;
  x: number;
  y: number;
}

export function getAffinityStageLabel(points: number): {
  level: number;
  label: string;
  hearts: string;
} {
  if (points >= 3) {
    return { level: 3, label: '평생의 단짝 하객', hearts: '♥♥♥' };
  }
  if (points === 2) {
    return { level: 2, label: '다정한 축복 메이트', hearts: '♥♥♡' };
  }
  return { level: 1, label: '반가운 첫 만남', hearts: '♥♡♡' };
}

export function resolveNpcAffinityReply(
  npc: ActiveNpcTarget,
  choiceId: NpcChoiceId,
  nextPoints: number
): string {
  if (npc.avatar === 'mochi') {
    if (choiceId === 'greet') {
      return nextPoints >= 3
        ? '야옹~♥ (모찌가 골골송을 부르며 발치에 애교를 부립니다!)'
        : '야옹! (모찌가 분홍 리본 방울을 딸랑이며 반갑게 꼬리를 흔들어요!)';
    }
    if (choiceId === 'heart') {
      return '골골골...🐾 (모찌가 따뜻한 손길에 기분이 좋아 눈을 반달처럼 접었어요!)';
    }
    return '야옹~✨ (모찌가 신랑·신부 사이에서 신나게 폴짝 뛰어오릅니다!)';
  }

  if (choiceId === 'greet') {
    return nextPoints >= 3
      ? `“여러 번 다정하게 인사 건네주셔서 정말 반가워요! 오늘 최고의 하객이세요 ♥”`
      : `“안녕하세요! 날씨도 정원도 너무 아름답죠? 함께 축복할 수 있어 기뻐요!”`;
  }
  if (choiceId === 'heart') {
    return nextPoints >= 3
      ? `“따뜻한 마음이 신랑·신부에게 그대로 전해졌을 거예요. 평생 행복할 거예요!”`
      : `“이렇게 정성스러운 축하의 마음을 나눠주셔서 감사해요 🌸”`;
  }
  return nextPoints >= 3
    ? `“민준 ♥ 서연 두 사람의 찬란한 앞날을 위하여, 다 함께 건배!! 🥂✨”`
    : `“와아~ 오늘 결혼식 분위기가 한층 더 밝아졌어요! 축하합니다! 🎉”`;
}

export interface ZoneMiniQuestItem {
  id: string;
  label: string;
  icon: string;
  targetX: number;
  targetY: number;
}

export const ZONE_MINI_QUESTS: Record<
  GardenMapId,
  { title: string; steps: ZoneMiniQuestItem[] }
> = {
  garden: {
    title: '🌿 웨딩 가든 산책 미션',
    steps: [
      {
        id: 'mq-garden-story',
        label: '모시는 글 파빌리온 방문',
        icon: '💌',
        targetX: 15,
        targetY: 26,
      },
      {
        id: 'mq-garden-secret',
        label: '반짝이는 우체통 비밀 찾기',
        icon: '📮',
        targetX: 31,
        targetY: 25,
      },
      {
        id: 'mq-garden-npc',
        label: '하객 또는 모찌와 대화하기',
        icon: '💬',
        targetX: 44,
        targetY: 68,
      },
    ],
  },
  chapel: {
    title: '🕊️ 본식 채플 미션',
    steps: [
      {
        id: 'mq-chapel-piano',
        label: '그랜드 피아노 연주 듣기',
        icon: '🎹',
        targetX: 24,
        targetY: 33,
      },
      {
        id: 'mq-chapel-altar',
        label: '버진로드 본식 단상 행진',
        icon: '🔔',
        targetX: 50,
        targetY: 32,
      },
      {
        id: 'mq-chapel-secret',
        label: '채플 숨겨진 소품 찾기',
        icon: '🎼',
        targetX: 32,
        targetY: 33,
      },
    ],
  },
  memory: {
    title: '🌸 사계절 산책로 미션',
    steps: [
      {
        id: 'mq-memory-spring',
        label: '첫만남 봄날 카페 방문',
        icon: '☕',
        targetX: 22,
        targetY: 34,
      },
      {
        id: 'mq-memory-winter',
        label: '통나무 다리 건너 겨울 프로포즈',
        icon: '💍',
        targetX: 76,
        targetY: 34,
      },
      {
        id: 'mq-memory-secret',
        label: '산책로 숨겨진 소품 찾기',
        icon: '📔',
        targetX: 35,
        targetY: 38,
      },
    ],
  },
  reception: {
    title: '✨ 별빛 리셉션 미션',
    steps: [
      {
        id: 'mq-reception-cake',
        label: '웨딩 케이크 샴페인 건배',
        icon: '🥂',
        targetX: 50,
        targetY: 58,
      },
      {
        id: 'mq-reception-tree',
        label: '축복의 소원나무 방명록',
        icon: '🌳',
        targetX: 50,
        targetY: 31,
      },
      {
        id: 'mq-reception-secret',
        label: '리셉션 숨겨진 소품 찾기',
        icon: '🏮',
        targetX: 36,
        targetY: 26,
      },
    ],
  },
};
