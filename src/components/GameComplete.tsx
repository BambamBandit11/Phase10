import { useGameStore } from '../store';
import { Phase10Game, CribbageGame, SkipBoGame, MexicanTrainGame } from '../types';

export function GameComplete() {
  const game = useGameStore(s => s.getCurrentGame());
  const setCurrentGame = useGameStore(s => s.setCurrentGame);

  if (!game || game.status !== 'completed') return null;

  const winner = game.players.find(p => p.id === game.winnerId);

  // Phase 10 complete
  if (game.gameType === 'phase10') {
    const p10 = game as Phase10Game;
    const sortedStates = [...p10.playerStates].sort((a, b) => a.totalScore - b.totalScore);

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
              const player = p10.players.find(p => p.id === state.playerId);
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
            <p>Total Hands: {p10.hands.length}</p>
            {p10.settings.globalBet && (
              <p>Stakes: {p10.settings.globalBet}</p>
            )}
          </div>

          <button className="new-game-btn" onClick={() => setCurrentGame(null)}>
            New Game
          </button>
        </div>
      </div>
    );
  }

  // Cribbage / SkipBo complete
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
          {game.players.map((player, idx) => {
            let score: number | string = 0;
            if (game.gameType === 'cribbage') {
              score = (game as CribbageGame).scores[player.id];
            } else if (game.gameType === 'skipbo') {
              score = (game as SkipBoGame).stockPiles[player.id];
            } else if (game.gameType === 'mexicantrain') {
              score = (game as MexicanTrainGame).scores[player.id];
            }
            return (
              <div key={player.id} className="standing-row">
                <span className="rank">#{idx + 1}</span>
                <span>{player.avatar} {player.name}</span>
                <span>{score} {game.gameType === 'skipbo' ? 'cards left' : 'pts'}</span>
              </div>
            );
          })}
        </div>

        <button className="new-game-btn" onClick={() => setCurrentGame(null)}>
          New Game
        </button>
      </div>
    </div>
  );
}
