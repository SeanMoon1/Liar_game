import React, { useState } from 'react';
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
    setScreen 
  } = useGameStore();
  
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const handleVoteClick = () => {
    console.log('투표 버튼 클릭됨, 모달 상태:', !showVoteModal);
    setShowVoteModal(true);
  };

  const handlePlayerSelect = (playerName: string) => {
    console.log('플레이어 선택됨:', playerName);
    selectVote(playerName);
    setShowVoteModal(false);
  };

  const handleConfirmVote = () => {
    if (selectedVote) {
      console.log('투표 확정됨:', selectedVote);
      confirmVote();
      setHasVoted(true);
      // 잠시 후 결과 화면으로 이동
      setTimeout(() => {
        setScreen('result');
      }, 2000);
    }
  };

  const handleCancelVote = () => {
    console.log('투표 취소됨');
    setShowVoteModal(false);
  };

  // 투표 결과 계산 (임시로 랜덤하게 처리)
  const calculateVoteResult = () => {
    const voteCounts: Record<string, number> = {};
    players.forEach(player => {
      voteCounts[player.name] = Math.floor(Math.random() * 3) + 1; // 임시 랜덤 투표
    });
    
    const maxVotes = Math.max(...Object.values(voteCounts));
    const votedPlayers = Object.keys(voteCounts).filter(name => voteCounts[name] === maxVotes);
    
    return {
      votedPlayer: votedPlayers[0],
      voteCounts
    };
  };

  const voteResult = calculateVoteResult();
  const isLiarVoted = voteResult.votedPlayer === gameData?.liarKeyword;

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
              {hasVoted ? '투표 완료' : '투표하기'}
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
        </div>

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

        {/* 투표 결과 (임시) */}
        {hasVoted && (
          <div className="vote-result">
            <h3>투표 결과</h3>
            <div className="vote-counts">
              {Object.entries(voteResult.voteCounts).map(([name, count]) => (
                <div key={name} className="vote-count">
                  <span>{name}: {count}표</span>
                </div>
              ))}
            </div>
            <div className="result-message">
              <p><strong>{voteResult.votedPlayer}</strong>님이 라이어로 지목되었습니다.</p>
              <p>결과를 확인하는 중...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VotePage; 