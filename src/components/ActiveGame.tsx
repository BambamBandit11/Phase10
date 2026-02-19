import { useState } from 'react';
import { useGameStore } from '../store';
import { Scoreboard } from './Scoreboard';
import { HandEntry } from './HandEntry';
import { History } from './History';
import { GameComplete } from './GameComplete';
import { CribbageBoard } from './CribbageBoard';
import { SkipBoBoard } from './SkipBoBoard';
import { MexicanTrainBoard } from './MexicanTrainBoard';
import { MexicanTrainRoundEntry } from './MexicanTrainRoundEntry';
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
    return <MexicanTrainActiveGame game={mtGame} />;
  }

  return null;
}

// Mexican Train sub-component
function MexicanTrainActiveGame({ game }: { game: MexicanTrainGame }) {
  const setCurrentGame = useGameStore(s => s.setCurrentGame);
  const pauseGame = useGameStore(s => s.pauseGame);
  const resumeGame = useGameStore(s => s.resumeGame);
  const [showRoundEntry, setShowRoundEntry] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (game.status === 'completed') {
    return <GameComplete />;
  }

  return (
    <div className="active-game">
      <MexicanTrainBoard game={game} />

      <div className="game-actions">
        <button className="action-btn primary" onClick={() => setShowRoundEntry(true)}>
          + Enter Round
        </button>
        
        <button className="action-btn" onClick={() => setShowHistory(true)}>
          📜 History
        </button>

        {game.status === 'paused' ? (
          <button className="action-btn" onClick={() => resumeGame()}>
            ▶️ Resume
          </button>
        ) : (
          <button className="action-btn" onClick={() => pauseGame({
            dealerId: game.currentDealerId,
            currentPlayerId: game.currentDealerId,
            round: game.currentEngine,
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

      {showRoundEntry && <MexicanTrainRoundEntry onClose={() => setShowRoundEntry(false)} />}
      {showHistory && <MexicanTrainHistory game={game} onClose={() => setShowHistory(false)} />}
    </div>
  );
}

// Mexican Train History component
function MexicanTrainHistory({ game, onClose }: { game: MexicanTrainGame; onClose: () => void }) {
  const getPlayer = (id: string) => game.players.find(p => p.id === id);

  return (
    <div className="history-overlay">
      <div className="history">
        <div className="history-header">
          <h2>Round History</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {game.rounds.length === 0 ? (
          <p className="no-history">No rounds recorded yet.</p>
        ) : (
          <div className="history-list">
            {[...game.rounds].reverse().map(round => {
              const dealer = getPlayer(round.dealerId);
              const winner = round.winnerId ? getPlayer(round.winnerId) : null;

              return (
                <div key={round.id} className="history-item">
                  <div className="history-item-header">
                    <span>Round {round.roundNumber} • Double-{round.engine}</span>
                    <span>🎲 {dealer?.name}</span>
                    {winner && <span>🏆 {winner.name}</span>}
                  </div>
                  <div className="history-scores">
                    {round.scores.map(s => {
                      const player = getPlayer(s.playerId);
                      return (
                        <div key={s.playerId} className="history-score">
                          <span>{player?.avatar} {player?.name}</span>
                          <span>{s.pips === 0 ? '✓ Out!' : `${s.pips} pips`}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
