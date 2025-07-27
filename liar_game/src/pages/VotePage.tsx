import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { getTopicName } from '../utils/keywords';

const VotePage: React.FC = () => {
  const { 
    players, 
    gameData, 
    playerName, 
    selectedVote, 
    selectVote, 
    confirmVote,
    submitVote,
    submitLiarGuess,
    subscribeToVotes,
    subscribeToMessages,
    unsubscribe,
    votes,
    messages,
    playerMessages,
    sendMessage,
    roomId,
    setScreen 
  } = useGameStore();
  
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showGuessModal, setShowGuessModal] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [guessedKeyword, setGuessedKeyword] = useState('');
  const [voteUnsubscribe, setVoteUnsubscribe] = useState<(() => void) | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPlayerMessages, setShowPlayerMessages] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 투표 구독 설정
  useEffect(() => {
    if (roomId) {
      const voteUnsub = subscribeToVotes(roomId);
      const messageUnsub = subscribeToMessages(roomId);
      setVoteUnsubscribe(() => voteUnsub);
      
      return () => {
        voteUnsub();
        messageUnsub();
        unsubscribe();
      };
    }
  }, [roomId, subscribeToVotes, subscribeToMessages, unsubscribe]);

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

  // 이미 투표했는지 확인
  useEffect(() => {
    if (votes && playerName && votes[playerName]) {
      setHasVoted(true);
    }
  }, [votes, playerName]);

  // 모든 플레이어가 투표했는지 확인하고 결과화면으로 이동
  useEffect(() => {
    if (votes && players.length > 0) {
      const totalPlayers = players.length;
      const votedPlayers = Object.keys(votes).length;
      
      console.log('투표 현황 체크:', { 
        totalPlayers, 
        votedPlayers, 
        votes,
        players: players.map(p => p.name)
      });
      
      if (votedPlayers >= totalPlayers) {
        console.log('모든 플레이어 투표 완료, 결과화면으로 이동');
        // 3초 후 결과화면으로 이동
        setTimeout(() => {
          setScreen('result');
        }, 3000);
      }
    }
  }, [votes, players, setScreen]);

  const handleVoteClick = () => {
    console.log('투표 버튼 클릭됨, 모달 상태:', !showVoteModal);
    
    // 라이어인 경우 키워드 추측 모달 먼저 표시
    if (gameData?.isLiar && !hasGuessed) {
      setShowGuessModal(true);
    } else {
      setShowVoteModal(true);
    }
  };

  const handlePlayerSelect = (playerName: string) => {
    console.log('플레이어 선택됨:', playerName);
    selectVote(playerName);
    setShowVoteModal(false);
  };

  const handleConfirmVote = async () => {
    if (selectedVote) {
      console.log('투표 확정됨:', selectedVote);
      try {
        await submitVote(selectedVote);
        setHasVoted(true);
        console.log('투표 제출 완료');
      } catch (error) {
        console.error('투표 제출 실패:', error);
        alert('투표 제출에 실패했습니다.');
      }
    }
  };

  const handleGuessSubmit = async () => {
    if (!guessedKeyword.trim()) return;
    
    try {
      await submitLiarGuess(guessedKeyword.trim());
      setHasGuessed(true);
      setShowGuessModal(false);
      
      // 추측이 정확한지 확인
      const isCorrectGuess = guessedKeyword.trim().toLowerCase() === 
        (gameData?.actualNormalKeyword || '').toLowerCase();
      
      if (isCorrectGuess) {
        alert('🎉 정확한 키워드를 추측했습니다! 라이어 승리!');
        // 즉시 결과화면으로 이동
        setTimeout(() => {
          setScreen('result');
        }, 2000);
      } else {
        alert('키워드 추측이 완료되었습니다. 이제 투표를 진행하세요.');
        // 투표 모달 표시
        setShowVoteModal(true);
      }
    } catch (error) {
      console.error('키워드 추측 제출 실패:', error);
      alert('키워드 추측 제출에 실패했습니다.');
    }
  };

  const handleCancelVote = () => {
    console.log('투표 취소됨');
    setShowVoteModal(false);
  };

  const handleCancelGuess = () => {
    console.log('키워드 추측 취소됨');
    setShowGuessModal(false);
  };

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

  const handlePlayerClick = (playerName: string) => {
    setShowPlayerMessages(playerName);
  };

  const handleClosePlayerMessages = () => {
    setShowPlayerMessages(null);
  };

  // 실제 투표 결과 계산
  const calculateVoteResult = () => {
    const voteCounts: Record<string, number> = {};
    
    // 각 플레이어별 투표 수 계산 (단순화된 구조)
    Object.entries(votes).forEach(([voterName, votedFor]) => {
      voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
    });
    
    console.log('투표 결과 계산:', { votes, voteCounts });
    
    // 최다 득표자 찾기
    const maxVotes = Math.max(...Object.values(voteCounts), 0);
    const votedPlayers = Object.keys(voteCounts).filter(name => voteCounts[name] === maxVotes);
    
    return {
      votedPlayer: votedPlayers[0] || '없음',
      voteCounts,
      totalVotes: Object.keys(votes).length,
      totalPlayers: players.length
    };
  };

  const voteResult = calculateVoteResult();
  const isAllVotesComplete = voteResult.totalVotes >= voteResult.totalPlayers;

  // 발표 순서 생성 (플레이어 순서를 섞어서 랜덤하게)
  const getPresentationOrder = () => {
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    return shuffledPlayers.map((player, index) => ({
      ...player,
      order: index + 1
    }));
  };

  const presentationOrder = getPresentationOrder();

  return (
    <div className="screen">
      <div className="container">
        <div className="game-header">
          <h2>투표 시간</h2>
          <div className="game-info">
            <p><strong>주제:</strong> {gameData?.topic ? getTopicName(gameData.topic) : ''}</p>
            <p><strong>내 역할:</strong> {gameData?.isLiar ? '라이어' : '일반 플레이어'}</p>
            <p><strong>내 키워드:</strong> {gameData?.keyword}</p>
          </div>
        </div>

        <div className="vote-section">
          <h3>라이어로 의심되는 플레이어를 선택하세요</h3>
          <p>모든 플레이어가 투표를 완료하면 결과가 공개됩니다.</p>
          
          <div className="button-group">
            <button
              className="btn primary"
              onClick={handleVoteClick}
              disabled={hasVoted}
            >
              {gameData?.isLiar && !hasGuessed ? '키워드 추측하기' : hasVoted ? '투표 완료' : '투표하기'}
            </button>
            
            {selectedVote && !hasVoted && (
              <button
                className="btn secondary"
                onClick={handleConfirmVote}
              >
                투표 확정
              </button>
            )}
          </div>

          {selectedVote && (
            <div className="selected-vote">
              <p>선택한 플레이어: <strong>{selectedVote}</strong></p>
            </div>
          )}

          {gameData?.isLiar && hasGuessed && (
            <div className="guess-complete">
              <p>✅ 키워드 추측이 완료되었습니다!</p>
            </div>
          )}
        </div>

        {/* 발표 순서 표시 */}
        <div className="presentation-order">
          <h3>발표 순서</h3>
          <div className="order-list">
            {presentationOrder.map((player) => (
              <div key={player.name} className="order-item">
                <span className="order-number">{player.order}.</span>
                <span className="player-name">{player.name}</span>
                {player.hasVoted && <span className="vote-check">✅</span>}
              </div>
            ))}
          </div>
        </div>

        {/* 플레이어별 메시지 목록 */}
        <div className="player-messages-section">
          <h3>플레이어별 발언 목록</h3>
          <div className="player-list">
            {players.map((player) => (
              <button
                key={player.name}
                className="player-message-btn"
                onClick={() => handlePlayerClick(player.name)}
              >
                <span className="player-name">{player.name}</span>
                <span className="message-count">
                  ({playerMessages[player.name]?.length || 0}개)
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 실시간 채팅 */}
        <div className="chat-container">
          <h3>실시간 채팅</h3>
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

        {/* 키워드 추측 모달 */}
        {showGuessModal && (
          <div className="modal-overlay" onClick={handleCancelGuess}>
            <div className="modal guess-modal" onClick={(e) => e.stopPropagation()}>
              <h3>일반 플레이어의 키워드를 추측하세요!</h3>
              <p>다른 플레이어들의 대화를 듣고 일반 플레이어들이 받은 키워드를 정확히 추측하면 라이어가 승리합니다!</p>
              <div className="guess-input-modal">
                <input
                  type="text"
                  value={guessedKeyword}
                  onChange={(e) => setGuessedKeyword(e.target.value)}
                  placeholder="추측하는 키워드를 입력하세요..."
                  maxLength={20}
                />
              </div>
              <div className="modal-buttons">
                <button
                  className="btn primary"
                  onClick={handleGuessSubmit}
                  disabled={!guessedKeyword.trim()}
                >
                  추측 제출
                </button>
                <button className="btn secondary" onClick={handleCancelGuess}>
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 투표 모달 */}
        {showVoteModal && (
          <div className="modal-overlay" onClick={handleCancelVote}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>라이어로 의심되는 플레이어를 선택하세요</h3>
              <div className="player-vote-list">
                {players.map((player) => (
                  <button
                    key={player.name}
                    className={`vote-player-btn ${selectedVote === player.name ? 'selected' : ''}`}
                    onClick={() => handlePlayerSelect(player.name)}
                    disabled={player.name === playerName}
                  >
                    <span className="player-name">{player.name}</span>
                    {player.name === playerName && <span className="self-indicator">(나)</span>}
                  </button>
                ))}
              </div>
              <div className="modal-buttons">
                <button className="btn secondary" onClick={handleCancelVote}>
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 플레이어별 메시지 팝업 */}
        {showPlayerMessages && (
          <div className="modal-overlay" onClick={handleClosePlayerMessages}>
            <div className="modal player-messages-modal" onClick={(e) => e.stopPropagation()}>
              <h3>{showPlayerMessages}님의 발언 목록</h3>
              <div className="player-messages-list">
                {playerMessages[showPlayerMessages]?.length > 0 ? (
                  playerMessages[showPlayerMessages].map((message) => (
                    <div key={message.id} className="player-message">
                      <div className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="message-content">{message.content}</div>
                    </div>
                  ))
                ) : (
                  <p className="no-messages">발언한 메시지가 없습니다.</p>
                )}
              </div>
              <div className="modal-buttons">
                <button className="btn secondary" onClick={handleClosePlayerMessages}>
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 투표 결과 */}
        {hasVoted && (
          <div className="vote-result">
            <h3>투표 현황</h3>
            <div className="vote-progress">
              <p>투표 완료: {voteResult.totalVotes}/{voteResult.totalPlayers}명</p>
            </div>
            
            {Object.keys(voteResult.voteCounts).length > 0 && (
              <div className="vote-counts">
                <h4>현재 투표 결과:</h4>
                {Object.entries(voteResult.voteCounts).map(([name, count]) => (
                  <div key={name} className="vote-count">
                    <span>{name}: {count}표</span>
                    {name === voteResult.votedPlayer && <span className="voted-indicator">← 지목됨</span>}
                  </div>
                ))}
              </div>
            )}
            
            {isAllVotesComplete ? (
              <div className="result-message">
                <p><strong>{voteResult.votedPlayer}</strong>님이 라이어로 지목되었습니다.</p>
                <p>3초 후 결과 화면으로 이동합니다...</p>
              </div>
            ) : (
              <div className="waiting-message">
                <p>다른 플레이어들의 투표를 기다리는 중...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VotePage; 