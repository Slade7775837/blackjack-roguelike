"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game/store";
import { cn } from "@/lib/utils";

export function GameOverScreen() {
  const { score, stats, floor, playerName, returnToMenu } = useGameStore();
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    submitScore();
  }, []);

  async function submitScore() {
    if (submitted) return;
    try {
      await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_name: playerName,
          score,
          floor_reached: floor,
          enemies_defeated: stats.enemiesDefeated,
        }),
      });
      setSubmitted(true);
    } catch {
      // offline
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8 fade-slide-up">
      <div className="text-center">
        <div className="text-crimson/60 text-xs uppercase tracking-[0.3em] font-medium mb-3">
          Game Over
        </div>
        <h1 className="font-display text-5xl font-semibold text-text">
          The House Wins
        </h1>
        <p className="mt-2 text-text-dim text-sm">
          Better luck next time, {playerName}.
        </p>
      </div>

      <div className="w-full max-w-xs">
        <div className="text-center mb-4">
          <div className="text-xs text-text-dim uppercase tracking-widest mb-1">
            Final Score
          </div>
          <div className="font-display text-5xl font-semibold text-gold">
            {score.toLocaleString()}
          </div>
        </div>

        <div className="border border-border rounded-xl divide-y divide-border">
          <StatRow label="Floor Reached" value={`${floor} / 3`} />
          <StatRow label="Enemies Defeated" value={stats.enemiesDefeated} />
          <StatRow label="Elites Defeated" value={stats.elitesDefeated} />
          <StatRow label="Rounds Played" value={stats.roundsPlayed} />
          <StatRow label="Gold Earned" value={stats.goldEarned} />
          <StatRow label="Relics Found" value={stats.relicsFound} />
          <StatRow label="Abilities Found" value={stats.abilitiesFound} />
        </div>
      </div>

      <button
        onClick={returnToMenu}
        className="px-8 py-3 bg-surface border border-border-light rounded-lg text-sm font-medium text-text hover:border-text-dim transition-all"
      >
        Return to Menu
      </button>
    </div>
  );
}

export function VictoryScreen() {
  const { score, stats, playerName, returnToMenu } = useGameStore();
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    submitScore();
  }, []);

  async function submitScore() {
    if (submitted) return;
    try {
      await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_name: playerName,
          score,
          floor_reached: 3,
          enemies_defeated: stats.enemiesDefeated,
        }),
      });
      setSubmitted(true);
    } catch {}
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8 fade-slide-up">
      <div className="text-center">
        <div className="text-gold/60 text-xs uppercase tracking-[0.3em] font-medium mb-3">
          Victory
        </div>
        <h1 className="font-display text-5xl font-semibold text-text">
          You Beat the House
        </h1>
        <p className="mt-2 text-text-dim text-sm">
          Against all odds, {playerName}. Well played.
        </p>
      </div>

      <div className="w-full max-w-xs">
        <div className="text-center mb-4">
          <div className="text-xs text-text-dim uppercase tracking-widest mb-1">
            Final Score
          </div>
          <div className="font-display text-5xl font-semibold text-gold">
            {score.toLocaleString()}
          </div>
        </div>

        <div className="border border-gold/20 rounded-xl divide-y divide-border">
          <StatRow label="All Floors Cleared" value="3 / 3" highlight />
          <StatRow label="Enemies Defeated" value={stats.enemiesDefeated} />
          <StatRow label="Elites Defeated" value={stats.elitesDefeated} />
          <StatRow label="Bosses Defeated" value={stats.bossesDefeated} />
          <StatRow label="Rounds Played" value={stats.roundsPlayed} />
          <StatRow label="Gold Earned" value={stats.goldEarned} />
          <StatRow label="Relics Found" value={stats.relicsFound} />
        </div>
      </div>

      <button
        onClick={returnToMenu}
        className="px-8 py-3 bg-gold text-bg rounded-lg text-sm font-semibold hover:bg-gold/90 transition-all"
      >
        Play Again
      </button>
    </div>
  );
}

function StatRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-xs text-text-dim">{label}</span>
      <span
        className={cn(
          "font-mono text-sm",
          highlight ? "text-gold" : "text-text"
        )}
      >
        {value}
      </span>
    </div>
  );
}
