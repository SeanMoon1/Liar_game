import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, push, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { Player, Message, Room } from '../types';

// Firebase 설정 (환경 변수에서 가져오기)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

console.log('🔥 Firebase 설정 확인:', {
  apiKey: firebaseConfig.apiKey ? '설정됨' : '설정되지 않음',
  authDomain: firebaseConfig.authDomain ? '설정됨' : '설정되지 않음',
  databaseURL: firebaseConfig.databaseURL ? '설정됨' : '설정되지 않음',
  projectId: firebaseConfig.projectId ? '설정됨' : '설정되지 않음',
  storageBucket: firebaseConfig.storageBucket ? '설정됨' : '설정되지 않음',
  messagingSenderId: firebaseConfig.messagingSenderId ? '설정됨' : '설정되지 않음',
  appId: firebaseConfig.appId ? '설정됨' : '설정되지 않음',
  measurementId: firebaseConfig.measurementId ? '설정됨' : '설정되지 않음'
});

// 환경 변수 검증
if (!firebaseConfig.apiKey || !firebaseConfig.databaseURL) {
  console.error('❌ Firebase 환경 변수 누락:', {
    apiKey: !!firebaseConfig.apiKey,
    databaseURL: !!firebaseConfig.databaseURL
  });
  throw new Error('Firebase 환경 변수가 설정되지 않았습니다. .env 파일을 확인해주세요.');
}

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

console.log('✅ Firebase 초기화 완료');

// 최적화된 방 데이터 구조
interface OptimizedRoomData {
  h: string; // host (방장)
  p: { [key: string]: { n: string; h: boolean; o?: number } }; // players (플레이어들)
  g: boolean; // gameStarted
  t?: string; // topic
  l?: string; // liar
  k?: { n: string; l: string }; // keywords
  c: number; // createdAt
  v?: { [key: string]: string }; // votes
  lg?: { [key: string]: string }; // liarGuesses
}

// 방 생성 (최적화된 데이터 구조)
export const createRoom = async (roomCode: string, hostName: string): Promise<void> => {
  try {
    console.log('🏠 방 생성 시작:', { roomCode, hostName });
    
    const roomRef = ref(database, `rooms/${roomCode}`);
    const optimizedData: OptimizedRoomData = {
      h: hostName,
      p: { [hostName]: { n: hostName, h: true, o: 1 } },
      g: false,
      c: Date.now()
    };
    
    console.log('🏠 생성할 방 데이터:', optimizedData);
    
    await set(roomRef, optimizedData);
    
    console.log('✅ 방 생성 성공:', roomCode);
  } catch (error) {
    console.error('❌ 방 생성 실패:', error);
    console.error('❌ 방 생성 실패 상세:', {
      roomCode,
      hostName,
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }
};

// 방 참가 (최적화된 데이터 구조)
export const joinRoom = async (roomCode: string, playerName: string): Promise<boolean> => {
  try {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) {
      throw new Error('존재하지 않는 방입니다.');
    }
    
    const room = snapshot.val() as OptimizedRoomData;
    
    // 이미 존재하는 플레이어인지 확인
    if (room.p[playerName]) {
      throw new Error('이미 존재하는 닉네임입니다.');
    }
    
    // 플레이어 순서 계산
    const playerCount = Object.keys(room.p).length;
    const newPlayerOrder = playerCount + 1;
    
    // 새로운 플레이어 추가
    const updatedPlayers = {
      ...room.p,
      [playerName]: { n: playerName, h: false, o: newPlayerOrder }
    };
    
    await set(roomRef, {
      ...room,
      p: updatedPlayers
    });
    
    return true;
  } catch (error) {
    console.error('방 참가 실패:', error);
    throw error;
  }
};

// 방 정보 가져오기 (최적화된 구조에서 변환)
export const getRoom = async (roomCode: string): Promise<Room | null> => {
  try {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    
    if (snapshot.exists()) {
      const optimizedData = snapshot.val() as OptimizedRoomData;
      
      // 최적화된 데이터를 기존 구조로 변환
      const players: Player[] = Object.entries(optimizedData.p).map(([key, player]) => ({
        name: player.n,
        isHost: player.h,
        order: player.o
      }));
      
      return {
        code: roomCode,
        host: optimizedData.h,
        players,
        gameStarted: optimizedData.g,
        topic: optimizedData.t,
        liar: optimizedData.l,
        keywords: optimizedData.k ? { normal: optimizedData.k.n, liar: optimizedData.k.l } : undefined,
        messages: [],
        votes: optimizedData.v || {},
        liarGuesses: optimizedData.lg || {},
        createdAt: optimizedData.c,
        maxPlayers: 10
      };
    }
    return null;
  } catch (error) {
    console.error('방 정보 가져오기 실패:', error);
    throw error;
  }
};

// 빈 방 정리 (플레이어가 없을 때 방 삭제)
export const cleanupEmptyRoom = async (roomCode: string): Promise<void> => {
  try {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    
    if (snapshot.exists()) {
      const room = snapshot.val() as OptimizedRoomData;
      
      // 플레이어가 없거나 모든 플레이어가 나간 경우 방 삭제
      if (!room.p || Object.keys(room.p).length === 0) {
        console.log('🗑️ 빈 방 정리:', roomCode);
        await set(roomRef, null);
        console.log('✅ 빈 방 삭제 완료:', roomCode);
      }
    }
  } catch (error) {
    console.error('❌ 빈 방 정리 실패:', error);
    // 에러가 발생해도 게임 진행에 영향을 주지 않도록 조용히 처리
  }
};

// 플레이어 제거 (최적화된 구조 + 빈 방 정리)
export const removePlayer = async (roomCode: string, playerName: string): Promise<void> => {
  try {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    
    if (snapshot.exists()) {
      const room = snapshot.val() as OptimizedRoomData;
      const { [playerName]: removed, ...remainingPlayers } = room.p;
      
      const updatedRoom = {
        ...room,
        p: remainingPlayers
      };
      
      await set(roomRef, updatedRoom);
      
      console.log('👤 플레이어 제거 완료:', { roomCode, playerName, remainingPlayers: Object.keys(remainingPlayers) });
      
      // 플레이어가 제거된 후 빈 방인지 확인하고 정리
      if (Object.keys(remainingPlayers).length === 0) {
        console.log('🏠 마지막 플레이어가 나감, 방 정리 시작');
        await cleanupEmptyRoom(roomCode);
      }
    }
  } catch (error) {
    console.error('플레이어 제거 실패:', error);
    throw error;
  }
};

// 메시지 전송 (최적화된 구조)
export const sendMessage = async (roomCode: string, playerName: string, content: string): Promise<void> => {
  try {
    const messagesRef = ref(database, `rooms/${roomCode}/m`); // messages -> m으로 축약
    await push(messagesRef, {
      p: playerName, // playerName -> p
      c: content, // content -> c
      t: Date.now() // timestamp -> t
    });
  } catch (error) {
    console.error('메시지 전송 실패:', error);
    throw error;
  }
};

// 게임 시작 (최적화된 구조)
export const startGame = async (
  roomCode: string,
  topic: string,
  liar: string,
  keywords: { normal: string; liar: string }
): Promise<void> => {
  try {
    console.log('🎮 Firebase 게임 시작 요청:', {
      roomCode,
      topic,
      liar,
      keywords
    });
    
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    const existingData = snapshot.exists() ? snapshot.val() : {};
    
    const updatedRoomData = {
      ...existingData,
      g: true, // gameStarted -> g
      t: topic, // topic -> t
      l: liar, // liar -> l
      k: { n: keywords.normal, l: keywords.liar }, // keywords -> k
      m: [], // messages -> m
      v: {} // votes -> v
    };
    
    console.log('🎮 Firebase에 저장할 방 데이터:', updatedRoomData);
    
    await set(roomRef, updatedRoomData);
    
    console.log('✅ Firebase 게임 시작 성공!');
  } catch (error) {
    console.error('❌ Firebase 게임 시작 실패:', error);
    throw error;
  }
};

// 방 실시간 구독 (최적화된 구조)
export const subscribeToRoom = (roomCode: string, callback: (room: Room | null) => void) => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  
  console.log('🔥 Firebase 방 구독 시작:', roomCode);
  
  const unsubscribe = onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      const optimizedData = snapshot.val() as OptimizedRoomData;
      
      console.log('🔥 원본 Firebase 데이터:', optimizedData);
      
      try {
        // 최적화된 데이터를 기존 구조로 변환
        const players: Player[] = Object.entries(optimizedData.p || {}).map(([key, player]) => ({
          name: player.n,
          isHost: player.h,
          order: player.o
        }));
        
        const roomData: Room = {
          code: roomCode,
          host: optimizedData.h || '',
          players,
          gameStarted: optimizedData.g || false,
          topic: optimizedData.t,
          liar: optimizedData.l,
          keywords: optimizedData.k ? { normal: optimizedData.k.n, liar: optimizedData.k.l } : undefined,
          messages: [], // 메시지는 별도 구독으로 처리
          votes: optimizedData.v || {},
          liarGuesses: optimizedData.lg || {},
          createdAt: optimizedData.c || Date.now(),
          maxPlayers: 10
        };
        
        console.log('🔥 변환된 방 데이터:', roomData);
        console.log('🔥 Firebase 방 데이터 수신:', {
          roomCode,
          gameStarted: roomData.gameStarted,
          topic: roomData.topic,
          liar: roomData.liar,
          playersCount: roomData.players?.length || 0
        });
        callback(roomData);
      } catch (error) {
        console.error('🔥 방 데이터 변환 실패:', error);
        console.error('🔥 원본 데이터:', optimizedData);
        callback(null);
      }
    } else {
      console.log('🔥 Firebase 방 데이터 없음:', roomCode);
      callback(null);
    }
  });
  
  return unsubscribe;
};

// 메시지 실시간 구독 (최적화된 구조, 최근 50개만)
export const subscribeToMessages = (roomCode: string, callback: (messages: Message[]) => void) => {
  const messagesRef = ref(database, `rooms/${roomCode}/m`);
  const messagesQuery = query(messagesRef, orderByChild('t'), limitToLast(50)); // 최근 50개만
  
  const unsubscribe = onValue(messagesQuery, (snapshot) => {
    const messages: Message[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        messages.push({
          id: childSnapshot.key!,
          playerName: data.p,
          content: data.c,
          timestamp: data.t,
          type: 'chat'
        });
      });
    }
    callback(messages);
  });
  
  return unsubscribe;
};

// 투표 제출 (최적화된 구조)
export const submitVote = async (roomCode: string, voterName: string, votedPlayer: string): Promise<void> => {
  try {
    const voteRef = ref(database, `rooms/${roomCode}/v/${voterName}`); // votes -> v
    await set(voteRef, votedPlayer);
    
    console.log('투표 제출 성공:', { voter: voterName, votedFor: votedPlayer });
  } catch (error) {
    console.error('투표 제출 실패:', error);
    throw error;
  }
};

// 라이어 추측 제출 (최적화된 구조)
export const submitLiarGuess = async (roomCode: string, playerName: string, guessedKeyword: string): Promise<void> => {
  try {
    const guessRef = ref(database, `rooms/${roomCode}/lg/${playerName}`); // liarGuesses -> lg
    await set(guessRef, guessedKeyword);
    console.log('라이어 추측 제출 성공:', { player: playerName, guessedKeyword });
  } catch (error) {
    console.error('라이어 추측 제출 실패:', error);
    throw error;
  }
};

// 투표 실시간 구독 (최적화된 구조)
export const subscribeToVotes = (roomCode: string, callback: (votes: Record<string, string>) => void) => {
  const votesRef = ref(database, `rooms/${roomCode}/v`); // votes -> v
  
  const unsubscribe = onValue(votesRef, (snapshot) => {
    const votes: Record<string, string> = {};
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const voterName = childSnapshot.key!;
        const votedFor = childSnapshot.val();
        votes[voterName] = votedFor;
      });
    }
    console.log('투표 데이터 수신:', votes);
    callback(votes);
  });
  
  return unsubscribe;
}; 