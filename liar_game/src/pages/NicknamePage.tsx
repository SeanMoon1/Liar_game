import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateRoomId } from '../utils/keywords';

const NicknamePage: React.FC = () => {
  const { 
    setScreen, 
    setPlayerName, 
    setPlayers, 
    setIsHost, 
    setRoomId,
    isCreatingRoom,
    joiningRoomCode
  } = useGameStore();
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinGame = async () => {
    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    if (nickname.length > 12) {
      alert('닉네임은 12글자 이내로 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      // 플레이어 정보 설정
      setPlayerName(nickname);
      
      if (isCreatingRoom) {
        // 방 생성 모드
        setIsHost(true);
        
        // 임시 플레이어 목록 생성 (방장)
        const tempPlayers = [
          { name: nickname, isHost: true }
        ];
        setPlayers(tempPlayers);
        
        // 랜덤 방 ID 생성
        const tempRoomId = generateRoomId();
        setRoomId(tempRoomId);
      } else {
        // 방 참가 모드
        setIsHost(false);
        
        // 임시 플레이어 목록 생성 (기존 플레이어 + 새 플레이어)
        const tempPlayers = [
          { name: '기존플레이어', isHost: true },
          { name: nickname, isHost: false }
        ];
        setPlayers(tempPlayers);
        
        // 참가하려는 방 ID 설정
        setRoomId(joiningRoomCode);
      }
      
      // 대기실로 이동
      setScreen('waiting');
    } catch (error) {
      console.error('게임 참가 실패:', error);
      alert('게임 참가에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinGame();
    }
  };

  return (
    <div className="screen">
      <div className="container">
        <h2>닉네임을 입력하세요</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          {isCreatingRoom ? '새 방을 만들기 위한 닉네임을 입력하세요' : `방 ${joiningRoomCode}에 참가하기 위한 닉네임을 입력하세요`}
        </p>
        <div className="input-group">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="12글자 이내로 입력"
            maxLength={12}
            onKeyPress={handleKeyPress}
          />
          <button
            className="btn primary"
            onClick={handleJoinGame}
            disabled={isLoading || !nickname.trim()}
          >
            {isLoading ? '입장 중...' : (isCreatingRoom ? '방 만들기' : '참가하기')}
          </button>
        </div>
        
        <div className="button-group">
          <button
            className="btn secondary"
            onClick={() => setScreen('room-select')}
          >
            뒤로가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default NicknamePage; 