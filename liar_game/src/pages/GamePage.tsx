import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { getTopicName } from '../utils/keywords';
import Button from '../components/Button';
import Input from '../components/Input';

const GamePage: React.FC = () => {
  const { 
    gameData, 
    playerName, 
    roomId, 
    messages, 
    sendMessage, 
    subscribeToMessages, 
    setScreen
  } = useGameStore();
  
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Game data debugging
  useEffect(() => {
    if (gameData) {
      console.log('GamePage - 게임 데이터:', {
        playerName,
        topic: gameData.topic,
        keyword: gameData.keyword,
        isLiar: gameData.isLiar,
        liarKeyword: gameData.liarKeyword
      });
    }
  }, [gameData, playerName]);

  // Message subscription setup (한 번만)
  useEffect(() => {
    if (roomId) {
      console.log('GamePage: 메시지 구독 시작');
      subscribeToMessages(roomId);
    }
  }, [roomId, subscribeToMessages]); // subscribeToMessages 의존성 추가

  // Auto-scroll messages (최적화된 스크롤)
  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    // 메시지가 추가될 때만 스크롤
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]); // messages.length만 의존성으로 설정

  // Focus on input field when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // 메시지 전송 최적화 (useCallback 사용)
  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || isLoading) return;
    
    setIsLoading(true);
    try {
      await sendMessage(messageInput);
      setMessageInput('');
      // Keep focus on input field after sending message
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      alert('메시지 전송에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [messageInput, isLoading, sendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);



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
            <Input
              ref={inputRef as any}
              value={messageInput}
              onChange={setMessageInput}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              disabled={isLoading}
            />
            <Button
              variant="primary"
              onClick={handleSendMessage}
              disabled={isLoading || !messageInput.trim()}
            >
              전송
            </Button>
          </div>
        </div>

        <div className="button-group">
          <Button
            variant="secondary"
            onClick={() => setScreen('vote')}
          >
            투표하기
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GamePage; 