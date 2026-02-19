import { useGameStore } from '../store';
import { Phase10Game, Hand, HandScore } from '../types';

export function History({ onClose }: { onClose: () => void }) {
  const game = useGameStore(s => s.getCurrentGame()) as Phase10Game | null;
  const deleteHand = useGameStore(s => s.deleteHand);

  if (!game || game.gameType !== 'phase10') return null;

  const getPlayer = (id: string) => game.players.find(p => p.id === id);

  const exportCSV = () => {
    const headers = ['Hand', 'Dealer', 'Winner', ...game.players.map(p => `${p.name} Score`), ...game.players.map(p => `${p.name} Phase`)];
    const rows = game.hands.map((h: Hand) => {
      const dealer = getPlayer(h.dealerId);
      const winner = getPlayer(h.winnerId);
      return [
        h.handNumber,
        dealer?.name || '',
        winner?.name || '',
        ...game.players.map(p => h.scores.find((s: HandScore) => s.playerId === p.id)?.score || 0),
        ...game.players.map(p => h.scores.find((s: HandScore) => s.playerId === p.id)?.phaseNumber || ''),
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phase10-game-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="history-overlay">
      <div className="history">
        <div className="history-header">
          <h2>Hand History</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {game.hands.length === 0 ? (
          <p className="no-history">No hands recorded yet.</p>
        ) : (
          <div className="history-list">
            {[...game.hands].reverse().map(hand => {
              const dealer = getPlayer(hand.dealerId);
              const winner = getPlayer(hand.winnerId);

              return (
                <div key={hand.id} className="history-item">
                  <div className="history-item-header">
                    <span>Hand #{hand.handNumber}</span>
                    <span>🎴 {dealer?.name}</span>
                    <span>🏆 {winner?.name}</span>
                  </div>
                  <div className="history-scores">
                    {hand.scores.map(s => {
                      const player = getPlayer(s.playerId);
                      return (
                        <div key={s.playerId} className="history-score">
                          <span>{player?.avatar} {player?.name}</span>
                          <span>{s.phaseLaid ? '✓ Phase' : '✗'}</span>
                          <span>{s.score} pts</span>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    className="delete-hand-btn"
                    onClick={() => {
                      if (confirm('Delete this hand?')) deleteHand(hand.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <button className="export-btn" onClick={exportCSV}>
          📥 Export CSV
        </button>
      </div>
    </div>
  );
}
