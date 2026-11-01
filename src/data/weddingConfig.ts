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
        storySnippet: '🥂 “승재 ♥ 건희 두 사람의 빛나는 앞날을 위하여, 건배!”',
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

export const DEFAULT_WEDDING_CONFIG: WeddingConfig = {
  gameTitle: '봄날의 정원, 우리의 첫 페이지',
  versionTag: '2027. 05. 01 · SUNLIGHT GARDEN INVITATION',
  groom: {
    name: '승재',
    fullName: '이승재',
    jobClass: '따뜻한 봄바람 같은 사람',
    level: 100,
    mbti: '다정한 경청가 · 든든한 동반자',
    specialSkill: '건희를 웃게 만드는 따뜻한 요리와 산책',
    quote: '“사계절 내내 건희의 가장 편안한 그늘이 되어주겠습니다.”',
    fatherName: '김태호',
    motherName: '박정숙',
    relation: '장남',
    phone: '010-1234-5678',
    fatherPhone: '010-1111-2222',
    motherPhone: '010-3333-4444',
    suitColor: '#34495e',
    hairColor: '#2c1e18',
    stats: [
      { label: '다정함', value: 99, max: 100 },
      { label: '배려심', value: 98, max: 100 },
      { label: '요리솜씨', value: 94, max: 100 },
      { label: '사랑', value: 100, max: 100 },
    ],
  },
  bride: {
    name: '건희',
    fullName: '이건희',
    jobClass: '살랑이는 햇살 같은 사람',
    level: 100,
    mbti: '맑은 웃음 · 세심한 배려',
    specialSkill: '일상의 작은 순간도 행복으로 채우는 마음',
    quote: '“승재와 함께라면 어떤 계절도 늘 따뜻한 봄날일 거예요.”',
    fatherName: '이상훈',
    motherName: '최미경',
    relation: '장녀',
    phone: '010-8765-4321',
    fatherPhone: '010-5555-6666',
    motherPhone: '010-7777-8888',
    dressColor: '#ffffff',
    hairColor: '#3b2314',
    stats: [
      { label: '따뜻함', value: 99, max: 100 },
      { label: '현명함', value: 97, max: 100 },
      { label: '유머감각', value: 95, max: 100 },
      { label: '사랑', value: 100, max: 100 },
    ],
  },
  pet: {
    name: '크림 & 꼬미',
    title: '함께 지내는 반려견 모녀 (엄마 크림 · 딸 꼬미)',
  },
  wedding: {
    dateISO: '2027-05-01T17:10:00+09:00',
    dateDisplay: '2027년 5월 1일 토요일',
    timeDisplay: '오후 5시 10분',
    year: 2027,
    month: 5,
    day: 1,
    dayOfWeek: '토요일',
    venueName: 'MJ컨벤션',
    hallName: '5층 파티오볼룸',
    addressRoad: '경기 부천시 소사구 경인로 386',
    addressJibun: '경기 부천시 소사구 괴안동 192-4',
    tel: '032-347-5500',
    lat: 37.4828,
    lng: 126.7956,
    subwayGuide: [
      '1호선·서해선 소사역 1번 출구에서 도보 약 3분',
    ],
    busGuide: [
      '일반버스 : 12, 53, 56-1, 60, 66, 83, 88 (소사역 정류장 하차)',
    ],
    parkingGuide: [
      '주차 2시간 무료 · 약 500대 이상 동시 주차 가능',
    ],
    shuttleGuide: '1호선·서해선 소사역 1번 출구에서 직진 도보 3분 거리에 위치해 있습니다.',
  },
  invitationMessage: {
    headline: '서로의 계절이 되어주기로 약속한 날, 소중한 분들을 초대합니다',
    paragraphs: [
      '서로 다른 시간 속을 걷던 두 사람이 우연한 봄날에 만나, 네 번의 사계절 동안 가장 가까운 친구이자 연인으로 함께 걸어왔습니다.',
      '비가 내리는 날에는 하나의 우산을 나누어 쓰고, 맑은 날에는 나란히 산책하며 쌓아온 다정한 시간들을 모아 이제 부부로서의 첫 페이지를 열어가려 합니다.',
      '푸르른 오월의 햇살 아래 두 사람이 하나 되는 뜻깊은 자리에 함께해 주셔서 따뜻한 축복으로 자리를 빛내주시면 감사하겠습니다.',
    ],
    questObjective: '2027년 5월 1일 토요일 오후 5시 10분 · MJ컨벤션 5층 파티오볼룸',
  },
  storyLog: [
    {
      chapter: '첫 번째 봄',
      date: '2023. 05',
      title: '설레던 첫 만남과 여섯 시간의 대화',
      desc: '따스한 오월의 오후, 작은 카페 창가 자리에서 처음 마주 앉았습니다. 오래 알고 지낸 사람처럼 편안한 웃음이 끊이지 않던 날이었습니다.',
      badge: 'FIRST SPRING',
    },
    {
      chapter: '두 번째 가을',
      date: '2024. 10',
      title: '제주도의 빗소리와 깊어진 믿음',
      desc: '여행길에 만난 갑작스러운 비에도 서로를 먼저 챙기며 웃던 순간, 평생을 함께 걸어가고 싶다는 확신이 마음속에 자리 잡았습니다.',
      badge: 'DEEP TRUST',
    },
    {
      chapter: '네 번째 겨울',
      date: '2026. 12',
      title: '겨울밤의 반지와 따뜻한 약속',
      desc: '함께 걸어온 계절의 사진들을 엮은 작은 앨범과 함께 평생의 동반자가 되어달라 고백했고, 기쁜 마음으로 손을 맞잡았습니다.',
      badge: 'PROMISE',
    },
    {
      chapter: '다섯 번째 봄',
      date: '2027. 05. 01',
      title: '부부라는 이름으로 여는 새로운 계절',
      desc: '소중한 분들의 축복 속에서 두 사람이 하나의 가정을 이루며 새로운 산책을 시작합니다.',
      badge: 'OUR WEDDING',
    },
  ],
  gallery: [
    {
      id: 'photo-1',
      title: '벚꽃이 흩날리던 봄날의 오후',
      subtitle: 'Spring · 첫 번째 웨딩 스냅',
      seasonTag: 'SPRING GARDEN',
      questExp: '2027. 03',
      imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
      pixelTheme: 'cherry_blossom',
      description: '따스한 봄바람에 꽃잎이 흩날리던 정원에서 두 사람의 설레는 미소를 담았습니다.',
      initialLikes: 48,
    },
    {
      id: 'photo-2',
      title: '노을빛이 물든 여름 해변에서',
      subtitle: 'Summer · 제주 선셋 스냅',
      seasonTag: 'GOLDEN SUNSET',
      questExp: '2026. 08',
      imageUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80',
      pixelTheme: 'sunset_beach',
      description: '잔잔한 파도 소리와 황금빛 노을 아래에서 서로의 손을 꼭 잡고 걸었던 순간입니다.',
      initialLikes: 62,
    },
    {
      id: 'photo-3',
      title: '별빛이 내려앉은 가을밤의 약속',
      subtitle: 'Autumn · 프러포즈의 기억',
      seasonTag: 'STARLIGHT PROMISE',
      questExp: '2026. 10',
      imageUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=900&q=80',
      pixelTheme: 'starry_camp',
      description: '은은한 조명과 밤하늘의 별빛 아래에서 평생의 동반자가 되기로 약속한 밤입니다.',
      initialLikes: 91,
    },
    {
      id: 'photo-4',
      title: '글래스하우스 채플의 순백의 시간',
      subtitle: 'Bridal · 본식 포트레이트',
      seasonTag: 'PURE WHITE',
      questExp: '2027. 04',
      imageUrl: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=900&q=80',
      pixelTheme: 'royal_castle',
      description: '다가올 오월의 결혼식 날, 소중한 분들을 맞이할 설레는 마음으로 남긴 사진입니다.',
      initialLikes: 84,
    },
    {
      id: 'photo-5',
      title: '초록빛 온실 정원에서의 산책',
      subtitle: 'Botanic · 가든 스냅',
      seasonTag: 'GREENERY',
      questExp: '2027. 04',
      imageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=900&q=80',
      pixelTheme: 'autumn_cafe',
      description: '평소 두 사람이 가장 좋아하는 편안하고 자연스러운 웃음을 담았습니다.',
      initialLikes: 57,
    },
    {
      id: 'photo-6',
      title: '온기를 나누던 겨울의 기록',
      subtitle: 'Winter · 우리의 네 번째 겨울',
      seasonTag: 'WARM WINTER',
      questExp: '2026. 12',
      imageUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=900&q=80',
      pixelTheme: 'snow_village',
      description: '차가운 계절에도 서로의 손을 잡으면 늘 따뜻했던 두 사람의 겨울 이야기입니다.',
      initialLikes: 73,
    },
  ],
  accounts: {
    groomSide: [
      {
        role: '신랑',
        name: '이승재',
        bank: '카카오뱅크',
        accountNumber: '3333-01-2345678',
      },
      {
        role: '신랑 아버지',
        name: '김태호',
        bank: 'KB국민은행',
        accountNumber: '123401-04-567890',
      },
      {
        role: '신랑 어머니',
        name: '박정숙',
        bank: '신한은행',
        accountNumber: '110-234-567890',
      },
    ],
    brideSide: [
      {
        role: '신부',
        name: '이건희',
        bank: '토스뱅크',
        accountNumber: '1000-1234-5678',
      },
      {
        role: '신부 아버지',
        name: '이상훈',
        bank: '우리은행',
        accountNumber: '1002-345-678901',
      },
      {
        role: '신부 어머니',
        name: '최미경',
        bank: 'NH농협',
        accountNumber: '302-1234-5678-91',
      },
    ],
  },
  quiz: [
    {
      id: 'q1',
      question: 'Q1. 신랑 승재 & 신부 건희가 처음 만났던 계절은 언제일까요?',
      options: ['따스한 5월의 봄', '푸르른 8월의 여름', '단풍 든 10월의 가을', '눈 내리는 12월의 겨울'],
      correctIndex: 0,
      explanation: '정답입니다! 2023년 5월의 따스한 봄날에 처음 만나 또 다른 5월에 결혼식을 올리게 되었습니다.',
    },
    {
      id: 'q2',
      question: 'Q2. 두 사람이 함께 키우고 있는 사랑스러운 반려견 모녀(엄마 & 딸)의 이름은?',
      options: ['구름 & 보리', '크림 & 꼬미', '두부 & 콩이', '우유 & 모카'],
      correctIndex: 1,
      explanation: '정답입니다! 복슬복슬 다정한 엄마 강아지 [크림]이와 애교쟁이 딸 [꼬미]가 픽셀 정원에서도 함께 뛰놀고 있어요 🐶',
    },
    {
      id: 'q3',
      question: 'Q3. 두 사람이 가장 좋아하는 주말 데이트 풍경은 무엇일까요?',
      options: ['조용한 공원 산책과 홈쿡 요리', '번화가 밤샘 클럽 투어', '스카이다이빙 체험', '해외 오지 배낭여행'],
      correctIndex: 0,
      explanation: '정답입니다! 나란히 공원을 산책하고 맛있는 집밥을 만들어 먹는 시간을 가장 좋아합니다.',
    },
  ],
  initialGuestbook: [
    {
      id: 'gb-1',
      name: '이지훈',
      avatar: 'knight',
      side: 'groom',
      titleBadge: '🌿 소중한 벗',
      message: '승재야 건희씨와 결혼 진심으로 축하한다! 두 사람 늘 봄날처럼 행복하길 바랄게.',
      createdAt: '방금 전',
      attendance: 'attend',
      companions: 1,
      meal: 'yes',
    },
    {
      id: 'gb-2',
      name: '박수빈',
      avatar: 'mage',
      side: 'bride',
      titleBadge: '🌸 봄날의 하객',
      message: '우리 건희 세상에서 가장 아름다운 신부야. 5월 1일 기쁜 마음으로 축하하러 갈게!',
      createdAt: '10분 전',
      attendance: 'attend',
      companions: 1,
      meal: 'yes',
    },
    {
      id: 'gb-3',
      name: '현우 · 미소 부부',
      avatar: 'bard',
      side: 'both',
      titleBadge: '💍 축복의 동행',
      message: '두 분의 새로운 출발을 온 마음으로 축복합니다! 정원 산책 청첩장이 너무 따뜻하고 예뻐요.',
      createdAt: '32분 전',
      attendance: 'attend',
      companions: 2,
      meal: 'yes',
    },
    {
      id: 'gb-4',
      name: '고모 · 고모부',
      avatar: 'healer',
      side: 'groom',
      titleBadge: '🌷 따뜻한 가족',
      message: '늘 서로 아끼고 존중하며 화목하고 아름다운 가정 이루기를 진심으로 기도한다. 축하해!',
      createdAt: '1시간 전',
      attendance: 'attend',
      companions: 2,
      meal: 'yes',
    },
  ],
};
