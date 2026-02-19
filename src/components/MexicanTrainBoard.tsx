import { MexicanTrainGame } from '../types';
import { useGameStore } from '../store';

interface Props {
  game: MexicanTrainGame;
}

export function MexicanTrainBoard({ game }: Props) {
  const updateMexicanTrainScore = useGameStore(s => s.updateMexicanTrainScore);

  // Sort players by score (lowest is winning)
  const sortedPlayers = [...game.players].sort(
    (a, b) => (game.scores[a.id] || 0) - (game.scores[b.id] || 0)
  );

  return (
    <div>
      <h2 style={{ textAlign: 'center' }}>🚂 Mexican Train</h2>
      
      {game.status === 'paused' && (
        <div className="stakes-banner">
          ⏸️ Game Paused - Round {13 - game.round} (Double-{game.round} engine)
        </div>
      )}

      <div className="skipbo-board">
        {/* Engine display */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ 
            display: 'inline-block',
            padding: '12px 24px',
            background: 'var(--muted)',
            borderRadius: 8,
            border: '2px solid var(--accent)'
          }}>
            <span style={{ fontSize: '1.5rem' }}>🎲</span>
            <span style={{ fontWeight: 700, marginLeft: 8 }}>
              Double-{game.round} Engine
            </span>
          </div>
        </div>

        {/* Mexican Train (public) */}
        <div className="player-area" style={{ borderColor: 'var(--accent)' }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            🚂 Mexican Train (Public)
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {game.mexicanTrain.length} dominoes played
            </span>
          </div>
        </div>

        {/* Player trains */}
        {game.players.map(p => {
          const isCurrentPlayer = p.id === game.currentPlayerId;
          const isOpen = game.trainOpen[p.id];
          const trainLength = game.trains[p.id]?.length || 0;
          
          return (
            <div 
              key={p.id} 
              className="player-area"
              style={{
                border: isCurrentPlayer ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 600 }}>
                  {p.avatar} {p.name}'s Train
                  {isCurrentPlayer && <span style={{ color: 'var(--accent)' }}> ← Turn</span>}
                </span>
                <span style={{ 
                  padding: '2px 8px', 
                  borderRadius: 4, 
                  background: isOpen ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: isOpen ? '#ef4444' : '#10b981',
                  fontSize: '0.8rem'
                }}>
                  {isOpen ? '🔓 Open' : '🔒 Private'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  {trainLength} dominoes played
                </span>
                <span style={{ fontWeight: 700 }}>
                  Score: {game.scores[p.id] || 0}
                </span>
              </div>
            </div>
          );
        })}

        {/* Boneyard */}
        <div style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-muted)' }}>
          🦴 Boneyard: {game.boneyard} dominoes remaining
        </div>
      </div>

      {/* Score entry */}
      <div className="settings-section">
        <h3>Add Round Score (pips in hand)</h3>
        {game.players.map(p => (
          <div key={p.id} className="setting-row" style={{ marginBottom: 8 }}>
            <span>{p.avatar} {p.name}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {[5, 10, 15, 25, 50].map(pts => (
                <button
                  key={pts}
                  className="action-btn"
                  style={{ minWidth: 40, padding: '8px 12px', minHeight: 36 }}
                  onClick={() => updateMexicanTrainScore(p.id, pts)}
                >
                  +{pts}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Standings */}
      <div className="settings-section">
        <h3>Standings (lowest score wins)</h3>
        {sortedPlayers.map((p, idx) => (
          <div key={p.id} className="standing-row">
            <span className="rank">#{idx + 1}</span>
            <span>{p.avatar} {p.name}</span>
            <span style={{ fontWeight: 700 }}>{game.scores[p.id] || 0} pts</span>
          </div>
        ))}
      </div>

      {/* Board visualization JSON for API */}
      <details style={{ marginTop: 16 }}>
        <summary style={{ cursor: 'pointer', color: 'var(--accent)' }}>📊 Board State (JSON)</summary>
        <pre style={{ fontSize: '0.75rem', background: 'var(--muted)', padding: 12, borderRadius: 8, overflow: 'auto' }}>
          {JSON.stringify({
            round: game.round,
            engine: `Double-${game.round}`,
            currentPlayerId: game.currentPlayerId,
            currentDealerId: game.currentDealerId,
            mexicanTrainLength: game.mexicanTrain.length,
            boneyard: game.boneyard,
            players: game.players.map(p => ({
              name: p.name,
              score: game.scores[p.id] || 0,
              trainLength: game.trains[p.id]?.length || 0,
              trainOpen: game.trainOpen[p.id],
            })),
          }, null, 2)}
        </pre>
      </details>
    </div>
  );
}
