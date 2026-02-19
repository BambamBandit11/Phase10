import { SkipBoGame, MARINERS_THEME } from '../types';

interface Props {
  game: SkipBoGame;
}

export function SkipBoBoard({ game }: Props) {
  const currentPlayer = game.players.find(p => p.id === game.currentPlayerId);

  return (
    <div>
      <h2 style={{ textAlign: 'center', color: MARINERS_THEME.navy }}>🔢 Skip-Bo</h2>
      
      <div className="skipbo-board">
        {/* Build Piles */}
        <div style={{ textAlign: 'center', marginBottom: 8, fontWeight: 600 }}>Build Piles</div>
        <div className="build-piles">
          {game.buildPiles.map((pile, i) => (
            <div key={i} className="pile build">
              {pile.length > 0 ? pile[pile.length - 1] : '—'}
            </div>
          ))}
        </div>

        {/* Player Areas */}
        {game.players.map(p => {
          const isCurrentPlayer = p.id === game.currentPlayerId;
          return (
            <div 
              key={p.id} 
              className="player-area"
              style={{
                border: isCurrentPlayer ? `2px solid ${MARINERS_THEME.teal}` : '2px solid transparent',
              }}
            >
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 600 }}>
                  {p.avatar} {p.name}
                  {isCurrentPlayer && <span style={{ color: MARINERS_THEME.teal }}> ← Turn</span>}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Hand: {game.handSizes[p.id]} cards
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="pile stock-pile" title="Stock Pile">
                  {game.stockPiles[p.id]}
                </div>
                
                <div className="discard-piles">
                  {(game.discardPiles[p.id] || [[], [], [], []]).map((pile, i) => (
                    <div key={i} className="pile" style={{ width: 40, height: 56, fontSize: '0.9rem' }} title={`Discard ${i + 1}`}>
                      {pile.length > 0 ? pile[pile.length - 1] : '—'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: 16, color: '#64748b', fontSize: '0.85rem' }}>
        First player to empty their Stock Pile wins!
      </div>

      {/* Board visualization JSON for API */}
      <details style={{ marginTop: 16 }}>
        <summary style={{ cursor: 'pointer', color: MARINERS_THEME.teal }}>📊 Board State (JSON)</summary>
        <pre style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: 12, borderRadius: 8, overflow: 'auto' }}>
          {JSON.stringify({
            currentPlayerId: game.currentPlayerId,
            currentDealerId: game.currentDealerId,
            stockPiles: Object.fromEntries(
              game.players.map(p => [p.name, game.stockPiles[p.id]])
            ),
            handSizes: Object.fromEntries(
              game.players.map(p => [p.name, game.handSizes[p.id]])
            ),
            buildPiles: game.buildPiles.map(pile => pile.length > 0 ? pile[pile.length - 1] : null),
            discardPiles: Object.fromEntries(
              game.players.map(p => [p.name, (game.discardPiles[p.id] || []).map(pile => pile.length > 0 ? pile[pile.length - 1] : null)])
            ),
          }, null, 2)}
        </pre>
      </details>
    </div>
  );
}
