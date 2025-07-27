import { create } from 'zustand';
import { GameState, Room, Message, Player, TopicType } from '../types';
import { keywords } from '../utils/keywords';
import * as firebaseApi from '../api/firebase';

interface GameStore extends GameState {
  // 방 관련 상태
  isCreatingRoom: boolean;
  joiningRoomCode: string;
  
  // 액션들
  setScreen: (screen: GameState['currentScreen']) => void;
  setPlayerName: (name: string) => void;
  setRoomId: (id: string) => void;
  setIsHost: (isHost: boolean) => void;
  setPlayers: (players: Player[]) => void;
  setSelectedTopic: (topic: string) => void;
  setGameData: (data: GameState['gameData']) => void;
  setVotes: (votes: Record<string, string>) => void;
  setSelectedVote: (vote: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  
  // 방 관련 액션
  setCreatingRoom: (isCreating: boolean) => void;
  setJoiningRoomCode: (code: string) => void;
  
  // 게임 로직
  createRoom: (playerName: string) => Promise<string | null>;
  joinRoom: (roomCode: string, playerName: string) => Promise<boolean>;
  leaveRoom: () => void;
  startGame: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  selectVote: (playerName: string) => void;
  confirmVote: () => void;
  submitVote: (votedPlayer: string) => Promise<void>;
  resetGame: () => void;
  
  // 구독 관리
  subscribeToRoom: (roomCode: string) => (() => void);
  subscribeToMessages: (roomCode: string) => (() => void);
  subscribeToVotes: (roomCode: string) => (() => void);
  unsubscribe: () => void;
}

const initialState: GameState = {
  currentScreen: 'home',
  playerName: '',
  roomId: '',
  isHost: false,
  players: [],
  selectedTopic: '',
  gameData: {
    topic: '',
    keyword: '',
    isLiar: false,
    liarKeyword: ''
  },
  votes: {},
  selectedVote: null,
  messages: []
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  
  // 방 관련 상태
  isCreatingRoom: false,
  joiningRoomCode: '',
  
  // 기본 액션들
  setScreen: (screen) => set({ currentScreen: screen }),
  setPlayerName: (name) => set({ playerName: name }),
  setRoomId: (id) => set({ roomId: id }),
  setIsHost: (isHost) => set({ isHost }),
  setPlayers: (players) => set({ players }),
  setSelectedTopic: (topic) => set({ selectedTopic: topic }),
  setGameData: (data) => set({ gameData: data }),
  setVotes: (votes) => set({ votes }),
  setSelectedVote: (vote) => set({ selectedVote: vote }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  
  // 방 관련 액션
  setCreatingRoom: (isCreating) => set({ isCreatingRoom: isCreating }),
  setJoiningRoomCode: (code) => set({ joiningRoomCode: code }),
  
  // 방 생성
  createRoom: async (playerName) => {
    try {
      const { generateRoomId } = await import('../utils/keywords');
      const roomCode = generateRoomId();
      
      await firebaseApi.createRoom(roomCode, playerName);
      set({
        roomId: roomCode,
        playerName,
        isHost: true,
        players: [{ name: playerName, isHost: true }],
        currentScreen: 'waiting'
      });
      return roomCode;
    } catch (error) {
      console.error('방 생성 실패:', error);
      return null;
    }
  },
  
  // 방 참가
  joinRoom: async (roomCode, playerName) => {
    try {
      const success = await firebaseApi.joinRoom(roomCode, playerName);
      if (success) {
        // 방 정보를 가져와서 플레이어 목록 설정
        const room = await firebaseApi.getRoom(roomCode);
        if (room) {
          set({
            roomId: roomCode,
            playerName,
            isHost: false,
            players: room.players,
            currentScreen: 'waiting'
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('방 참가 실패:', error);
      alert(error instanceof Error ? error.message : '방 참가에 실패했습니다.');
      return false;
    }
  },
  
  // 방 나가기 (단순화)
  leaveRoom: () => {
    set(initialState);
  },
  
  // 게임 시작
  startGame: async () => {
    const { roomId, selectedTopic, players, playerName } = get();
    
    if (!selectedTopic) {
      alert('주제를 선택해주세요.');
      return;
    }
    
    try {
      // 라이어 선정
      const liarIndex = Math.floor(Math.random() * players.length);
      const liar = players[liarIndex];
      
      console.log('게임 시작 - 라이어 선정:', {
        players: players.map(p => p.name),
        selectedLiar: liar.name,
        liarIndex
      });
      
      // 키워드 설정
      const topicKeywords = keywords[selectedTopic as TopicType] || keywords.general;
      const normalKeyword = topicKeywords.normal[Math.floor(Math.random() * topicKeywords.normal.length)];
      const liarKeyword = topicKeywords.liar[Math.floor(Math.random() * topicKeywords.liar.length)];
      
      console.log('게임 시작 - 키워드 설정:', {
        topic: selectedTopic,
        normalKeyword,
        liarKeyword,
        topicKeywords
      });
      
      // Firebase에 게임 시작 정보 저장
      await firebaseApi.startGame(roomId, selectedTopic, liar.name, {
        normal: normalKeyword,
        liar: liarKeyword
      });
      
      // 로컬 게임 데이터 설정
      const isLiar = liar.name === playerName;
      set({
        gameData: {
          topic: selectedTopic,
          keyword: isLiar ? liarKeyword : normalKeyword,
          isLiar,
          liarKeyword: liar.name // 실제 라이어의 이름 저장
        },
        votes: {}, // 투표 데이터 초기화
        currentScreen: 'game'
      });
      
      console.log('게임 시작 성공!', {
        topic: selectedTopic,
        liar: liar.name,
        isLiar,
        keyword: isLiar ? liarKeyword : normalKeyword
      });
      
    } catch (error) {
      console.error('게임 시작 실패:', error);
      alert('게임 시작에 실패했습니다.');
    }
  },
  
  // 메시지 전송
  sendMessage: async (content) => {
    const { roomId, playerName } = get();
    if (!roomId || !playerName || !content.trim()) return;
    
    try {
      await firebaseApi.sendMessage(roomId, {
        playerName,
        content: content.trim(),
        type: 'chat'
      });
    } catch (error) {
      console.error('메시지 전송 실패:', error);
    }
  },
  
  // 투표 선택
  selectVote: (playerName) => {
    set({ selectedVote: playerName });
  },
  
  // 투표 확인
  confirmVote: () => {
    const { selectedVote, playerName, votes } = get();
    if (!selectedVote) return;
    
    const newVotes = { ...votes, [playerName]: selectedVote };
    set({ votes: newVotes, selectedVote: null });
  },
  
  // 투표 제출 (Firebase)
  submitVote: async (votedPlayer: string) => {
    const { roomId, playerName } = get();
    if (!roomId || !playerName) return;
    
    try {
      await firebaseApi.submitVote(roomId, playerName, votedPlayer);
      console.log('투표 제출 성공:', { voter: playerName, votedFor: votedPlayer });
    } catch (error) {
      console.error('투표 제출 실패:', error);
      throw error;
    }
  },
  
  // 투표 구독
  subscribeToVotes: (roomCode: string) => {
    const unsubscribe = firebaseApi.subscribeToVotes(roomCode, (votes) => {
      console.log('투표 업데이트:', votes);
      set({ votes });
    });
    return unsubscribe;
  },
  
  // 게임 리셋
  resetGame: () => {
    set(initialState);
  },
  
  // 실시간 구독
  subscribeToRoom: (roomCode) => {
    const unsubscribe = firebaseApi.subscribeToRoom(roomCode, (room) => {
      if (room) {
        const currentPlayerName = get().playerName;
        const isLiar = room.liar === currentPlayerName;
        
        console.log('Firebase 구독 - 방 정보 업데이트:', {
          roomCode,
          currentPlayerName,
          liar: room.liar,
          isLiar,
          normalKeyword: room.keywords?.normal,
          liarKeyword: room.keywords?.liar,
          assignedKeyword: isLiar ? (room.keywords?.liar || '') : (room.keywords?.normal || '')
        });
        
        set({
          players: room.players,
          gameData: {
            topic: room.topic,
            keyword: isLiar ? (room.keywords?.liar || '') : (room.keywords?.normal || ''),
            isLiar,
            liarKeyword: room.liar || '' // 실제 라이어의 이름 저장
          },
          votes: room.votes || {} // 투표 데이터 동기화
        });
        
        // 게임이 시작되면 게임 화면으로 이동
        if (room.gameStarted && get().currentScreen === 'waiting') {
          set({ currentScreen: 'game' });
        }
      }
    });
    
    return unsubscribe;
  },
  
  subscribeToMessages: (roomCode) => {
    const unsubscribe = firebaseApi.subscribeToMessages(roomCode, (messages) => {
      set({ messages });
    });
    return unsubscribe;
  },
  
  unsubscribe: () => {
    // 구독 해제 로직
  }
})); 