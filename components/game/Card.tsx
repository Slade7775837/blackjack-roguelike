"use client";

import { Card as CardType, Suit } from "@/lib/game/types";
import { SUIT_SYMBOLS, getCardColorClass } from "@/lib/game/deck";
import { cn } from "@/lib/utils";

interface CardProps {
  card: CardType;
  size?: "sm" | "md" | "lg";
  selectable?: boolean;
  selected?: boolean;
  onClick?: () => void;
  animDelay?: number;
  faceDown?: boolean;
}

const sizeClasses = {
  sm: "w-10 h-14 text-xs",
  md: "w-14 h-20 text-sm",
  lg: "w-16 h-24 text-base",
};

export default function Card({
  card,
  size = "md",
  selectable = false,
  selected = false,
  onClick,
  animDelay = 0,
  faceDown = false,
}: CardProps) {
  if (faceDown) {
    return (
      <div
        className={cn(
          "card-back deal-anim flex items-center justify-center",
          sizeClasses[size]
        )}
        style={{ animationDelay: `${animDelay}ms` }}
      >
        <div className="w-3/4 h-3/4 border border-blue-900/40 rounded-sm" />
      </div>
    );
  }

  const colorClass = getCardColorClass(card.suit);
  const suit = SUIT_SYMBOLS[card.suit];

  return (
    <div
      className={cn(
        "card-face deal-anim flex flex-col justify-between p-1",
        sizeClasses[size],
        selectable && "selectable",
        selected && "selected"
      )}
      style={{ animationDelay: `${animDelay}ms` }}
      onClick={onClick}
    >
      <div className={cn("font-mono font-bold leading-none", colorClass)}>
        <div>{card.rank}</div>
        <div className="text-xs leading-none">{suit}</div>
      </div>
      <div className={cn("self-end rotate-180 font-mono font-bold leading-none", colorClass)}>
        <div className="text-xs leading-none">{suit}</div>
        <div>{card.rank}</div>
      </div>
    </div>
  );
}

export function CardBack({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <div
      className={cn(
        "card-back deal-anim flex items-center justify-center",
        sizeClasses[size]
      )}
    >
      <div className="w-3/4 h-3/4 border border-blue-900/40 rounded-sm" />
    </div>
  );
}
