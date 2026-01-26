import { useGameStore } from '../store';

export function GameComplete() {
  const game = useGameStore(s => s.getCurrentGame());
  const setCurrentGame = useGameStore(s => s.setCurrentGame);

  if (!game || game.status !== 'completed') return null;

  const winner = game.players.find(p => p.id === game.winnerId);
  const sortedStates = [...game.playerStates].sort((a, b) => a.totalScore - b.totalScore);

  return (
    <div className="game-complete-overlay">
      <div className="game-complete">
        <h1>🎉 Game Over!</h1>
        
        {winner && (
          <div className="winner-banner">
            <span className="winner-avatar">{winner.avatar}</span>
            <span className="winner-name">{winner.name} Wins!</span>
          </div>
        )}

        <div className="final-standings">
          <h3>Final Standings</h3>
          {sortedStates.map((state, idx) => {
            const player = game.players.find(p => p.id === state.playerId);
            return (
              <div key={state.playerId} className="standing-row">
                <span className="rank">#{idx + 1}</span>
                <span>{player?.avatar} {player?.name}</span>
                <span>Phase {state.currentPhase}</span>
                <span>{state.totalScore} pts</span>
              </div>
            );
          })}
        </div>

        <div className="game-stats">
          <p>Total Hands: {game.hands.length}</p>
          {game.settings.globalBet && (
            <p>Stakes: {game.settings.globalBet}</p>
          )}
        </div>

        <button className="new-game-btn" onClick={() => setCurrentGame(null)}>
          New Game
        </button>
      </div>
    </div>
  );
}
