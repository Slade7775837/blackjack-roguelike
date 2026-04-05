"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/game/store";
import { cn } from "@/lib/utils";

export default function RestView() {
  const { rest, hp, maxHp, abilities } = useGameStore();
  const [cooldownTarget, setCooldownTarget] = useState<string | null>(null);

  const healAmount = Math.max(20, Math.floor(maxHp * 0.3));
  const healedAlready = hp === maxHp;

  function handleRest() {
    rest("heal");
  }

  function handleReduceCooldown() {
    if (!cooldownTarget) return;
    rest("reduce_cooldown", cooldownTarget);
  }

  const upgradableAbilities = abilities.filter((a) => a.cooldown > 1);

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg mx-auto fade-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 border border-text-dim/40 rounded flex items-center justify-center text-text-dim font-mono font-bold text-sm">
          R
        </div>
        <span className="text-xs text-text-dim uppercase tracking-widest">Rest Site</span>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6">
        <p className="text-text-dim text-sm leading-relaxed">
          A quiet corner. The noise of the casino fades. You can catch your
          breath — or sharpen your skills.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-1 bg-surface-high rounded-full">
            <div
              className="h-full rounded-full bg-emerald"
              style={{ width: `${(hp / maxHp) * 100}%` }}
            />
          </div>
          <span className="font-mono text-xs text-text-dim">
            {hp}/{maxHp} HP
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {/* Heal option */}
        <button
          onClick={handleRest}
          disabled={healedAlready}
          className={cn(
            "w-full text-left px-4 py-4 border rounded-xl transition-all",
            healedAlready
              ? "border-border opacity-40 cursor-not-allowed"
              : "border-border-light hover:border-emerald/60 hover:bg-surface-high"
          )}
        >
          <div className="font-medium text-sm text-text">Rest</div>
          <div className="text-xs text-text-dim mt-1">
            {healedAlready
              ? "You're already at full HP."
              : `Restore ${healAmount} HP (${Math.round((healAmount / maxHp) * 100)}% of max).`}
          </div>
        </button>

        {/* Reduce cooldown option */}
        {upgradableAbilities.length > 0 && (
          <div className="border border-border-light rounded-xl p-4">
            <div className="font-medium text-sm text-text mb-1">Sharpen Skills</div>
            <div className="text-xs text-text-dim mb-3">
              Permanently reduce one ability's cooldown by 1 round.
            </div>
            <div className="flex flex-col gap-2 mb-3">
              {upgradableAbilities.map((ability) => (
                <label
                  key={ability.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 border rounded-lg cursor-pointer transition-all",
                    cooldownTarget === ability.id
                      ? "border-sapphire/60 bg-sapphire/10"
                      : "border-border hover:border-border-light"
                  )}
                >
                  <input
                    type="radio"
                    name="cooldown-target"
                    value={ability.id}
                    checked={cooldownTarget === ability.id}
                    onChange={() => setCooldownTarget(ability.id)}
                    className="accent-sapphire"
                  />
                  <div>
                    <div className="text-sm text-text">{ability.name}</div>
                    <div className="text-xs text-text-dim">
                      Cooldown: {ability.cooldown} → {ability.cooldown - 1}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <button
              onClick={handleReduceCooldown}
              disabled={!cooldownTarget}
              className={cn(
                "w-full py-2 rounded-lg text-sm font-medium transition-all",
                cooldownTarget
                  ? "bg-sapphire/20 border border-sapphire/60 text-sapphire hover:bg-sapphire/30"
                  : "border border-border text-text-dim cursor-not-allowed opacity-40"
              )}
            >
              Confirm
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
