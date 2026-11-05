import rawWeddingData from './wedding.json';

export type QuestBuildingId =
  | 'story'
  | 'ceremony'
  | 'gallery'
  | 'location'
  | 'gift'
  | 'rsvp'
  | 'minigame';

export type GardenMapId =
  | 'home'
  | 'neighborhood'
  | 'station'
  | 'train'
  | 'garden'
  | 'bridal'
  | 'chapel'
  | 'memory'
  | 'reception';

export interface MapLandmark {
  id: string;
  questId?: QuestBuildingId;
  specialAction?:
    | 'virgin_road'
    | 'piano_melody'
    | 'memory_spring'
    | 'memory_autumn'
    | 'memory_winter'
    | 'cake_toast'
    | 'avatar_mirror'
    | 'street_cafe'
    | 'flower_stand'
    | 'station_bench'
    | 'bridal_photo';
  name: string;
  shortName: string;
  npcName: string;
  badge: string;
  x: number;
  y: number;
  color: string;
  description: string;
  storySnippet?: string;
}

export interface MapPortal {
  id: string;
  targetMap: GardenMapId;
  label: string;
  direction: 'north' | 'south' | 'east' | 'west';
  x: number;
  y: number;
  spawnX: number;
  spawnY: number;
}

export interface GardenMapConfig {
  id: GardenMapId;
  stage: 'commute' | 'venue';
  tabLabel: string;
  icon: string;
  title: string;
  subtitle: string;
  particleType: 'petals' | 'sunbeams' | 'seasons' | 'fireflies';
  defaultSpawn: { x: number; y: number };
  landmarks: MapLandmark[];
  portals: MapPortal[];
}

export type AvatarClassId = 'knight' | 'mage' | 'archer' | 'bard' | 'healer' | 'cat';

export interface GuestbookEntry {
  id: string;
  name: string;
  avatar: AvatarClassId;
  side: 'groom' | 'bride' | 'both';
  titleBadge: string;
  message: string;
  createdAt: string;
  attendance?: 'attend' | 'maybe' | 'unable';
  companions?: number;
  meal?: 'yes' | 'no' | 'undecided';
}

export interface GalleryItem {
  id: string;
  title: string;
  subtitle: string;
  seasonTag: string;
  questExp: string;
  imageUrl: string;
  pixelTheme: 'cherry_blossom' | 'starry_camp' | 'sunset_beach' | 'royal_castle' | 'autumn_cafe' | 'snow_village';
  description: string;
  initialLikes: number;
}

export interface BankAccount {
  role: string;
  name: string;
  bank: string;
  accountNumber: string;
  kakaoPayUrl?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface WeddingConfig {
  gameTitle: string;
  versionTag: string;
  groom: {
    name: string;
    fullName: string;
    jobClass: string;
    level: number;
    mbti: string;
    specialSkill: string;
    quote: string;
    fatherName: string;
    motherName: string;
    relation: string;
    phone: string;
    fatherPhone: string;
    motherPhone: string;
    suitColor: string;
    hairColor: string;
    stats: { label: string; value: number; max: number }[];
  };
  bride: {
    name: string;
    fullName: string;
    jobClass: string;
    level: number;
    mbti: string;
    specialSkill: string;
    quote: string;
    fatherName: string;
    motherName: string;
    relation: string;
    phone: string;
    fatherPhone: string;
    motherPhone: string;
    dressColor: string;
    hairColor: string;
    stats: { label: string; value: number; max: number }[];
  };
  pet: {
    name: string;
    title: string;
  };
  wedding: {
    dateISO: string;
    dateDisplay: string;
    timeDisplay: string;
    year: number;
    month: number;
    day: number;
    dayOfWeek: string;
    venueName: string;
    hallName: string;
    addressRoad: string;
    addressJibun: string;
    tel: string;
    lat: number;
    lng: number;
    subwayGuide: string[];
    busGuide: string[];
    parkingGuide: string[];
    shuttleGuide: string;
  };
  invitationMessage: {
    headline: string;
    paragraphs: string[];
    questObjective: string;
  };
  storyLog: {
    chapter: string;
    date: string;
    title: string;
    desc: string;
    badge: string;
  }[];
  gallery: GalleryItem[];
  accounts: {
    groomSide: BankAccount[];
    brideSide: BankAccount[];
  };
  quiz: QuizQuestion[];
  initialGuestbook: GuestbookEntry[];
}

export const AVATAR_CLASSES: {
  id: AvatarClassId;
  name: string;
  roleDesc: string;
  color: string;
}[] = [
  { id: 'knight', name: '젠틀 가드너', roleDesc: '든든한 축복과 따뜻한 미소', color: '#749bc2' },
  { id: 'mage', name: '블라썸 요정', roleDesc: '두 사람의 앞날에 꽃잎 선물', color: '#d97b84' },
  { id: 'archer', name: '스냅 포토그래퍼', roleDesc: '가장 빛나는 순간을 기록', color: '#6b9071' },
  { id: 'bard', name: '세레나데 연주자', roleDesc: '로맨틱한 선율과 박수 갈채', color: '#c59b6d' },
  { id: 'healer', name: '축복의 메신저', roleDesc: '다정한 덕담과 따뜻한 포옹', color: '#e29578' },
  { id: 'cat', name: '비숑 강아지 하객', roleDesc: '정원을 산책하는 복슬복슬 강아지 손님', color: '#e09f3e' },
];

export const QUEST_BUILDINGS: {
  id: QuestBuildingId;
  name: string;
  shortName: string;
  npcName: string;
  badge: string;
  x: number;
  y: number;
  color: string;
  description: string;
}[] = [
  {
    id: 'story',
    name: '💌 초대의 정원 (모시는 글)',
    shortName: '모시는글',
    npcName: '북서쪽 로즈 파빌리온',
    badge: 'INVITATION',
    x: 15,
    y: 20,
    color: '#d97b84',
    description: '소중한 분들을 모시는 초대의 글과 두 사람의 이야기, 혼주 연락처를 확인합니다.',
  },
  {
    id: 'ceremony',
    name: '🕊️ 글래스하우스 채플 (예식 안내)',
    shortName: '예식일시',
    npcName: '중앙 온실 웨딩 채플',
    badge: 'WEDDING DAY',
    x: 50,
    y: 19,
    color: '#c59b6d',
    description: '예식 일시와 웨딩 캘린더, D-Day 카운트다운 및 본식 순서를 안내합니다.',
  },
  {
    id: 'gallery',
    name: '🎞️ 온실 갤러리 (웨딩 포토)',
    shortName: '갤러리',
    npcName: '북동쪽 가든 파빌리온',
    badge: 'GALLERY',
    x: 85,
    y: 20,
    color: '#6b9071',
    description: '두 사람의 사계절 웨딩 스냅과 감성 픽셀 일러스트를 감상할 수 있습니다.',
  },
  {
    id: 'minigame',
    name: '⛲ 백조의 분수대 (작은 이벤트)',
    shortName: '미니게임',
    npcName: '중앙 대리석 분수대',
    badge: 'EVENT',
    x: 50,
    y: 51,
    color: '#749bc2',
    description: '떨어지는 꽃잎과 부케를 받는 가벼운 미니게임과 커플 퀴즈를 즐겨보세요.',
  },
  {
    id: 'location',
    name: '🧭 가든 스테이션 (오시는 길)',
    shortName: '오시는길',
    npcName: '남서쪽 가든 파빌리온',
    badge: 'LOCATION',
    x: 15,
    y: 80,
    color: '#84a98c',
    description: '네이버·카카오·티맵 원클릭 길찾기와 대중교통, 주차 안내를 확인합니다.',
  },
  {
    id: 'gift',
    name: '🌷 마음 전하실 곳 (축의금 안내)',
    shortName: '마음전하기',
    npcName: '남동쪽 축복 파빌리온',
    badge: 'BLESSING',
    x: 85,
    y: 80,
    color: '#d4a373',
    description: '신랑·신부 및 혼주분들께 따뜻한 축하의 마음을 전하실 수 있는 계좌 안내입니다.',
  },
  {
    id: 'rsvp',
    name: '📖 방명록 & 참석 안내 (RSVP)',
    shortName: '방명록·참석',
    npcName: '남쪽 플로럴 가든 게이트',
    badge: 'GUESTBOOK',
    x: 50,
    y: 88,
    color: '#b5838d',
    description: '참석 여부(RSVP)와 따뜻한 축하 방명록을 남겨주시면 정원에 소중히 기록됩니다.',
  },
];

export const GARDEN_MAPS: Record<GardenMapId, GardenMapConfig> = {
  home: {
    id: 'home',
    stage: 'commute',
    tabLabel: '우리 집',
    icon: '🏠',
    title: '설레는 아침, 우리 집 거실',
    subtitle: '청첩장과 오시는 길을 확인하고 하객 의상을 고른 뒤 현관문으로 출발하세요',
    particleType: 'sunbeams',
    defaultSpawn: { x: 48, y: 70 },
    landmarks: [
      {
        id: 'home-invitation',
        questId: 'story',
        name: '💌 거실 탁자 위 모바일 청첩장 (모시는 글)',
        shortName: '청첩장 확인',
        npcName: '햇살 드는 거실 티테이블',
        badge: 'INVITATION',
        x: 50,
        y: 53,
        color: '#d97b84',
        description: '오늘 결혼식의 주인공인 신랑·신부의 초대 글과 혼주 연락처를 확인합니다.',
      },
      {
        id: 'home-directions',
        questId: 'location',
        name: '🧭 현관 메모장 (예식장 오시는 길 확인)',
        shortName: '오시는길 메모',
        npcName: '현관 옆 콘솔 테이블',
        badge: 'DIRECTIONS',
        x: 24,
        y: 27,
        color: '#84a98c',
        description: '출발 전 웨딩홀 주소와 지하철·주차장 정보를 미리 체크합니다.',
      },
      {
        id: 'home-mirror',
        specialAction: 'avatar_mirror',
        name: '🪞 현관 전신거울 (하객 캐릭터 & 의상 변경)',
        shortName: '하객 의상선택',
        npcName: '외출 준비 스타일링 코너',
        badge: 'DRESS UP',
        x: 18,
        y: 58,
        color: '#c59b6d',
        description: '결혼식에 참석할 나만의 하객 아바타(6종)를 자유롭게 골라보세요!',
        storySnippet: '🪞 “오늘 하객룩 완벽해! 이제 현관문을 열고 결혼식장으로 출발해 볼까?”',
      },
    ],
    portals: [
      {
        id: 'portal-home-to-neighborhood',
        targetMap: 'neighborhood',
        label: '🌳 현관문 열고 동네로 출발',
        direction: 'north',
        x: 50,
        y: 22,
        spawnX: 50,
        spawnY: 80,
      },
    ],
  },
  neighborhood: {
    id: 'neighborhood',
    stage: 'commute',
    tabLabel: '동네 거리',
    icon: '🌳',
    title: '봄바람 부는 동네 가로수길',
    subtitle: '횡단보도를 건너 모닝커피와 꽃다발을 챙기고 우측 지하철역으로 이동하세요',
    particleType: 'petals',
    defaultSpawn: { x: 50, y: 80 },
    landmarks: [
      {
        id: 'neighborhood-cafe',
        specialAction: 'street_cafe',
        questId: 'story',
        name: '☕ 봄날 테라스 카페 (모닝커피 & 러브스토리)',
        shortName: '테라스 카페',
        npcName: '동네 브런치 카페',
        badge: 'MORNING CAFE',
        x: 58,
        y: 24,
        color: '#c59b6d',
        description: '향긋한 커피를 마시며 신랑·신부의 첫 만남 스토리를 읽어봅니다.',
        storySnippet: '☕ “고소한 아메리카노 한 모금! 두 사람의 첫 만남도 이런 봄날 카페였대요.”',
      },
      {
        id: 'neighborhood-gift',
        questId: 'gift',
        name: '🏦 동네 은행 & 축의금 봉투 준비 (마음 전하실 곳)',
        shortName: '축의금 준비',
        npcName: '세이지 그린 금융 라운지',
        badge: 'BLESSING',
        x: 23,
        y: 24,
        color: '#d4a373',
        description: '신랑·신부 및 혼주 계좌번호와 카카오페이 송금 안내를 확인합니다.',
      },
      {
        id: 'neighborhood-flower',
        specialAction: 'flower_stand',
        name: '💐 횡단보도 앞 꽃마차 (축하 꽃다발)',
        shortName: '축하 꽃다발',
        npcName: '가로수길 플라워 카트',
        badge: 'BOUQUET',
        x: 39,
        y: 59,
        color: '#d97b84',
        description: '횡단보도를 건너며 신랑·신부에게 건넬 향기로운 봄꽃 한 송이를 챙깁니다.',
        storySnippet: '💐 “신랑·신부에게 전해줄 분홍빛 장미와 안개꽃을 품에 안았어요!”',
      },
    ],
    portals: [
      {
        id: 'portal-neighborhood-to-home',
        targetMap: 'home',
        label: '🏠 우리 집으로',
        direction: 'south',
        x: 50,
        y: 90,
        spawnX: 50,
        spawnY: 32,
      },
      {
        id: 'portal-neighborhood-to-station',
        targetMap: 'station',
        label: '🚉 지하철역 입구',
        direction: 'east',
        x: 88,
        y: 31,
        spawnX: 22,
        spawnY: 54,
      },
    ],
  },
  station: {
    id: 'station',
    stage: 'commute',
    tabLabel: '지하철역',
    icon: '🚉',
    title: '보타닉 글래스하우스 지하철 승강장',
    subtitle: '노선 안내판을 확인하고 우측 로즈 탑승구에서 웨딩행 열차에 탑승하세요',
    particleType: 'sunbeams',
    defaultSpawn: { x: 22, y: 54 },
    landmarks: [
      {
        id: 'station-route',
        questId: 'location',
        name: '🗺️ 종합 교통 안내 키오스크 (지하철·버스·셔틀 안내)',
        shortName: '노선·교통안내',
        npcName: '골드 노선도 키오스크',
        badge: 'SUBWAY MAP',
        x: 32,
        y: 30,
        color: '#84a98c',
        description: '예식장까지 가는 지하철 출구, 셔틀버스, 자가용 길찾기를 안내합니다.',
      },
      {
        id: 'station-bench',
        specialAction: 'station_bench',
        name: '🪑 승강장 대기 벤치 (설레는 기다림)',
        shortName: '승강장 벤치',
        npcName: '플랫폼 원목 벤치',
        badge: 'WAITING',
        x: 64,
        y: 32,
        color: '#749bc2',
        description: '열차가 들어오기를 기다리며 같은 결혼식에 가는 하객들과 인사를 나눕니다.',
        storySnippet: '🚋 “딩동댕동~ 지금 웨딩 가든행 특별 열차가 승강장으로 들어오고 있습니다!”',
      },
    ],
    portals: [
      {
        id: 'portal-station-to-neighborhood',
        targetMap: 'neighborhood',
        label: '🌳 동네 거리로',
        direction: 'west',
        x: 11,
        y: 54,
        spawnX: 78,
        spawnY: 34,
      },
      {
        id: 'portal-station-to-train',
        targetMap: 'train',
        label: '🚇 웨딩행 열차 탑승',
        direction: 'east',
        x: 85,
        y: 54,
        spawnX: 24,
        spawnY: 56,
      },
    ],
  },
  train: {
    id: 'train',
    stage: 'commute',
    tabLabel: '웨딩 열차',
    icon: '🚇',
    title: '봄날 한강을 달리는 웨딩행 열차',
    subtitle: '차창 밖 한강 풍경과 커플 퀴즈를 즐기며 우측 문으로 웨딩홀 역에 하차하세요',
    particleType: 'fireflies',
    defaultSpawn: { x: 24, y: 56 },
    landmarks: [
      {
        id: 'train-window-gallery',
        questId: 'gallery',
        name: '🌉 차창 밖 한강 & 웨딩 이젤 포토 감상',
        shortName: '차창밖·갤러리',
        npcName: '파노라마 한강뷰 이젤',
        badge: 'WINDOW VIEW',
        x: 24,
        y: 48,
        color: '#6b9071',
        description: '창밖으로 흐르는 봄날 한강 풍경과 함께 두 사람의 웨딩 포토 앨범을 감상합니다.',
      },
      {
        id: 'train-quiz',
        questId: 'minigame',
        name: '🎮 이동 중 즐기는 신랑·신부 퀴즈 & 미니게임',
        shortName: '열차 미니게임',
        npcName: '객차 부케 이벤트 스탠드',
        badge: 'QUIZ & GAME',
        x: 78,
        y: 50,
        color: '#749bc2',
        description: '웨딩홀에 도착하기 전, 재미있는 신랑·신부 퀴즈와 부케 캐치 게임을 즐겨보세요!',
      },
    ],
    portals: [
      {
        id: 'portal-train-to-station',
        targetMap: 'station',
        label: '🚉 승강장으로',
        direction: 'west',
        x: 10,
        y: 56,
        spawnX: 74,
        spawnY: 54,
      },
      {
        id: 'portal-train-to-garden',
        targetMap: 'garden',
        label: '🌿 웨딩홀 역 도착 (하차)',
        direction: 'east',
        x: 90,
        y: 56,
        spawnX: 50,
        spawnY: 76,
      },
    ],
  },
  garden: {
    id: 'garden',
    stage: 'venue',
    tabLabel: '웨딩 가든',
    icon: '🌿',
    title: '보타닉 웨딩 가든 (메인 정원 도착!)',
    subtitle: '신랑과 반려견 크림·꼬미 모녀가 맞이하는 정원! 신부대기실·채플·산책로·연회장으로 이어집니다',
    particleType: 'petals',
    defaultSpawn: { x: 50, y: 74 },
    landmarks: [
      {
        id: 'garden-story',
        questId: 'story',
        name: '💌 초대의 정원 (모시는 글)',
        shortName: '모시는글',
        npcName: '북서쪽 로즈 파빌리온',
        badge: 'INVITATION',
        x: 15,
        y: 20,
        color: '#d97b84',
        description: '소중한 분들을 모시는 초대의 글과 두 사람의 이야기를 확인합니다.',
      },
      {
        id: 'garden-gallery',
        questId: 'gallery',
        name: '🎞️ 온실 갤러리 (웨딩 포토)',
        shortName: '갤러리',
        npcName: '북동쪽 가든 파빌리온',
        badge: 'GALLERY',
        x: 85,
        y: 20,
        color: '#6b9071',
        description: '두 사람의 사계절 웨딩 스냅과 픽셀 일러스트를 감상합니다.',
      },
      {
        id: 'garden-minigame',
        questId: 'minigame',
        name: '⛲ 백조의 분수대 (신랑 맞이 & 이벤트)',
        shortName: '분수대·이벤트',
        npcName: '중앙 대리석 분수대',
        badge: 'EVENT',
        x: 50,
        y: 51,
        color: '#749bc2',
        description: '분수대 앞에서 하객을 맞이하는 신랑과 인사하고 미니게임을 즐겨보세요.',
      },
      {
        id: 'garden-location',
        questId: 'location',
        name: '🧭 가든 스테이션 (오시는 길)',
        shortName: '오시는길',
        npcName: '남서쪽 가든 파빌리온',
        badge: 'LOCATION',
        x: 15,
        y: 80,
        color: '#84a98c',
        description: '네이버·카카오·티맵 길찾기와 대중교통, 주차 안내를 확인합니다.',
      },
      {
        id: 'garden-gift',
        questId: 'gift',
        name: '🌷 마음 전하실 곳 (축의금 안내)',
        shortName: '마음전하기',
        npcName: '남동쪽 축복 파빌리온',
        badge: 'BLESSING',
        x: 85,
        y: 80,
        color: '#d4a373',
        description: '따뜻한 축하의 마음을 전하실 수 있는 계좌 안내입니다.',
      },
      {
        id: 'garden-rsvp',
        questId: 'rsvp',
        name: '📖 방명록 & 참석 안내 (RSVP)',
        shortName: '방명록·참석',
        npcName: '남쪽 플로럴 가든 게이트',
        badge: 'GUESTBOOK',
        x: 50,
        y: 88,
        color: '#b5838d',
        description: '참석 여부(RSVP)와 축하 방명록을 남길 수 있습니다.',
      },
    ],
    portals: [
      {
        id: 'portal-to-bridal',
        targetMap: 'bridal',
        label: '💐 신부 대기실 입장',
        direction: 'north',
        x: 34,
        y: 28,
        spawnX: 50,
        spawnY: 80,
      },
      {
        id: 'portal-to-chapel',
        targetMap: 'chapel',
        label: '🕊️ 채플 홀 입장',
        direction: 'north',
        x: 50,
        y: 22,
        spawnX: 50,
        spawnY: 74,
      },
      {
        id: 'portal-to-memory',
        targetMap: 'memory',
        label: '🌸 추억 산책로',
        direction: 'west',
        x: 9,
        y: 51,
        spawnX: 82,
        spawnY: 50,
      },
      {
        id: 'portal-to-reception',
        targetMap: 'reception',
        label: '✨ 별빛 리셉션',
        direction: 'east',
        x: 91,
        y: 51,
        spawnX: 20,
        spawnY: 51,
      },
      {
        id: 'portal-garden-to-train',
        targetMap: 'train',
        label: '🚇 웨딩홀 역(출발코스)',
        direction: 'south',
        x: 50,
        y: 95,
        spawnX: 80,
        spawnY: 50,
      },
    ],
  },
  bridal: {
    id: 'bridal',
    stage: 'venue',
    tabLabel: '신부 대기실',
    icon: '💐',
    title: '로즈 플라워 신부 대기실',
    subtitle: '꽃벽 앞에서 설레는 마음으로 기다리는 신부에게 축하 인사를 건네고 기념사진을 찍어보세요',
    particleType: 'petals',
    defaultSpawn: { x: 50, y: 80 },
    landmarks: [
      {
        id: 'bridal-bride-photo',
        specialAction: 'bridal_photo',
        questId: 'gallery',
        name: '📸 신부 대기실 플라워월 포토존 (신부와 기념촬영)',
        shortName: '신부님과 촬영',
        npcName: '로즈 가든 플라워 월',
        badge: 'BRIDAL ROOM',
        x: 50,
        y: 42,
        color: '#d97b84',
        description: '아름다운 신부에게 다가가 따뜻한 축하 인사를 전하고 폴라로이드 기념사진을 남겨보세요!',
        storySnippet: '👰 “와주셔서 정말 고마워요 ♥ 우리 꽃벽 앞에서 같이 기념사진 한 장 찍어요!”',
      },
      {
        id: 'bridal-guestbook',
        questId: 'rsvp',
        name: '📖 대기실 축복 방명록 & 참석 체크',
        shortName: '대기실 방명록',
        npcName: '좌측 벨벳 라운지 테이블',
        badge: 'GUESTBOOK',
        x: 26,
        y: 62,
        color: '#b5838d',
        description: '신부 대기실을 찾은 반가운 발걸음을 방명록에 남깁니다.',
      },
      {
        id: 'bridal-vanity',
        questId: 'ceremony',
        name: '💄 골드 프레임 화장대 (본식 시간 & 식순 안내)',
        shortName: '본식 시간안내',
        npcName: '우측 부케 & 골드 미러 콘솔',
        badge: 'CEREMONY INFO',
        x: 80,
        y: 58,
        color: '#c59b6d',
        description: '곧 시작될 본식 시간과 예식 순서를 확인합니다.',
      },
    ],
    portals: [
      {
        id: 'portal-bridal-to-garden',
        targetMap: 'garden',
        label: '🌿 웨딩 가든으로',
        direction: 'south',
        x: 50,
        y: 91,
        spawnX: 34,
        spawnY: 36,
      },
      {
        id: 'portal-bridal-to-chapel',
        targetMap: 'chapel',
        label: '🕊️ 본식 채플 홀로 이동',
        direction: 'east',
        x: 86,
        y: 78,
        spawnX: 50,
        spawnY: 74,
      },
    ],
  },
  chapel: {
    id: 'chapel',
    stage: 'venue',
    tabLabel: '본식 채플',
    icon: '🕊️',
    title: '글래스하우스 웨딩 채플 내부',
    subtitle: '꽃길 버진로드를 따라 본식 단상으로 행진해 보세요',
    particleType: 'sunbeams',
    defaultSpawn: { x: 50, y: 74 },
    landmarks: [
      {
        id: 'chapel-altar',
        questId: 'ceremony',
        specialAction: 'virgin_road',
        name: '🔔 로즈 아치 본식 단상 (예식 일시 & 식순)',
        shortName: '예식일시·단상',
        npcName: '글래스하우스 메인 채플 홀',
        badge: 'WEDDING ALTAR',
        x: 50,
        y: 26,
        color: '#d97b84',
        description: '두 사람이 서약을 나누는 본식 단상입니다. 예식 일정과 식순을 확인하세요.',
        storySnippet: '💍 “오늘 이 자리에서 평생의 봄날을 약속합니다.”',
      },
      {
        id: 'chapel-piano',
        specialAction: 'piano_melody',
        name: '🎹 화이트 그랜드 피아노 (웨딩 세레나데)',
        shortName: '웨딩피아노',
        npcName: '채플 좌측 연주석',
        badge: 'SERENADE',
        x: 24,
        y: 27,
        color: '#c59b6d',
        description: '맑은 오르골 웨딩 선율이 울려 퍼지는 화이트 그랜드 피아노입니다.',
        storySnippet: '🎶 감미로운 웨딩 행진곡 선율이 온실 가득 울려 퍼집니다.',
      },
      {
        id: 'chapel-easels',
        questId: 'gallery',
        name: '🖼️ 온실 포토 회랑 (웨딩 스냅 이젤)',
        shortName: '웨딩스냅',
        npcName: '채플 우측 포토 갤러리',
        badge: 'GALLERY',
        x: 78,
        y: 27,
        color: '#6b9071',
        description: '금빛 이젤 위에 전시된 두 사람의 웨딩 포토를 감상합니다.',
      },
    ],
    portals: [
      {
        id: 'portal-chapel-to-garden',
        targetMap: 'garden',
        label: '🌿 정원으로 나가기',
        direction: 'south',
        x: 50,
        y: 92,
        spawnX: 50,
        spawnY: 32,
      },
    ],
  },
  memory: {
    id: 'memory',
    stage: 'venue',
    tabLabel: '추억 산책로',
    icon: '🌸',
    title: '사계절 추억의 산책로',
    subtitle: '2023년 첫 봄부터 겨울밤의 약속까지, 네 번의 사계절을 걸어보세요',
    particleType: 'seasons',
    defaultSpawn: { x: 50, y: 52 },
    landmarks: [
      {
        id: 'memory-spring',
        specialAction: 'memory_spring',
        questId: 'story',
        name: '☕ 첫 번째 봄 : 창가 카페 (2023. 05)',
        shortName: '첫만남 카페',
        npcName: '설레던 여섯 시간의 대화',
        badge: '2023 SPRING',
        x: 22,
        y: 28,
        color: '#d97b84',
        description: '처음 마주 앉아 여섯 시간 동안 웃음이 끊이지 않던 봄날의 카페입니다.',
        storySnippet: '☕ “따스한 오월의 오후, 처음 마주 앉아 여섯 시간 동안 대화를 나누었죠.”',
      },
      {
        id: 'memory-autumn',
        specialAction: 'memory_autumn',
        name: '☔ 두 번째 가을 : 제주 수국과 우산 (2024. 10)',
        shortName: '제주 빗길',
        npcName: '빗소리와 깊어진 믿음',
        badge: '2024 AUTUMN',
        x: 20,
        y: 68,
        color: '#749bc2',
        description: '갑작스러운 제주도의 비에도 하나의 우산을 나누어 쓰며 서로를 챙기던 바닷길입니다.',
        storySnippet: '☔ “갑작스러운 비에도 서로의 어깨를 먼저 감싸주던 순간, 평생을 확신했어요.”',
      },
      {
        id: 'memory-winter',
        specialAction: 'memory_winter',
        name: '💍 네 번째 겨울 : 별빛 트리의 약속 (2026. 12)',
        shortName: '겨울 프로포즈',
        npcName: '겨울밤의 사진첩과 반지',
        badge: '2026 WINTER',
        x: 76,
        y: 28,
        color: '#c59b6d',
        description: '사계절의 사진을 엮은 앨범과 반지로 평생의 동반자가 되어달라 고백한 곳입니다.',
        storySnippet: '💍 “함께 걸어온 계절의 사진첩과 반지를 건네며, 평생의 동반자가 되어달라 고백했습니다.”',
      },
      {
        id: 'memory-photo',
        questId: 'gallery',
        name: '📸 다섯 번째 봄 : 야외 스냅 정자 (2027. 05)',
        shortName: '스냅 포토존',
        npcName: '부부로 여는 새로운 계절',
        badge: 'PHOTO ZONE',
        x: 82,
        y: 78,
        color: '#6b9071',
        description: '두 사람의 사계절 웨딩 스냅과 픽셀 일러스트 앨범을 열어봅니다.',
      },
    ],
    portals: [
      {
        id: 'portal-memory-to-garden',
        targetMap: 'garden',
        label: '🌿 웨딩 가든으로',
        direction: 'east',
        x: 91,
        y: 48,
        spawnX: 20,
        spawnY: 51,
      },
    ],
  },
  reception: {
    id: 'reception',
    stage: 'venue',
    tabLabel: '별빛 리셉션',
    icon: '✨',
    title: '별빛 가든 리셉션 (피로연 광장)',
    subtitle: '축복의 소원나무에 방명록을 남기고 샴페인 건배를 나눠보세요',
    particleType: 'fireflies',
    defaultSpawn: { x: 50, y: 74 },
    landmarks: [
      {
        id: 'reception-wishing-tree',
        questId: 'rsvp',
        name: '🌳 축복의 소원나무 (방명록 & 참석 의사)',
        shortName: '소원나무·방명록',
        npcName: '북쪽 소원나무 단상',
        badge: 'WISHING TREE',
        x: 50,
        y: 25,
        color: '#d97b84',
        description: '하객분들의 따뜻한 축하 메시지와 참석 의사(RSVP)가 소원 리본으로 걸리는 나무입니다.',
      },
      {
        id: 'reception-cake',
        specialAction: 'cake_toast',
        questId: 'minigame',
        name: '🎂 3단 웨딩 케이크 & 샴페인 타워',
        shortName: '샴페인 건배',
        npcName: '중앙 만찬 테이블',
        badge: 'CELEBRATION',
        x: 50,
        y: 47,
        color: '#c59b6d',
        description: '가까이 다가가 축하 건배를 올리고 작은 이벤트에도 참여해 보세요!',
        storySnippet: '🥂 “{groom} ♥ {bride} 두 사람의 빛나는 앞날을 위하여, 건배!”',
      },
      {
        id: 'reception-gift',
        questId: 'gift',
        name: '🌷 축복의 리셉션 데스크 (마음 전하실 곳)',
        shortName: '마음전하기',
        npcName: '남동쪽 리셉션 파빌리온',
        badge: 'BLESSING',
        x: 86,
        y: 80,
        color: '#d4a373',
        description: '신랑·신부 및 혼주분들께 축하의 마음을 전하실 수 있는 계좌 안내입니다.',
      },
      {
        id: 'reception-location',
        questId: 'location',
        name: '🧭 귀가 셔틀 & 주차 안내소 (오시는 길)',
        shortName: '교통·주차안내',
        npcName: '남서쪽 가든 파빌리온',
        badge: 'SHUTTLE & PARKING',
        x: 14,
        y: 80,
        color: '#84a98c',
        description: '예식장 위치 및 무료 주차 등록, 전용 셔틀버스 안내를 확인합니다.',
      },
    ],
    portals: [
      {
        id: 'portal-reception-to-garden',
        targetMap: 'garden',
        label: '🌿 웨딩 가든으로',
        direction: 'west',
        x: 15,
        y: 49,
        spawnX: 80,
        spawnY: 51,
      },
    ],
  },
};

export const COMMUTE_MAP_ORDER: GardenMapId[] = [
  'home',
  'neighborhood',
  'station',
  'train',
];

export const VENUE_MAP_ORDER: GardenMapId[] = [
  'garden',
  'bridal',
  'chapel',
  'memory',
  'reception',
];

export const GARDEN_MAP_ORDER: GardenMapId[] = [
  ...COMMUTE_MAP_ORDER,
  ...VENUE_MAP_ORDER,
];

function normalizeWeddingJson(raw: WeddingConfig): WeddingConfig {
  const groomFullName = raw.groom.fullName.trim();
  const brideFullName = raw.bride.fullName.trim();
  const groomName = raw.groom.name?.trim() || groomFullName.slice(-2) || groomFullName;
  const brideName = raw.bride.name?.trim() || brideFullName.slice(-2) || brideFullName;

  return {
    ...raw,
    groom: {
      ...raw.groom,
      fullName: groomFullName,
      name: groomName,
    },
    bride: {
      ...raw.bride,
      fullName: brideFullName,
      name: brideName,
    },
  };
}

/**
 * 청첩장의 모든 데이터는 `src/data/wedding.json` 단일 파일에서 불러옵니다.
 * 사진은 `public/photos/` 폴더에 넣고 `wedding.json`의 `gallery[].imageUrl`에 `"./photos/파일명.jpg"`로 지정하세요.
 */
export const DEFAULT_WEDDING_CONFIG: WeddingConfig = normalizeWeddingJson(
  rawWeddingData as WeddingConfig
);
