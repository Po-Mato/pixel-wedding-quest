export type QuestBuildingId =
  | 'story'
  | 'ceremony'
  | 'gallery'
  | 'location'
  | 'gift'
  | 'rsvp'
  | 'minigame';

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
  { id: 'cat', name: '아기 고양이 하객', roleDesc: '정원을 산책하는 귀여운 손님', color: '#e09f3e' },
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

export const DEFAULT_WEDDING_CONFIG: WeddingConfig = {
  gameTitle: '봄날의 정원, 우리의 첫 페이지',
  versionTag: '2027. 05. 22 · SUNLIGHT GARDEN INVITATION',
  groom: {
    name: '민준',
    fullName: '김민준',
    jobClass: '따뜻한 봄바람 같은 사람',
    level: 100,
    mbti: '다정한 경청가 · 든든한 동반자',
    specialSkill: '서연이를 웃게 만드는 따뜻한 요리와 산책',
    quote: '“사계절 내내 서연이의 가장 편안한 그늘이 되어주겠습니다.”',
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
    name: '서연',
    fullName: '이서연',
    jobClass: '살랑이는 햇살 같은 사람',
    level: 100,
    mbti: '맑은 웃음 · 세심한 배려',
    specialSkill: '일상의 작은 순간도 행복으로 채우는 마음',
    quote: '“민준이와 함께라면 어떤 계절도 늘 따뜻한 봄날일 거예요.”',
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
    name: '모찌',
    title: '함께 지내는 반려묘',
  },
  wedding: {
    dateISO: '2027-05-22T13:00:00+09:00',
    dateDisplay: '2027년 5월 22일 토요일',
    timeDisplay: '오후 1시 00분',
    year: 2027,
    month: 5,
    day: 22,
    dayOfWeek: '토요일',
    venueName: '아르카디아 보타닉 가든 채플',
    hallName: '3층 글래스하우스 홀',
    addressRoad: '서울특별시 강남구 테헤란로 522 아르카디아 타워 3F',
    addressJibun: '서울특별시 강남구 삼성동 158-22',
    tel: '02-555-0522',
    lat: 37.5088,
    lng: 127.0631,
    subwayGuide: [
      '2호선 삼성역 4번 출구 도보 4분 (직진 250m 우측 보타닉 타워)',
      '9호선 봉은사역 7번 출구 도보 6분 (전용 셔틀버스 10분 간격 운행)',
    ],
    busGuide: [
      '간선버스 : 143, 146, 301, 342, 401 (무역센터 정류장 하차)',
      '지선버스 : 2413, 3411, 3412, 4318',
    ],
    parkingGuide: [
      '건물 내 지하 B2 ~ B6 전용 주차장 800대 동시 주차 가능',
      '웨딩홀 3층 접수대에서 차량번호 등록 시 2시간 무료 주차 적용',
    ],
    shuttleGuide: '삼성역 4번 출구 앞에서 예식 전용 셔틀버스가 12:00부터 10분 간격으로 운행됩니다.',
  },
  invitationMessage: {
    headline: '서로의 계절이 되어주기로 약속한 날, 소중한 분들을 초대합니다',
    paragraphs: [
      '서로 다른 시간 속을 걷던 두 사람이 우연한 봄날에 만나, 네 번의 사계절 동안 가장 가까운 친구이자 연인으로 함께 걸어왔습니다.',
      '비가 내리는 날에는 하나의 우산을 나누어 쓰고, 맑은 날에는 나란히 산책하며 쌓아온 다정한 시간들을 모아 이제 부부로서의 첫 페이지를 열어가려 합니다.',
      '푸르른 오월의 햇살 아래 두 사람이 하나 되는 뜻깊은 자리에 함께해 주셔서 따뜻한 축복으로 자리를 빛내주시면 감사하겠습니다.',
    ],
    questObjective: '2027년 5월 22일 토요일 오후 1시 · 아르카디아 보타닉 가든 채플',
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
      date: '2027. 05. 22',
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
        name: '김민준',
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
        name: '이서연',
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
      question: 'Q1. 신랑 민준 & 신부 서연이 처음 만났던 계절은 언제일까요?',
      options: ['따스한 5월의 봄', '푸르른 8월의 여름', '단풍 든 10월의 가을', '눈 내리는 12월의 겨울'],
      correctIndex: 0,
      explanation: '정답입니다! 2023년 5월의 따스한 봄날에 처음 만나 또 다른 5월에 결혼식을 올리게 되었습니다.',
    },
    {
      id: 'q2',
      question: 'Q2. 두 사람이 함께 돌보고 있는 귀여운 반려묘의 이름은 무엇일까요?',
      options: ['치즈', '모찌', '호두', '보리'],
      correctIndex: 1,
      explanation: '정답입니다! 말랑하고 다정한 치즈냥이 [모찌]가 픽셀 정원에서도 함께 산책하고 있어요.',
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
      message: '민준아 서연씨와 결혼 진심으로 축하한다! 두 사람 늘 봄날처럼 행복하길 바랄게.',
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
      message: '우리 서연이 세상에서 가장 아름다운 신부야. 5월 22일 기쁜 마음으로 축하하러 갈게!',
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
