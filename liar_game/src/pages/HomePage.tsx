import React from 'react';
import { useGameStore } from '../store/gameStore';
import Button from '../components/Button';

const HomePage: React.FC = () => {
  const setScreen = useGameStore((state) => state.setScreen);

  return (
    <div className="screen">
      <div className="container">
        <h1>라이어 게임</h1>
        <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '30px' }}>
          거짓말쟁이를 찾아내는 소셜 게임
        </p>
        
        <div className="button-group">
          <Button
            variant="primary"
            onClick={() => setScreen('room-select')}
          >
            게임 시작하기
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => setScreen('home')}
          >
            홈으로
          </Button>
        </div>
        
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          background: '#f8f9fa', 
          borderRadius: '10px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ 
            fontWeight: 'bold', 
            color: '#667eea', 
            marginBottom: '10px',
            fontSize: '1.2rem'
          }}>
            게임 규칙
          </h3>
          <ul style={{ 
            textAlign: 'left',
            color: '#666',
            lineHeight: '1.6'
          }}>
            <li>• 한 명의 라이어가 숨어있습니다</li>
            <li>• 라이어를 제외한 모두는 같은 키워드를 받습니다</li>
            <li>• 라이어는 비슷하지만 다른 키워드를 받습니다</li>
            <li>• 대화를 통해 라이어를 찾아내세요!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 