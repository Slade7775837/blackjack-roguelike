// ─── Cards ────────────────────────────────────────────────────────────────────

export type Suit = "S" | "H" | "D" | "C";
export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string; // unique per card in deck
}

// ─── Relics ───────────────────────────────────────────────────────────────────

export type RelicTier = "common" | "uncommon" | "rare";

export interface Relic {
  id: string;
  name: string;
  description: string;
  tier: RelicTier;
  flavorText?: string;
}

// ─── Abilities ────────────────────────────────────────────────────────────────

export interface Ability {
  id: string;
  name: string;
  description: string;
  cooldown: number; // base cooldown in rounds
  currentCooldown: number; // 0 = ready
  usesLeft?: number; // undefined = unlimited uses
}

// ─── Enemies ─────────────────────────────────────────────────────────────────

export type EnemyBehavior = "cautious" | "balanced" | "aggressive" | "random";
export type EnemyTier = "normal" | "elite" | "boss";

export interface EnemySpecial {
  extraCardOnEvenRound?: boolean; // draws an extra card on even rounds
  bustDamageMultiplier?: number; // multiplies player bust damage
  startsWithCard?: boolean; // enemy starts each round with 1 card
  tieDamage?: number; // damage dealt on tie (overrides default)
  revealPlayerTotal?: boolean; // enemy "knows" your total (stands optimally vs you)
  lowTotalBonus?: number; // if enemy wins with total <= 17, deals bonus damage
}

export interface Enemy {
  id: string;
  name: string;
  description: string;
  hp: number;
  maxHp: number;
  standAt: number;
  behavior: EnemyBehavior;
  tier: EnemyTier;
  special?: EnemySpecial;
  goldReward: [number, number]; // [min, max]
  relicChance: number; // 0-1
  abilityChance: number; // 0-1
}

// ─── Events ───────────────────────────────────────────────────────────────────

export type EventEffectType =
  | "heal"
  | "damage"
  | "gold"
  | "max_hp"
  | "add_relic"
  | "add_ability"
  | "nothing"
  | "lose_gold"
  | "remove_relic";

export interface EventEffect {
  type: EventEffectType;
  value?: number;
  relicId?: string;
  abilityId?: string;
}

export interface EventOption {
  text: string;
  effects: EventEffect[];
  requireGold?: number;
  requireHpAbove?: number;
  tooltip?: string;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  options: EventOption[];
  imageKey?: string;
}

// ─── Map ──────────────────────────────────────────────────────────────────────

export type RoomType =
  | "monster"
  | "elite"
  | "event"
  | "shop"
  | "rest"
  | "boss";

export interface MapNode {
  id: string;
  layer: number;
  column: number;
  type: RoomType;
  cleared: boolean;
  enemyId?: string;
  connections: string[]; // ids in next layer this node connects to
}

// ─── Combat ───────────────────────────────────────────────────────────────────

export type CombatPhase =
  | "player_turn"
  | "enemy_turn"
  | "resolution"
  | "round_over"
  | "combat_over";

export interface CombatLogEntry {
  message: string;
  type: "info" | "damage_player" | "damage_enemy" | "heal" | "special" | "tie";
}

export interface PeekInfo {
  cards: Card[];
}

export interface CombatState {
  enemy: Enemy;
  playerHand: Card[];
  enemyHand: Card[];
  deck: Card[];
  playerTotal: number;
  enemyTotal: number;
  playerStood: boolean;
  enemyStood: boolean;
  phase: CombatPhase;
  roundNumber: number;
  log: CombatLogEntry[];
  peek: PeekInfo | null; // for Peek ability
  lastRoundResult: "player_win" | "enemy_win" | "tie" | "player_bust" | "enemy_bust" | null;
  consecutiveWins: number; // for Hot Streak relic
  usedSecondWind: boolean; // once per combat
  usedAceUp: boolean; // once per combat (Ace Up Your Sleeve relic)
  ironStandBonus: number; // +N to player total this round from Iron Stand ability
  doubleDrawActive: boolean; // Double Down Chip relic
}

// ─── Shop ─────────────────────────────────────────────────────────────────────

export interface ShopItem {
  type: "relic" | "ability" | "heal";
  item?: Relic | Ability;
  cost: number;
  sold: boolean;
}

export interface ShopState {
  items: ShopItem[];
}

// ─── Run Stats ────────────────────────────────────────────────────────────────

export interface RunStats {
  enemiesDefeated: number;
  elitesDefeated: number;
  bossesDefeated: number;
  goldEarned: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  relicsFound: number;
  abilitiesFound: number;
  floorsCleared: number;
  roundsPlayed: number;
}

// ─── Game State ───────────────────────────────────────────────────────────────

export type GamePhase =
  | "menu"
  | "map"
  | "combat"
  | "event"
  | "shop"
  | "rest"
  | "floor_transition"
  | "victory"
  | "game_over";

export interface GameState {
  phase: GamePhase;
  playerName: string;

  // Player
  hp: number;
  maxHp: number;
  gold: number;
  relics: Relic[];
  abilities: Ability[];

  // Progress
  floor: number; // 1, 2, 3
  score: number;
  stats: RunStats;

  // Map
  map: MapNode[];
  currentNodeId: string | null;
  availableNodes: string[]; // nodes player can navigate to

  // Sub-states
  combat: CombatState | null;
  currentEvent: GameEvent | null;
  shop: ShopState | null;

  // UI feedback
  shakePlayer: boolean;
  shakeEnemy: boolean;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  floor_reached: number;
  enemies_defeated: number;
  created_at: string;
}
