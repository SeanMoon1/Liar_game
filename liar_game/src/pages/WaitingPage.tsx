import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

const WaitingPage: React.FC = () => {
  const { 
    setScreen, 
    players, 
    isHost, 
    roomId, 
    leaveRoom,
    playerName 
  } = useGameStore();
  
  const [roomCode, setRoomCode] = useState('');

  useEffect(() => {
    // 방 코드 설정
    setRoomCode(roomId || 'ABC123');
  }, [roomId]);

  const handleStartGame = () => {
    if (isHost) {
      setScreen('topic');
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    setScreen('home');
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    alert('방 코드가 복사되었습니다!');
  };

  const host = players.find(p => p.isHost);
  const playerCount = players.length;

  return (
    <div className="screen">
      <div className="container">
        <h2>게임 대기실</h2>
        
        <div className="room-info">
          <p>방장: <span>{host?.name || '로딩 중...'}</span></p>
          <p>전체 인원: <span>{playerCount}</span>명</p>
        </div>
        
        <div className="players-list">
          {players.map((player, index) => (
            <div 
              key={index} 
              className={`player-card ${player.isHost ? 'host' : ''}`}
            >
              <div className="player-info">
                <div className="player-name">{player.name}</div>
                <div className="player-status">
                  {player.isHost ? '방장' : '참가자'}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="room-link">
          <p>방 코드: <strong>{roomCode}</strong></p>
          <p>방 코드를 공유하세요:</p>
          <div className="link-container">
            <input
              type="text"
              value={roomCode}
              readOnly
            />
            <button
              className="btn secondary"
              onClick={copyRoomCode}
            >
              복사
            </button>
          </div>
        </div>
        
        <div className="button-group">
          {isHost && (
            <button
              className="btn primary"
              onClick={handleStartGame}
              disabled={false} // 혼자서도 게임 시작 가능하도록 수정
            >
              게임 시작
            </button>
          )}
          <button
            className="btn secondary"
            onClick={handleLeaveRoom}
          >
            방 나가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaitingPage; 