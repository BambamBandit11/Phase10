import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Player, GameSettings } from '../types';
import { useGameStore } from '../store';

const AVATARS = ['😀', '😎', '🤓', '😊', '🥳', '😜'];

export function GameSetup() {
  const createGame = useGameStore(s => s.createGame);
  const [players, setPlayers] = useState<Player[]>([
    { id: uuid(), name: '', avatar: AVATARS[0] },
    { id: uuid(), name: '', avatar: AVATARS[1] },
  ]);
  const [dealerIdx, setDealerIdx] = useState(0);
  const [settings, setSettings] = useState<GameSettings>({
    strictPhaseEnforcement: true,
    variant: 'standard',
    betType: 'perGame',
  });
  const [bet, setBet] = useState('');

  const addPlayer = () => {
    if (players.length < 6) {
      setPlayers([...players, { id: uuid(), name: '', avatar: AVATARS[players.length] }]);
    }
  };

  const removePlayer = (idx: number) => {
    if (players.length > 2) {
      const newPlayers = players.filter((_, i) => i !== idx);
      setPlayers(newPlayers);
      if (dealerIdx >= newPlayers.length) setDealerIdx(0);
    }
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

  return (
    <div className="setup">
      <h1>🎴 Phase 10</h1>
      <h2>New Game</h2>

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
            {players.length > 2 && (
              <button className="remove-btn" onClick={() => removePlayer(idx)}>✕</button>
            )}
          </div>
        ))}
      </div>

      {players.length < 6 && (
        <button className="add-player-btn" onClick={addPlayer}>+ Add Player</button>
      )}

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
    </div>
  );
}
