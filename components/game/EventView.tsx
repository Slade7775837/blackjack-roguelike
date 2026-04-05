"use client";

import { useGameStore } from "@/lib/game/store";
import { cn } from "@/lib/utils";

export default function EventView() {
  const { currentEvent, gold, hp, selectEventOption } = useGameStore();

  if (!currentEvent) return null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg mx-auto fade-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 border border-sapphire/60 rounded flex items-center justify-center text-sapphire font-mono font-bold text-sm">
          ?
        </div>
        <span className="text-xs text-text-dim uppercase tracking-widest">Event</span>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="font-display text-2xl font-semibold text-text mb-3">
          {currentEvent.title}
        </h2>
        <p className="text-text-dim text-sm leading-relaxed">
          {currentEvent.description}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {currentEvent.options.map((option, i) => {
          const disabled =
            (option.requireGold !== undefined && gold < option.requireGold) ||
            (option.requireHpAbove !== undefined && hp <= option.requireHpAbove);

          return (
            <div key={i} className="tooltip">
              <button
                onClick={() => !disabled && selectEventOption(i)}
                disabled={disabled}
                className={cn(
                  "w-full text-left px-4 py-3.5 border rounded-lg transition-all group",
                  disabled
                    ? "border-border text-text-dim opacity-40 cursor-not-allowed"
                    : "border-border-light text-text hover:border-text-dim hover:bg-surface-high"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm leading-relaxed">{option.text}</span>
                  {option.requireGold && (
                    <span
                      className={cn(
                        "text-xs font-mono shrink-0 mt-0.5",
                        gold < option.requireGold
                          ? "text-crimson"
                          : "text-gold"
                      )}
                    >
                      {gold < option.requireGold
                        ? `Need ${option.requireGold}g`
                        : `${option.requireGold}g`}
                    </span>
                  )}
                </div>
              </button>
              {option.tooltip && (
                <div className="tooltip-content">{option.tooltip}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
