import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Player, GameSettings, GameType, PLAYER_COUNTS, MARINERS_THEME } from '../types';
import { useGameStore } from '../store';
import { WinHistory } from './WinHistory';

const AVATARS = ['😀', '😎', '🤓', '😊', '🥳', '😜', '🤠', '😇', '🥰', '🤩', '😈', '👻', '🦊', '🐱', '🐶', '🦁', '🐸', '🐵', '🌟', '🔥', '💜', '💚', '🌈', '🎯'];

const GAME_LABELS: Record<GameType, { emoji: string; name: string }> = {
  phase10: { emoji: '🎴', name: 'Phase 10' },
  cribbage: { emoji: '🃏', name: 'Cribbage' },
  skipbo: { emoji: '🔢', name: 'Skip-Bo' },
};

export function GameSetup() {
  const createGame = useGameStore(s => s.createGame);
  const createCribbageGame = useGameStore(s => s.createCribbageGame);
  const createSkipBoGame = useGameStore(s => s.createSkipBoGame);
  const selectedGameType = useGameStore(s => s.selectedGameType);
  const setGameType = useGameStore(s => s.setGameType);
  const addStake = useGameStore(s => s.addStake);
  
  const [numPlayers, setNumPlayers] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [dealerIdx, setDealerIdx] = useState(0);
  const [settings, setSettings] = useState<GameSettings>({
    strictPhaseEnforcement: true,
    variant: 'standard',
    betType: 'perGame',
  });
  const [bet, setBet] = useState('');
  const [betCurrency, setBetCurrency] = useState('USD');
  const [showHistory, setShowHistory] = useState(false);
  const gameHistory = useGameStore(s => s.gameHistory);

  const selectNumPlayers = (n: number) => {
    setNumPlayers(n);
    setPlayers(Array.from({ length: n }, (_, i) => ({
      id: uuid(),
      name: '',
      avatar: AVATARS[i % AVATARS.length],
    })));
  };

  const updatePlayer = (idx: number, updates: Partial<Player>) => {
    setPlayers(players.map((p, i) => (i === idx ? { ...p, ...updates } : p)));
  };

  const startGame = () => {
    const validPlayers = players.filter(p => p.name.trim());
    const { min } = PLAYER_COUNTS[selectedGameType];
    if (validPlayers.length < min) return;

    const dealerId = validPlayers[dealerIdx % validPlayers.length].id;
    const stake = bet ? { amount: bet, currency: betCurrency } : undefined;

    if (selectedGameType === 'phase10') {
      const gameSettings: GameSettings = {
        ...settings,
        globalBet: bet || undefined,
      };
      createGame(validPlayers, dealerId, gameSettings);
    } else if (selectedGameType === 'cribbage') {
      createCribbageGame(validPlayers, dealerId, stake);
    } else {
      createSkipBoGame(validPlayers, dealerId, stake);
    }
  };

  const { min: minPlayers } = PLAYER_COUNTS[selectedGameType];
  const canStart = players.filter(p => p.name.trim()).length >= minPlayers;

  // Game selection screen
  if (numPlayers === null) {
    const { min, max } = PLAYER_COUNTS[selectedGameType];
    const playerOptions = Array.from({ length: max - min + 1 }, (_, i) => min + i);

    return (
      <div className="setup">
        <h1>🎮 Game Room</h1>
        <h2>Which game would you like to play?</h2>
        
        <div className="game-select-grid">
          {(['phase10', 'cribbage', 'skipbo'] as GameType[]).map(gt => (
            <button
              key={gt}
              className={`game-select-btn ${selectedGameType === gt ? 'selected' : ''}`}
              onClick={() => setGameType(gt)}
            >
              <span className="game-emoji">{GAME_LABELS[gt].emoji}</span>
              <span className="game-name">{GAME_LABELS[gt].name}</span>
              <span className="game-players">{PLAYER_COUNTS[gt].min}-{PLAYER_COUNTS[gt].max} players</span>
            </button>
          ))}
        </div>

        <h3 style={{ marginTop: 24, marginBottom: 12 }}>How many players?</h3>
        <div className="num-players-grid">
          {playerOptions.map(n => (
            <button key={n} className="num-player-btn" onClick={() => selectNumPlayers(n)}>
              {n}
            </button>
          ))}
        </div>

        {gameHistory.length > 0 && (
          <button className="history-btn" onClick={() => setShowHistory(true)}>
            🏆 View Win History ({gameHistory.length})
          </button>
        )}

        {showHistory && <WinHistory onClose={() => setShowHistory(false)} />}
      </div>
    );
  }

  const gameLabel = GAME_LABELS[selectedGameType];

  return (
    <div className="setup">
      <h1>{gameLabel.emoji} {gameLabel.name}</h1>
      <h2>New Game ({numPlayers} Players)</h2>

      <div className="players-list">
        {players.map((p, idx) => (
          <div key={p.id} className="player-row">
            <button
              className={`avatar-btn ${dealerIdx === idx ? 'dealer' : ''}`}
              onClick={() => setDealerIdx(idx)}
              title="Tap to set as dealer"
            >
              {p.avatar}
            </button>
            <input
              type="text"
              placeholder={`Player ${idx + 1}`}
              value={p.name}
              onChange={e => updatePlayer(idx, { name: e.target.value })}
              className="player-name"
            />
            <select
              value={p.avatar}
              onChange={e => updatePlayer(idx, { avatar: e.target.value })}
              className="avatar-select"
            >
              {AVATARS.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            
          </div>
        ))}
      </div>

      <button className="change-players-btn" onClick={() => setNumPlayers(null)}>← Change player count</button>

      <div className="settings-section">
        <h3>Settings</h3>

        {selectedGameType === 'phase10' && (
          <>
            <label className="setting-row">
              <span>Rules</span>
              <select
                value={settings.variant}
                onChange={e => setSettings({ ...settings, variant: e.target.value as GameSettings['variant'] })}
              >
                <option value="standard">Standard (first to Phase 10)</option>
                <option value="evens">Evens Only (2,4,6,8,10)</option>
                <option value="fixed10">Fixed 10 Hands</option>
              </select>
            </label>

            <label className="setting-row">
              <span>Phase Enforcement</span>
              <select
                value={settings.strictPhaseEnforcement ? 'strict' : 'manual'}
                onChange={e => setSettings({ ...settings, strictPhaseEnforcement: e.target.value === 'strict' })}
              >
                <option value="strict">Strict (auto-advance)</option>
                <option value="manual">Manual</option>
              </select>
            </label>
          </>
        )}

        <label className="setting-row bet-row">
          <span>Stakes (amount + currency)</span>
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <input
              type="text"
              placeholder="e.g. 10"
              value={bet}
              onChange={e => setBet(e.target.value)}
              className="stakes-input"
              style={{ flex: 2 }}
            />
            <select
              value={betCurrency}
              onChange={e => setBetCurrency(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="USD">$</option>
              <option value="EUR">€</option>
              <option value="GBP">£</option>
              <option value="BEER">🍺</option>
              <option value="TACO">🌮</option>
              <option value="COFFEE">☕</option>
            </select>
          </div>
        </label>
      </div>

      <button className="start-btn" onClick={startGame} disabled={!canStart}>
        Start Game
      </button>

      {gameHistory.length > 0 && (
        <button className="history-btn" onClick={() => setShowHistory(true)}>
          🏆 View Win History ({gameHistory.length})
        </button>
      )}

      {showHistory && <WinHistory onClose={() => setShowHistory(false)} />}
    </div>
  );
}
