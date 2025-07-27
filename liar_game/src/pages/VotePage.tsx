import React, { useState, useEffect } from 'react';
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
    subscribeToVotes,
    votes,
    roomId,
    setScreen 
  } = useGameStore();
  
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteUnsubscribe, setVoteUnsubscribe] = useState<(() => void) | null>(null);

  // 투표 구독 설정
  useEffect(() => {
    if (roomId) {
      const unsubscribe = subscribeToVotes(roomId);
      setVoteUnsubscribe(() => unsubscribe);
      
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [roomId, subscribeToVotes]);

  // 이미 투표했는지 확인
  useEffect(() => {
    if (votes && playerName && votes[playerName]) {
      setHasVoted(true);
    }
  }, [votes, playerName]);

  const handleVoteClick = () => {
    console.log('투표 버튼 클릭됨, 모달 상태:', !showVoteModal);
    setShowVoteModal(true);
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
        
        // 모든 플레이어가 투표했는지 확인
        setTimeout(() => {
          checkAllVotesComplete();
        }, 1000);
      } catch (error) {
        console.error('투표 제출 실패:', error);
        alert('투표 제출에 실패했습니다.');
      }
    }
  };

  const checkAllVotesComplete = () => {
    const totalPlayers = players.length;
    const votedPlayers = Object.keys(votes).length;
    
    console.log('투표 현황:', { 
      totalPlayers, 
      votedPlayers, 
      votes,
      players: players.map(p => p.name)
    });
    
    if (votedPlayers >= totalPlayers) {
      // 모든 플레이어가 투표 완료
      setTimeout(() => {
        setScreen('result');
      }, 2000);
    }
  };

  const handleCancelVote = () => {
    console.log('투표 취소됨');
    setShowVoteModal(false);
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
                <p>결과 화면으로 이동합니다...</p>
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