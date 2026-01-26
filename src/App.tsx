import { useGameStore } from './store';
import { GameSetup } from './components/GameSetup';
import { ActiveGame } from './components/ActiveGame';
import './App.css';

function App() {
  const currentGameId = useGameStore(s => s.currentGameId);
  const game = useGameStore(s => s.getCurrentGame());

  if (!currentGameId || !game) {
    return <GameSetup />;
  }

  return <ActiveGame />;
}

export default App;
