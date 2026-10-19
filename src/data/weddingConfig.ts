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
    dateISO: string; // e.g., "2027-05-22T13:00:00+09:00"
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
  { id: 'knight', name: '축복의 성기사', roleDesc: '든든한 축의와 박수 담당', color: '#4dabf7' },
  { id: 'mage', name: '꽃잎 대마법사', roleDesc: '화려한 꽃길 마법 시전', color: '#da77f2' },
  { id: 'archer', name: '큐피드 명사수', roleDesc: '백발백중 부케 & 사진 스나이퍼', color: '#69db7c' },
  { id: 'bard', name: '축가의 음유시인', roleDesc: '흥겨운 텐션과 환호성 버프', color: '#ffd43b' },
  { id: 'healer', name: '행복의 프리스트', roleDesc: '따뜻한 덕담과 감동 힐링', color: '#ff8787' },
  { id: 'cat', name: '뷔페 요정 고양이', roleDesc: '연회장 스테이크 정복 요원', color: '#ffa94d' },
];

export const QUEST_BUILDINGS: {
  id: QuestBuildingId;
  name: string;
  shortName: string;
  npcName: string;
  badge: string;
  x: number; // grid / percentage coordinate on map (0..100)
  y: number;
  color: string;
  description: string;
}[] = [
  {
    id: 'story',
    name: '📜 모험가 길드 (초대장)',
    shortName: '초대장',
    npcName: '길드장 알프레드',
    badge: 'MAIN QUEST 01',
    x: 22,
    y: 26,
    color: '#ffd541',
    description: '두 사람의 첫 만남부터 결혼까지의 모험 일지와 부모님 연락처를 확인합니다.',
  },
  {
    id: 'ceremony',
    name: '🏰 웨딩 대성당 (예식·달력)',
    shortName: '예식일정',
    npcName: '대주교 루미에르',
    badge: 'MAIN QUEST 02',
    x: 50,
    y: 16,
    color: '#ff5277',
    description: '예식 시간표, 실시간 D-Day 카운트다운, 픽셀 달력을 확인합니다.',
  },
  {
    id: 'gallery',
    name: '🖼️ 기억의 박물관 (갤러리)',
    shortName: '갤러리',
    npcName: '큐레이터 도트씨',
    badge: 'MAIN QUEST 03',
    x: 78,
    y: 26,
    color: '#4dabf7',
    description: '웨딩 스냅과 실시간 8-Bit 도트 필터 변환기를 체험할 수 있습니다.',
  },
  {
    id: 'minigame',
    name: '⛲ 축복의 분수대 (미니게임)',
    shortName: '미니게임',
    npcName: '치즈냥이 모찌',
    badge: 'BONUS STAGE',
    x: 50,
    y: 50,
    color: '#38d9a9',
    description: '부케 & 하트 캐치 미니게임과 신랑·신부 퀴즈로 특별 칭호를 획득하세요!',
  },
  {
    id: 'location',
    name: '🗺️ 마법 정류장 (오시는 길)',
    shortName: '오시는길',
    npcName: '역무원 포탈군',
    badge: 'MAIN QUEST 04',
    x: 22,
    y: 74,
    color: '#69db7c',
    description: '네이버·카카오·티맵 원클릭 길찾기와 지하철/주차 퀘스트 공략집입니다.',
  },
  {
    id: 'gift',
    name: '🏦 골드 은행 (마음 전할 곳)',
    shortName: '마음전하기',
    npcName: '은행장 골드링',
    badge: 'MAIN QUEST 05',
    x: 78,
    y: 74,
    color: '#ffa94d',
    description: '신랑·신부 및 혼주분들께 축복의 골드를 전할 수 있는 길드 은행입니다.',
  },
  {
    id: 'rsvp',
    name: '🏕️ 모험가 주점 (방명록·참석)',
    shortName: '방명록·참석',
    npcName: '주점 마스터 바드',
    badge: 'FINAL QUEST 06',
    x: 50,
    y: 84,
    color: '#da77f2',
    description: '하객 캐릭터를 골라 참석 의사(RSVP)와 마을 광장 말풍선 방명록을 남깁니다!',
  },
];

export const DEFAULT_WEDDING_CONFIG: WeddingConfig = {
  gameTitle: 'LOVE QUEST : 영원의 파티',
  versionTag: 'VER 2027.05.22 · 16-BIT EDITION',
  groom: {
    name: '민준',
    fullName: '김민준',
    jobClass: '다정다감 성기사 (Paladin)',
    level: 99,
    mbti: 'ENFJ · 인간 골든리트리버',
    specialSkill: '서연이 전용 무한 리액션 & 맛집 레이더',
    quote: '“평생 서연이의 든든한 탱커이자 요리사가 되겠습니다!”',
    fatherName: '김태호',
    motherName: '박정숙',
    relation: '장남',
    phone: '010-1234-5678',
    fatherPhone: '010-1111-2222',
    motherPhone: '010-3333-4444',
    suitColor: '#2b3a67',
    hairColor: '#2c1e18',
    stats: [
      { label: '다정함 (SWEET)', value: 99, max: 99 },
      { label: '요리력 (COOK)', value: 92, max: 99 },
      { label: '공감력 (EMPATHY)', value: 95, max: 99 },
      { label: '서연사랑 (LOVE)', value: 999, max: 999 },
    ],
  },
  bride: {
    name: '서연',
    fullName: '이서연',
    jobClass: '햇살 아크메이지 (Archmage)',
    level: 99,
    mbti: 'INFJ · 웃음꽃 힐러',
    specialSkill: '눈웃음 한 방으로 피로 회복 100% 마법',
    quote: '“민준이와 함께라면 어떤 던전도 꽃길이 될 거예요!”',
    fatherName: '이상훈',
    motherName: '최미경',
    relation: '장녀',
    phone: '010-8765-4321',
    fatherPhone: '010-5555-6666',
    motherPhone: '010-7777-8888',
    dressColor: '#ffffff',
    hairColor: '#3b2314',
    stats: [
      { label: '사랑스러움 (LOVELY)', value: 99, max: 99 },
      { label: '계획력 (PLAN)', value: 96, max: 99 },
      { label: '유머감각 (WIT)', value: 94, max: 99 },
      { label: '민준사랑 (LOVE)', value: 999, max: 999 },
    ],
  },
  pet: {
    name: '모찌',
    title: '링 베어러 치즈냥이',
  },
  wedding: {
    dateISO: '2027-05-22T13:00:00+09:00',
    dateDisplay: '2027년 5월 22일 토요일',
    timeDisplay: '오후 1시 00분',
    year: 2027,
    month: 5,
    day: 22,
    dayOfWeek: '토요일',
    venueName: '아르카디아 픽셀 그랜드 캐슬',
    hallName: '3층 크리스탈 가든홀',
    addressRoad: '서울특별시 강남구 테헤란로 522 아르카디아 타워 3F',
    addressJibun: '서울특별시 강남구 삼성동 158-22',
    tel: '02-555-0522',
    lat: 37.5088,
    lng: 127.0631,
    subwayGuide: [
      '2호선 삼성역 4번 출구 도보 4분 (직진 250m 우측 성당 건물)',
      '9호선 봉은사역 7번 출구 도보 6분 (셔틀 포탈 5분 간격 운행)',
    ],
    busGuide: [
      '간선버스 : 143, 146, 301, 342, 401 (무역센터 정류장 하차)',
      '지선버스 : 2413, 3411, 3412, 4318',
    ],
    parkingGuide: [
      '건물 내 지하 B2 ~ B6 전용 주차던전 800대 동시 주차 가능',
      '웨딩홀 로비 접수대에서 2시간 무료 귀환석(주차권) 등록',
    ],
    shuttleGuide: '삼성역 4번 출구 앞 [LOVE QUEST 셔틀 마차] 12:00부터 10분 간격 운행',
  },
  invitationMessage: {
    headline: '서로의 세계를 구원할 평생의 파티원을 찾았습니다',
    paragraphs: [
      '각자의 맵에서 솔로 플레이를 이어오던 두 모험가가 우연한 퀘스트에서 만나 1,460일 동안 함께 웃고 성장했습니다.',
      '비 오는 날엔 서로의 우산 버프가 되어주고, 맛있는 음식을 발견하면 가장 먼저 아이템을 나누던 우리가 이제 [부부]라는 이름으로 새로운 월드맵을 시작하려 합니다.',
      '저희 두 사람의 가장 찬란한 챕터가 열리는 날, 귀한 걸음으로 축복의 자리를 빛내주시면 평생 잊지 못할 큰 기쁨으로 간직하겠습니다.',
    ],
    questObjective: '퀘스트 목표 : 2027. 05. 22 (토) 오후 1시, 두 사람의 영원한 서약을 축복해주세요!',
  },
  storyLog: [
    {
      chapter: 'STAGE 01',
      date: '2023. 05',
      title: '우연한 첫 파티 매칭',
      desc: '성수동의 작은 보드게임 카페에서 같은 테이블에 앉게 된 두 사람. 첫날부터 대화가 6시간 동안 끊기지 않았습니다.',
      badge: 'FIRST ENCOUNTER',
    },
    {
      chapter: 'STAGE 02',
      date: '2024. 10',
      title: '제주도 3박 4일 협동 레이드',
      desc: '갑작스러운 폭우 속에서도 함께 라면을 끓여 먹으며 웃던 밤, “이 사람과라면 평생 어느 던전이든 즐거울 것 같다”고 확신했습니다.',
      badge: 'BOND LV.50',
    },
    {
      chapter: 'STAGE 03',
      date: '2026. 12',
      title: '별빛 아래의 전설 반지 프러포즈',
      desc: '직접 만든 픽셀 포토북과 함께 건넨 반지. 서연이가 눈물과 함께 [수락(YES)] 버튼을 눌렀습니다!',
      badge: 'QUEST ACCEPTED',
    },
    {
      chapter: 'FINAL STAGE',
      date: '2027. 05. 22',
      title: '영원의 서약, 결혼식 본식 오픈!',
      desc: '소중한 하객 모험가 여러분의 축복 속에서 [부부 길드]를 정식 창설합니다.',
      badge: 'NEW WORLD OPEN',
    },
  ],
  gallery: [
    {
      id: 'photo-1',
      title: '벚꽃 성채 앞에서의 약속',
      subtitle: 'Chapter 1 · 봄날의 스냅',
      seasonTag: 'SPRING · 벚꽃 버프',
      questExp: '+500 EXP',
      imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
      pixelTheme: 'cherry_blossom',
      description: '따스한 봄바람에 벚꽃잎이 흩날리던 날, 처음 맞춘 웨딩 슈트와 드레스를 입고 기록한 첫 번째 장면입니다.',
      initialLikes: 48,
    },
    {
      id: 'photo-2',
      title: '노을 지는 황금빛 해변',
      subtitle: 'Chapter 2 · 제주 선셋 필드',
      seasonTag: 'SUMMER · 황금 노을',
      questExp: '+750 EXP',
      imageUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80',
      pixelTheme: 'sunset_beach',
      description: '파도 소리와 붉은 노을이 어우러진 바닷가에서 서로의 손을 꼭 잡고 걸었던 순간입니다.',
      initialLikes: 62,
    },
    {
      id: 'photo-3',
      title: '별빛 야영지에서의 프러포즈',
      subtitle: 'Chapter 3 · 별똥별의 밤',
      seasonTag: 'AUTUMN · 별빛 마법',
      questExp: '+999 EXP',
      imageUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=900&q=80',
      pixelTheme: 'starry_camp',
      description: '수많은 별빛과 랜턴 불빛 아래에서 평생의 동반자가 되기로 약속한 밤입니다.',
      initialLikes: 91,
    },
    {
      id: 'photo-4',
      title: '대성당의 화이트 베일',
      subtitle: 'Chapter 4 · 로얄 웨딩홀',
      seasonTag: 'ROYAL · 성스러운 빛',
      questExp: '+1200 EXP',
      imageUrl: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=900&q=80',
      pixelTheme: 'royal_castle',
      description: '다가올 5월 22일, 여러분을 맞이할 설레는 마음으로 남긴 웨딩 본식 포트레이트입니다.',
      initialLikes: 84,
    },
    {
      id: 'photo-5',
      title: '가을 숲속의 피크닉 데이트',
      subtitle: 'Chapter 5 · 단풍나무 정원',
      seasonTag: 'COZY · 힐링 포션',
      questExp: '+600 EXP',
      imageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=900&q=80',
      pixelTheme: 'autumn_cafe',
      description: '평소 가장 좋아하는 커피와 디저트를 나누며 장난치던 가장 우리다운 모습입니다.',
      initialLikes: 57,
    },
    {
      id: 'photo-6',
      title: '첫눈 내리던 겨울 마을',
      subtitle: 'Chapter 6 · 윈터 원더랜드',
      seasonTag: 'WINTER · 영원의 온기',
      questExp: '+880 EXP',
      imageUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=900&q=80',
      pixelTheme: 'snow_village',
      description: '추운 겨울에도 손난로보다 따뜻했던 두 사람의 네 번째 겨울 기록입니다.',
      initialLikes: 73,
    },
  ],
  accounts: {
    groomSide: [
      {
        role: '신랑 (성기사)',
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
        role: '신부 (아크메이지)',
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
      question: 'Q1. 신랑 민준 & 신부 서연이가 처음 만난 장소는 어디일까요?',
      options: [
        '성수동 보드게임 카페',
        '강남역 방탈출 던전',
        '한강 치맥 피크닉',
        '대학교 도서관 4층',
      ],
      correctIndex: 0,
      explanation: '정답! 성수동 보드게임 카페에서 첫 파티 매칭에 성공해 6시간 수다를 떨었답니다!',
    },
    {
      id: 'q2',
      question: 'Q2. 두 사람이 함께 키우는 귀여운 치즈냥이(링 베어러)의 이름은?',
      options: ['치즈', '모찌', '호두', '보리'],
      correctIndex: 1,
      explanation: '정답! 말랑말랑한 볼살이 매력적인 치즈냥이 [모찌]가 마을 광장에도 나와 있어요!',
    },
    {
      id: 'q3',
      question: 'Q3. 신랑 민준이의 최고 특기 스킬(Special Skill)은 무엇일까요?',
      options: [
        '서연이 전용 무한 리액션 & 요리',
        '노래방 3옥타브 고음 발사',
        '철권 무릎급 콤보 입력',
        '마라톤 풀코스 완주',
      ],
      correctIndex: 0,
      explanation: '정답! 요리 스킬 Lv.92와 무한 리액션 버프로 서연이의 행복지수를 매일 채워줍니다!',
    },
  ],
  initialGuestbook: [
    {
      id: 'gb-1',
      name: '지훈 (대학동기)',
      avatar: 'knight',
      side: 'groom',
      titleBadge: '⚔️ 전설의 하객',
      message: '민준아 드디어 장가가는구나!! 두 사람 평생 꽃길만 걷길 축복한다!!',
      createdAt: '방금 전',
      attendance: 'attend',
      companions: 1,
      meal: 'yes',
    },
    {
      id: 'gb-2',
      name: '수빈 (베프)',
      avatar: 'mage',
      side: 'bride',
      titleBadge: '🌸 부케 스나이퍼',
      message: '우리 서연이 세상에서 제일 예쁜 신부야 ㅠㅠ 5월 22일에 무조건 출석 완료!!',
      createdAt: '10분 전',
      attendance: 'attend',
      companions: 1,
      meal: 'yes',
    },
    {
      id: 'gb-3',
      name: '현우 & 미소 부부',
      avatar: 'bard',
      side: 'both',
      titleBadge: '🎵 유부길드 선배',
      message: '유부 월드 입성을 환영합니다!! 도트 청첩장 진짜 역대급으로 귀여워요 ㅋㅋㅋ',
      createdAt: '32분 전',
      attendance: 'attend',
      companions: 2,
      meal: 'yes',
    },
    {
      id: 'gb-4',
      name: '고모 & 고모부',
      avatar: 'healer',
      side: 'groom',
      titleBadge: '💖 축복의 대현자',
      message: '늘 서로 아끼고 사랑하며 화목한 가정 이루기를 온 마음으로 기도한다. 축하해!',
      createdAt: '1시간 전',
      attendance: 'attend',
      companions: 2,
      meal: 'yes',
    },
  ],
};
