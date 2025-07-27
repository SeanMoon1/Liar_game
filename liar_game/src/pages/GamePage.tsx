import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { getTopicName } from '../utils/keywords';

const GamePage: React.FC = () => {
  const { 
    gameData, 
    playerName, 
    roomId, 
    messages, 
    sendMessage, 
    subscribeToMessages, 
    unsubscribe,
    setScreen
  } = useGameStore();
  
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 메시지 구독 설정
  useEffect(() => {
    if (roomId) {
      subscribeToMessages(roomId);
    }
    
    return () => {
      unsubscribe();
    };
  }, [roomId, subscribeToMessages, unsubscribe]);

  // 메시지 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    
    setIsLoading(true);
    try {
      await sendMessage(messageInput);
      setMessageInput('');
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      alert('메시지 전송에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!gameData) {
    return (
      <div className="screen">
        <div className="container">
          <h2>게임 정보를 불러오는 중...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="container">
        <div className="game-header">
          <h2>게임 진행 중</h2>
          <div className="game-info">
            <p><strong>주제:</strong> {getTopicName(gameData.topic)}</p>
            <p><strong>내 역할:</strong> {gameData.isLiar ? '라이어' : '일반 플레이어'}</p>
            <p><strong>내 키워드:</strong> {gameData.keyword}</p>
          </div>
        </div>

        <div className="chat-container">
          <div className="messages">
            {messages.length === 0 ? (
              <div className="no-messages">
                <p>채팅을 시작해보세요!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`message ${message.playerName === playerName ? 'own' : ''}`}
                >
                  <div className="message-header">
                    <span className="player-name">{message.playerName}</span>
                    <span className="timestamp">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="message-content">{message.content}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="message-input">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              disabled={isLoading}
            />
            <button
              className="btn primary"
              onClick={handleSendMessage}
              disabled={isLoading || !messageInput.trim()}
            >
              전송
            </button>
          </div>
        </div>

        <div className="button-group">
          <button
            className="btn secondary"
            onClick={() => setScreen('vote')}
          >
            투표하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default GamePage; 