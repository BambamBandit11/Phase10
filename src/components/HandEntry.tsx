import { useState } from 'react';
import { useGameStore, createEmptyCardCount } from '../store';
import { HandScore, CardCount, calculateScore, PHASES } from '../types';

interface PlayerEntry {
  playerId: string;
  phaseLaid: boolean;
  cards: CardCount;
  hits: boolean;
  skippedThisHand: boolean;
}

export function HandEntry({ onClose }: { onClose: () => void }) {
  const game = useGameStore(s => s.getCurrentGame());
  const addHand = useGameStore(s => s.addHand);

  const [winnerId, setWinnerId] = useState<string>('');
  const [entries, setEntries] = useState<PlayerEntry[]>(() =>
    game?.players.map(p => ({
      playerId: p.id,
      phaseLaid: false,
      cards: createEmptyCardCount(),
      hits: false,
      skippedThisHand: false,
    })) || []
  );
  const [showConfirm, setShowConfirm] = useState(false);

  if (!game) return null;

  const updateEntry = (playerId: string, updates: Partial<PlayerEntry>) => {
    setEntries(entries.map(e => (e.playerId === playerId ? { ...e, ...updates } : e)));
  };

  const updateCards = (playerId: string, cardType: keyof CardCount, delta: number) => {
    const entry = entries.find(e => e.playerId === playerId);
    if (!entry) return;
    const newVal = Math.max(0, entry.cards[cardType] + delta);
    updateEntry(playerId, { cards: { ...entry.cards, [cardType]: newVal } });
  };

  const submitHand = () => {
    if (!winnerId) return;

    const scores: HandScore[] = entries.map(e => {
      const playerState = game.playerStates.find(s => s.playerId === e.playerId);
      const isWinner = e.playerId === winnerId;
      const score = isWinner ? 0 : calculateScore(e.cards);
      const cardsLeft = e.cards.low + e.cards.high + e.cards.skip + e.cards.wild;

      return {
        playerId: e.playerId,
        phaseLaid: e.phaseLaid,
        phaseNumber: playerState?.currentPhase || 1,
        cardsLeft,
        score,
        cards: e.cards,
        hits: e.hits,
        skippedThisHand: e.skippedThisHand,
      };
    });

    addHand({
      handNumber: game.hands.length + 1,
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
          <h2>Hand #{game.hands.length + 1}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        {game.settings.globalBet && (
          <div className="stakes-banner">🏆 Stakes: {game.settings.globalBet}</div>
        )}

        <div className="winner-select">
          <label>Who went out first? (ended the round)</label>
          <div className="winner-buttons">
            {game.players.map(p => (
              <button
                key={p.id}
                className={`winner-btn ${winnerId === p.id ? 'selected' : ''}`}
                onClick={() => setWinnerId(p.id)}
              >
                {p.avatar} {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="entries-table">
          {game.players.map(player => {
            const entry = entries.find(e => e.playerId === player.id);
            const playerState = game.playerStates.find(s => s.playerId === player.id);
            const isWinner = player.id === winnerId;
            const score = entry ? calculateScore(entry.cards) : 0;

            if (!entry || !playerState) return null;

            return (
              <div key={player.id} className={`entry-row ${isWinner ? 'winner' : ''}`}>
                <div className="entry-player">
                  <span>{player.avatar} {player.name}</span>
                  <span className="phase-info">Phase {playerState.currentPhase}: {PHASES[playerState.currentPhase]}</span>
                </div>

                <label className="phase-laid-toggle">
                  <input
                    type="checkbox"
                    checked={entry.phaseLaid}
                    onChange={e => updateEntry(player.id, { phaseLaid: e.target.checked })}
                  />
                  <span>Completed Phase {playerState.currentPhase}</span>
                </label>

                <div className="cards-entry">
                  <p className="cards-label">{isWinner ? 'Cards left (should be 0):' : 'Cards left in hand:'}</p>
                    <div className="card-row">
                      <span>1-9 (5 pts)</span>
                      <div className="stepper">
                        <button onClick={() => updateCards(player.id, 'low', -1)}>−</button>
                        <span>{entry.cards.low}</span>
                        <button onClick={() => updateCards(player.id, 'low', 1)}>+</button>
                      </div>
                    </div>
                    <div className="card-row">
                      <span>10-12 (10 pts)</span>
                      <div className="stepper">
                        <button onClick={() => updateCards(player.id, 'high', -1)}>−</button>
                        <span>{entry.cards.high}</span>
                        <button onClick={() => updateCards(player.id, 'high', 1)}>+</button>
                      </div>
                    </div>
                    <div className="card-row">
                      <span>Skip (15 pts)</span>
                      <div className="stepper">
                        <button onClick={() => updateCards(player.id, 'skip', -1)}>−</button>
                        <span>{entry.cards.skip}</span>
                        <button onClick={() => updateCards(player.id, 'skip', 1)}>+</button>
                      </div>
                    </div>
                    <div className="card-row">
                      <span>Wild (25 pts)</span>
                      <div className="stepper">
                        <button onClick={() => updateCards(player.id, 'wild', -1)}>−</button>
                        <span>{entry.cards.wild}</span>
                        <button onClick={() => updateCards(player.id, 'wild', 1)}>+</button>
                      </div>
                    </div>
                </div>

                <div className="entry-score">
                  Score: <strong>{score}</strong>
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
              Review & Submit
            </button>
          ) : (
            <div className="confirm-actions">
              <p>Confirm hand scores?</p>
              <button className="cancel-btn" onClick={() => setShowConfirm(false)}>Back</button>
              <button className="confirm-btn" onClick={submitHand}>Confirm</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
