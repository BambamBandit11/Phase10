import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { 
  Game, Player, Hand, PlayerState, GameSettings, getNextDealerId, CardCount, GameHistoryEntry,
  GameType, Phase10Game, CribbageGame, SkipBoGame, MexicanTrainGame, StakeEntry, CribbagePegState,
  GameSnapshot, PauseSnapshot, MexicanTrainRound, MexicanTrainRoundScore, MexicanTrainPlayerState
} from './types';

interface GameStore {
  games: Game[];
  currentGameId: string | null;
  activeGameId: string | null;
  gameHistory: GameHistoryEntry[];
  gameSnapshots: GameSnapshot[]; // append-only audit
  stakesHistory: StakeEntry[];
  selectedGameType: GameType;
  
  // Actions
  setGameType: (gameType: GameType) => void;
  createGame: (players: Player[], dealerId: string, settings: GameSettings) => string;
  createCribbageGame: (players: Player[], dealerId: string, stake?: { amount: string; currency: string }) => string;
  createSkipBoGame: (players: Player[], dealerId: string, stake?: { amount: string; currency: string }) => string;
  createMexicanTrainGame: (players: Player[], dealerId: string, stake?: { amount: string; currency: string }) => string;
  getCurrentGame: () => Game | null;
  getActiveGame: () => Game | null;
  addHand: (hand: Omit<Hand, 'id' | 'timestamp'>) => void;
  updateHand: (handId: string, updates: Partial<Hand>) => void;
  deleteHand: (handId: string) => void;
  endGame: (winnerId: string) => void;
  setCurrentGame: (gameId: string | null) => void;
  switchGame: (gameId: string) => void;
  undoLastHand: () => void;
  deleteGame: (gameId: string) => void;
  pauseGame: (resumeState?: PauseSnapshot) => void;
  resumeGame: (gameId?: string) => void;
  addStake: (stake: Omit<StakeEntry, 'id' | 'createdAt'>) => string;
  updateCribbageScore: (playerId: string, points: number) => void;
  updateSkipBoState: (updates: Partial<SkipBoGame>) => void;
  addMexicanTrainRound: (round: Omit<MexicanTrainRound, 'id' | 'timestamp'>) => void;
  addGameSnapshot: (gameId: string, action: GameSnapshot['action']) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      games: [],
      currentGameId: null,
      activeGameId: null,
      gameHistory: [],
      gameSnapshots: [],
      stakesHistory: [],
      selectedGameType: 'phase10' as GameType,

      setGameType: (gameType) => {
        set({ selectedGameType: gameType });
      },

      addGameSnapshot: (gameId, action) => {
        const game = get().games.find(g => g.id === gameId);
        if (!game) return;
        
        const snapshot: PauseSnapshot = {
          dealerId: game.currentDealerId,
          currentPlayerId: 'currentPlayerId' in game ? game.currentPlayerId : game.currentDealerId,
          round: 'round' in game ? game.round : undefined,
          scores: 'scores' in game ? game.scores : undefined,
        };
        
        const entry: GameSnapshot = {
          id: uuid(),
          gameId,
          gameType: game.gameType,
          action,
          timestamp: Date.now(),
          snapshot,
        };
        
        set(state => ({ gameSnapshots: [...state.gameSnapshots, entry] }));
      },

      createGame: (players, dealerId, settings) => {
        const id = uuid();
        const playerStates: PlayerState[] = players.map(p => ({
          playerId: p.id,
          currentPhase: 1,
          totalScore: 0,
          handsWon: 0,
          completedPhase10: false,
        }));

        const game: Phase10Game = {
          id,
          gameType: 'phase10',
          players,
          playerStates,
          hands: [],
          currentDealerId: dealerId,
          settings,
          startedAt: Date.now(),
          status: 'active',
        };

        set(state => ({
          games: [...state.games, game],
          currentGameId: id,
        }));

        return id;
      },

      createCribbageGame: (players, dealerId, stake) => {
        const id = uuid();
        const pegState: CribbagePegState[] = players.map(p => ({
          playerId: p.id,
          frontPeg: 0,
          backPeg: 0,
        }));

        const game: CribbageGame = {
          id,
          gameType: 'cribbage',
          players,
          currentDealerId: dealerId,
          scores: Object.fromEntries(players.map(p => [p.id, 0])),
          pegState,
          round: 1,
          whoHasCrib: dealerId,
          currentPlayerId: players.find(p => p.id !== dealerId)?.id || dealerId,
          startedAt: Date.now(),
          status: 'active',
        };

        set(state => ({
          games: [...state.games, game],
          currentGameId: id,
        }));

        if (stake) {
          get().addStake({
            gameId: id,
            gameType: 'cribbage',
            amount: stake.amount,
            currency: stake.currency,
            players: players.map(p => p.name),
          });
        }

        return id;
      },

      createSkipBoGame: (players, dealerId, stake) => {
        const id = uuid();
        const stockCount = players.length <= 4 ? 30 : 20;

        const game: SkipBoGame = {
          id,
          gameType: 'skipbo',
          players,
          currentDealerId: dealerId,
          currentPlayerId: players.find(p => p.id !== dealerId)?.id || dealerId,
          stockPiles: Object.fromEntries(players.map(p => [p.id, stockCount])),
          handSizes: Object.fromEntries(players.map(p => [p.id, 5])),
          discardPiles: Object.fromEntries(players.map(p => [p.id, [[], [], [], []]])),
          buildPiles: [[], [], [], []],
          startedAt: Date.now(),
          status: 'active',
        };

        set(state => ({
          games: [...state.games, game],
          currentGameId: id,
        }));

        if (stake) {
          get().addStake({
            gameId: id,
            gameType: 'skipbo',
            amount: stake.amount,
            currency: stake.currency,
            players: players.map(p => p.name),
          });
        }

        return id;
      },

      createMexicanTrainGame: (players, dealerId, stake) => {
        const id = uuid();
        
        const playerStates: MexicanTrainPlayerState[] = players.map(p => ({
          playerId: p.id,
          totalScore: 0,
          roundsWon: 0,
        }));

        const game: MexicanTrainGame = {
          id,
          gameType: 'mexicantrain',
          players,
          playerStates,
          rounds: [],
          currentDealerId: dealerId,
          currentEngine: 12, // Start with double-12
          startedAt: Date.now(),
          status: 'active',
        };

        set(state => ({
          games: [...state.games, game],
          currentGameId: id,
          activeGameId: id,
        }));

        get().addGameSnapshot(id, 'created');

        if (stake) {
          get().addStake({
            gameId: id,
            gameType: 'mexicantrain',
            amount: stake.amount,
            currency: stake.currency,
            players: players.map(p => p.name),
          });
        }

        return id;
      },

      getCurrentGame: () => {
        const { games, currentGameId } = get();
        return games.find(g => g.id === currentGameId) || null;
      },

      getActiveGame: () => {
        const { games, activeGameId } = get();
        return games.find(g => g.id === activeGameId) || null;
      },

      switchGame: (gameId) => {
        const game = get().games.find(g => g.id === gameId);
        if (!game) return;
        
        get().addGameSnapshot(gameId, 'switched');
        set({ activeGameId: gameId, currentGameId: gameId });
      },

      addHand: (handData) => {
        const handId = uuid();
        const hand: Hand = { ...handData, id: handId, timestamp: Date.now() };

        set(state => {
          const game = state.games.find(g => g.id === state.currentGameId) as Phase10Game | undefined;
          if (!game || game.gameType !== 'phase10') return state;

          // Update player states based on hand results
          const newPlayerStates = game.playerStates.map(ps => {
            const handScore = hand.scores.find(s => s.playerId === ps.playerId);
            if (!handScore) return ps;

            const newState = { ...ps };
            newState.totalScore += handScore.score;

            if (hand.winnerId === ps.playerId) {
              newState.handsWon += 1; // tracks who went out first
            }

            // Advance phase if laid this hand
            if (handScore.phaseLaid && ps.currentPhase < 10) {
              newState.currentPhase += 1;
            }

            if (handScore.phaseLaid && ps.currentPhase === 10) {
              newState.completedPhase10 = true;
            }

            return newState;
          });

          // Check for game end
          let status = game.status;
          let winnerId = game.winnerId;
          let endedAt = game.endedAt;

          const completers = newPlayerStates.filter(ps => ps.completedPhase10);
          if (completers.length > 0) {
            status = 'completed';
            endedAt = Date.now();
            // Lowest score among completers wins
            const winnerState = completers.reduce((a, b) => 
              a.totalScore <= b.totalScore ? a : b
            );
            winnerId = winnerState.playerId;
            const winner = game.players.find(p => p.id === winnerId);
            if (winner) {
              set(s => ({
                gameHistory: [...s.gameHistory, {
                  id: uuid(),
                  gameType: 'phase10' as GameType,
                  winnerName: winner.name,
                  winnerAvatar: winner.avatar,
                  stake: game.settings.globalBet,
                  date: Date.now(),
                }]
              }));
            }
          }

          // Fixed 10 hands variant
          if (game.settings.variant === 'fixed10' && game.hands.length + 1 >= 10) {
            status = 'completed';
            endedAt = Date.now();
            winnerId = newPlayerStates.reduce((a, b) => 
              a.totalScore <= b.totalScore ? a : b
            ).playerId;
          }

          const nextDealerId = getNextDealerId(game.players, game.currentDealerId);

          return {
            games: state.games.map(g =>
              g.id === state.currentGameId && g.gameType === 'phase10'
                ? {
                    ...g,
                    hands: [...(g as Phase10Game).hands, hand],
                    playerStates: newPlayerStates,
                    currentDealerId: nextDealerId,
                    status,
                    winnerId,
                    endedAt,
                  }
                : g
            ),
          };
        });
      },

      updateHand: (handId, updates) => {
        set(state => ({
          games: state.games.map(g => {
            if (g.id !== state.currentGameId || g.gameType !== 'phase10') return g;
            const p10 = g as Phase10Game;
            return {
              ...p10,
              hands: p10.hands.map((h: Hand) =>
                h.id === handId ? { ...h, ...updates } : h
              ),
            };
          }),
        }));
      },

      deleteHand: (handId) => {
        set(state => {
          const game = state.games.find(g => g.id === state.currentGameId);
          if (!game || game.gameType !== 'phase10') return state;
          
          const p10Game = game as Phase10Game;
          const handToDelete = p10Game.hands.find(h => h.id === handId);
          if (!handToDelete) return state;

          // Recalculate player states without this hand
          const remainingHands = p10Game.hands.filter(h => h.id !== handId);
          const newPlayerStates: PlayerState[] = p10Game.players.map(p => {
            let totalScore = 0;
            let handsWon = 0;
            let currentPhase = 1;
            let completedPhase10 = false;

            for (const hand of remainingHands) {
              const score = hand.scores.find(s => s.playerId === p.id);
              if (score) {
                totalScore += score.score;
                if (score.phaseLaid && currentPhase < 10) currentPhase++;
                if (score.phaseLaid && currentPhase === 10) completedPhase10 = true;
              }
              if (hand.winnerId === p.id) handsWon++;
            }

            return { playerId: p.id, totalScore, handsWon, currentPhase, completedPhase10 };
          });

          return {
            games: state.games.map(g =>
              g.id === state.currentGameId
                ? { ...p10Game, hands: remainingHands, playerStates: newPlayerStates } as Phase10Game
                : g
            ),
          };
        });
      },

      undoLastHand: () => {
        const game = get().getCurrentGame() as Phase10Game | null;
        if (game && game.gameType === 'phase10' && game.hands.length > 0) {
          get().deleteHand(game.hands[game.hands.length - 1].id);
        }
      },

      endGame: (winnerId) => {
        const game = get().getCurrentGame();
        const winner = game?.players.find(p => p.id === winnerId);
        const stake = game?.gameType === 'phase10' ? (game as Phase10Game).settings.globalBet : undefined;
        
        set(state => ({
          games: state.games.map(g =>
            g.id === state.currentGameId
              ? { ...g, status: 'completed', winnerId, endedAt: Date.now() }
              : g
          ),
          gameHistory: winner ? [...state.gameHistory, {
            id: uuid(),
            gameType: game?.gameType || 'phase10',
            winnerName: winner.name,
            winnerAvatar: winner.avatar,
            stake,
            date: Date.now(),
          }] : state.gameHistory,
        }));
      },

      setCurrentGame: (gameId) => {
        set({ currentGameId: gameId });
      },

      deleteGame: (gameId) => {
        set(state => ({
          games: state.games.filter(g => g.id !== gameId),
          currentGameId: state.currentGameId === gameId ? null : state.currentGameId,
        }));
      },

      pauseGame: (resumeState) => {
        const currentGameId = get().currentGameId;
        if (currentGameId) {
          get().addGameSnapshot(currentGameId, 'paused');
        }
        set(state => ({
          games: state.games.map(g => {
            if (g.id !== state.currentGameId) return g;
            if (g.gameType === 'cribbage') {
              return { ...g, status: 'paused', pauseState: resumeState as CribbageGame['pauseState'] };
            }
            if (g.gameType === 'mexicantrain') {
              return { ...g, status: 'paused', pauseSnapshot: resumeState };
            }
            return { ...g, status: 'paused' };
          }),
        }));
      },

      resumeGame: (gameId) => {
        const targetId = gameId || get().currentGameId;
        if (targetId) {
          get().addGameSnapshot(targetId, 'resumed');
        }
        set(state => ({
          games: state.games.map(g =>
            g.id === targetId
              ? { ...g, status: 'active' }
              : g
          ),
          currentGameId: targetId,
          activeGameId: targetId,
        }));
      },

      addStake: (stakeData) => {
        const id = uuid();
        const stake: StakeEntry = { ...stakeData, id, createdAt: Date.now() };
        set(state => ({
          stakesHistory: [...state.stakesHistory, stake],
        }));
        return id;
      },

      updateCribbageScore: (playerId, points) => {
        set(state => ({
          games: state.games.map(g => {
            if (g.id !== state.currentGameId || g.gameType !== 'cribbage') return g;
            const cg = g as CribbageGame;
            const newScore = (cg.scores[playerId] || 0) + points;
            const pegState = cg.pegState.map(p =>
              p.playerId === playerId
                ? { ...p, backPeg: p.frontPeg, frontPeg: newScore }
                : p
            );
            const scores = { ...cg.scores, [playerId]: newScore };
            
            // Check for win (121 points)
            const winnerId = newScore >= 121 ? playerId : undefined;
            const status = winnerId ? 'completed' : cg.status;
            
            return { ...cg, scores, pegState, winnerId, status };
          }),
        }));
      },

      updateSkipBoState: (updates) => {
        set(state => ({
          games: state.games.map(g => {
            if (g.id !== state.currentGameId || g.gameType !== 'skipbo') return g;
            return { ...g, ...updates };
          }),
        }));
      },

      addMexicanTrainRound: (roundData) => {
        const roundId = uuid();
        const round: MexicanTrainRound = { ...roundData, id: roundId, timestamp: Date.now() };

        set(state => {
          const game = state.games.find(g => g.id === state.currentGameId);
          if (!game || game.gameType !== 'mexicantrain') return state;
          
          const mtGame = game as MexicanTrainGame;

          // Update player states with new scores
          const newPlayerStates: MexicanTrainPlayerState[] = mtGame.playerStates.map(ps => {
            const roundScore = round.scores.find(s => s.playerId === ps.playerId);
            if (!roundScore) return ps;

            return {
              playerId: ps.playerId,
              totalScore: ps.totalScore + roundScore.pips,
              roundsWon: round.winnerId === ps.playerId ? ps.roundsWon + 1 : ps.roundsWon,
            };
          });

          // Next engine (12 -> 11 -> ... -> 0)
          const nextEngine = mtGame.currentEngine - 1;
          const isGameOver = nextEngine < 0;

          // If game over, find winner (lowest score)
          let winnerId = mtGame.winnerId;
          let status: MexicanTrainGame['status'] = mtGame.status;
          let endedAt = mtGame.endedAt;

          if (isGameOver) {
            status = 'completed';
            endedAt = Date.now();
            const winner = newPlayerStates.reduce((a, b) => 
              a.totalScore <= b.totalScore ? a : b
            );
            winnerId = winner.playerId;
          }

          // Rotate dealer
          const nextDealerId = getNextDealerId(mtGame.players, mtGame.currentDealerId);

          const updatedGame: MexicanTrainGame = {
            ...mtGame,
            rounds: [...mtGame.rounds, round],
            playerStates: newPlayerStates,
            currentEngine: isGameOver ? 0 : nextEngine,
            currentDealerId: nextDealerId,
            status,
            winnerId,
            endedAt,
          };

          return {
            games: state.games.map(g =>
              g.id === state.currentGameId ? updatedGame : g
            ),
          };
        });
      },
    }),
    {
      name: 'phase10-storage',
      version: 2, // Bump version to reset incompatible state
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState, version) => {
        // Reset state on version mismatch to avoid type conflicts
        if (version < 2) {
          return {
            games: [],
            currentGameId: null,
            activeGameId: null,
            gameHistory: [],
            gameSnapshots: [],
            stakesHistory: [],
            selectedGameType: 'phase10',
          };
        }
        return persistedState as GameStore;
      },
    }
  )
);

export function createEmptyCardCount(): CardCount {
  return { low: 0, high: 0, skip: 0, wild: 0 };
}
