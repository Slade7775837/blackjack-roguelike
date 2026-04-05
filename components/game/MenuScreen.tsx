"use client";

import { useState, useEffect, FormEvent } from "react";
import { useGameStore } from "@/lib/game/store";
import { LeaderboardEntry } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export default function MenuScreen() {
  const { startGame, playerName } = useGameStore();
  const [name, setName] = useState(playerName || "");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLb, setLoadingLb] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  async function fetchLeaderboard() {
    setLoadingLb(true);
    try {
      const res = await fetch("/api/scores");
      const data = await res.json();
      setLeaderboard(data.scores || []);
      setConfigured(data.configured);
    } catch {
      // offline / not configured
    } finally {
      setLoadingLb(false);
    }
  }

  function handleStart(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startGame(name.trim());
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8">
      {/* Title */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="h-px w-12 bg-gold/40" />
          <span className="text-gold/60 text-xs uppercase tracking-[0.3em] font-medium">
            Roguelike Card Game
          </span>
          <div className="h-px w-12 bg-gold/40" />
        </div>
        <h1 className="font-display text-6xl font-semibold text-text tracking-tight">
          21 Rogue
        </h1>
        <p className="mt-3 text-text-dim text-sm max-w-sm mx-auto leading-relaxed">
          A strategic roguelike built on the logic of Blackjack. Draw cards,
          manage risk, defeat enemies. The house doesn't always win.
        </p>
      </div>

      {/* Start form */}
      <form onSubmit={handleStart} className="flex flex-col gap-3 w-full max-w-xs">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name..."
          maxLength={30}
          className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text placeholder-text-dim text-sm focus:outline-none focus:border-gold/60 transition-colors"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className={cn(
            "py-3 rounded-lg font-semibold text-sm transition-all",
            name.trim()
              ? "bg-gold text-bg hover:bg-gold/90"
              : "bg-surface border border-border text-text-dim cursor-not-allowed"
          )}
        >
          Begin Run
        </button>
      </form>

      {/* How to play */}
      <div className="w-full max-w-xs">
        <div className="border border-border rounded-xl p-4 space-y-2.5">
          <h3 className="text-xs uppercase tracking-widest text-text-dim font-medium">
            How to Play
          </h3>
          <HowToItem label="Draw">Add a card to your hand. Risk going over 21.</HowToItem>
          <HowToItem label="Stand">Lock your total. Enemy reveals their hand.</HowToItem>
          <HowToItem label="Bust">Go over 21. Take damage based on how far.</HowToItem>
          <HowToItem label="Win">Higher total wins. Difference = damage dealt.</HowToItem>
          <HowToItem label="Tie">Both take minor damage. Beware the House.</HowToItem>
        </div>
      </div>

      {/* Leaderboard toggle */}
      {configured && (
        <div className="w-full max-w-xs">
          <button
            onClick={() => {
              setShowLeaderboard((v) => !v);
              if (!showLeaderboard) fetchLeaderboard();
            }}
            className="w-full text-xs text-text-dim hover:text-text transition-colors uppercase tracking-widest text-center"
          >
            {showLeaderboard ? "Hide Leaderboard" : "View Leaderboard"}
          </button>

          {showLeaderboard && (
            <div className="mt-4 border border-border rounded-xl overflow-hidden fade-slide-up">
              <div className="px-4 py-2.5 border-b border-border bg-surface-high">
                <span className="text-xs uppercase tracking-widest text-text-dim font-medium">
                  Global Leaderboard
                </span>
              </div>
              {loadingLb ? (
                <div className="p-6 text-center text-text-dim text-xs">
                  Loading...
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="p-6 text-center text-text-dim text-xs">
                  No scores yet. Be the first!
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {leaderboard.slice(0, 10).map((entry, i) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <span
                        className={cn(
                          "font-mono text-xs w-5 text-center",
                          i === 0
                            ? "text-gold"
                            : i === 1
                            ? "text-text-dim"
                            : i === 2
                            ? "text-text-dim/60"
                            : "text-border-light"
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm text-text flex-1 truncate">
                        {entry.player_name}
                      </span>
                      <div className="text-right">
                        <div className="font-mono text-sm text-gold">
                          {entry.score.toLocaleString()}
                        </div>
                        <div className="text-xs text-text-dim">
                          F{entry.floor_reached}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HowToItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-xs font-mono font-medium text-gold/80 shrink-0 mt-0.5 w-10">
        {label}
      </span>
      <span className="text-xs text-text-dim leading-relaxed">{children}</span>
    </div>
  );
}
