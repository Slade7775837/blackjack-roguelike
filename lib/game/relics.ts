import { Relic } from "./types";

export const RELICS: Record<string, Relic> = {
  // ─── COMMON ──────────────────────────────────────────────────────────────────
  lucky_coin: {
    id: "lucky_coin",
    name: "Lucky Coin",
    description: "+12 max HP. Restore 6 HP now.",
    tier: "common",
    flavorText: "Worn smooth from a thousand anxious fingers.",
  },
  gamblers_flask: {
    id: "gamblers_flask",
    name: "Gambler's Flask",
    description: "Heal 5 HP after each combat victory.",
    tier: "common",
    flavorText: "A sip for every hand won.",
  },
  insurance_policy: {
    id: "insurance_policy",
    name: "Insurance Policy",
    description: "When you bust, take only half the bust damage.",
    tier: "common",
    flavorText: "The fine print was surprisingly favorable.",
  },
  bankroll: {
    id: "bankroll",
    name: "Bankroll",
    description: "Gain 20 gold at the start of each new floor.",
    tier: "common",
    flavorText: "Deep pockets, deeper nerve.",
  },
  dealing_glove: {
    id: "dealing_glove",
    name: "Dealing Glove",
    description: "Start each combat with 3 cards instead of 2.",
    tier: "common",
    flavorText: "More information. More control.",
  },

  // ─── UNCOMMON ─────────────────────────────────────────────────────────────────
  card_counters_lens: {
    id: "card_counters_lens",
    name: "Card Counter's Lens",
    description: "See the top card of the deck before each of your draws.",
    tier: "uncommon",
    flavorText: "The edge is invisible. Until now.",
  },
  iron_nerves: {
    id: "iron_nerves",
    name: "Iron Nerves",
    description: "When you stand with a total of 18 or higher, deal +4 damage this round.",
    tier: "uncommon",
    flavorText: "Stillness is its own kind of power.",
  },
  double_down_chip: {
    id: "double_down_chip",
    name: "Double Down Chip",
    description: "Once per combat, draw 2 cards simultaneously instead of 1.",
    tier: "uncommon",
    flavorText: "High risk. Higher reward.",
  },
  marked_card: {
    id: "marked_card",
    name: "Marked Card",
    description: "Once per combat, swap one card in your hand for a random one.",
    tier: "uncommon",
    flavorText: "The mark is barely visible, if you know where to look.",
  },

  // ─── RARE ────────────────────────────────────────────────────────────────────
  ace_up_your_sleeve: {
    id: "ace_up_your_sleeve",
    name: "Ace Up Your Sleeve",
    description: "Once per combat, convert any card in your hand to an Ace (counts as 11, or 1 if needed).",
    tier: "rare",
    flavorText: "They never see it coming.",
  },
  hot_streak: {
    id: "hot_streak",
    name: "Hot Streak",
    description: "Each consecutive combat win grants +2 extra damage in the next combat (max +8).",
    tier: "rare",
    flavorText: "Momentum is its own currency.",
  },
  loaded_deck: {
    id: "loaded_deck",
    name: "Loaded Deck",
    description: "Your combat deck has no 2s, 3s, or 4s. Higher average draws.",
    tier: "rare",
    flavorText: "When asked if the deck was fair, they smiled and changed the subject.",
  },
  second_sight: {
    id: "second_sight",
    name: "Second Sight",
    description: "You can see the enemy's first card at the start of each combat round.",
    tier: "rare",
    flavorText: "A single card reveals everything.",
  },
};

export const ALL_RELICS = Object.values(RELICS);

export const RELICS_BY_TIER = {
  common: ALL_RELICS.filter((r) => r.tier === "common"),
  uncommon: ALL_RELICS.filter((r) => r.tier === "uncommon"),
  rare: ALL_RELICS.filter((r) => r.tier === "rare"),
};

export function getRandomRelic(
  ownedIds: string[],
  tier?: "common" | "uncommon" | "rare"
): Relic | null {
  const pool = tier ? RELICS_BY_TIER[tier] : ALL_RELICS;
  const available = pool.filter((r) => !ownedIds.includes(r.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

export function getRelicById(id: string): Relic | null {
  return RELICS[id] || null;
}

export function getShopRelics(ownedIds: string[]): Relic[] {
  const available = ALL_RELICS.filter((r) => !ownedIds.includes(r.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2);
}

export function getRelicCost(relic: Relic): number {
  return relic.tier === "rare" ? 65 : relic.tier === "uncommon" ? 45 : 30;
}

/** Apply immediate relic effects (called when relic is obtained) */
export function getRelicImmediateEffect(
  relicId: string
): { hp?: number; maxHp?: number; gold?: number } {
  switch (relicId) {
    case "lucky_coin":
      return { maxHp: 12, hp: 6 };
    case "bankroll":
      return { gold: 20 };
    default:
      return {};
  }
}
