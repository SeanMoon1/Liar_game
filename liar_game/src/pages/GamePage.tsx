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
    setScreen,
    submitLiarGuess
  } = useGameStore();
  
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showGuessModal, setShowGuessModal] = useState(false);
  const [guessedKeyword, setGuessedKeyword] = useState('');
  const [hasGuessed, setHasGuessed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 게임 데이터 디버깅
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

  // 컴포넌트 마운트 시 입력창에 포커스
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    
    setIsLoading(true);
    try {
      await sendMessage(messageInput);
      setMessageInput('');
      // 메시지 전송 후 입력창에 포커스 유지
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
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleGuessSubmit = async () => {
    if (!guessedKeyword.trim()) return;
    
    try {
      await submitLiarGuess(guessedKeyword.trim());
      setHasGuessed(true);
      setShowGuessModal(false);
      alert('키워드 추측이 제출되었습니다!');
    } catch (error) {
      console.error('키워드 추측 제출 실패:', error);
      alert('키워드 추측 제출에 실패했습니다.');
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

        {/* 라이어 키워드 추측 섹션 */}
        {gameData.isLiar && !hasGuessed && (
          <div className="liar-guess-section">
            <h3>일반 플레이어의 키워드를 추측해보세요!</h3>
            <p>다른 플레이어들의 대화를 듣고 일반 플레이어들이 받은 키워드를 추측해보세요.</p>
            <div className="guess-input">
              <input
                type="text"
                value={guessedKeyword}
                onChange={(e) => setGuessedKeyword(e.target.value)}
                placeholder="추측하는 키워드를 입력하세요..."
                maxLength={20}
              />
              <button
                className="btn primary"
                onClick={handleGuessSubmit}
                disabled={!guessedKeyword.trim()}
              >
                추측 제출
              </button>
            </div>
          </div>
        )}

        {gameData.isLiar && hasGuessed && (
          <div className="guess-complete">
            <p>✅ 키워드 추측이 완료되었습니다!</p>
          </div>
        )}

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
              ref={inputRef}
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