import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import Button from '../components/Button';
import Input from '../components/Input';

const RoomSelectPage: React.FC = () => {
  const { setScreen, setCreatingRoom, setJoiningRoomCode } = useGameStore();
  const [roomCode, setRoomCode] = useState('');

  const handleJoinRoom = () => {
    if (!roomCode.trim()) {
      alert('방 코드를 입력해주세요.');
      return;
    }

    // 방 참가 모드로 설정
    setJoiningRoomCode(roomCode);
    setCreatingRoom(false);
    setScreen('nickname');
  };

  const handleCreateRoom = () => {
    // 방 생성 모드로 설정
    setCreatingRoom(true);
    setJoiningRoomCode('');
    setScreen('nickname');
  };

  const handleRoomCodeChange = (value: string) => {
    setRoomCode(value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinRoom();
    }
  };

  return (
    <div className="screen">
      <div className="container">
        <h2>방을 선택하세요</h2>
        
        <div className="room-options">
          {/* 새 방 만들기 */}
          <div className="room-option">
            <h3>새 방 만들기</h3>
            <p>새로운 게임 방을 생성합니다</p>
            <Button
              variant="primary"
              onClick={handleCreateRoom}
            >
              방 만들기
            </Button>
          </div>

          {/* 기존 방 참가 */}
          <div className="room-option">
            <h3>기존 방 참가</h3>
            <p>방 코드를 입력하여 참가합니다</p>
            
            <div className="input-group">
              <Input
                value={roomCode}
                onChange={handleRoomCodeChange}
                placeholder="6자리 영문+숫자 코드 입력"
                maxLength={6}
                onKeyPress={handleKeyPress}
              />
              <Button
                variant="primary"
                onClick={handleJoinRoom}
                disabled={!roomCode.trim()}
              >
                참가하기
              </Button>
            </div>
          </div>
        </div>

        <div className="button-group">
          <Button
            variant="secondary"
            onClick={() => setScreen('home')}
          >
            홈으로
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoomSelectPage; 