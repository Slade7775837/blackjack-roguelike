import { Card, Rank, Suit } from "./types";

export const SUITS: Suit[] = ["S", "H", "D", "C"];
export const RANKS: Rank[] = [
  "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K",
];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  S: "♠",
  H: "♥",
  D: "♦",
  C: "♣",
};

export const SUIT_NAMES: Record<Suit, string> = {
  S: "Spades",
  H: "Hearts",
  D: "Diamonds",
  C: "Clubs",
};

export function cardBaseValue(rank: Rank): number {
  if (rank === "A") return 11;
  if (["J", "Q", "K"].includes(rank)) return 10;
  return parseInt(rank);
}

export function calculateTotal(hand: Card[]): number {
  let total = 0;
  let aces = 0;

  for (const card of hand) {
    if (card.rank === "A") {
      total += 11;
      aces++;
    } else if (["J", "Q", "K"].includes(card.rank)) {
      total += 10;
    } else {
      total += parseInt(card.rank);
    }
  }

  // Convert aces from 11 to 1 as needed
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

export function isBust(hand: Card[]): boolean {
  return calculateTotal(hand) > 21;
}

export function isBlackjack(hand: Card[]): boolean {
  return hand.length === 2 && calculateTotal(hand) === 21;
}

export function createDeck(filterLowCards = false): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      // Loaded Deck relic: remove 2, 3, 4
      if (filterLowCards && ["2", "3", "4"].includes(rank)) continue;
      deck.push({
        suit,
        rank,
        id: `${suit}${rank}_${Math.random().toString(36).substr(2, 6)}`,
      });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck: Card[], count: number): { cards: Card[]; remaining: Card[] } {
  const remaining = [...deck];
  const cards: Card[] = [];
  for (let i = 0; i < count; i++) {
    const card = remaining.pop();
    if (card) cards.push(card);
  }
  return { cards, remaining };
}

export function peekTop(deck: Card[], count: number): Card[] {
  return deck.slice(-count).reverse();
}

/** Enemy AI: optimal stand total given player total (for 'knows your hand' special) */
export function enemyOptimalStand(playerTotal: number): number {
  // Enemy tries to beat player by smallest margin
  if (playerTotal >= 21) return 17; // player likely bust, stand early
  return Math.min(playerTotal + 1, 21);
}

export function shouldEnemyStand(
  standAt: number,
  total: number,
  behavior: string,
  round: number,
  playerTotal?: number // if enemy has revealPlayerTotal special
): boolean {
  if (total > 21) return true; // busted, stop drawing

  // If enemy knows player's total
  if (playerTotal !== undefined) {
    const needed = playerTotal + 1;
    if (total >= needed) return true;
    if (total > 21) return true;
    return false;
  }

  switch (behavior) {
    case "cautious":
      return total >= standAt - 1;
    case "aggressive":
      return total >= standAt + 1;
    case "random": {
      const threshold = standAt + (round % 2 === 0 ? -1 : 1);
      return total >= threshold;
    }
    default:
      return total >= standAt;
  }
}

export function getCardColorClass(suit: Suit): string {
  return suit === "H" || suit === "D" ? "text-crimson" : "text-text";
}

export function formatTotal(total: number): string {
  if (total > 21) return `${total} BUST`;
  return `${total}`;
}

export function getRankDisplay(rank: Rank): string {
  return rank;
}
