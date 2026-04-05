import { GameEvent } from "./types";

export const EVENTS: GameEvent[] = [
  {
    id: "mysterious_stranger",
    title: "The Mysterious Stranger",
    description:
      "A figure in the shadows offers you a deal. 'Something useful for the right price, friend.'",
    options: [
      {
        text: "Pay 25 gold for a relic.",
        effects: [{ type: "lose_gold", value: 25 }, { type: "add_relic" }],
        requireGold: 25,
        tooltip: "Requires 25 gold",
      },
      {
        text: "Decline and move on.",
        effects: [{ type: "nothing" }],
        tooltip: "Safe choice",
      },
    ],
  },
  {
    id: "ancient_tome",
    title: "Ancient Tome",
    description:
      "A crumbling book lies open on a table. Its pages describe techniques far beyond normal play.",
    options: [
      {
        text: "Study the tome. Gain an ability.",
        effects: [{ type: "add_ability" }],
        tooltip: "Learn a new technique",
      },
      {
        text: "The knowledge comes at a cost. Gain an ability, lose 10 HP.",
        effects: [{ type: "add_ability" }, { type: "damage", value: 10 }],
        tooltip: "Higher risk for guaranteed result",
      },
      {
        text: "Ignore it.",
        effects: [{ type: "nothing" }],
      },
    ],
  },
  {
    id: "the_offer",
    title: "The Offer",
    description:
      "Two envelopes sit on the table. One holds gold. The other holds something else.",
    options: [
      {
        text: "Take the gold. Gain 30 gold.",
        effects: [{ type: "gold", value: 30 }],
        tooltip: "Reliable gain",
      },
      {
        text: "Take the other envelope. Heal 18 HP.",
        effects: [{ type: "heal", value: 18 }],
        tooltip: "Good if low on health",
      },
    ],
  },
  {
    id: "devils_bargain",
    title: "The Devil's Bargain",
    description:
      "A smiling figure offers you something rare. The catch? You'll feel it.",
    options: [
      {
        text: "Accept. Gain a rare relic, lose 15 max HP.",
        effects: [{ type: "max_hp", value: -15 }, { type: "add_relic", relicId: "rare" }],
        tooltip: "Permanent HP loss for a rare relic",
      },
      {
        text: "Refuse.",
        effects: [{ type: "nothing" }],
      },
    ],
  },
  {
    id: "training_session",
    title: "Training Session",
    description:
      "An old pro offers to sharpen your skills. 'Takes time, but it's worth it.'",
    options: [
      {
        text: "Train with them. Reduce an ability's cooldown by 1.",
        effects: [{ type: "add_ability", abilityId: "reduce_cooldown" }],
        tooltip: "Permanently reduce one ability's cooldown",
      },
      {
        text: "You don't have time. Move on.",
        effects: [{ type: "nothing" }],
      },
    ],
  },
  {
    id: "healing_spring",
    title: "Healing Spring",
    description:
      "You find a small room with a basin of cool, clear water. Something about it restores you.",
    options: [
      {
        text: "Drink deeply. Heal 20 HP.",
        effects: [{ type: "heal", value: 20 }],
      },
      {
        text: "Drink and rest. Heal 12 HP, gain 10 gold.",
        effects: [{ type: "heal", value: 12 }, { type: "gold", value: 10 }],
      },
    ],
  },
  {
    id: "card_tournament",
    title: "Underground Tournament",
    description:
      "A small crowd watches a game in progress. They need a new player. The entry is free — but you'll put your HP on the line.",
    options: [
      {
        text: "Gamble 15 HP for 40 gold (50% chance).",
        effects: [
          { type: "add_ability", abilityId: "gamble_win_40" }, // handled specially
        ],
        tooltip: "Win: +40 gold. Lose: -15 HP",
      },
      {
        text: "Watch and learn. Gain a random ability.",
        effects: [{ type: "add_ability" }],
        tooltip: "Safe but less rewarding",
      },
      {
        text: "Leave.",
        effects: [{ type: "nothing" }],
      },
    ],
  },
  {
    id: "relic_merchant",
    title: "The Collector",
    description:
      "A merchant spreads their wares on a velvet cloth. Everything looks useful.",
    options: [
      {
        text: "Browse the selection. (Opens a small shop.)",
        effects: [{ type: "add_ability", abilityId: "open_mini_shop" }],
        tooltip: "2 relics for sale at reduced prices",
      },
      {
        text: "You're not interested.",
        effects: [{ type: "nothing" }],
      },
    ],
  },
];

export function getRandomEvent(): GameEvent {
  return EVENTS[Math.floor(Math.random() * EVENTS.length)];
}

export function getEventById(id: string): GameEvent | null {
  return EVENTS.find((e) => e.id === id) || null;
}
