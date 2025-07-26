// 전역 방 저장소 (실제로는 Redis나 데이터베이스 사용 권장)
const rooms = new Map();

// 환경변수에서 설정 가져오기
const MAX_PLAYERS_PER_ROOM = process.env.MAX_PLAYERS_PER_ROOM || 10;
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { roomCode, playerName } = req.body;
    
    if (!roomCode || !playerName) {
      return res.status(400).json({ error: '방 코드와 플레이어 이름이 필요합니다.' });
    }
    
    const room = rooms.get(roomCode);
    if (!room) {
      return res.status(404).json({ error: '존재하지 않는 방입니다.' });
    }
    
    if (room.gameStarted) {
      return res.status(400).json({ error: '게임이 이미 시작되었습니다.' });
    }
    
    // 방 인원 수 제한 확인
    if (room.players.length >= MAX_PLAYERS_PER_ROOM) {
      return res.status(400).json({ error: '방 인원이 가득 찼습니다.' });
    }
    
    // 같은 이름의 플레이어가 있는지 확인
    const existingPlayer = room.players.find(p => p.name === playerName);
    if (existingPlayer) {
      return res.status(400).json({ error: '같은 이름의 플레이어가 이미 있습니다.' });
    }
    
    // 플레이어 추가
    room.players.push({ name: playerName, isHost: false });
    rooms.set(roomCode, room);
    
    return res.status(200).json({ 
      success: true, 
      room: room 
    });
  }
  
  if (req.method === 'DELETE') {
    const { roomCode, playerName } = req.query;
    
    if (!roomCode || !playerName) {
      return res.status(400).json({ error: '방 코드와 플레이어 이름이 필요합니다.' });
    }
    
    const room = rooms.get(roomCode);
    if (!room) {
      return res.status(404).json({ error: '존재하지 않는 방입니다.' });
    }
    
    // 플레이어 제거
    room.players = room.players.filter(p => p.name !== playerName);
    
    // 방장이 나간 경우 방 삭제
    if (room.players.length === 0) {
      rooms.delete(roomCode);
      return res.status(200).json({ 
        success: true, 
        roomDeleted: true 
      });
    }
    
    // 방장이 나간 경우 새로운 방장 지정
    if (room.host === playerName) {
      room.host = room.players[0].name;
      room.players[0].isHost = true;
    }
    
    rooms.set(roomCode, room);
    
    return res.status(200).json({ 
      success: true, 
      room: room 
    });
  }
  
  return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
} 