// ===================
// Common Types
// ===================
export type GameType = 'phase10' | 'cribbage' | 'skipbo' | 'mexicantrain';

export interface Player {
  id: string;
  name: string;
  avatar?: string;
}

export interface StakeEntry {
  id: string;
  gameId?: string;
  gameType: GameType;
  amount: string;
  currency: string;
  players: string[];
  playerId?: string;
  winnerId?: string;
  createdAt: number;
  settledAt?: number;
}

// Player count constraints per game
export const PLAYER_COUNTS: Record<GameType, { min: number; max: number }> = {
  phase10: { min: 2, max: 6 },
  cribbage: { min: 2, max: 3 },
  skipbo: { min: 2, max: 6 },
  mexicantrain: { min: 2, max: 8 },
};

// ===================
// Game Snapshot for history (append-only audit)
// ===================
export interface GameSnapshot {
  id: string;
  gameId: string;
  gameType: GameType;
  action: 'created' | 'updated' | 'paused' | 'resumed' | 'switched' | 'completed';
  timestamp: number;
  snapshot: PauseSnapshot;
}

export interface PauseSnapshot {
  dealerId: string;
  currentPlayerId: string;
  round?: number;
  scores?: Record<string, number>;
  // Game-specific minimal state
  gameSpecific?: unknown;
}

// ===================
// Phase 10 Types
// ===================
export interface HandScore {
  playerId: string;
  phaseLaid: boolean;
  phaseNumber: number;
  cardsLeft: number;
  score: number;
  cards: CardCount;
  hits: boolean;
  skippedThisHand: boolean;
}

export interface CardCount {
  low: number;      // 1-9 (5 pts each)
  high: number;     // 10-12 (10 pts each)
  skip: number;     // 15 pts each
  wild: number;     // 25 pts each
}

export interface Hand {
  id: string;
  handNumber: number;
  dealerId: string;
  winnerId: string;
  scores: HandScore[];
  bet?: number;
  notes?: string;
  timestamp: number;
}

export interface PlayerState {
  playerId: string;
  currentPhase: number;
  totalScore: number;
  handsWon: number;
  completedPhase10: boolean;
}

export interface GameSettings {
  strictPhaseEnforcement: boolean;
  variant: 'standard' | 'evens' | 'fixed10';
  globalBet?: string;
  betType: 'perHand' | 'perGame';
}

export interface Phase10Game {
  id: string;
  gameType: 'phase10';
  players: Player[];
  playerStates: PlayerState[];
  hands: Hand[];
  currentDealerId: string;
  settings: GameSettings;
  startedAt: number;
  endedAt?: number;
  winnerId?: string;
  status: 'setup' | 'active' | 'paused' | 'completed';
}

// ===================
// Cribbage Types
// ===================
export interface CribbagePegState {
  playerId: string;
  frontPeg: number;
  backPeg: number;
}

export interface CribbagePeggingState {
  pegs: CribbagePegState[];
  currentPegTurn: string;
  playedCards: { playerId: string; card: string }[];
  runningTotal: number;
}

export interface CribbageResumeState {
  round: number;
  dealerId: string;
  currentPlayerId: string;
  whoHasCrib: string;
  peggingState: CribbagePeggingState;
  shortHandSummary?: string;
}

export interface CribbageGame {
  id: string;
  gameType: 'cribbage';
  players: Player[];
  currentDealerId: string;
  scores: Record<string, number>; // playerId -> score
  pegState: CribbagePegState[];
  round: number;
  whoHasCrib: string;
  currentPlayerId: string;
  peggingState?: CribbagePeggingState;
  startedAt: number;
  endedAt?: number;
  winnerId?: string;
  status: 'setup' | 'active' | 'paused' | 'completed';
  pauseState?: CribbageResumeState;
}

// ===================
// Skip-Bo Types
// ===================
export interface SkipBoGame {
  id: string;
  gameType: 'skipbo';
  players: Player[];
  currentDealerId: string;
  currentPlayerId: string;
  stockPiles: Record<string, number>; // playerId -> cards remaining in stock
  handSizes: Record<string, number>; // playerId -> cards in hand
  discardPiles: Record<string, number[][]>; // playerId -> 4 discard piles (card arrays)
  buildPiles: number[][]; // 4 center build piles
  startedAt: number;
  endedAt?: number;
  winnerId?: string;
  status: 'setup' | 'active' | 'paused' | 'completed';
}

// ===================
// Mexican Train Types
// ===================
export interface MexicanTrainRoundScore {
  playerId: string;
  pips: number; // Pips left in hand at end of round
}

export interface MexicanTrainRound {
  id: string;
  roundNumber: number; // 1-13
  engine: number; // 12, 11, 10... down to 0
  dealerId: string;
  winnerId?: string; // Player who went out (0 pips)
  scores: MexicanTrainRoundScore[];
  timestamp: number;
}

export interface MexicanTrainPlayerState {
  playerId: string;
  totalScore: number; // Running total (lower is better)
  roundsWon: number; // Times they went out first
}

export interface MexicanTrainGame {
  id: string;
  gameType: 'mexicantrain';
  players: Player[];
  playerStates: MexicanTrainPlayerState[];
  rounds: MexicanTrainRound[];
  currentDealerId: string;
  currentEngine: number; // 12, 11, 10... down to 0
  startedAt: number;
  endedAt?: number;
  winnerId?: string;
  status: 'setup' | 'active' | 'paused' | 'completed';
  pauseSnapshot?: PauseSnapshot;
}

// ===================
// Union Game Type
// ===================
export type Game = Phase10Game | CribbageGame | SkipBoGame | MexicanTrainGame;

export interface GameHistoryEntry {
  id: string;
  gameType: GameType;
  winnerName: string;
  winnerAvatar?: string;
  stake?: string;
  date: number;
}

// ===================
// UI Hints
// ===================
export interface UIHints {
  primaryColor: string;
  secondaryColor: string;
  highlightedPlayers?: string[];
  boardVisualization?: string;
}

// Mariners theme
export const MARINERS_THEME = {
  navy: '#0C2340',
  teal: '#2C9AA0',
};

// ===================
// API Response Type
// ===================
export interface GameRoomResponse {
  action: 'created' | 'updated' | 'paused' | 'resumed' | 'switched' | 'completed' | 'query' | 'error';
  game: Game | null;
  activeGameId?: string | null;
  stakesHistory: StakeEntry[];
  gameHistory: GameSnapshot[];
  ui: UIHints | null;
  query?: { question: string; requiredFields?: string[] };
  errorMessage?: string;
}

export const PHASES: Record<number, string> = {
  1: '2 sets of 3',
  2: '1 set of 3 + 1 run of 4',
  3: '1 set of 4 + 1 run of 4',
  4: '1 run of 7',
  5: '1 run of 8',
  6: '1 run of 9',
  7: '2 sets of 4',
  8: '7 cards of one color',
  9: '1 set of 5 + 1 set of 2',
  10: '1 set of 5 + 1 set of 3',
};

export function calculateScore(cards: CardCount): number {
  return cards.low * 5 + cards.high * 10 + cards.skip * 15 + cards.wild * 25;
}

export function getNextDealerId(players: Player[], currentDealerId: string): string {
  const idx = players.findIndex(p => p.id === currentDealerId);
  return players[(idx + 1) % players.length].id;
}
