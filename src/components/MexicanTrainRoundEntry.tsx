import { useState } from 'react';
import { useGameStore } from '../store';
import { MexicanTrainGame, MexicanTrainRoundScore } from '../types';

interface Props {
  onClose: () => void;
}

export function MexicanTrainRoundEntry({ onClose }: Props) {
  const game = useGameStore(s => s.getCurrentGame()) as MexicanTrainGame | null;
  const addMexicanTrainRound = useGameStore(s => s.addMexicanTrainRound);

  const [winnerId, setWinnerId] = useState<string>('');
  const [pips, setPips] = useState<Record<string, number>>(() =>
    Object.fromEntries(game?.players.map(p => [p.id, 0]) || [])
  );
  const [showConfirm, setShowConfirm] = useState(false);

  if (!game || game.gameType !== 'mexicantrain') return null;

  const roundNumber = 13 - game.currentEngine;

  const updatePips = (playerId: string, delta: number) => {
    setPips(prev => ({
      ...prev,
      [playerId]: Math.max(0, (prev[playerId] || 0) + delta),
    }));
  };

  const submitRound = () => {
    if (!winnerId) return;

    const scores: MexicanTrainRoundScore[] = game.players.map(p => ({
      playerId: p.id,
      pips: p.id === winnerId ? 0 : pips[p.id] || 0,
    }));

    addMexicanTrainRound({
      roundNumber,
      engine: game.currentEngine,
      dealerId: game.currentDealerId,
      winnerId,
      scores,
    });

    onClose();
  };

  return (
    <div className="hand-entry-overlay">
      <div className="hand-entry">
        <div className="hand-entry-header">
          <h2>Round {roundNumber} • Double-{game.currentEngine}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="winner-select">
          <label>Who went out first? (emptied their hand)</label>
          <div className="winner-buttons">
            {game.players.map(p => (
              <button
                key={p.id}
                className={`winner-btn ${winnerId === p.id ? 'selected' : ''}`}
                onClick={() => {
                  setWinnerId(p.id);
                  // Set winner's pips to 0
                  setPips(prev => ({ ...prev, [p.id]: 0 }));
                }}
              >
                {p.avatar} {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="entries-table">
          {game.players.map(player => {
            const isWinner = player.id === winnerId;
            const playerPips = pips[player.id] || 0;
            const state = game.playerStates.find(s => s.playerId === player.id);

            return (
              <div key={player.id} className={`entry-row ${isWinner ? 'winner' : ''}`}>
                <div className="entry-player">
                  <span>{player.avatar} {player.name}</span>
                  <span className="phase-info">
                    Current total: {state?.totalScore || 0} pts
                  </span>
                </div>

                <div className="cards-entry">
                  <p className="cards-label">
                    {isWinner ? 'Pips (0 - went out!)' : 'Pips left in hand:'}
                  </p>
                  <div className="card-row">
                    <span>Total pips</span>
                    <div className="stepper">
                      <button 
                        onClick={() => updatePips(player.id, -5)}
                        disabled={isWinner}
                      >−5</button>
                      <button 
                        onClick={() => updatePips(player.id, -1)}
                        disabled={isWinner}
                      >−</button>
                      <span style={{ width: 50 }}>{isWinner ? 0 : playerPips}</span>
                      <button 
                        onClick={() => updatePips(player.id, 1)}
                        disabled={isWinner}
                      >+</button>
                      <button 
                        onClick={() => updatePips(player.id, 5)}
                        disabled={isWinner}
                      >+5</button>
                    </div>
                  </div>
                </div>

                <div className="entry-score">
                  Round score: <strong>{isWinner ? 0 : playerPips}</strong>
                  {state && (
                    <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
                      (New total: {state.totalScore + (isWinner ? 0 : playerPips)})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="hand-entry-actions">
          {!showConfirm ? (
            <button
              className="submit-btn"
              onClick={() => setShowConfirm(true)}
              disabled={!winnerId}
            >
              Review & Submit Round
            </button>
          ) : (
            <div className="confirm-actions">
              <p>Confirm round scores?</p>
              <button className="cancel-btn" onClick={() => setShowConfirm(false)}>Back</button>
              <button className="confirm-btn" onClick={submitRound}>Confirm</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
