"use client";

import { useState, useEffect, useRef } from "react";
import { useGameStore } from "@/lib/game/store";
import { Ability } from "@/lib/game/types";
import { formatTotal } from "@/lib/game/deck";
import { isAbilityReady } from "@/lib/game/abilities";
import { cn } from "@/lib/utils";
import Card from "./Card";

export default function CombatView() {
  const {
    combat,
    hp,
    maxHp,
    abilities,
    relics,
    shakePlayer,
    shakeEnemy,
    drawCard,
    stand,
    useAbility,
    continueAfterRound,
    continueAfterCombat,
  } = useGameStore();

  const [selectingCardFor, setSelectingCardFor] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [combat?.log.length]);

  if (!combat) return null;

  const {
    enemy,
    playerHand,
    enemyHand,
    playerTotal,
    enemyTotal,
    phase,
    roundNumber,
    log,
    peek,
    lastRoundResult,
    ironStandBonus,
  } = combat;

  const isPlayerTurn = phase === "player_turn";
  const isRoundOver = phase === "round_over";
  const isCombatOver = phase === "combat_over";
  const isResolution = phase === "resolution" || phase === "enemy_turn";
  const enemyWon = enemy.hp <= 0;

  const displayPlayerTotal = playerTotal + ironStandBonus;
  const playerBust = displayPlayerTotal > 21;

  const hpPct = (hp / maxHp) * 100;
  const enemyHpPct = (enemy.hp / enemy.maxHp) * 100;

  function handleAbilityClick(ability: Ability) {
    if (!isAbilityReady(ability)) return;

    // Abilities that need card selection
    if (
      (ability.id === "card_swap" || ability.id === "ace_mark") &&
      playerHand.length > 0
    ) {
      setSelectingCardFor(ability.id);
      return;
    }

    useAbility(ability.id);
  }

  function handleCardSelect(index: number) {
    if (!selectingCardFor) return;
    useAbility(selectingCardFor, index);
    setSelectingCardFor(null);
  }

  function handleDrawCard() {
    if (selectingCardFor) {
      setSelectingCardFor(null);
      return;
    }
    drawCard();
  }

  const tierColor =
    enemy.tier === "boss"
      ? "text-crimson border-crimson/30"
      : enemy.tier === "elite"
      ? "text-gold border-gold/30"
      : "text-text-dim border-border";

  const resultColor =
    lastRoundResult === "player_win" || lastRoundResult === "enemy_bust"
      ? "text-emerald"
      : lastRoundResult === "enemy_win" || lastRoundResult === "player_bust"
      ? "text-crimson"
      : "text-gold";

  const resultText =
    lastRoundResult === "player_win"
      ? "You win the round!"
      : lastRoundResult === "enemy_win"
      ? "Enemy wins the round."
      : lastRoundResult === "player_bust"
      ? "You bust!"
      : lastRoundResult === "enemy_bust"
      ? "Enemy busts!"
      : lastRoundResult === "tie"
      ? "Tie."
      : "";

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
      {/* Round badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-dim uppercase tracking-widest font-medium">
          Round {roundNumber}
        </span>
        <span
          className={cn(
            "text-xs uppercase tracking-widest font-medium border px-2 py-0.5 rounded",
            tierColor
          )}
        >
          {enemy.tier === "boss"
            ? "Boss"
            : enemy.tier === "elite"
            ? "Elite"
            : "Combat"}
        </span>
      </div>

      {/* Enemy card */}
      <div
        className={cn(
          "bg-surface border border-border rounded-xl p-4 transition-all duration-200",
          shakeEnemy && "shake-anim"
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-text">
              {enemy.name}
            </h2>
            <p className="text-xs text-text-dim mt-0.5">{enemy.description}</p>
            {enemy.special && (
              <div className="mt-1 flex flex-wrap gap-1">
                {enemy.special.extraCardOnEvenRound && (
                  <span className="text-xs px-1.5 py-0.5 bg-surface-high rounded border border-border text-text-dim">
                    Extra card on even rounds
                  </span>
                )}
                {enemy.special.bustDamageMultiplier && (
                  <span className="text-xs px-1.5 py-0.5 bg-surface-high rounded border border-crimson/40 text-crimson">
                    x{enemy.special.bustDamageMultiplier} bust damage
                  </span>
                )}
                {enemy.special.revealPlayerTotal && (
                  <span className="text-xs px-1.5 py-0.5 bg-surface-high rounded border border-gold/40 text-gold">
                    Reads your hand
                  </span>
                )}
                {enemy.special.startsWithCard && (
                  <span className="text-xs px-1.5 py-0.5 bg-surface-high rounded border border-crimson/40 text-crimson">
                    Starts with a card
                  </span>
                )}
                {enemy.special.tieDamage && enemy.special.tieDamage > 2 && (
                  <span className="text-xs px-1.5 py-0.5 bg-surface-high rounded border border-crimson/40 text-crimson">
                    Ties deal {enemy.special.tieDamage} dmg
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Enemy HP */}
          <div className="text-right min-w-[80px]">
            <div className="font-mono text-sm text-text">
              {enemy.hp}
              <span className="text-text-dim">/{enemy.maxHp}</span>
            </div>
            <div className="h-1 w-20 bg-surface-high rounded-full mt-1 ml-auto">
              <div
                className="hp-bar h-full rounded-full bg-crimson"
                style={{ width: `${Math.max(0, enemyHpPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Enemy hand */}
        <div className="flex items-center gap-3">
          <div className="flex gap-2 flex-wrap">
            {enemyHand.length === 0 ? (
              <div className="text-xs text-text-dim italic">No cards yet</div>
            ) : (
              enemyHand.map((card, i) => (
                <Card
                  key={card.id}
                  card={card}
                  size="sm"
                  animDelay={i * 80}
                />
              ))
            )}
          </div>
          {(isResolution || isRoundOver || isCombatOver) && enemyHand.length > 0 && (
            <div
              className={cn(
                "font-mono text-lg font-bold ml-2",
                enemyTotal > 21 ? "text-crimson" : "text-text"
              )}
            >
              = {formatTotal(enemyTotal)}
            </div>
          )}
          {isPlayerTurn && enemyHand.length > 0 && (
            <div className="text-xs text-text-dim ml-2">
              {enemyHand.length} card{enemyHand.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Second Sight relic: show first enemy card */}
        {relics.some((r) => r.id === "second_sight") && isPlayerTurn && enemyHand.length === 0 && (
          <div className="text-xs text-text-dim italic mt-1">
            Second Sight: Waiting for enemy's first card...
          </div>
        )}
      </div>

      {/* VS divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        {lastRoundResult && (isRoundOver || isCombatOver) && (
          <span className={cn("text-sm font-medium font-display", resultColor)}>
            {resultText}
          </span>
        )}
        {!lastRoundResult && !isCombatOver && (
          <span className="text-xs text-text-dim">
            {isPlayerTurn
              ? selectingCardFor
                ? "Select a card to swap"
                : "Your turn"
              : phase === "enemy_turn"
              ? "Enemy drawing..."
              : "Resolving..."}
          </span>
        )}
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Player card */}
      <div
        className={cn(
          "bg-surface border border-border rounded-xl p-4 transition-all duration-200",
          shakePlayer && "shake-anim"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-dim uppercase tracking-widest font-medium">
              Your Hand
            </span>
            {ironStandBonus > 0 && (
              <span className="text-xs px-1.5 py-0.5 bg-surface-high border border-gold/40 text-gold rounded">
                Iron Stand +{ironStandBonus}
              </span>
            )}
          </div>
          <div
            className={cn(
              "font-mono text-2xl font-bold",
              playerBust ? "text-crimson" : displayPlayerTotal === 21 ? "text-gold" : "text-text"
            )}
          >
            {formatTotal(displayPlayerTotal)}
          </div>
        </div>

        {/* Player hand */}
        <div className="flex gap-2 flex-wrap min-h-[80px] items-end">
          {playerHand.map((card, i) => (
            <Card
              key={card.id}
              card={card}
              size="md"
              selectable={!!selectingCardFor}
              onClick={selectingCardFor ? () => handleCardSelect(i) : undefined}
              animDelay={i * 80}
            />
          ))}
        </div>

        {/* Peek info */}
        {peek && peek.cards.length > 0 && isPlayerTurn && (
          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
            <span className="text-xs text-text-dim">
              {peek.cards.length === 1 ? "Next card:" : "Top cards:"}
            </span>
            <div className="flex gap-1.5">
              {peek.cards.map((card) => (
                <Card key={card.id} card={card} size="sm" />
              ))}
            </div>
          </div>
        )}

        {/* HP bar */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-1 bg-surface-high rounded-full">
            <div
              className="hp-bar h-full rounded-full bg-emerald"
              style={{ width: `${Math.max(0, hpPct)}%` }}
            />
          </div>
          <span className="font-mono text-xs text-text-dim">
            {hp}/{maxHp} HP
          </span>
        </div>
      </div>

      {/* Abilities */}
      {abilities.length > 0 && isPlayerTurn && (
        <div className="flex flex-wrap gap-2">
          {abilities.map((ability) => {
            const ready = isAbilityReady(ability);
            const exhausted = ability.usesLeft !== undefined && ability.usesLeft <= 0;
            return (
              <div key={ability.id} className="tooltip">
                <button
                  onClick={() => handleAbilityClick(ability)}
                  disabled={!ready || exhausted}
                  className={cn(
                    "px-3 py-1.5 border rounded text-xs font-medium transition-all",
                    ready && !exhausted
                      ? "border-sapphire/60 text-sapphire hover:bg-sapphire/10"
                      : "border-border text-text-dim opacity-40 cursor-not-allowed"
                  )}
                >
                  {ability.name}
                  {!ready && !exhausted && (
                    <span className="ml-1.5 text-text-dim">
                      ({ability.currentCooldown})
                    </span>
                  )}
                </button>
                <div className="tooltip-content max-w-[200px] whitespace-normal">
                  {ability.description}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap">
        {isPlayerTurn && !selectingCardFor && (
          <>
            <button
              onClick={handleDrawCard}
              className="flex-1 min-w-[120px] py-3 bg-surface-high border border-border-light rounded-lg text-sm font-medium text-text hover:border-text-dim transition-all"
            >
              Draw Card
            </button>
            <button
              onClick={stand}
              className="flex-1 min-w-[120px] py-3 bg-gold text-bg rounded-lg text-sm font-semibold hover:bg-gold/90 transition-all"
            >
              Stand ({displayPlayerTotal})
            </button>
          </>
        )}

        {selectingCardFor && (
          <button
            onClick={() => setSelectingCardFor(null)}
            className="flex-1 py-3 bg-surface-high border border-border-light rounded-lg text-sm text-text-dim hover:border-text-dim transition-all"
          >
            Cancel
          </button>
        )}

        {isRoundOver && !isCombatOver && (
          <button
            onClick={continueAfterRound}
            className="flex-1 py-3 bg-surface-high border border-border-light rounded-lg text-sm font-medium text-text hover:border-text-dim transition-all"
          >
            Next Round
          </button>
        )}

        {isCombatOver && (
          <button
            onClick={continueAfterCombat}
            className={cn(
              "flex-1 py-3 rounded-lg text-sm font-semibold transition-all",
              enemyWon
                ? "bg-gold text-bg hover:bg-gold/90"
                : "bg-crimson text-white hover:bg-crimson/90"
            )}
          >
            {enemyWon ? "Continue" : "Defeated..."}
          </button>
        )}
      </div>

      {/* Combat log */}
      <div
        ref={logRef}
        className="combat-log bg-surface rounded-lg border border-border p-3 max-h-32 overflow-y-auto space-y-1"
      >
        {log.slice(-12).map((entry, i) => (
          <div
            key={i}
            className={cn(
              "text-xs leading-relaxed",
              entry.type === "damage_player"
                ? "text-crimson"
                : entry.type === "damage_enemy"
                ? "text-emerald"
                : entry.type === "special"
                ? "text-gold"
                : entry.type === "tie"
                ? "text-sapphire"
                : "text-text-dim"
            )}
          >
            {entry.message}
          </div>
        ))}
      </div>
    </div>
  );
}
