import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { Game, Player, Hand, HandScore, PlayerState, GameSettings, getNextDealerId, CardCount, GameHistoryEntry } from './types';

interface GameStore {
  games: Game[];
  currentGameId: string | null;
  gameHistory: GameHistoryEntry[];
  
  // Actions
  createGame: (players: Player[], dealerId: string, settings: GameSettings) => string;
  getCurrentGame: () => Game | null;
  addHand: (hand: Omit<Hand, 'id' | 'timestamp'>) => void;
  updateHand: (handId: string, updates: Partial<Hand>) => void;
  deleteHand: (handId: string) => void;
  endGame: (winnerId: string) => void;
  setCurrentGame: (gameId: string | null) => void;
  undoLastHand: () => void;
  deleteGame: (gameId: string) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      games: [],
      currentGameId: null,
      gameHistory: [],

      createGame: (players, dealerId, settings) => {
        const id = uuid();
        const playerStates: PlayerState[] = players.map(p => ({
          playerId: p.id,
          currentPhase: 1,
          totalScore: 0,
          handsWon: 0,
          completedPhase10: false,
        }));

        const game: Game = {
          id,
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

      getCurrentGame: () => {
        const { games, currentGameId } = get();
        return games.find(g => g.id === currentGameId) || null;
      },

      addHand: (handData) => {
        const handId = uuid();
        const hand: Hand = { ...handData, id: handId, timestamp: Date.now() };

        set(state => {
          const game = state.games.find(g => g.id === state.currentGameId);
          if (!game) return state;

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
              g.id === state.currentGameId
                ? {
                    ...g,
                    hands: [...g.hands, hand],
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
          games: state.games.map(g =>
            g.id === state.currentGameId
              ? {
                  ...g,
                  hands: g.hands.map(h =>
                    h.id === handId ? { ...h, ...updates } : h
                  ),
                }
              : g
          ),
        }));
      },

      deleteHand: (handId) => {
        set(state => {
          const game = state.games.find(g => g.id === state.currentGameId);
          if (!game) return state;

          const handToDelete = game.hands.find(h => h.id === handId);
          if (!handToDelete) return state;

          // Recalculate player states without this hand
          const remainingHands = game.hands.filter(h => h.id !== handId);
          const newPlayerStates = game.players.map(p => {
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
                ? { ...g, hands: remainingHands, playerStates: newPlayerStates }
                : g
            ),
          };
        });
      },

      undoLastHand: () => {
        const game = get().getCurrentGame();
        if (game && game.hands.length > 0) {
          get().deleteHand(game.hands[game.hands.length - 1].id);
        }
      },

      endGame: (winnerId) => {
        const game = get().getCurrentGame();
        const winner = game?.players.find(p => p.id === winnerId);
        
        set(state => ({
          games: state.games.map(g =>
            g.id === state.currentGameId
              ? { ...g, status: 'completed', winnerId, endedAt: Date.now() }
              : g
          ),
          gameHistory: winner ? [...state.gameHistory, {
            id: uuid(),
            winnerName: winner.name,
            winnerAvatar: winner.avatar,
            stake: game?.settings.globalBet,
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
    }),
    {
      name: 'phase10-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function createEmptyCardCount(): CardCount {
  return { low: 0, high: 0, skip: 0, wild: 0 };
}
