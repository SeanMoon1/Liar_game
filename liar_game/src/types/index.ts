export interface Player {
  name: string;
  isHost: boolean;
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
  topic: string;
  liar: string | null;
  keywords: {
    normal: string;
    liar: string;
  } | null;
  messages: Message[];
  votes: Record<string, string>; // 투표 데이터 추가
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
  };
  votes: Record<string, string>;
  selectedVote: string | null;
  messages: Message[];
}

export interface Keywords {
  [topic: string]: {
    normal: string[];
    liar: string[];
  };
}

export type TopicType = 'politics' | 'economy' | 'history' | 'general' | 'culture' | 'animals' | 'plants' | 'games' | 'movies' | 'music' | 'all'; 