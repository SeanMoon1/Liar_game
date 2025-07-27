import { create } from 'zustand';
import { GameState, Room, Message, Player, TopicType } from '../types';
import { keywords } from '../utils/keywords';
import * as firebaseApi from '../api/firebase';

interface GameStore extends GameState {
  // 구독 관리
  subscriptions: {
    room: (() => void) | null;
    messages: (() => void) | null;
    votes: (() => void) | null;
  };
  
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
  setPlayerMessages: (playerMessages: Record<string, Message[]>) => void;
  setLiarGuessResult: (result: { isCorrect: boolean; guessedKeyword: string }) => void;
  
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
  submitLiarGuess: (guessedKeyword: string) => Promise<void>;
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
  messages: [],
  playerMessages: {},
  liarGuessResult: undefined
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  
  // 구독 관리 상태 추가
  subscriptions: {
    room: null as (() => void) | null,
    messages: null as (() => void) | null,
    votes: null as (() => void) | null
  },
  
  // 방 관련 상태
  isCreatingRoom: false,
  joiningRoomCode: '',
  
  // 액션들
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
    messages: [...state.messages, message],
    playerMessages: {
      ...state.playerMessages,
      [message.playerName]: [...(state.playerMessages[message.playerName] || []), message]
    }
  })),
  setPlayerMessages: (playerMessages) => set({ playerMessages }),
  setLiarGuessResult: (result) => set({ liarGuessResult: result }),
  
  // 방 관련 액션
  setCreatingRoom: (isCreating) => set({ isCreatingRoom: isCreating }),
  setJoiningRoomCode: (code) => set({ joiningRoomCode: code }),
  
  // 게임 로직
  createRoom: async (playerName) => {
    try {
      const { generateRoomId } = await import('../utils/keywords');
      const roomCode = generateRoomId();
      
      await firebaseApi.createRoom(roomCode, playerName);
      set({
        roomId: roomCode,
        playerName,
        isHost: true,
        players: [{ name: playerName, isHost: true, order: 1 }],
        currentScreen: 'waiting'
      });
      return roomCode;
    } catch (error) {
      console.error('방 생성 실패:', error);
      return null;
    }
  },
  
  joinRoom: async (roomCode, playerName) => {
    try {
      const success = await firebaseApi.joinRoom(roomCode, playerName);
      if (success) {
        // 방 정보를 가져와서 플레이어 목록 설정
        const room = await firebaseApi.getRoom(roomCode);
        if (room) {
          // 플레이어 순서 지정
          const updatedPlayers = room.players.map((player, index) => ({
            ...player,
            order: index + 1
          }));
          
          set({
            roomId: roomCode,
            playerName,
            isHost: false,
            players: updatedPlayers,
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
  
  leaveRoom: () => {
    const { roomId, playerName, subscriptions } = get();
    
    // 모든 구독 해제
    if (subscriptions.room) {
      subscriptions.room();
    }
    if (subscriptions.messages) {
      subscriptions.messages();
    }
    if (subscriptions.votes) {
      subscriptions.votes();
    }
    
    // Firebase에서 플레이어 제거 (빈 방 정리 포함)
    if (roomId && playerName) {
      firebaseApi.removePlayer(roomId, playerName).catch(console.error);
    }
    
    // 로컬 상태 초기화
    set({
      roomId: '',
      playerName: '',
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
      messages: [],
      playerMessages: {},
      liarGuessResult: undefined,
      subscriptions: {
        room: null,
        messages: null,
        votes: null
      }
    });
  },
  
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
      const gameData = {
        topic: selectedTopic,
        keyword: isLiar ? liarKeyword : normalKeyword,
        isLiar,
        liarKeyword: liar.name, // 실제 라이어의 이름 저장
        actualNormalKeyword: normalKeyword, // 실제 일반 키워드 저장
        actualLiarKeyword: liarKeyword // 실제 라이어 키워드 저장
      };
      
      set({
        gameData,
        votes: {}, // 투표 데이터 초기화
        currentScreen: 'game'
      });
      
      console.log('게임 시작 성공!', {
        topic: selectedTopic,
        liar: liar.name,
        isLiar,
        keyword: isLiar ? liarKeyword : normalKeyword,
        actualNormalKeyword: normalKeyword,
        actualLiarKeyword: liarKeyword,
        currentScreen: 'game'
      });
      
    } catch (error) {
      console.error('게임 시작 실패:', error);
      alert('게임 시작에 실패했습니다.');
    }
  },
  
  // 메시지 전송
  sendMessage: async (content) => {
    const { roomId, playerName } = get();
    try {
      await firebaseApi.sendMessage(roomId, playerName, content);
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      throw error;
    }
  },
  
  // 투표 선택
  selectVote: (playerName) => set({ selectedVote: playerName }),
  
  // 투표 확정
  confirmVote: () => {
    const { selectedVote, submitVote } = get();
    if (selectedVote) {
      submitVote(selectedVote);
    }
  },
  
  // 투표 제출
  submitVote: async (votedPlayer) => {
    const { roomId, playerName } = get();
    try {
      await firebaseApi.submitVote(roomId, playerName, votedPlayer);
      
      // 플레이어 투표 완료 상태 업데이트
      set((state) => ({
        players: state.players.map(player => 
          player.name === playerName 
            ? { ...player, hasVoted: true }
            : player
        )
      }));
    } catch (error) {
      console.error('투표 제출 실패:', error);
      throw error;
    }
  },
  
  // 라이어 키워드 추측 제출
  submitLiarGuess: async (guessedKeyword) => {
    const { roomId, playerName, gameData } = get();
    try {
      // Firebase에 라이어 추측 키워드 저장
      await firebaseApi.submitLiarGuess(roomId, playerName, guessedKeyword);
      
      // 추측이 정확한지 확인
      const isCorrectGuess = guessedKeyword.toLowerCase() === 
        (gameData?.actualNormalKeyword || '').toLowerCase();
      
      // 추측 결과 저장
      set((state) => ({
        players: state.players.map(player => 
          player.name === playerName 
            ? { ...player, guessedKeyword }
            : player
        ),
        liarGuessResult: {
          isCorrect: isCorrectGuess,
          guessedKeyword
        }
      }));
      
      console.log('라이어 추측 결과:', {
        guessedKeyword,
        actualKeyword: gameData?.actualNormalKeyword,
        isCorrect: isCorrectGuess
      });
      
      // 정확한 추측인 경우 즉시 결과화면으로 이동
      if (isCorrectGuess) {
        console.log('🎉 라이어가 정확한 키워드를 추측했습니다!');
        setTimeout(() => {
          set({ currentScreen: 'result' });
        }, 2000);
      }
    } catch (error) {
      console.error('라이어 추측 제출 실패:', error);
      throw error;
    }
  },
  
  // 게임 리셋
  resetGame: () => {
    const { subscriptions } = get();
    
    // 모든 구독 해제
    if (subscriptions.room) {
      subscriptions.room();
    }
    if (subscriptions.messages) {
      subscriptions.messages();
    }
    if (subscriptions.votes) {
      subscriptions.votes();
    }
    
    set({
      ...initialState,
      subscriptions: {
        room: null,
        messages: null,
        votes: null
      }
    });
  },
  
  // 방 구독 (최적화된 구독 관리)
  subscribeToRoom: (roomCode) => {
    const { subscriptions } = get();
    
    // 기존 구독 해제
    if (subscriptions.room) {
      subscriptions.room();
    }
    
    const unsubscribe = firebaseApi.subscribeToRoom(roomCode, (room) => {
      if (room) {
        const currentState = get();
        const currentPlayerName = currentState.playerName;
        
        console.log('방 구독 업데이트:', {
          roomCode,
          currentPlayer: currentPlayerName,
          currentScreen: currentState.currentScreen,
          gameStarted: room.gameStarted,
          players: room.players?.length || 0,
          topic: room.topic,
          liar: room.liar
        });
        
        try {
          // 플레이어 순서 유지하면서 업데이트
          const updatedPlayers = (room.players || []).map((player, index) => ({
            ...player,
            order: player.order || index + 1
          }));
          
          // 게임이 시작되었는지 확인
          if (room.gameStarted) {
            console.log('🎮 게임 시작 상태 감지!');
            
            // 현재 플레이어가 라이어인지 확인
            const isLiar = room.liar === currentPlayerName;
            
            // 게임 데이터 설정
            const gameData = {
              topic: room.topic || '',
              keyword: isLiar ? (room.keywords?.liar || '') : (room.keywords?.normal || ''),
              isLiar,
              liarKeyword: room.liar || '',
              actualNormalKeyword: room.keywords?.normal || '',
              actualLiarKeyword: room.keywords?.liar || ''
            };

            console.log('게임 데이터 설정:', gameData);

            // 즉시 화면 전환
            set({
              players: updatedPlayers,
              votes: room.votes || {},
              gameData,
              currentScreen: 'game'
            });

            console.log('✅ 게임 화면으로 즉시 전환 완료:', {
              gameData,
              currentScreen: 'game'
            });
          } else {
            // 게임이 시작되지 않은 경우 플레이어 목록만 업데이트
            set({
              players: updatedPlayers,
              votes: room.votes || {}
            });
          }
        } catch (error) {
          console.error('방 구독 데이터 처리 실패:', error);
          console.error('받은 방 데이터:', room);
        }
      } else {
        console.log('방 정보가 없음:', roomCode);
      }
    });
    
    // 구독 저장
    set((state) => ({
      subscriptions: {
        ...state.subscriptions,
        room: unsubscribe
      }
    }));
    
    return unsubscribe;
  },
  
  // 메시지 구독 (최적화된 구독 관리)
  subscribeToMessages: (roomCode) => {
    const { subscriptions } = get();
    
    // 기존 구독 해제
    if (subscriptions.messages) {
      subscriptions.messages();
    }
    
    const unsubscribe = firebaseApi.subscribeToMessages(roomCode, (messages) => {
      console.log('💬 메시지 구독 업데이트:', {
        totalMessages: messages.length,
        messages: messages.map(m => ({ player: m.playerName, content: m.content.substring(0, 20) + '...' }))
      });
      
      set({ messages });
      
      // 플레이어별 메시지 분류
      const playerMessages: Record<string, Message[]> = {};
      messages.forEach(message => {
        if (!playerMessages[message.playerName]) {
          playerMessages[message.playerName] = [];
        }
        playerMessages[message.playerName].push(message);
      });
      
      console.log('💬 플레이어별 메시지 분류:', {
        playerCount: Object.keys(playerMessages).length,
        playerMessages: Object.entries(playerMessages).map(([player, msgs]) => ({
          player,
          messageCount: msgs.length
        }))
      });
      
      set({ playerMessages });
    });
    
    // 구독 저장
    set((state) => ({
      subscriptions: {
        ...state.subscriptions,
        messages: unsubscribe
      }
    }));
    
    return unsubscribe;
  },
  
  // 투표 구독 (최적화된 구독 관리)
  subscribeToVotes: (roomCode) => {
    const { subscriptions } = get();
    
    // 기존 구독 해제
    if (subscriptions.votes) {
      subscriptions.votes();
    }
    
    const unsubscribe = firebaseApi.subscribeToVotes(roomCode, (votes) => {
      set({ votes });
      
      // 투표 완료한 플레이어들 상태 업데이트
      set((state) => ({
        players: state.players.map(player => ({
          ...player,
          hasVoted: !!votes[player.name]
        }))
      }));
    });
    
    // 구독 저장
    set((state) => ({
      subscriptions: {
        ...state.subscriptions,
        votes: unsubscribe
      }
    }));
    
    return unsubscribe;
  },
  
  // 구독 해제 (모든 구독 해제)
  unsubscribe: () => {
    const { subscriptions } = get();
    
    if (subscriptions.room) {
      subscriptions.room();
    }
    if (subscriptions.messages) {
      subscriptions.messages();
    }
    if (subscriptions.votes) {
      subscriptions.votes();
    }
    
    set((state) => ({
      subscriptions: {
        room: null,
        messages: null,
        votes: null
      }
    }));
  }
})); 