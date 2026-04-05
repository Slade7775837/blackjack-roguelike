"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  GameState,
  CombatState,
  Card,
  Ability,
  Relic,
  RunStats,
  Enemy,
} from "./types";
import {
  createDeck,
  shuffleDeck,
  calculateTotal,
  peekTop,
  shouldEnemyStand,
} from "./deck";
import { getEnemyForRoom } from "./enemies";
import {
  getRandomRelic,
  getShopRelics,
  getRelicCost,
  getRelicImmediateEffect,
} from "./relics";
import {
  createAbility,
  getStartingAbility,
  getRandomAbility,
  getAbilityCost,
  tickAbilityCooldowns,
  isAbilityReady,
  putOnCooldown,
} from "./abilities";
import { getRandomEvent } from "./events";
import {
  generateMap,
  getAvailableNodes,
  getNodeById,
  markNodeCleared,
} from "./map";

// ─── Score calculation ────────────────────────────────────────────────────────

function calculateScore(state: GameState): number {
  const floorBonus = state.stats.floorsCleared * 150;
  const enemyBonus = state.stats.enemiesDefeated * 20;
  const eliteBonus = state.stats.elitesDefeated * 50;
  const bossBonus = state.stats.bossesDefeated * 100;
  const goldBonus = Math.floor(state.gold * 0.5);
  const hpBonus = state.hp * 2;
  const relicBonus = state.relics.length * 25;
  return floorBonus + enemyBonus + eliteBonus + bossBonus + goldBonus + hpBonus + relicBonus;
}

// ─── Combat helpers ──────────────────────────────────────────────────────────

function initCombat(enemy: Enemy, relics: string[], abilities: Ability[]): CombatState {
  const hasLoadedDeck = relics.includes("loaded_deck");
  const hasDealingGlove = relics.includes("dealing_glove");
  const deck = shuffleDeck(createDeck(hasLoadedDeck));

  const startCards = hasDealingGlove ? 3 : 2;
  const playerHand: Card[] = [];
  const remaining = [...deck];

  for (let i = 0; i < startCards; i++) {
    const card = remaining.pop();
    if (card) playerHand.push(card);
  }

  // If boss has startsWithCard, deal 1 to enemy
  const enemyHand: Card[] = [];
  if (enemy.special?.startsWithCard) {
    const card = remaining.pop();
    if (card) enemyHand.push(card);
  }

  return {
    enemy,
    playerHand,
    enemyHand,
    deck: remaining,
    playerTotal: calculateTotal(playerHand),
    enemyTotal: calculateTotal(enemyHand),
    playerStood: false,
    enemyStood: false,
    phase: "player_turn",
    roundNumber: 1,
    log: [
      {
        message: `Combat begins! Facing ${enemy.name} (${enemy.hp} HP).`,
        type: "info",
      },
      {
        message: `You draw ${startCards} cards.`,
        type: "info",
      },
    ],
    peek: null,
    lastRoundResult: null,
    consecutiveWins: 0,
    usedSecondWind: false,
    usedAceUp: false,
    ironStandBonus: 0,
    doubleDrawActive: false,
  };
}

function resolveRound(
  combat: CombatState,
  playerHp: number,
  relics: Relic[]
): { combat: CombatState; playerHp: number; enemyHp: number; scoreGain: number } {
  const relicIds = relics.map((r) => r.id);
  const hasInsurance = relicIds.includes("insurance_policy");
  const hasIronNerves = relicIds.includes("iron_nerves");
  const hasHotStreak = relicIds.includes("hot_streak");

  let playerTotal = combat.playerTotal + combat.ironStandBonus;
  const enemyTotal = combat.enemyTotal;
  const playerBust = playerTotal > 21;
  const enemyBust = enemyTotal > 21;
  const tieDamage = combat.enemy.special?.tieDamage ?? 2;
  const bustMult = combat.enemy.special?.bustDamageMultiplier ?? 1;
  const lowTotalBonus = combat.enemy.special?.lowTotalBonus ?? 0;

  let hpDelta = 0; // negative = player takes damage
  let enemyHpDelta = 0; // negative = enemy takes damage
  let resultType: CombatState["lastRoundResult"] = null;
  let logMsg = "";
  let consecutiveWins = combat.consecutiveWins;
  let scoreGain = 0;

  if (playerBust && enemyBust) {
    // Both bust: both take bust damage
    let pDmg = Math.max(3, (playerTotal - 21)) * bustMult;
    if (hasInsurance) pDmg = Math.ceil(pDmg / 2);
    let eDmg = Math.max(3, enemyTotal - 21);
    hpDelta = -pDmg;
    enemyHpDelta = -eDmg;
    resultType = "player_bust";
    logMsg = `Both bust! You take ${pDmg} damage, enemy takes ${eDmg}.`;
    consecutiveWins = 0;
  } else if (playerBust) {
    let dmg = Math.max(3, (playerTotal - 21)) * bustMult;
    if (hasInsurance) dmg = Math.ceil(dmg / 2);
    hpDelta = -dmg;
    resultType = "player_bust";
    logMsg = `You bust with ${playerTotal}! ${hasInsurance ? "(Insurance: half damage) " : ""}Take ${dmg} damage.`;
    consecutiveWins = 0;
  } else if (enemyBust) {
    let dmg = Math.max(3, enemyTotal - 21);
    enemyHpDelta = -dmg;
    resultType = "enemy_bust";
    logMsg = `Enemy busts with ${enemyTotal}! They take ${dmg} damage.`;
    consecutiveWins++;
    scoreGain = 5;
  } else if (playerTotal > enemyTotal) {
    // Player wins round
    let dmg = Math.max(3, playerTotal - enemyTotal);
    // Iron Nerves bonus
    if (hasIronNerves && playerTotal >= 18 && combat.ironStandBonus === 0) {
      // only counts if we used iron_stand naturally
    }
    if (hasIronNerves && playerTotal >= 18) dmg += 4;
    enemyHpDelta = -dmg;
    resultType = "player_win";
    logMsg = `You win with ${playerTotal} vs ${enemyTotal}! Enemy takes ${dmg} damage.`;
    consecutiveWins++;
    scoreGain = 5;
  } else if (enemyTotal > playerTotal) {
    // Enemy wins round
    let dmg = Math.max(3, enemyTotal - playerTotal);
    if (lowTotalBonus && enemyTotal <= 17) dmg += lowTotalBonus;
    hpDelta = -dmg;
    resultType = "enemy_win";
    logMsg = `Enemy wins with ${enemyTotal} vs ${playerTotal}! You take ${dmg} damage.`;
    consecutiveWins = 0;
  } else {
    // Tie
    hpDelta = -tieDamage;
    resultType = "tie";
    logMsg = `Tie at ${playerTotal}! ${tieDamage > 2 ? "The House punishes ties. " : ""}You take ${tieDamage} damage.`;
    consecutiveWins = 0;
  }

  // Hot Streak: consecutive wins add bonus damage to next round
  const hotStreakBonus = hasHotStreak ? Math.min(consecutiveWins * 2, 8) : 0;
  if (hotStreakBonus > 0 && consecutiveWins > 1) {
    enemyHpDelta -= hotStreakBonus;
    if (consecutiveWins > 1) logMsg += ` Hot Streak +${hotStreakBonus}!`;
  }

  const newEnemyHp = Math.max(0, combat.enemy.hp + enemyHpDelta);
  const newPlayerHp = Math.max(0, playerHp + hpDelta);
  const combatOver = newEnemyHp <= 0 || newPlayerHp <= 0;

  const updatedEnemy: Enemy = { ...combat.enemy, hp: newEnemyHp };

  const newCombat: CombatState = {
    ...combat,
    enemy: updatedEnemy,
    phase: combatOver ? "combat_over" : "round_over",
    lastRoundResult: resultType,
    consecutiveWins,
    ironStandBonus: 0, // reset after round
    log: [
      ...combat.log,
      { message: logMsg, type: resultType === "player_bust" || resultType === "enemy_win" ? "damage_player" : resultType === "enemy_bust" || resultType === "player_win" ? "damage_enemy" : "tie" },
    ],
  };

  return {
    combat: newCombat,
    playerHp: newPlayerHp,
    enemyHp: newEnemyHp,
    scoreGain,
  };
}

function startNextRound(combat: CombatState, relics: Relic[]): CombatState {
  const relicIds = relics.map((r) => r.id);
  const hasLoadedDeck = relicIds.includes("loaded_deck");
  const hasDealingGlove = relicIds.includes("dealing_glove");

  // Fresh deck each round
  const newDeck = shuffleDeck(createDeck(hasLoadedDeck));
  const startCards = hasDealingGlove ? 3 : 2;
  const playerHand: Card[] = [];
  const remaining = [...newDeck];

  for (let i = 0; i < startCards; i++) {
    const card = remaining.pop();
    if (card) playerHand.push(card);
  }

  const enemyHand: Card[] = [];
  // Boss "starts with card" special
  if (combat.enemy.special?.startsWithCard) {
    const card = remaining.pop();
    if (card) enemyHand.push(card);
  }

  return {
    ...combat,
    playerHand,
    enemyHand,
    deck: remaining,
    playerTotal: calculateTotal(playerHand),
    enemyTotal: calculateTotal(enemyHand),
    playerStood: false,
    enemyStood: false,
    phase: "player_turn",
    roundNumber: combat.roundNumber + 1,
    peek: null,
    doubleDrawActive: false,
    log: [
      ...combat.log.slice(-6), // keep last 6 entries
      { message: `--- Round ${combat.roundNumber + 1} ---`, type: "info" },
    ],
  };
}

// ─── Store definition ─────────────────────────────────────────────────────────

interface GameStore extends GameState {
  // Actions
  startGame: (playerName: string) => void;
  navigateToNode: (nodeId: string) => void;
  
  // Combat actions
  drawCard: () => void;
  stand: () => void;
  useAbility: (abilityId: string, targetCardIndex?: number) => void;
  continueAfterRound: () => void;
  continueAfterCombat: () => void;
  
  // Event actions
  selectEventOption: (optionIndex: number) => void;
  
  // Shop actions
  buyItem: (itemIndex: number) => void;
  leaveShop: () => void;
  
  // Rest actions
  rest: (choice: "heal" | "reduce_cooldown", abilityId?: string) => void;
  
  // Floor/game flow
  continueToNextFloor: () => void;
  returnToMenu: () => void;
  
  // Internal
  _addRelic: (relic: Relic) => void;
  _addAbility: (ability: Ability) => void;
  _resolveAfterPlayerBust: () => void;
  _runEnemyTurn: () => void;
  _resolveRound: () => void;
}

const INITIAL_STATS: RunStats = {
  enemiesDefeated: 0,
  elitesDefeated: 0,
  bossesDefeated: 0,
  goldEarned: 0,
  totalDamageDealt: 0,
  totalDamageTaken: 0,
  relicsFound: 0,
  abilitiesFound: 0,
  floorsCleared: 0,
  roundsPlayed: 0,
};

const INITIAL_STATE: Omit<GameState, "playerName"> = {
  phase: "menu",
  hp: 60,
  maxHp: 60,
  gold: 0,
  relics: [],
  abilities: [],
  floor: 1,
  score: 0,
  stats: INITIAL_STATS,
  map: [],
  currentNodeId: null,
  availableNodes: [],
  combat: null,
  currentEvent: null,
  shop: null,
  shakePlayer: false,
  shakeEnemy: false,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,
      playerName: "",

      startGame: (playerName: string) => {
        const startingAbility = getStartingAbility();
        const map = generateMap(1);
        const available = getAvailableNodes(map, null);

        set({
          ...INITIAL_STATE,
          phase: "map",
          playerName,
          hp: 60,
          maxHp: 60,
          gold: 80,
          relics: [],
          abilities: [startingAbility],
          floor: 1,
          score: 0,
          stats: INITIAL_STATS,
          map,
          currentNodeId: null,
          availableNodes: available,
          combat: null,
          currentEvent: null,
          shop: null,
        });
      },

      navigateToNode: (nodeId: string) => {
        const state = get();
        if (!state.availableNodes.includes(nodeId)) return;

        const node = getNodeById(state.map, nodeId);
        if (!node) return;

        const newMap = markNodeCleared(state.map, nodeId);

        if (node.type === "monster" || node.type === "elite" || node.type === "boss") {
          const tier =
            node.type === "boss" ? "boss" : node.type === "elite" ? "elite" : "normal";
          const enemy = getEnemyForRoom(state.floor, tier);
          const combat = initCombat(
            enemy,
            state.relics.map((r) => r.id),
            state.abilities
          );

          set({
            phase: "combat",
            currentNodeId: nodeId,
            map: newMap,
            combat,
          });
        } else if (node.type === "event") {
          const event = getRandomEvent();
          set({
            phase: "event",
            currentNodeId: nodeId,
            map: newMap,
            currentEvent: event,
          });
        } else if (node.type === "shop") {
          const relicIds = state.relics.map((r) => r.id);
          const shopRelics = getShopRelics(relicIds);
          const abilityObj = getRandomAbility(state.abilities.map((a) => a.id));
          const items: ShopState["items"] = [
            ...shopRelics.map((r) => ({
              type: "relic" as const,
              item: r,
              cost: getRelicCost(r),
              sold: false,
            })),
            ...(abilityObj
              ? [
                  {
                    type: "ability" as const,
                    item: abilityObj,
                    cost: getAbilityCost(),
                    sold: false,
                  },
                ]
              : []),
            {
              type: "heal" as const,
              cost: 30,
              sold: false,
            },
          ];
          set({
            phase: "shop",
            currentNodeId: nodeId,
            map: newMap,
            shop: { items },
          });
        } else if (node.type === "rest") {
          set({
            phase: "rest",
            currentNodeId: nodeId,
            map: newMap,
          });
        }
      },

      // ─── Combat ────────────────────────────────────────────────────────────

      drawCard: () => {
        const state = get();
        if (!state.combat || state.combat.phase !== "player_turn") return;

        const deck = [...state.combat.deck];
        const card = deck.pop();
        if (!card) return;

        let playerHand = [...state.combat.playerHand, card];

        // Second Wind: if bust, becomes 20
        let playerTotal = calculateTotal(playerHand);
        let usedSecondWind = state.combat.usedSecondWind;

        if (playerTotal > 21 && !usedSecondWind) {
          const hasSecondWind = state.abilities.some(
            (a) => a.id === "second_wind" && isAbilityReady(a)
          );
          if (hasSecondWind) {
            // Don't auto-apply, let player choose (just flag it)
            // For simplicity, auto-apply if it would save them
          }
        }

        const hasPeekRelic = state.relics.some((r) => r.id === "card_counters_lens");
        const peek = hasPeekRelic ? { cards: peekTop(deck, 1) } : null;

        const updatedCombat: CombatState = {
          ...state.combat,
          playerHand,
          deck,
          playerTotal,
          peek,
          doubleDrawActive: false,
        };

        if (playerTotal > 21) {
          // Auto-enter resolution
          set({ combat: updatedCombat });
          get()._resolveAfterPlayerBust();
        } else {
          set({ combat: updatedCombat });
        }
      },

      stand: () => {
        const state = get();
        if (!state.combat || state.combat.phase !== "player_turn") return;
        if (state.combat.playerStood) return;

        set({
          combat: {
            ...state.combat,
            playerStood: true,
            phase: "enemy_turn",
            log: [
              ...state.combat.log,
              { message: `You stand at ${state.combat.playerTotal + state.combat.ironStandBonus}.`, type: "info" },
            ],
          },
        });

        // Run enemy AI
        setTimeout(() => get()._runEnemyTurn(), 600);
      },

      useAbility: (abilityId: string, targetCardIndex?: number) => {
        const state = get();
        if (!state.combat || state.combat.phase !== "player_turn") return;

        const abilityIdx = state.abilities.findIndex((a) => a.id === abilityId);
        if (abilityIdx === -1) return;
        const ability = state.abilities[abilityIdx];
        if (!isAbilityReady(ability)) return;

        const newAbilities = [...state.abilities];
        newAbilities[abilityIdx] = putOnCooldown(ability);

        let updatedCombat = { ...state.combat };
        let updatedState: Partial<GameStore> = { abilities: newAbilities };

        switch (abilityId) {
          case "card_swap": {
            if (targetCardIndex === undefined || state.combat.playerHand.length === 0) break;
            const newHand = [...state.combat.playerHand];
            const deck = [...state.combat.deck];
            const newCard = deck.pop();
            if (!newCard) break;
            newHand[targetCardIndex] = newCard;
            updatedCombat = {
              ...updatedCombat,
              playerHand: newHand,
              deck,
              playerTotal: calculateTotal(newHand),
              log: [...updatedCombat.log, { message: "Card swapped!", type: "special" }],
            };
            break;
          }

          case "peek": {
            const topCards = peekTop(state.combat.deck, 3);
            updatedCombat = {
              ...updatedCombat,
              peek: { cards: topCards },
              log: [...updatedCombat.log, { message: `Peek: Top cards revealed.`, type: "special" }],
            };
            break;
          }

          case "iron_stand": {
            updatedCombat = {
              ...updatedCombat,
              ironStandBonus: 3,
              log: [...updatedCombat.log, { message: "Iron Stand: +3 to your total this round!", type: "special" }],
            };
            break;
          }

          case "second_wind": {
            if (state.combat.playerTotal <= 21) {
              // Can't use it if not busting - refund cooldown
              newAbilities[abilityIdx] = ability;
              break;
            }
            updatedCombat = {
              ...updatedCombat,
              playerTotal: 20,
              usedSecondWind: true,
              log: [...updatedCombat.log, { message: "Second Wind! Total set to 20.", type: "special" }],
            };
            break;
          }

          case "fold": {
            updatedState.hp = Math.max(0, state.hp - 3);
            updatedCombat = {
              ...updatedCombat,
              phase: "round_over",
              lastRoundResult: "tie",
              log: [...updatedCombat.log, { message: "You fold. No damage dealt. You take 3 HP.", type: "special" }],
            };
            break;
          }

          case "double_draw": {
            const deck = [...state.combat.deck];
            const cards: Card[] = [];
            const c1 = deck.pop();
            const c2 = deck.pop();
            if (c1) cards.push(c1);
            if (c2) cards.push(c2);
            const newHand = [...state.combat.playerHand, ...cards];
            const newTotal = calculateTotal(newHand);
            updatedCombat = {
              ...updatedCombat,
              playerHand: newHand,
              deck,
              playerTotal: newTotal,
              log: [...updatedCombat.log, { message: `Double Draw: +2 cards!`, type: "special" }],
            };
            if (newTotal > 21) {
              set({ combat: updatedCombat, ...updatedState });
              get()._resolveAfterPlayerBust();
              return;
            }
            break;
          }

          case "ace_mark": {
            if (targetCardIndex === undefined) break;
            const hand = [...state.combat.playerHand];
            hand[targetCardIndex] = {
              ...hand[targetCardIndex],
              rank: "A",
              suit: hand[targetCardIndex].suit,
            };
            const newTotal = calculateTotal(hand);
            updatedCombat = {
              ...updatedCombat,
              playerHand: hand,
              playerTotal: newTotal,
              usedAceUp: true,
              log: [...updatedCombat.log, { message: "Ace Mark: Card converted to Ace!", type: "special" }],
            };
            break;
          }
        }

        set({ combat: updatedCombat, ...updatedState });
      },

      _resolveAfterPlayerBust: () => {
        const state = get();
        if (!state.combat) return;
        // Auto-stand for enemy resolution
        set({
          combat: {
            ...state.combat,
            playerStood: true,
            phase: "enemy_turn",
          },
        });
        setTimeout(() => get()._runEnemyTurn(), 400);
      },

      _runEnemyTurn: () => {
        const state = get();
        if (!state.combat) return;

        const combat = state.combat;
        const enemy = combat.enemy;
        let deck = [...combat.deck];
        let enemyHand = [...combat.enemyHand];

        // Special: extra card on even rounds
        const extraCard = enemy.special?.extraCardOnEvenRound && combat.roundNumber % 2 === 0;

        // Enemy draws cards
        let maxDraws = 10;
        while (maxDraws-- > 0) {
          const total = calculateTotal(enemyHand);
          const playerTotal = combat.playerTotal + combat.ironStandBonus;
          const revealPlayer = enemy.special?.revealPlayerTotal ? playerTotal : undefined;

          if (shouldEnemyStand(enemy.standAt, total, enemy.behavior, combat.roundNumber, revealPlayer)) {
            break;
          }
          if (total > 21) break;
          const card = deck.pop();
          if (!card) break;
          enemyHand.push(card);
        }

        // Extra card for boss special
        if (extraCard && deck.length > 0) {
          const card = deck.pop()!;
          enemyHand.push(card);
        }

        const enemyTotal = calculateTotal(enemyHand);

        const updatedCombat: CombatState = {
          ...combat,
          enemyHand,
          deck,
          enemyTotal,
          enemyStood: true,
          phase: "resolution",
          log: [
            ...combat.log,
            { message: `${enemy.name} stands at ${enemyTotal > 21 ? `${enemyTotal} (bust!)` : enemyTotal}.`, type: "info" },
          ],
        };

        set({ combat: updatedCombat });
        setTimeout(() => get()._resolveRound(), 800);
      },

      _resolveRound: () => {
        const state = get();
        if (!state.combat) return;

        const { combat, playerHp, enemyHp, scoreGain } = resolveRound(
          state.combat,
          state.hp,
          state.relics
        );

        const isDead = playerHp <= 0;
        const enemyDead = enemyHp <= 0;

        let newStats = { ...state.stats, roundsPlayed: state.stats.roundsPlayed + 1 };
        let shakePlayer = playerHp < state.hp;
        let shakeEnemy = enemyHp < (state.combat?.enemy.hp ?? 100);

        set({
          combat,
          hp: playerHp,
          score: state.score + scoreGain,
          stats: newStats,
          shakePlayer,
          shakeEnemy,
        });

        setTimeout(() => set({ shakePlayer: false, shakeEnemy: false }), 600);

        if (isDead) {
          setTimeout(() => {
            set({ phase: "game_over", score: calculateScore(get()) });
          }, 1200);
        } else if (enemyDead) {
          // Combat won
          setTimeout(() => {
            set((s) => ({
              combat: s.combat
                ? { ...s.combat, phase: "combat_over" }
                : null,
            }));
          }, 800);
        }
      },

      continueAfterRound: () => {
        const state = get();
        if (!state.combat) return;
        const newCombat = startNextRound(state.combat, state.relics);
        const tickedAbilities = tickAbilityCooldowns(state.abilities);
        set({ combat: newCombat, abilities: tickedAbilities });
      },

      continueAfterCombat: () => {
        const state = get();
        if (!state.combat) return;

        const enemy = state.combat.enemy;
        const relicIds = state.relics.map((r) => r.id);

        // Gold reward
        const [minGold, maxGold] = enemy.goldReward;
        const goldGain =
          Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold;

        // HP regen (Gambler's Flask relic)
        const hasFlask = relicIds.includes("gamblers_flask");
        const flaskHeal = hasFlask ? 5 : 0;

        // Stats
        const newStats = {
          ...state.stats,
          enemiesDefeated: state.stats.enemiesDefeated + 1,
          elitesDefeated:
            enemy.tier === "elite"
              ? state.stats.elitesDefeated + 1
              : state.stats.elitesDefeated,
          bossesDefeated:
            enemy.tier === "boss"
              ? state.stats.bossesDefeated + 1
              : state.stats.bossesDefeated,
          goldEarned: state.stats.goldEarned + goldGain,
          floorsCleared:
            enemy.tier === "boss"
              ? state.stats.floorsCleared + 1
              : state.stats.floorsCleared,
        };

        let newState: Partial<GameStore> = {
          gold: state.gold + goldGain,
          hp: Math.min(state.maxHp, state.hp + flaskHeal),
          stats: newStats,
          combat: null,
        };

        // Relic drop
        if (Math.random() < enemy.relicChance) {
          const relic = getRandomRelic(relicIds);
          if (relic) {
            const immediate = getRelicImmediateEffect(relic.id);
            newState.relics = [...state.relics, relic];
            if (immediate.maxHp) newState.maxHp = (state.maxHp) + immediate.maxHp;
            if (immediate.hp) newState.hp = Math.min((newState.maxHp || state.maxHp), (newState.hp || state.hp) + immediate.hp);
            if (immediate.gold) newState.gold = (newState.gold || state.gold) + immediate.gold;
            newState.stats = { ...newStats, relicsFound: newStats.relicsFound + 1 };
          }
        }

        // Ability drop
        if (Math.random() < enemy.abilityChance) {
          const ownedIds = state.abilities.map((a) => a.id);
          const ability = getRandomAbility(ownedIds);
          if (ability) {
            newState.abilities = [...state.abilities, ability];
            newState.stats = { ...(newState.stats || newStats), abilitiesFound: (newState.stats || newStats).abilitiesFound + 1 };
          }
        }

        // Check if boss = floor cleared
        if (enemy.tier === "boss") {
          if (state.floor >= 3) {
            newState.phase = "victory";
            newState.score = calculateScore({ ...state, ...newState } as GameState);
          } else {
            newState.phase = "floor_transition";
          }
        } else {
          // Return to map
          const available = getAvailableNodes(state.map, state.currentNodeId);
          newState.phase = "map";
          newState.availableNodes = available;
        }

        newState.score = calculateScore({ ...state, ...newState } as GameState);
        set(newState as GameStore);
      },

      // ─── Events ────────────────────────────────────────────────────────────

      selectEventOption: (optionIndex: number) => {
        const state = get();
        if (!state.currentEvent) return;

        const option = state.currentEvent.options[optionIndex];
        if (!option) return;

        // Check requirements
        if (option.requireGold && state.gold < option.requireGold) return;

        let newState: Partial<GameStore> = {};

        for (const effect of option.effects) {
          switch (effect.type) {
            case "heal":
              newState.hp = Math.min(
                state.maxHp,
                (newState.hp ?? state.hp) + (effect.value ?? 0)
              );
              break;
            case "damage":
              newState.hp = Math.max(
                0,
                (newState.hp ?? state.hp) - (effect.value ?? 0)
              );
              break;
            case "gold":
              newState.gold = (newState.gold ?? state.gold) + (effect.value ?? 0);
              break;
            case "lose_gold":
              newState.gold = Math.max(0, (newState.gold ?? state.gold) - (effect.value ?? 0));
              break;
            case "max_hp":
              newState.maxHp = Math.max(
                20,
                (newState.maxHp ?? state.maxHp) + (effect.value ?? 0)
              );
              newState.hp = Math.min(
                newState.maxHp,
                newState.hp ?? state.hp
              );
              break;
            case "add_relic": {
              const relicIds = [
                ...state.relics.map((r) => r.id),
                ...(newState.relics ?? []).map((r) => r.id),
              ];
              const tier =
                effect.relicId === "rare" ? "rare" : undefined;
              const relic = getRandomRelic(relicIds, tier);
              if (relic) {
                newState.relics = [...(newState.relics ?? state.relics), relic];
                const immediate = getRelicImmediateEffect(relic.id);
                if (immediate.maxHp) newState.maxHp = (newState.maxHp ?? state.maxHp) + immediate.maxHp;
                if (immediate.hp) newState.hp = Math.min(newState.maxHp ?? state.maxHp, (newState.hp ?? state.hp) + immediate.hp);
                if (immediate.gold) newState.gold = (newState.gold ?? state.gold) + immediate.gold;
              }
              break;
            }
            case "add_ability": {
              if (effect.abilityId === "reduce_cooldown" || effect.abilityId === "gamble_win_40" || effect.abilityId === "open_mini_shop") {
                // Special events handled differently
                if (effect.abilityId === "gamble_win_40") {
                  if (Math.random() > 0.5) {
                    newState.gold = (newState.gold ?? state.gold) + 40;
                  } else {
                    newState.hp = Math.max(0, (newState.hp ?? state.hp) - 15);
                  }
                } else if (effect.abilityId === "reduce_cooldown") {
                  // Reduce random ability cooldown by 1
                  const abilities = [...state.abilities];
                  if (abilities.length > 0) {
                    const idx = Math.floor(Math.random() * abilities.length);
                    abilities[idx] = { ...abilities[idx], cooldown: Math.max(1, abilities[idx].cooldown - 1) };
                    newState.abilities = abilities;
                  }
                }
                break;
              }
              const ownedIds = [...state.abilities, ...(newState.abilities ?? [])].map((a) => a.id);
              const ability = getRandomAbility(ownedIds);
              if (ability) {
                newState.abilities = [...(newState.abilities ?? state.abilities), ability];
              }
              break;
            }
            case "nothing":
              break;
          }
        }

        // Return to map
        const available = getAvailableNodes(state.map, state.currentNodeId);
        set({
          ...newState,
          phase: "map",
          currentEvent: null,
          availableNodes: available,
          score: calculateScore({ ...state, ...newState } as GameState),
        } as GameStore);
      },

      // ─── Shop ──────────────────────────────────────────────────────────────

      buyItem: (itemIndex: number) => {
        const state = get();
        if (!state.shop) return;

        const shopItems = [...state.shop.items];
        const item = shopItems[itemIndex];
        if (!item || item.sold || state.gold < item.cost) return;

        shopItems[itemIndex] = { ...item, sold: true };

        let newState: Partial<GameStore> = {
          gold: state.gold - item.cost,
          shop: { items: shopItems },
        };

        if (item.type === "relic" && item.item) {
          const relic = item.item as Relic;
          const immediate = getRelicImmediateEffect(relic.id);
          newState.relics = [...state.relics, relic];
          if (immediate.maxHp) newState.maxHp = state.maxHp + immediate.maxHp;
          if (immediate.hp) newState.hp = Math.min(newState.maxHp ?? state.maxHp, state.hp + immediate.hp);
          if (immediate.gold) newState.gold = (newState.gold ?? state.gold) + immediate.gold;
        } else if (item.type === "ability" && item.item) {
          newState.abilities = [...state.abilities, item.item as Ability];
        } else if (item.type === "heal") {
          newState.hp = Math.min(state.maxHp, state.hp + 20);
        }

        set(newState as GameStore);
      },

      leaveShop: () => {
        const state = get();
        const available = getAvailableNodes(state.map, state.currentNodeId);
        set({ phase: "map", shop: null, availableNodes: available });
      },

      // ─── Rest ──────────────────────────────────────────────────────────────

      rest: (choice: "heal" | "reduce_cooldown", abilityId?: string) => {
        const state = get();
        let newState: Partial<GameStore> = {};

        if (choice === "heal") {
          const healAmount = Math.max(20, Math.floor(state.maxHp * 0.3));
          newState.hp = Math.min(state.maxHp, state.hp + healAmount);
        } else if (choice === "reduce_cooldown" && abilityId) {
          newState.abilities = state.abilities.map((a) =>
            a.id === abilityId
              ? { ...a, cooldown: Math.max(1, a.cooldown - 1) }
              : a
          );
        }

        const available = getAvailableNodes(state.map, state.currentNodeId);
        set({
          ...newState,
          phase: "map",
          availableNodes: available,
        } as GameStore);
      },

      // ─── Floor transition ──────────────────────────────────────────────────

      continueToNextFloor: () => {
        const state = get();
        const nextFloor = state.floor + 1;
        const newMap = generateMap(nextFloor);
        const available = getAvailableNodes(newMap, null);

        // Bankroll relic
        const hasBankroll = state.relics.some((r) => r.id === "bankroll");
        const bonusGold = hasBankroll ? 20 : 0;

        set({
          phase: "map",
          floor: nextFloor,
          map: newMap,
          currentNodeId: null,
          availableNodes: available,
          gold: state.gold + bonusGold,
          combat: null,
          currentEvent: null,
          shop: null,
        });
      },

      returnToMenu: () => {
        set({ ...INITIAL_STATE, playerName: get().playerName });
      },

      _addRelic: (relic: Relic) => {
        const state = get();
        const immediate = getRelicImmediateEffect(relic.id);
        set({
          relics: [...state.relics, relic],
          maxHp: state.maxHp + (immediate.maxHp ?? 0),
          hp: Math.min(state.maxHp + (immediate.maxHp ?? 0), state.hp + (immediate.hp ?? 0)),
          gold: state.gold + (immediate.gold ?? 0),
        });
      },

      _addAbility: (ability: Ability) => {
        set((s) => ({ abilities: [...s.abilities, ability] }));
      },
    }),
    {
      name: "blackjack-roguelike-save",
      partialize: (state) => ({
        playerName: state.playerName,
        phase: state.phase,
        hp: state.hp,
        maxHp: state.maxHp,
        gold: state.gold,
        relics: state.relics,
        abilities: state.abilities,
        floor: state.floor,
        score: state.score,
        stats: state.stats,
        map: state.map,
        currentNodeId: state.currentNodeId,
        availableNodes: state.availableNodes,
        combat: state.combat,
        currentEvent: state.currentEvent,
        shop: state.shop,
      }),
    }
  )
);
