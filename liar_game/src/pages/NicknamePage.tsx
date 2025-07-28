import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import Button from '../components/Button';
import Input from '../components/Input';

const NicknamePage: React.FC = () => {
  const { 
    setScreen, 
    createRoom,
    joinRoom,
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
      if (isCreatingRoom) {
        // 방 생성 모드
        console.log('방 생성 중...');
        const roomCode = await createRoom(nickname);
        
        if (!roomCode) {
          throw new Error('방 생성에 실패했습니다.');
        }
        
        console.log('방 생성 성공:', roomCode);
      } else {
        // 방 참가 모드
        console.log('방 참가 중:', joiningRoomCode);
        const success = await joinRoom(joiningRoomCode, nickname);
        
        if (!success) {
          throw new Error('방 참가에 실패했습니다.');
        }
        
        console.log('방 참가 성공');
      }
      
      // 대기실로 이동 (GameStore에서 이미 설정됨)
      setScreen('waiting');
    } catch (error) {
      console.error('게임 참가 실패:', error);
      alert(error instanceof Error ? error.message : '게임 참가에 실패했습니다.');
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
          <Input
            value={nickname}
            onChange={setNickname}
            placeholder="12글자 이내로 입력"
            maxLength={12}
            onKeyPress={handleKeyPress}
          />
          <Button
            variant="primary"
            onClick={handleJoinGame}
            disabled={isLoading || !nickname.trim()}
          >
            {isLoading ? '입장 중...' : (isCreatingRoom ? '방 만들기' : '참가하기')}
          </Button>
        </div>
        
        <div className="button-group">
          <Button
            variant="secondary"
            onClick={() => setScreen('room-select')}
          >
            뒤로가기
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NicknamePage; 