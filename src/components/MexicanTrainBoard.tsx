import { MexicanTrainGame, MexicanTrainPlayerState } from '../types';
import { useGameStore } from '../store';

interface Props {
  game: MexicanTrainGame;
}

export function MexicanTrainBoard({ game }: Props) {
  // Sort players by score (lowest is winning)
  const sortedPlayers = [...game.playerStates].sort(
    (a, b) => a.totalScore - b.totalScore
  );

  const dealer = game.players.find(p => p.id === game.currentDealerId);
  const roundNumber = 13 - game.currentEngine; // Round 1 = Double-12, Round 13 = Double-0

  return (
    <div className="scoreboard">
      <div className="scoreboard-header">
        <span>Round {roundNumber}/13 • Double-{game.currentEngine}</span>
        <span className="dealer-badge">🎲 {dealer?.name || 'Unknown'} deals</span>
      </div>

      {game.status === 'paused' && (
        <div className="stakes-banner">
          ⏸️ Game Paused
        </div>
      )}

      <div className="player-cards">
        {game.players.map(player => {
          const state = game.playerStates.find((s: MexicanTrainPlayerState) => s.playerId === player.id);
          if (!state) return null;

          const isDealer = player.id === game.currentDealerId;

          return (
            <div key={player.id} className={`player-card ${isDealer ? 'is-dealer' : ''}`}>
              <div className="player-header">
                <span className="player-avatar">{player.avatar}</span>
                <span className="player-name">{player.name}</span>
                {isDealer && <span className="dealer-icon">🎲</span>}
              </div>

              <div className="player-stats">
                <div className="stat">
                  <span className="stat-label">Total Score</span>
                  <span className="stat-value">{state.totalScore}</span>
                  <span className="stat-desc">Lower is better</span>
                </div>

                <div className="stat">
                  <span className="stat-label">Rounds Won</span>
                  <span className="stat-value">{state.roundsWon}</span>
                </div>

                <div className="stat">
                  <span className="stat-label">Avg/Round</span>
                  <span className="stat-value">
                    {game.rounds.length > 0 
                      ? Math.round(state.totalScore / game.rounds.length) 
                      : 0}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current standings */}
      <div className="settings-section" style={{ marginTop: 16 }}>
        <h3>🏆 Current Standings</h3>
        {sortedPlayers.map((state, idx) => {
          const player = game.players.find(p => p.id === state.playerId);
          return (
            <div key={state.playerId} className="standing-row">
              <span className="rank">#{idx + 1}</span>
              <span>{player?.avatar} {player?.name}</span>
              <span style={{ fontWeight: 700 }}>{state.totalScore} pts</span>
            </div>
          );
        })}
      </div>

      {/* Board visualization JSON for API */}
      <details style={{ marginTop: 16 }}>
        <summary style={{ cursor: 'pointer', color: 'var(--accent)' }}>📊 Board State (JSON)</summary>
        <pre style={{ fontSize: '0.75rem', background: 'var(--muted)', padding: 12, borderRadius: 8, overflow: 'auto' }}>
          {JSON.stringify({
            roundNumber,
            currentEngine: game.currentEngine,
            totalRounds: 13,
            roundsPlayed: game.rounds.length,
            currentDealerId: game.currentDealerId,
            players: game.players.map(p => {
              const state = game.playerStates.find(s => s.playerId === p.id);
              return {
                name: p.name,
                totalScore: state?.totalScore || 0,
                roundsWon: state?.roundsWon || 0,
              };
            }),
          }, null, 2)}
        </pre>
      </details>
    </div>
  );
}
