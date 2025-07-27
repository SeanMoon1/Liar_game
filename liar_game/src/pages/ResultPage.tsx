import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { getTopicName } from '../utils/keywords';

const ResultPage: React.FC = () => {
  const { 
    gameData, 
    players, 
    playerName, 
    votes,
    resetGame, 
    setScreen 
  } = useGameStore();
  
  const [votedPlayer, setVotedPlayer] = useState<string>('');
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [isLiarVoted, setIsLiarVoted] = useState(false);

  useEffect(() => {
    // 실제 투표 결과 계산
    const calculateVoteResult = () => {
      const counts: Record<string, number> = {};
      
      // 각 플레이어별 투표 수 계산 (단순화된 구조)
      Object.entries(votes).forEach(([voterName, votedFor]) => {
        counts[votedFor] = (counts[votedFor] || 0) + 1;
      });
      
      // 최다 득표자 찾기
      const maxVotes = Math.max(...Object.values(counts), 0);
      const votedPlayers = Object.keys(counts).filter(name => counts[name] === maxVotes);
      
      setVoteCounts(counts);
      setVotedPlayer(votedPlayers[0] || '없음');
      
      // 실제 라이어와 비교 (gameData.liarKeyword는 실제 라이어의 이름)
      const actualLiar = gameData?.liarKeyword;
      setIsLiarVoted(votedPlayers[0] === actualLiar);
      
      console.log('결과 계산:', {
        votes,
        counts,
        votedPlayer: votedPlayers[0],
        actualLiar,
        isLiarVoted: votedPlayers[0] === actualLiar
      });
    };

    calculateVoteResult();
  }, [votes, gameData]);

  const handleNewGame = () => {
    resetGame();
    setScreen('home');
  };

  const handleBackToHome = () => {
    resetGame();
    setScreen('home');
  };

  if (!gameData) {
    return (
      <div className="screen">
        <div className="container">
          <h2>결과를 불러오는 중...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="container">
        <div className="result-header">
          <h2>게임 결과</h2>
        </div>

        <div className="result-content">
          <div className="game-summary">
            <h3>게임 요약</h3>
            <div className="summary-info">
              <p><strong>주제:</strong> {getTopicName(gameData.topic)}</p>
              <p><strong>내 역할:</strong> {gameData.isLiar ? '라이어' : '일반 플레이어'}</p>
              <p><strong>내 키워드:</strong> {gameData.keyword}</p>
              <p><strong>실제 라이어:</strong> {gameData.liarKeyword}</p>
            </div>
          </div>

          <div className="vote-results">
            <h3>투표 결과</h3>
            <div className="vote-counts">
              {Object.entries(voteCounts).map(([name, count]) => (
                <div key={name} className={`vote-count ${name === votedPlayer ? 'voted' : ''}`}>
                  <span className="player-name">{name}</span>
                  <span className="vote-number">{count}표</span>
                  {name === votedPlayer && <span className="voted-indicator">← 지목됨</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="game-result">
            <h3>게임 결과</h3>
            <div className={`result-message ${isLiarVoted ? 'citizen-win' : 'liar-win'}`}>
              {isLiarVoted ? (
                <div>
                  <h4>🎉 시민 승리! 🎉</h4>
                  <p><strong>{votedPlayer}</strong>님이 라이어로 정확히 지목되었습니다!</p>
                  <p>시민들이 라이어를 찾아냈습니다.</p>
                </div>
              ) : (
                <div>
                  <h4>🎭 라이어 승리! 🎭</h4>
                  <p><strong>{votedPlayer}</strong>님이 라이어로 잘못 지목되었습니다.</p>
                  <p>라이어가 성공적으로 속였습니다.</p>
                </div>
              )}
            </div>
          </div>

          <div className="player-perspective">
            <h3>내 관점</h3>
            <div className="perspective-info">
              {gameData.isLiar ? (
                <div>
                  <p>당신은 <strong>라이어</strong>였습니다.</p>
                  <p>키워드: <strong>{gameData.keyword}</strong></p>
                  {isLiarVoted ? (
                    <p className="result-text">❌ 실패: 시민들에게 들켰습니다.</p>
                  ) : (
                    <p className="result-text">✅ 성공: 시민들을 속였습니다!</p>
                  )}
                </div>
              ) : (
                <div>
                  <p>당신은 <strong>일반 플레이어</strong>였습니다.</p>
                  <p>키워드: <strong>{gameData.keyword}</strong></p>
                  {isLiarVoted ? (
                    <p className="result-text">✅ 성공: 라이어를 찾았습니다!</p>
                  ) : (
                    <p className="result-text">❌ 실패: 라이어를 놓쳤습니다.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="button-group">
          <button className="btn primary" onClick={handleNewGame}>
            새 게임 시작
          </button>
          <button className="btn secondary" onClick={handleBackToHome}>
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultPage; 