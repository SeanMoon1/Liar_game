import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { getTopicName } from '../utils/keywords';

const ResultPage: React.FC = () => {
  const { 
    gameData, 
    players, 
    playerName, 
    votes,
    liarGuessResult,
    resetGame, 
    setScreen 
  } = useGameStore();
  
  const [votedPlayer, setVotedPlayer] = useState<string>('');
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [isLiarVoted, setIsLiarVoted] = useState(false);
  const [isDraw, setIsDraw] = useState(false);
  const [maxVotes, setMaxVotes] = useState(0);
  const [liarWonByGuess, setLiarWonByGuess] = useState(false);

  useEffect(() => {
    // 라이어가 키워드를 정확히 추측했는지 확인
    if (liarGuessResult?.isCorrect) {
      setLiarWonByGuess(true);
      return; // 키워드 추측으로 승리한 경우 투표 결과는 무시
    }

    // 실제 투표 결과 계산
    const calculateVoteResult = () => {
      const counts: Record<string, number> = {};
      
      // 각 플레이어별 투표 수 계산 (단순화된 구조)
      Object.entries(votes).forEach(([voterName, votedFor]) => {
        counts[votedFor] = (counts[votedFor] || 0) + 1;
      });
      
      // 최다 득표자 찾기
      const maxVoteCount = Math.max(...Object.values(counts), 0);
      const votedPlayers = Object.keys(counts).filter(name => counts[name] === maxVoteCount);
      
      setVoteCounts(counts);
      setMaxVotes(maxVoteCount);
      setVotedPlayer(votedPlayers[0] || '없음');
      
      // 무승부 확인 (최다 득표자가 2명 이상)
      const isDrawResult = votedPlayers.length > 1;
      setIsDraw(isDrawResult);
      
      // 실제 라이어와 비교 (gameData.liarKeyword는 실제 라이어의 이름)
      const actualLiar = gameData?.liarKeyword;
      setIsLiarVoted(votedPlayers[0] === actualLiar);
      
      console.log('결과 계산:', {
        votes,
        counts,
        votedPlayer: votedPlayers[0],
        actualLiar,
        isLiarVoted: votedPlayers[0] === actualLiar,
        isDraw: isDrawResult,
        maxVoteCount
      });
    };

    calculateVoteResult();
  }, [votes, gameData, liarGuessResult]);

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

  // 모든 플레이어의 키워드 정보 수집
  const getPlayerKeywords = () => {
    const keywords: Record<string, { keyword: string; isLiar: boolean }> = {};
    players.forEach(player => {
      if (player.name === gameData.liarKeyword) {
        // 라이어인 경우
        keywords[player.name] = {
          keyword: gameData.actualLiarKeyword || '라이어 키워드',
          isLiar: true
        };
      } else {
        // 일반 플레이어인 경우
        keywords[player.name] = {
          keyword: gameData.actualNormalKeyword || '일반 키워드',
          isLiar: false
        };
      }
    });
    return keywords;
  };

  const playerKeywords = getPlayerKeywords();

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

          {/* 라이어 키워드 추측 결과 */}
          {liarGuessResult && (
            <div className="liar-guess-result">
              <h3>라이어 키워드 추측 결과</h3>
              <div className={`guess-result ${liarGuessResult.isCorrect ? 'correct' : 'incorrect'}`}>
                <p><strong>추측한 키워드:</strong> {liarGuessResult.guessedKeyword}</p>
                <p><strong>실제 키워드:</strong> {gameData.actualNormalKeyword}</p>
                {liarGuessResult.isCorrect ? (
                  <p className="correct-guess">🎉 정확한 추측!</p>
                ) : (
                  <p className="incorrect-guess">❌ 틀린 추측</p>
                )}
              </div>
            </div>
          )}

          {/* 키워드 추측으로 라이어가 승리한 경우 */}
          {liarWonByGuess ? (
            <div className="game-result">
              <h3>게임 결과</h3>
              <div className="result-message liar-win">
                <div>
                  <h4>🎭 라이어 승리! 🎭</h4>
                  <p><strong>{gameData.liarKeyword}</strong>님이 정확한 키워드를 추측했습니다!</p>
                  <p>라이어가 일반 플레이어의 키워드를 정확히 맞췄습니다.</p>
                </div>
              </div>
            </div>
          ) : (
            <>
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
                <div className={`result-message ${isDraw ? 'draw' : isLiarVoted ? 'citizen-win' : 'liar-win'}`}>
                  {isDraw ? (
                    <div>
                      <h4>🤝 무승부! 🤝</h4>
                      <p>최다 득표자가 <strong>{maxVotes}표</strong>로 <strong>{Object.keys(voteCounts).filter(name => voteCounts[name] === maxVotes).length}명</strong>이 동점입니다.</p>
                      <p>라이어를 정확히 찾지 못했습니다.</p>
                    </div>
                  ) : isLiarVoted ? (
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
            </>
          )}

          <div className="player-perspective">
            <h3>모든 플레이어 키워드</h3>
            <div className="all-keywords">
              {players.map((player) => (
                <div key={player.name} className="player-keyword">
                  <span className="player-name">{player.name}</span>
                  <span className="keyword">
                    {playerKeywords[player.name]?.isLiar ? (
                      <span className="liar-keyword">{playerKeywords[player.name]?.keyword}</span>
                    ) : (
                      <span className="normal-keyword">{playerKeywords[player.name]?.keyword}</span>
                    )}
                  </span>
                  {playerKeywords[player.name]?.isLiar && <span className="liar-indicator">(라이어)</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="keyword-summary">
            <h3>키워드 요약</h3>
            <div className="keyword-info">
              <div className="keyword-item">
                <span className="keyword-label">일반 플레이어 키워드:</span>
                <span className="keyword-value normal-keyword">{gameData.actualNormalKeyword}</span>
              </div>
              <div className="keyword-item">
                <span className="keyword-label">라이어 키워드:</span>
                <span className="keyword-value liar-keyword">{gameData.actualLiarKeyword}</span>
              </div>
            </div>
          </div>

          <div className="player-perspective">
            <h3>내 관점</h3>
            <div className="perspective-info">
              {gameData.isLiar ? (
                <div>
                  <p>당신은 <strong>라이어</strong>였습니다.</p>
                  <p>키워드: <strong>{gameData.keyword}</strong></p>
                  {liarWonByGuess ? (
                    <p className="result-text">🎉 승리: 정확한 키워드를 추측했습니다!</p>
                  ) : isDraw ? (
                    <p className="result-text">🤝 무승부: 시민들이 라이어를 찾지 못했습니다.</p>
                  ) : isLiarVoted ? (
                    <p className="result-text">❌ 실패: 시민들에게 들켰습니다.</p>
                  ) : (
                    <p className="result-text">✅ 성공: 시민들을 속였습니다!</p>
                  )}
                </div>
              ) : (
                <div>
                  <p>당신은 <strong>일반 플레이어</strong>였습니다.</p>
                  <p>키워드: <strong>{gameData.keyword}</strong></p>
                  {liarWonByGuess ? (
                    <p className="result-text">❌ 패배: 라이어가 키워드를 정확히 추측했습니다.</p>
                  ) : isDraw ? (
                    <p className="result-text">🤝 무승부: 라이어를 찾지 못했습니다.</p>
                  ) : isLiarVoted ? (
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