import { useState } from 'react';
import { useGameStore } from '../store';
import { Scoreboard } from './Scoreboard';
import { HandEntry } from './HandEntry';
import { History } from './History';
import { GameComplete } from './GameComplete';

export function ActiveGame() {
  const game = useGameStore(s => s.getCurrentGame());
  const undoLastHand = useGameStore(s => s.undoLastHand);
  const setCurrentGame = useGameStore(s => s.setCurrentGame);

  const [showHandEntry, setShowHandEntry] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (!game) return null;

  if (game.status === 'completed') {
    return <GameComplete />;
  }

  return (
    <div className="active-game">
      <Scoreboard />

      <div className="game-actions">
        <button className="action-btn primary" onClick={() => setShowHandEntry(true)}>
          + Enter Hand
        </button>
        
        <button
          className="action-btn"
          onClick={() => setShowHistory(true)}
        >
          📜 History
        </button>

        {game.hands.length > 0 && (
          <button
            className="action-btn"
            onClick={() => {
              if (confirm('Undo the last hand?')) undoLastHand();
            }}
          >
            ↩ Undo
          </button>
        )}

        <button
          className="action-btn danger"
          onClick={() => {
            if (confirm('End this game and start over?')) setCurrentGame(null);
          }}
        >
          End Game
        </button>
      </div>

      {showHandEntry && <HandEntry onClose={() => setShowHandEntry(false)} />}
      {showHistory && <History onClose={() => setShowHistory(false)} />}
    </div>
  );
}
