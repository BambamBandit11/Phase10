import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Player, GameSettings } from '../types';
import { useGameStore } from '../store';
import { WinHistory } from './WinHistory';

const AVATARS = ['😀', '😎', '🤓', '😊', '🥳', '😜', '🤠', '😇', '🥰', '🤩', '😈', '👻', '🦊', '🐱', '🐶', '🦁', '🐸', '🐵', '🌟', '🔥', '💜', '💚', '🌈', '🎯'];

export function GameSetup() {
  const createGame = useGameStore(s => s.createGame);
  const [numPlayers, setNumPlayers] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [dealerIdx, setDealerIdx] = useState(0);
  const [settings, setSettings] = useState<GameSettings>({
    strictPhaseEnforcement: true,
    variant: 'standard',
    betType: 'perGame',
  });
  const [bet, setBet] = useState('');
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
    if (validPlayers.length < 2) return;

    const gameSettings: GameSettings = {
      ...settings,
      globalBet: bet || undefined,
    };

    createGame(validPlayers, validPlayers[dealerIdx % validPlayers.length].id, gameSettings);
  };

  const canStart = players.filter(p => p.name.trim()).length >= 2;

  if (numPlayers === null) {
    return (
      <div className="setup">
        <h1>🎴 Phase 10</h1>
        <h2>How many players?</h2>
        <div className="num-players-grid">
          {[2, 3, 4, 5, 6].map(n => (
            <button key={n} className="num-player-btn" onClick={() => selectNumPlayers(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="setup">
      <h1>🎴 Phase 10</h1>
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

        <label className="setting-row bet-row">
          <span>Stakes</span>
          <input
            type="text"
            placeholder="e.g. Taco truck dinner"
            value={bet}
            onChange={e => setBet(e.target.value)}
            className="stakes-input"
          />
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
