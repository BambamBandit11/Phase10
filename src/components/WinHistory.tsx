import { useGameStore } from '../store';

export function WinHistory({ onClose }: { onClose: () => void }) {
  const gameHistory = useGameStore(s => s.gameHistory);

  return (
    <div className="history-overlay">
      <div className="history">
        <div className="history-header">
          <h2>🏆 Win History</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {gameHistory.length === 0 ? (
          <p className="no-history">No completed games yet.</p>
        ) : (
          <div className="history-list">
            {[...gameHistory].reverse().map(entry => (
              <div key={entry.id} className="win-history-item">
                <div className="win-history-winner">
                  <span className="winner-avatar">{entry.winnerAvatar}</span>
                  <span className="winner-name">{entry.winnerName}</span>
                </div>
                {entry.stake && <div className="win-history-stake">🏆 {entry.stake}</div>}
                <div className="win-history-date">
                  {new Date(entry.date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
