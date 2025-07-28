export interface Player {
  name: string;
  isHost: boolean;
  order?: number; // 플레이어 순서
  guessedKeyword?: string; // 라이어가 추측한 키워드
  hasVoted?: boolean; // 투표 완료 여부
}

export interface Message {
  id: string;
  playerName: string;
  content: string;
  timestamp: number;
  type: 'chat' | 'system';
}

export interface Room {
  code: string;
  host: string;
  players: Player[];
  gameStarted: boolean;
  topic?: string;
  liar?: string;
  keywords?: {
    normal: string;
    liar: string;
  };
  messages: Message[];
  votes: Record<string, string>; // 투표 데이터 추가
  liarGuesses?: Record<string, string>; // 라이어 추측 데이터 추가
  createdAt: number;
  maxPlayers: number;
}

export interface GameState {
  currentScreen: 'home' | 'room-select' | 'nickname' | 'waiting' | 'topic' | 'game' | 'vote' | 'result';
  playerName: string;
  roomId: string;
  isHost: boolean;
  players: Player[];
  selectedTopic: string;
  gameData: {
    topic: string;
    keyword: string;
    isLiar: boolean;
    liarKeyword: string;
    actualNormalKeyword?: string; // 실제 일반 키워드
    actualLiarKeyword?: string; // 실제 라이어 키워드
  };
  votes: Record<string, string>;
  selectedVote: string | null;
  messages: Message[];
  playerMessages: Record<string, Message[]>; // 플레이어별 메시지 목록
  liarGuessResult?: { isCorrect: boolean; guessedKeyword: string }; // 라이어 키워드 추측 결과
}

export interface Keywords {
  [topic: string]: {
    normal: string[];
    liar: string[];
  };
}

export type TopicType = 'politics' | 'economy' | 'history' | 'nature' | 'culture' | 'animals' | 'plants' | 'games' | 'movies' | 'music' | 'all'; 