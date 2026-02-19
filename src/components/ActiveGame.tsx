import { useState } from 'react';
import { useGameStore } from '../store';
import { Scoreboard } from './Scoreboard';
import { HandEntry } from './HandEntry';
import { History } from './History';
import { GameComplete } from './GameComplete';
import { CribbageBoard } from './CribbageBoard';
import { SkipBoBoard } from './SkipBoBoard';
import { MexicanTrainBoard } from './MexicanTrainBoard';
import { Phase10Game, CribbageGame, SkipBoGame, MexicanTrainGame } from '../types';

export function ActiveGame() {
  const game = useGameStore(s => s.getCurrentGame());
  const undoLastHand = useGameStore(s => s.undoLastHand);
  const setCurrentGame = useGameStore(s => s.setCurrentGame);
  const pauseGame = useGameStore(s => s.pauseGame);
  const resumeGame = useGameStore(s => s.resumeGame);

  const [showHandEntry, setShowHandEntry] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (!game) return null;

  if (game.status === 'completed') {
    return <GameComplete />;
  }

  // Phase 10 game
  if (game.gameType === 'phase10') {
    const p10Game = game as Phase10Game;
    return (
      <div className="active-game">
        <Scoreboard />

        <div className="game-actions">
          <button className="action-btn primary" onClick={() => setShowHandEntry(true)}>
            + Enter Hand
          </button>
          
          <button className="action-btn" onClick={() => setShowHistory(true)}>
            📜 History
          </button>

          {p10Game.hands.length > 0 && (
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

  // Cribbage game
  if (game.gameType === 'cribbage') {
    const cribGame = game as CribbageGame;
    return (
      <div className="active-game">
        <CribbageBoard game={cribGame} />
        
        <div className="game-actions">
          {game.status === 'paused' ? (
            <button className="action-btn primary" onClick={() => resumeGame()}>
              ▶️ Resume Game
            </button>
          ) : (
            <button className="action-btn" onClick={() => pauseGame({
              round: cribGame.round,
              dealerId: cribGame.currentDealerId,
              currentPlayerId: cribGame.currentPlayerId,
              scores: cribGame.scores,
            })}>
              ⏸️ Pause
            </button>
          )}
          
          <button
            className="action-btn danger"
            onClick={() => {
              if (confirm('End this game?')) setCurrentGame(null);
            }}
          >
            End Game
          </button>
        </div>
      </div>
    );
  }

  // Skip-Bo game
  if (game.gameType === 'skipbo') {
    const skipGame = game as SkipBoGame;
    return (
      <div className="active-game">
        <SkipBoBoard game={skipGame} />
        
        <div className="game-actions">
          <button
            className="action-btn danger"
            onClick={() => {
              if (confirm('End this game?')) setCurrentGame(null);
            }}
          >
            End Game
          </button>
        </div>
      </div>
    );
  }

  // Mexican Train game
  if (game.gameType === 'mexicantrain') {
    const mtGame = game as MexicanTrainGame;
    return (
      <div className="active-game">
        <MexicanTrainBoard game={mtGame} />
        
        <div className="game-actions">
          {game.status === 'paused' ? (
            <button className="action-btn primary" onClick={() => resumeGame()}>
              ▶️ Resume Game
            </button>
          ) : (
            <button className="action-btn" onClick={() => pauseGame({
              dealerId: mtGame.currentDealerId,
              currentPlayerId: mtGame.currentPlayerId,
              round: mtGame.round,
              scores: mtGame.scores,
            })}>
              ⏸️ Pause
            </button>
          )}
          
          <button
            className="action-btn danger"
            onClick={() => {
              if (confirm('End this game?')) setCurrentGame(null);
            }}
          >
            End Game
          </button>
        </div>
      </div>
    );
  }

  return null;
}
