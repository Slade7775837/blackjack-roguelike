"use client";

import dynamic from "next/dynamic";
import { useGameStore } from "@/lib/game/store";
import PlayerHUD from "./PlayerHUD";
import CombatView from "./CombatView";
import MapView from "./MapView";
import EventView from "./EventView";
import ShopView from "./ShopView";
import RestView from "./RestView";
import FloorTransition from "./FloorTransition";
import { GameOverScreen, VictoryScreen } from "./EndScreens";

// MenuScreen uses localStorage via zustand — needs client only
const MenuScreen = dynamic(() => import("./MenuScreen"), { ssr: false });

export default function GameBoard() {
  const { phase } = useGameStore();

  if (phase === "menu") return <MenuScreen />;
  if (phase === "game_over") return <GameOverScreen />;
  if (phase === "victory") return <VictoryScreen />;
  if (phase === "floor_transition") return <FloorTransition />;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header HUD */}
      <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <PlayerHUD />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {phase === "combat" && <CombatView />}
          {phase === "map" && <MapView />}
          {phase === "event" && <EventView />}
          {phase === "shop" && <ShopView />}
          {phase === "rest" && <RestView />}
        </div>
      </main>
    </div>
  );
}
