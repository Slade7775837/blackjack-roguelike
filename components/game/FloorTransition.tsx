"use client";

import { useGameStore } from "@/lib/game/store";

export default function FloorTransitionScreen() {
  const { floor, continueToNextFloor, relics } = useGameStore();
  const hasBankroll = relics.some((r) => r.id === "bankroll");

  const FLOOR_DESCRIPTIONS: Record<number, { title: string; desc: string }> = {
    2: {
      title: "The Second Floor",
      desc: "The stakes rise. Enemies are tougher, and the rewards richer. Elites patrol more corridors.",
    },
    3: {
      title: "The Final Floor",
      desc: "The heart of the house. Only the boss stands between you and victory. You won't get another chance.",
    },
  };

  const nextFloor = floor + 1;
  const info = FLOOR_DESCRIPTIONS[nextFloor] || {
    title: `Floor ${nextFloor}`,
    desc: "Deeper into the house.",
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8 fade-slide-up">
      <div className="text-center max-w-sm">
        <div className="text-gold/60 text-xs uppercase tracking-[0.3em] font-medium mb-3">
          Floor {floor} Cleared
        </div>
        <h2 className="font-display text-4xl font-semibold text-text mb-3">
          {info.title}
        </h2>
        <p className="text-text-dim text-sm leading-relaxed">{info.desc}</p>

        {hasBankroll && (
          <div className="mt-4 px-4 py-2.5 border border-gold/30 rounded-lg text-xs text-gold">
            Bankroll: +20 gold from your relic.
          </div>
        )}
      </div>

      <button
        onClick={continueToNextFloor}
        className="px-8 py-3 bg-gold text-bg rounded-lg text-sm font-semibold hover:bg-gold/90 transition-all"
      >
        Descend
      </button>
    </div>
  );
}
