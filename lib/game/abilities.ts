import { Ability } from "./types";

export const ABILITY_DEFINITIONS: Record<string, Omit<Ability, "currentCooldown">> = {
  // ─── Starting ability ─────────────────────────────────────────────────────
  card_swap: {
    id: "card_swap",
    name: "Card Swap",
    description:
      "Discard one card from your hand and draw a replacement. Cooldown: 2 rounds.",
    cooldown: 2,
  },

  // ─── Obtainable ──────────────────────────────────────────────────────────
  peek: {
    id: "peek",
    name: "Peek",
    description:
      "Reveal the top 3 cards of the deck before deciding your next action. Cooldown: 2 rounds.",
    cooldown: 2,
  },
  iron_stand: {
    id: "iron_stand",
    name: "Iron Stand",
    description:
      "Your hand total counts as +3 higher this round when you stand. Cooldown: 3 rounds.",
    cooldown: 3,
  },
  second_wind: {
    id: "second_wind",
    name: "Second Wind",
    description:
      "If you are about to bust, your total becomes 20 instead. Once per combat.",
    cooldown: 0,
    usesLeft: 1,
  },
  fold: {
    id: "fold",
    name: "Fold",
    description:
      "End the round with no damage to either side. You take 3 HP. Cooldown: 3 rounds.",
    cooldown: 3,
  },
  double_draw: {
    id: "double_draw",
    name: "Double Draw",
    description:
      "Draw 2 cards at once as a single action. Cooldown: 3 rounds.",
    cooldown: 3,
  },
  ace_mark: {
    id: "ace_mark",
    name: "Ace Mark",
    description:
      "Convert any card in your hand to count as 11 (or 1 if needed) this round. Cooldown: 4 rounds.",
    cooldown: 4,
  },
};

export function createAbility(id: string): Ability {
  const def = ABILITY_DEFINITIONS[id];
  if (!def) throw new Error(`Unknown ability: ${id}`);
  return {
    ...def,
    currentCooldown: 0,
    usesLeft: def.usesLeft,
  };
}

export function getStartingAbility(): Ability {
  return createAbility("card_swap");
}

export const OBTAINABLE_ABILITIES = [
  "peek",
  "iron_stand",
  "second_wind",
  "fold",
  "double_draw",
  "ace_mark",
];

export function getRandomAbility(ownedIds: string[]): Ability | null {
  const available = OBTAINABLE_ABILITIES.filter((id) => !ownedIds.includes(id));
  if (available.length === 0) return null;
  const id = available[Math.floor(Math.random() * available.length)];
  return createAbility(id);
}

export function getAbilityCost(): number {
  return 50;
}

export function tickAbilityCooldowns(abilities: Ability[]): Ability[] {
  return abilities.map((a) => ({
    ...a,
    currentCooldown: Math.max(0, a.currentCooldown - 1),
  }));
}

export function isAbilityReady(ability: Ability): boolean {
  if (ability.currentCooldown > 0) return false;
  if (ability.usesLeft !== undefined && ability.usesLeft <= 0) return false;
  return true;
}

export function putOnCooldown(ability: Ability): Ability {
  const updated: Ability = {
    ...ability,
    currentCooldown: ability.cooldown,
  };
  if (ability.usesLeft !== undefined) {
    updated.usesLeft = ability.usesLeft - 1;
  }
  return updated;
}
