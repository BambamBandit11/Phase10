import { CribbageGame } from '../types';
import { useGameStore } from '../store';

interface Props {
  game: CribbageGame;
}

export function CribbageBoard({ game }: Props) {
  const updateCribbageScore = useGameStore(s => s.updateCribbageScore);

  const renderPegTrack = (_playerId: string, playerName: string, score: number, avatar?: string) => {
    const holes = 12; // Simplified visual (actual board is 121)
    const filledHoles = Math.min(Math.floor(score / 10), holes);
    
    return (
      <div className="peg-track">
        <span className="peg-label">{avatar} {playerName}</span>
        <div className="peg-positions">
          {Array.from({ length: holes }, (_, i) => (
            <div key={i} className={`peg-hole ${i < filledHoles ? 'filled' : ''}`} />
          ))}
        </div>
        <span className="peg-score">{score}</span>
      </div>
    );
  };

  return (
    <div>
      <h2 style={{ textAlign: 'center' }}>🃏 Cribbage</h2>
      
      {game.status === 'paused' && (
        <div className="stakes-banner" style={{ background: '#fef3c7', color: '#92400e' }}>
          ⏸️ Game Paused - Round {game.pauseState?.round || game.round}
        </div>
      )}
      
      <div className="cribbage-board">
        <div style={{ textAlign: 'center', marginBottom: 12, opacity: 0.8, fontSize: '0.85rem' }}>
          First to 121 wins! • Round {game.round}
        </div>
        
        {game.players.map(p => renderPegTrack(p.id, p.name, game.scores[p.id] || 0, p.avatar))}
        
        <div style={{ marginTop: 16, textAlign: 'center', fontSize: '0.85rem', opacity: 0.8 }}>
          Dealer: {game.players.find(p => p.id === game.currentDealerId)?.name} • 
          Crib: {game.players.find(p => p.id === game.whoHasCrib)?.name}
        </div>
      </div>

      <div className="settings-section">
        <h3>Add Points</h3>
        {game.players.map(p => (
          <div key={p.id} className="setting-row" style={{ marginBottom: 8 }}>
            <span>{p.avatar} {p.name}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 5, 10].map(pts => (
                <button
                  key={pts}
                  className="action-btn"
                  style={{ minWidth: 40, padding: '8px 12px', minHeight: 36 }}
                  onClick={() => updateCribbageScore(p.id, pts)}
                >
                  +{pts}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Board visualization JSON for API */}
      <details style={{ marginTop: 16 }}>
        <summary style={{ cursor: 'pointer', color: 'var(--accent)' }}>📊 Board State (JSON)</summary>
        <pre style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: 12, borderRadius: 8, overflow: 'auto' }}>
          {JSON.stringify({
            round: game.round,
            dealerId: game.currentDealerId,
            currentPlayerId: game.currentPlayerId,
            whoHasCrib: game.whoHasCrib,
            peggingState: {
              pegs: game.pegState.map(p => ({ playerId: p.playerId, pegPos: p.frontPeg })),
              currentPegTurn: game.currentPlayerId,
            },
            scores: game.scores,
          }, null, 2)}
        </pre>
      </details>
    </div>
  );
}
