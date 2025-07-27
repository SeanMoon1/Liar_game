import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, push, onValue, off } from 'firebase/database';
import { Player, Message, Room, Keywords } from '../types';

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

// 환경 변수 검증
if (!firebaseConfig.apiKey || !firebaseConfig.databaseURL) {
  throw new Error('Firebase 환경 변수가 설정되지 않았습니다. .env 파일을 확인해주세요.');
}

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// 방 생성
export const createRoom = async (roomCode: string, hostName: string): Promise<void> => {
  try {
    const roomRef = ref(database, `rooms/${roomCode}`);
    await set(roomRef, {
      host: hostName,
      players: [{ name: hostName, isHost: true }],
      gameStarted: false,
      createdAt: Date.now()
    });
  } catch (error) {
    console.error('방 생성 실패:', error);
    throw error;
  }
};

// 방 참가
export const joinRoom = async (roomCode: string, playerName: string): Promise<boolean> => {
  try {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) {
      throw new Error('존재하지 않는 방입니다.');
    }
    
    const room = snapshot.val();
    const existingPlayer = room.players?.find((p: Player) => p.name === playerName);
    
    if (existingPlayer) {
      throw new Error('이미 존재하는 닉네임입니다.');
    }
    
    const newPlayer = { name: playerName, isHost: false };
    const updatedPlayers = [...(room.players || []), newPlayer];
    
    await set(roomRef, {
      ...room,
      players: updatedPlayers
    });
    
    return true;
  } catch (error) {
    console.error('방 참가 실패:', error);
    throw error;
  }
};

// 방 정보 가져오기
export const getRoom = async (roomCode: string): Promise<Room | null> => {
  try {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error('방 정보 가져오기 실패:', error);
    throw error;
  }
};

// 플레이어 제거
export const removePlayer = async (roomCode: string, playerName: string): Promise<void> => {
  try {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    
    if (snapshot.exists()) {
      const room = snapshot.val();
      const updatedPlayers = room.players?.filter((p: Player) => p.name !== playerName) || [];
      
      await set(roomRef, {
        ...room,
        players: updatedPlayers
      });
    }
  } catch (error) {
    console.error('플레이어 제거 실패:', error);
    throw error;
  }
};

// 메시지 전송
export const sendMessage = async (roomCode: string, playerName: string, content: string): Promise<void> => {
  try {
    const messagesRef = ref(database, `rooms/${roomCode}/messages`);
    await push(messagesRef, {
      playerName,
      content,
      timestamp: Date.now(),
      type: 'chat'
    });
  } catch (error) {
    console.error('메시지 전송 실패:', error);
    throw error;
  }
};

// 게임 시작
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
      gameStarted: true,
      topic,
      liar,
      keywords,
      messages: [],
      votes: {} // 투표 데이터 초기화
    };
    
    console.log('🎮 Firebase에 저장할 방 데이터:', updatedRoomData);
    
    await set(roomRef, updatedRoomData);
    
    console.log('✅ Firebase 게임 시작 성공!');
  } catch (error) {
    console.error('❌ Firebase 게임 시작 실패:', error);
    throw error;
  }
};

// 방 실시간 구독
export const subscribeToRoom = (roomCode: string, callback: (room: Room | null) => void) => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  
  console.log('🔥 Firebase 방 구독 시작:', roomCode);
  
  const unsubscribe = onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      const roomData = snapshot.val();
      console.log('🔥 Firebase 방 데이터 수신:', {
        roomCode,
        gameStarted: roomData.gameStarted,
        topic: roomData.topic,
        liar: roomData.liar,
        playersCount: roomData.players?.length || 0
      });
      callback(roomData);
    } else {
      console.log('🔥 Firebase 방 데이터 없음:', roomCode);
      callback(null);
    }
  });
  
  return unsubscribe;
};

// 메시지 실시간 구독
export const subscribeToMessages = (roomCode: string, callback: (messages: Message[]) => void) => {
  const messagesRef = ref(database, `rooms/${roomCode}/messages`);
  
  const unsubscribe = onValue(messagesRef, (snapshot) => {
    const messages: Message[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        messages.push({
          id: childSnapshot.key!,
          ...childSnapshot.val()
        });
      });
    }
    callback(messages);
  });
  
  return unsubscribe;
};

// 투표 제출
export const submitVote = async (roomCode: string, voterName: string, votedPlayer: string): Promise<void> => {
  try {
    const voteRef = ref(database, `rooms/${roomCode}/votes/${voterName}`);
    await set(voteRef, votedPlayer); // 단순히 투표 대상 이름만 저장
    
    console.log('투표 제출 성공:', { voter: voterName, votedFor: votedPlayer });
  } catch (error) {
    console.error('투표 제출 실패:', error);
    throw error;
  }
};

export const submitLiarGuess = async (roomCode: string, playerName: string, guessedKeyword: string): Promise<void> => {
  try {
    const guessRef = ref(database, `rooms/${roomCode}/liarGuesses/${playerName}`);
    await set(guessRef, guessedKeyword);
    console.log('라이어 추측 제출 성공:', { player: playerName, guessedKeyword });
  } catch (error) {
    console.error('라이어 추측 제출 실패:', error);
    throw error;
  }
};

// 투표 실시간 구독
export const subscribeToVotes = (roomCode: string, callback: (votes: Record<string, string>) => void) => {
  const votesRef = ref(database, `rooms/${roomCode}/votes`);
  
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