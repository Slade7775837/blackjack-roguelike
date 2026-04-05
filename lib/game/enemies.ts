import { Enemy } from "./types";

export const ENEMIES: Record<string, Enemy> = {
  // ─── FLOOR 1 NORMALS ────────────────────────────────────────────────────────
  novice_gambler: {
    id: "novice_gambler",
    name: "Novice Gambler",
    description: "Stands early, afraid to bust. Predictable.",
    hp: 28,
    maxHp: 28,
    standAt: 15,
    behavior: "cautious",
    tier: "normal",
    goldReward: [6, 10],
    relicChance: 0,
    abilityChance: 0.15,
  },
  street_hustler: {
    id: "street_hustler",
    name: "Street Hustler",
    description: "Knows the standard play. Won't deviate.",
    hp: 32,
    maxHp: 32,
    standAt: 17,
    behavior: "balanced",
    tier: "normal",
    goldReward: [8, 12],
    relicChance: 0,
    abilityChance: 0.2,
  },

  // ─── FLOOR 2 NORMALS ────────────────────────────────────────────────────────
  card_sharp: {
    id: "card_sharp",
    name: "Card Sharp",
    description: "Pushes hard. Stands at 18. Confident.",
    hp: 42,
    maxHp: 42,
    standAt: 18,
    behavior: "balanced",
    tier: "normal",
    goldReward: [12, 16],
    relicChance: 0,
    abilityChance: 0.2,
  },
  risk_taker: {
    id: "risk_taker",
    name: "Risk Taker",
    description: "Won't stop until 20. Volatile and dangerous.",
    hp: 36,
    maxHp: 36,
    standAt: 20,
    behavior: "aggressive",
    tier: "normal",
    goldReward: [10, 15],
    relicChance: 0,
    abilityChance: 0.25,
  },

  // ─── FLOOR 3 NORMALS ────────────────────────────────────────────────────────
  the_counter: {
    id: "the_counter",
    name: "The Counter",
    description: "Unpredictable. Adapts each round.",
    hp: 50,
    maxHp: 50,
    standAt: 18,
    behavior: "random",
    tier: "normal",
    goldReward: [14, 20],
    relicChance: 0.05,
    abilityChance: 0.2,
  },
  house_agent: {
    id: "house_agent",
    name: "House Agent",
    description: "Disciplined. Never deviates from 17.",
    hp: 55,
    maxHp: 55,
    standAt: 17,
    behavior: "balanced",
    tier: "normal",
    goldReward: [16, 22],
    relicChance: 0.05,
    abilityChance: 0.2,
  },

  // ─── ELITES ─────────────────────────────────────────────────────────────────
  the_shark: {
    id: "the_shark",
    name: "The Shark",
    description: "Reads you perfectly. Always knows when to push.",
    hp: 62,
    maxHp: 62,
    standAt: 18,
    behavior: "balanced",
    tier: "elite",
    special: { revealPlayerTotal: true },
    goldReward: [22, 30],
    relicChance: 0.5,
    abilityChance: 0.4,
  },
  casino_enforcer: {
    id: "casino_enforcer",
    name: "Casino Enforcer",
    description: "Powerful. Punishes low-total hands with bonus damage.",
    hp: 75,
    maxHp: 75,
    standAt: 17,
    behavior: "balanced",
    tier: "elite",
    special: { lowTotalBonus: 4 },
    goldReward: [25, 35],
    relicChance: 0.6,
    abilityChance: 0.4,
  },
  debt_collector: {
    id: "debt_collector",
    name: "Debt Collector",
    description: "Doubles your bust damage. Merciless.",
    hp: 68,
    maxHp: 68,
    standAt: 17,
    behavior: "cautious",
    tier: "elite",
    special: { bustDamageMultiplier: 2 },
    goldReward: [28, 38],
    relicChance: 0.6,
    abilityChance: 0.35,
  },

  // ─── BOSSES ──────────────────────────────────────────────────────────────────
  pit_boss: {
    id: "pit_boss",
    name: "The Pit Boss",
    description: "Draws an extra card on every even round. Patient and cunning.",
    hp: 90,
    maxHp: 90,
    standAt: 17,
    behavior: "balanced",
    tier: "boss",
    special: { extraCardOnEvenRound: true },
    goldReward: [40, 55],
    relicChance: 1,
    abilityChance: 0.6,
  },
  loan_shark: {
    id: "loan_shark",
    name: "The Loan Shark",
    description: "Your bust damage is doubled. Stands at 18. Ruthless.",
    hp: 115,
    maxHp: 115,
    standAt: 18,
    behavior: "balanced",
    tier: "boss",
    special: { bustDamageMultiplier: 2 },
    goldReward: [55, 70],
    relicChance: 1,
    abilityChance: 0.7,
  },
  the_house: {
    id: "the_house",
    name: "The House",
    description: "Always starts with a card in hand. Ties cost you 8 HP. The house always wins.",
    hp: 155,
    maxHp: 155,
    standAt: 17,
    behavior: "balanced",
    tier: "boss",
    special: { startsWithCard: true, tieDamage: 8 },
    goldReward: [80, 100],
    relicChance: 1,
    abilityChance: 1,
  },
};

export const FLOOR_ENEMIES: Record<number, { normal: string[]; elite: string[]; boss: string }> = {
  1: {
    normal: ["novice_gambler", "street_hustler"],
    elite: ["the_shark"],
    boss: "pit_boss",
  },
  2: {
    normal: ["card_sharp", "risk_taker"],
    elite: ["casino_enforcer"],
    boss: "loan_shark",
  },
  3: {
    normal: ["the_counter", "house_agent"],
    elite: ["debt_collector"],
    boss: "the_house",
  },
};

export function getEnemyForRoom(
  floor: number,
  type: "normal" | "elite" | "boss"
): Enemy {
  const pool = FLOOR_ENEMIES[floor] || FLOOR_ENEMIES[3];
  let id: string;

  if (type === "boss") {
    id = pool.boss;
  } else if (type === "elite") {
    id = pool.elite[Math.floor(Math.random() * pool.elite.length)];
  } else {
    id = pool.normal[Math.floor(Math.random() * pool.normal.length)];
  }

  // Scale HP slightly with floor
  const base = ENEMIES[id];
  if (!base) return ENEMIES["novice_gambler"];

  return { ...base };
}

export function getEnemyById(id: string): Enemy {
  return ENEMIES[id] || ENEMIES["novice_gambler"];
}

export function scaleEnemyForFloor(enemy: Enemy, floor: number): Enemy {
  const hpScale = 1 + (floor - 1) * 0.1;
  const hp = Math.floor(enemy.maxHp * hpScale);
  return { ...enemy, hp, maxHp: hp };
}
