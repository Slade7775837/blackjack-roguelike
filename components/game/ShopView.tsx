"use client";

import { useGameStore } from "@/lib/game/store";
import { Relic, Ability } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export default function ShopView() {
  const { shop, gold, buyItem, leaveShop } = useGameStore();

  if (!shop) return null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg mx-auto fade-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-emerald/60 rounded flex items-center justify-center text-emerald font-mono font-bold text-sm">
            $
          </div>
          <span className="text-xs text-text-dim uppercase tracking-widest">Shop</span>
        </div>
        <span className="font-mono text-gold text-sm">
          {gold} gold
        </span>
      </div>

      <div className="grid gap-3">
        {shop.items.map((item, i) => {
          const canAfford = gold >= item.cost;
          const sold = item.sold;

          let name = "";
          let description = "";
          let typeLabel = "";
          let tierColor = "border-border-light";

          if (item.type === "relic" && item.item) {
            const r = item.item as Relic;
            name = r.name;
            description = r.description;
            typeLabel = `Relic · ${r.tier}`;
            tierColor =
              r.tier === "rare"
                ? "border-gold/50"
                : r.tier === "uncommon"
                ? "border-sapphire/50"
                : "border-border-light";
          } else if (item.type === "ability" && item.item) {
            const a = item.item as Ability;
            name = a.name;
            description = a.description;
            typeLabel = "Ability";
            tierColor = "border-sapphire/40";
          } else if (item.type === "heal") {
            name = "Rest & Recover";
            description = "Restore 20 HP immediately.";
            typeLabel = "Heal";
            tierColor = "border-emerald/40";
          }

          return (
            <div
              key={i}
              className={cn(
                "border rounded-xl p-4 transition-all",
                sold
                  ? "border-border opacity-30"
                  : tierColor
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-text-dim">{typeLabel}</span>
                  </div>
                  <h3 className="font-medium text-text text-sm">{name}</h3>
                  <p className="text-xs text-text-dim mt-1 leading-relaxed">
                    {description}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    className={cn(
                      "font-mono text-sm font-medium",
                      sold
                        ? "text-text-dim line-through"
                        : canAfford
                        ? "text-gold"
                        : "text-crimson"
                    )}
                  >
                    {item.cost}g
                  </span>
                  {!sold && (
                    <button
                      onClick={() => buyItem(i)}
                      disabled={!canAfford}
                      className={cn(
                        "px-3 py-1.5 rounded text-xs font-medium transition-all",
                        canAfford
                          ? "bg-gold text-bg hover:bg-gold/90"
                          : "bg-surface-high text-text-dim cursor-not-allowed"
                      )}
                    >
                      {canAfford ? "Buy" : "Broke"}
                    </button>
                  )}
                  {sold && (
                    <span className="text-xs text-text-dim">Sold</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={leaveShop}
        className="w-full py-3 border border-border-light rounded-lg text-sm text-text-dim hover:text-text hover:border-text-dim transition-all"
      >
        Leave Shop
      </button>
    </div>
  );
}
