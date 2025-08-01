import { Keywords } from '../types';

export const keywords: Keywords = {
  politics: {
    normal: ['대통령', '국회', '정부', '민주주의', '선거', '정책', '법률', '외교'],
    liar: ['총리', '의회', '행정부', '공화국', '투표', '방침', '규정', '국제관계']
  },
  economy: {
    normal: ['주식', '은행', '투자', '경제', '금융', '부동산', '무역', '인플레이션'],
    liar: ['증권', '금고', '자본', '재정', '자금', '부동자산', '상업', '물가상승']
  },
  history: {
    normal: ['고조선', '삼국시대', '고려', '조선', '일제강점기', '독립운동', '6.25전쟁', '민주화'],
    liar: ['로마제국', '중세시대', '르네상스', '프랑스혁명', '산업혁명', '세계대전', '냉전시대', '정보화시대']
  },
  nature: {
    normal: ['지구', '태양', '달', '별', '우주', '은하수', '행성', '소행성'],
    liar: ['바다', '산', '강', '숲', '사막', '빙하', '화산', '지진']
  },
  culture: {
    normal: ['한복', '김치', '태권도', '판소리', '한글', '불교', '유교', '전통'],
    liar: ['전통의상', '발효음식', '무술', '민속음악', '한국문자', '종교', '철학', '문화']
  },
  animals: {
    normal: ['호랑이', '곰', '사자', '코끼리', '기린', '팬더', '펭귄', '고래'],
    liar: ['늑대', '여우', '치타', '하마', '얼룩말', '코알라', '알파카', '돌고래']
  },
  plants: {
    normal: ['소나무', '벚꽃', '장미', '해바라기', '튤립', '국화', '난초', '수국'],
    liar: ['단풍나무', '개나리', '튤립', '카네이션', '백합', '장미', '카라', '안개꽃']
  },
  games: {
    normal: ['롤', '오버워치', '마인크래프트', '포켓몬', '피파', '배틀그라운드', '스타크래프트', '디아블로'],
    liar: ['발로란트', '팔라딘', '스타듀밸리', '디지몬', '이스포츠', '포트나이트', '워크래프트', '다크소울']
  },
  movies: {
    normal: ['아바타', '타이타닉', '스타워즈', '해리포터', '반지의제왕', '인터스텔라', '인셉션', '어벤져스'],
    liar: ['토이스토리', '라이온킹', '스파이더맨', '반지의제왕', '듄', '매트릭스', '배트맨', '가디언즈 오브 갤럭시']
  },
  music: {
    normal: ['BTS', '블랙핑크', '아이유', '싸이', '빅뱅', '소녀시대', '엑소', '레드벨벳'],
    liar: ['세븐틴', '투모로우바이투게더', '태연', '제니', '투피엠', '아이브', '뉴진스', '르세라핌']
  }
};

// 전체 주제 목록 (all 제외)
export const availableTopics = ['politics', 'economy', 'history', 'nature', 'culture', 'animals', 'plants', 'games', 'movies', 'music'];

// 랜덤 주제 선택 함수
export const getRandomTopic = (): string => {
  const randomIndex = Math.floor(Math.random() * availableTopics.length);
  return availableTopics[randomIndex];
};

// all 주제에 대한 키워드 가져오기 (랜덤 선택)
export const getAllKeywords = () => {
  const randomTopic = getRandomTopic();
  return keywords[randomTopic as keyof typeof keywords];
};

export const getTopicName = (topic: string): string => {
  const topicNames: Record<string, string> = {
    politics: '정치',
    economy: '경제',
    history: '역사',
    nature: '자연',
    culture: '문화',
    animals: '동물',
    plants: '식물',
    games: '게임',
    movies: '영화',
    music: '음악',
    all: '전체'
  };
  return topicNames[topic] || topic;
};

export const generateRoomId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}; 