import React from 'react';
import { useGameStore } from './store/gameStore';
import HomePage from './pages/HomePage';
import RoomSelectPage from './pages/RoomSelectPage';
import NicknamePage from './pages/NicknamePage';
import WaitingPage from './pages/WaitingPage';
import TopicPage from './pages/TopicPage';
import GamePage from './pages/GamePage';
import VotePage from './pages/VotePage';
import ResultPage from './pages/ResultPage';

function App() {
  const { currentScreen } = useGameStore();

  return (
    <div className="App">
      {currentScreen === 'home' && <HomePage />}
      {currentScreen === 'room-select' && <RoomSelectPage />}
      {currentScreen === 'nickname' && <NicknamePage />}
      {currentScreen === 'waiting' && <WaitingPage />}
      {currentScreen === 'topic' && <TopicPage />}
      {currentScreen === 'game' && <GamePage />}
      {currentScreen === 'vote' && <VotePage />}
      {currentScreen === 'result' && <ResultPage />}
    </div>
  );
}

export default App;
