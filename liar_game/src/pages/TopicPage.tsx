import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { getTopicName } from '../utils/keywords';
import Button from '../components/Button';

const TopicPage: React.FC = () => {
  const { setScreen, setSelectedTopic, startGame } = useGameStore();
  const [localSelectedTopic, setLocalSelectedTopic] = useState('');

  const topics = [
    'politics', 'economy', 'history', 'general', 'culture',
    'animals', 'plants', 'games', 'movies', 'music', 'all'
  ];

  const handleTopicSelect = (topic: string) => {
    setLocalSelectedTopic(topic);
  };

  const handleStartGame = async () => {
    if (!localSelectedTopic) {
      alert('주제를 선택해주세요.');
      return;
    }

    try {
      // 전역 상태에 선택된 주제 설정
      setSelectedTopic(localSelectedTopic);
      
      // 게임 시작
      await startGame();
    } catch (error) {
      console.error('게임 시작 실패:', error);
      alert('게임 시작에 실패했습니다.');
    }
  };

  return (
    <div className="screen">
      <div className="container">
        <h2>주제를 선택하세요</h2>
        
        <div className="topics-grid">
          {topics.map((topic) => (
            <button
              key={topic}
              className={`topic-btn ${localSelectedTopic === topic ? 'selected' : ''}`}
              onClick={() => handleTopicSelect(topic)}
            >
              {getTopicName(topic)}
            </button>
          ))}
        </div>
        
        <div className="button-group">
          <Button
            variant="primary"
            onClick={handleStartGame}
            disabled={!localSelectedTopic}
          >
            시작하기
          </Button>
          <Button
            variant="secondary"
            onClick={() => setScreen('waiting')}
          >
            돌아가기
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TopicPage; 