export interface Player {
  id: string;
  name: string;
  avatar?: string;
}

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

export interface Game {
  id: string;
  players: Player[];
  playerStates: PlayerState[];
  hands: Hand[];
  currentDealerId: string;
  settings: GameSettings;
  startedAt: number;
  endedAt?: number;
  winnerId?: string;
  status: 'setup' | 'active' | 'completed';
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
