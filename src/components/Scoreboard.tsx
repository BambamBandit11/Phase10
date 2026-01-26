import { useGameStore } from '../store';
import { PHASES } from '../types';

export function Scoreboard() {
  const game = useGameStore(s => s.getCurrentGame());

  if (!game) return null;

  const dealer = game.players.find(p => p.id === game.currentDealerId);

  return (
    <div className="scoreboard">
      <div className="scoreboard-header">
        <span>Hand #{game.hands.length + 1}</span>
        <span className="dealer-badge">🎴 {dealer?.name || 'Unknown'} deals</span>
      </div>

      <div className="player-cards">
        {game.players.map(player => {
          const state = game.playerStates.find(s => s.playerId === player.id);
          if (!state) return null;

          const isDealer = player.id === game.currentDealerId;

          return (
            <div key={player.id} className={`player-card ${isDealer ? 'is-dealer' : ''}`}>
              <div className="player-header">
                <span className="player-avatar">{player.avatar}</span>
                <span className="player-name">{player.name}</span>
                {isDealer && <span className="dealer-icon">🎴</span>}
              </div>

              <div className="player-stats">
                <div className="stat phase">
                  <span className="stat-label">Phase</span>
                  <span className="stat-value">{state.currentPhase}</span>
                  <span className="stat-desc">{PHASES[state.currentPhase]}</span>
                </div>

                <div className="stat score">
                  <span className="stat-label">Score</span>
                  <span className="stat-value">{state.totalScore}</span>
                </div>

                <div className="stat wins">
                  <span className="stat-label">Hands Won</span>
                  <span className="stat-value">{state.handsWon}</span>
                </div>
              </div>

              {state.completedPhase10 && (
                <div className="completed-badge">✅ Completed Phase 10!</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
