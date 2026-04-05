"use client";

import { useGameStore } from "@/lib/game/store";
import { Relic, Ability } from "@/lib/game/types";
import { isAbilityReady } from "@/lib/game/abilities";
import { cn } from "@/lib/utils";

export default function PlayerHUD() {
  const { hp, maxHp, gold, floor, relics, abilities, score } = useGameStore();

  const hpPct = Math.round((hp / maxHp) * 100);
  const hpColor =
    hpPct > 60
      ? "bg-emerald"
      : hpPct > 30
      ? "bg-gold"
      : "bg-crimson";

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Top row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-6">
          {/* HP */}
          <div className="flex flex-col gap-1 min-w-[120px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-dim uppercase tracking-widest">HP</span>
              <span className="font-mono text-sm text-text">
                {hp}<span className="text-text-dim">/{maxHp}</span>
              </span>
            </div>
            <div className="h-1.5 bg-surface-high rounded-full overflow-hidden">
              <div
                className={cn("hp-bar h-full rounded-full", hpColor)}
                style={{ width: `${hpPct}%` }}
              />
            </div>
          </div>

          {/* Gold */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-dim uppercase tracking-widest">Gold</span>
            <span className="font-mono font-medium text-gold text-sm">{gold}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Floor */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-dim uppercase tracking-widest">Floor</span>
            <span className="font-mono text-sm text-text">{floor}/3</span>
          </div>

          {/* Score */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-dim uppercase tracking-widest">Score</span>
            <span className="font-mono text-sm text-gold">{score.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Relics row */}
      {relics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {relics.map((r) => (
            <RelicBadge key={r.id} relic={r} />
          ))}
        </div>
      )}

      {/* Abilities row */}
      {abilities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {abilities.map((a) => (
            <AbilityBadge key={a.id} ability={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function RelicBadge({ relic }: { relic: Relic }) {
  const borderColor =
    relic.tier === "rare"
      ? "border-gold/60 text-gold"
      : relic.tier === "uncommon"
      ? "border-sapphire/60 text-sapphire"
      : "border-border-light text-text-dim";

  return (
    <div className="tooltip">
      <div
        className={cn(
          "px-2 py-0.5 border rounded text-xs font-medium",
          borderColor
        )}
      >
        {relic.name}
      </div>
      <div className="tooltip-content max-w-xs whitespace-normal">
        <div className="font-semibold text-text mb-0.5">{relic.name}</div>
        <div className="text-text-dim">{relic.description}</div>
      </div>
    </div>
  );
}

function AbilityBadge({ ability }: { ability: Ability }) {
  const ready = isAbilityReady(ability);
  const exhausted = ability.usesLeft !== undefined && ability.usesLeft <= 0;

  return (
    <div className="tooltip">
      <div
        className={cn(
          "px-2 py-0.5 border rounded text-xs font-medium flex items-center gap-1.5",
          exhausted
            ? "border-border text-text-dim opacity-40"
            : ready
            ? "border-emerald/60 text-emerald"
            : "border-border text-text-dim"
        )}
      >
        <span>{ability.name}</span>
        {!ready && !exhausted && (
          <span className="font-mono text-text-dim text-xs">
            ({ability.currentCooldown})
          </span>
        )}
        {exhausted && <span className="text-text-dim text-xs">(used)</span>}
      </div>
      <div className="tooltip-content max-w-xs whitespace-normal">
        <div className="font-semibold text-text mb-0.5">{ability.name}</div>
        <div className="text-text-dim text-xs">{ability.description}</div>
        {!ready && !exhausted && (
          <div className="text-gold text-xs mt-1">
            Ready in {ability.currentCooldown} round(s)
          </div>
        )}
      </div>
    </div>
  );
}
