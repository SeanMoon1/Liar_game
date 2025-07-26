// 전역 방 저장소 (실제로는 Redis나 데이터베이스 사용 권장)
const rooms = new Map();

// 환경변수에서 설정 가져오기
const MAX_ROOMS = process.env.MAX_ROOMS || 100;
const ROOM_TIMEOUT = process.env.ROOM_TIMEOUT || 3600000; // 1시간 (밀리초)
const MAX_PLAYERS_PER_ROOM = process.env.MAX_PLAYERS_PER_ROOM || 10;
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

export default function handler(req, res) {
  if (req.method === 'POST') {
    // 방 생성
    const { roomCode, hostName } = req.body;
    
    if (rooms.has(roomCode)) {
      return res.status(400).json({ error: '이미 존재하는 방 코드입니다.' });
    }
    
    // 최대 방 개수 제한
    if (rooms.size >= MAX_ROOMS) {
      return res.status(400).json({ error: '최대 방 개수에 도달했습니다.' });
    }
    
    const room = {
      code: roomCode,
      host: hostName,
      players: [{ name: hostName, isHost: true }],
      gameStarted: false,
      topic: '',
      liar: null,
      messages: [],
      createdAt: new Date().toISOString(),
      maxPlayers: MAX_PLAYERS_PER_ROOM
    };
    
    rooms.set(roomCode, room);
    
    return res.status(200).json({ 
      success: true, 
      room: room 
    });
  }
  
  if (req.method === 'GET') {
    // 방 정보 조회
    const { roomCode } = req.query;
    
    if (!roomCode) {
      return res.status(400).json({ error: '방 코드가 필요합니다.' });
    }
    
    const room = rooms.get(roomCode);
    if (!room) {
      return res.status(404).json({ error: '존재하지 않는 방입니다.' });
    }
    
    return res.status(200).json({ 
      success: true, 
      room: room 
    });
  }
  
  if (req.method === 'DELETE') {
    // 방 삭제
    const { roomCode } = req.query;
    
    if (!roomCode) {
      return res.status(400).json({ error: '방 코드가 필요합니다.' });
    }
    
    const deleted = rooms.delete(roomCode);
    
    return res.status(200).json({ 
      success: true, 
      deleted: deleted 
    });
  }
  
  return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
} 