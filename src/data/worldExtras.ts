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
  {
    id: 'secret-home-corsage',
    mapId: 'home',
    icon: '🎀',
    title: '서랍 속 하객용 실크 코사지',
    clueLabel: '창가 근처에 리본 코사지가 반짝여요',
    storyText:
      '결혼식에 참석하기 위해 미리 다려둔 손수건과 분홍빛 하객용 실크 코사지예요! 달고 가면 기분이 한층 설렙니다.',
    x: 20,
    y: 44,
  },
  {
    id: 'secret-neighborhood-clover',
    mapId: 'neighborhood',
    icon: '🍀',
    title: '가로수길 네잎클로버 꽃잎',
    clueLabel: '벤치 옆 화단에서 네잎클로버가 빛나요',
    storyText:
      '동네 가로수 벤치 옆에서 우연히 발견한 행운의 네잎클로버! 오늘 결혼하는 두 사람에게 큰 행운이 깃들 징조예요.',
    x: 68,
    y: 38,
  },
  {
    id: 'secret-station-ticket',
    mapId: 'station',
    icon: '🎫',
    title: '행운의 골든 웨딩 패스 티켓',
    clueLabel: '승강장 벤치 옆에 금빛 티켓이 반짝여요',
    storyText:
      '좌석 번호 0522가 찍힌 스페셜 웨딩행 열차 기념 승차권이에요! 소중히 간직하면 평생 좋은 인연이 함께합니다.',
    x: 45,
    y: 28,
  },
  {
    id: 'secret-train-musicbox',
    mapId: 'train',
    icon: '🎧',
    title: '차창가에 흐르는 봄날 플레이리스트',
    clueLabel: '창가 좌석 근처에서 음표가 반짝여요',
    storyText:
      '신랑·신부가 직접 고른 웨딩 식전 플레이리스트 QR 카드가 놓여 있어요! 잔잔한 피아노 선율이 귓가에 맴돕니다.',
    x: 50,
    y: 48,
  },
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
    id: 'secret-bridal-tiara',
    mapId: 'bridal',
    icon: '👑',
    title: '신부 화장대의 진주 티아라 케이스',
    clueLabel: '화장대 옆 벨벳 케이스가 빛나요',
    storyText:
      '오늘 신부를 가장 빛나게 해줄 수제 진주 티아라 보관함이에요. 뚜껑 안쪽에 “내 평생의 봄, 서연에게”라고 각인되어 있습니다.',
    x: 68,
    y: 44,
  },
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
    description: '비밀 소품 5개 발견 보상 · 머리 위에 찬란한 웨딩 왕관과 하트가 빛납니다',
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
  avatar: AvatarClassId | 'mochi' | 'groom' | 'bride';
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
    return '야옹~✨ (모찌가 신랑·신부 곁에서 신나게 폴짝 뛰어오릅니다!)';
  }

  if (npc.avatar === 'groom') {
    if (choiceId === 'greet') {
      return nextPoints >= 3
        ? '“바쁜 걸음 내어 와주셔서 정말 고맙습니다! 덕분에 오늘 세상에서 가장 행복한 신랑이에요 ♥”'
        : '“어서 오세요! 멀리서부터 저희 결혼식장까지 귀한 발걸음 해주셔서 진심으로 감사합니다!”';
    }
    if (choiceId === 'heart') {
      return '“따뜻한 덕담 평생 가슴에 새기며 서연이와 늘 봄날처럼 아끼고 살겠습니다! 🌸”';
    }
    return '“와주신 하객분들과 함께 건배!! 오늘 맛있는 식사도 꼭 즐기고 가세요! 🥂✨”';
  }

  if (npc.avatar === 'bride') {
    if (choiceId === 'greet') {
      return nextPoints >= 3
        ? '“대기실까지 찾아와 손잡아주셔서 정말 감동이에요 ♥ 우리 평생 잊지 못할 추억이 될 거예요!”'
        : '“와아~ 반가워요! 이렇게 직접 얼굴 보고 인사 나눌 수 있어서 너무 설레고 기뻐요 💐”';
    }
    if (choiceId === 'heart') {
      return '“전해주신 다정한 축복 덕분에 긴장이 사르르 녹았어요. 예쁘게 잘 살게요! 💗”';
    }
    return '“우리 꽃벽 앞에서 폴라로이드 기념사진도 꼭 함께 남겨요! 찰칵! 📸✨”';
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
    ? `“신랑 ♥ 신부 두 사람의 찬란한 앞날을 위하여, 다 함께 건배!! 🥂✨”`
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
  home: {
    title: '🏠 우리 집 출발 준비 미션',
    steps: [
      { id: 'mq-home-invite', label: '탁자 위 청첩장 확인', icon: '💌', targetX: 58, targetY: 48 },
      { id: 'mq-home-mirror', label: '전신거울 하객 의상 선택', icon: '🪞', targetX: 24, targetY: 72 },
      { id: 'mq-home-door', label: '현관문으로 출발하기', icon: '🚪', targetX: 49, targetY: 16 },
    ],
  },
  neighborhood: {
    title: '🌳 동네 가로수길 미션',
    steps: [
      { id: 'mq-nb-flower', label: '횡단보도 축하 꽃다발 챙기기', icon: '💐', targetX: 44, targetY: 52 },
      { id: 'mq-nb-cafe', label: '테라스 카페 모닝커피', icon: '☕', targetX: 56, targetY: 26 },
      { id: 'mq-nb-station', label: '우측 지하철역 입구로 이동', icon: '🚉', targetX: 88, targetY: 34 },
    ],
  },
  station: {
    title: '🚉 지하철 승강장 미션',
    steps: [
      { id: 'mq-st-route', label: '웨딩홀행 노선도 확인', icon: '🗺️', targetX: 32, targetY: 26 },
      { id: 'mq-st-secret', label: '골든 웨딩 패스 티켓 찾기', icon: '🎫', targetX: 45, targetY: 28 },
      { id: 'mq-st-board', label: '웨딩행 열차 탑승하기', icon: '🚇', targetX: 86, targetY: 52 },
    ],
  },
  train: {
    title: '🚇 웨딩행 열차 미션',
    steps: [
      { id: 'mq-tr-view', label: '차창 밖 한강 & 스냅 감상', icon: '🌉', targetX: 36, targetY: 44 },
      { id: 'mq-tr-quiz', label: '열차 내 커플 퀴즈 참여', icon: '🎮', targetX: 64, targetY: 44 },
      { id: 'mq-tr-arrive', label: '웨딩홀 역 하차하기', icon: '🌿', targetX: 89, targetY: 50 },
    ],
  },
  garden: {
    title: '🌿 웨딩 가든 도착 미션',
    steps: [
      { id: 'mq-garden-groom', label: '분수대 앞 신랑과 인사하기', icon: '🤵', targetX: 48, targetY: 62 },
      { id: 'mq-garden-bridal', label: '신부 대기실 방문하기', icon: '💐', targetX: 34, targetY: 29 },
      { id: 'mq-garden-secret', label: '우체통 비밀 소품 찾기', icon: '📮', targetX: 31, targetY: 25 },
    ],
  },
  bridal: {
    title: '💐 신부 대기실 미션',
    steps: [
      { id: 'mq-bridal-greet', label: '꽃벽 앞 신부에게 축복 인사', icon: '👰', targetX: 50, targetY: 45 },
      { id: 'mq-bridal-photo', label: '신부와 폴라로이드 촬영', icon: '📸', targetX: 50, targetY: 42 },
      { id: 'mq-bridal-secret', label: '진주 티아라 케이스 찾기', icon: '👑', targetX: 68, targetY: 44 },
    ],
  },
  chapel: {
    title: '🕊️ 본식 채플 미션',
    steps: [
      { id: 'mq-chapel-piano', label: '그랜드 피아노 연주 듣기', icon: '🎹', targetX: 24, targetY: 33 },
      { id: 'mq-chapel-altar', label: '버진로드 본식 단상 행진', icon: '🔔', targetX: 50, targetY: 32 },
      { id: 'mq-chapel-secret', label: '피아노 손글씨 악보 찾기', icon: '🎼', targetX: 32, targetY: 33 },
    ],
  },
  memory: {
    title: '🌸 사계절 산책로 미션',
    steps: [
      { id: 'mq-memory-spring', label: '첫만남 봄날 카페 방문', icon: '☕', targetX: 22, targetY: 34 },
      { id: 'mq-memory-winter', label: '통나무 다리 건너 겨울 프로포즈', icon: '💍', targetX: 76, targetY: 34 },
      { id: 'mq-memory-secret', label: '첫 봄날의 책갈피 찾기', icon: '📔', targetX: 35, targetY: 38 },
    ],
  },
  reception: {
    title: '✨ 별빛 리셉션 미션',
    steps: [
      { id: 'mq-reception-cake', label: '웨딩 케이크 샴페인 건배', icon: '🥂', targetX: 50, targetY: 58 },
      { id: 'mq-reception-tree', label: '축복의 소원나무 방명록', icon: '🌳', targetX: 50, targetY: 31 },
      { id: 'mq-reception-secret', label: '모찌 수제 마카롱 찾기', icon: '🧁', targetX: 64, targetY: 44 },
    ],
  },
};
