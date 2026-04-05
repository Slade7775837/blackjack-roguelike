"use client";

import { useGameStore } from "@/lib/game/store";
import { MapNode, RoomType } from "@/lib/game/types";
import { getMapLayers, ROOM_ICONS, ROOM_LABELS, ROOM_COLORS } from "@/lib/game/map";
import { cn } from "@/lib/utils";

export default function MapView() {
  const { map, currentNodeId, availableNodes, navigateToNode, floor } =
    useGameStore();

  const layers = getMapLayers(map);

  return (
    <div className="flex flex-col gap-4 w-full max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-text">
          Floor {floor}
        </h2>
        <span className="text-xs text-text-dim uppercase tracking-widest">
          Choose your path
        </span>
      </div>

      {/* Map grid - render bottom to top */}
      <div className="flex flex-col gap-0">
        {[...layers].reverse().map((layer, reversedIdx) => {
          const layerIdx = layers.length - 1 - reversedIdx;
          return (
            <MapLayer
              key={layerIdx}
              nodes={layer}
              availableNodes={availableNodes}
              currentNodeId={currentNodeId}
              onNavigate={navigateToNode}
              allNodes={map}
              isTopLayer={layerIdx === layers.length - 1}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-border pt-4">
        {(["monster", "elite", "event", "shop", "rest", "boss"] as RoomType[]).map(
          (type) => (
            <div key={type} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "w-5 h-5 flex items-center justify-center border rounded text-xs font-mono",
                  ROOM_COLORS[type]
                )}
              >
                {ROOM_ICONS[type]}
              </span>
              <span className="text-xs text-text-dim">{ROOM_LABELS[type]}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

interface MapLayerProps {
  nodes: MapNode[];
  availableNodes: string[];
  currentNodeId: string | null;
  onNavigate: (id: string) => void;
  allNodes: MapNode[];
  isTopLayer: boolean;
}

function MapLayer({
  nodes,
  availableNodes,
  currentNodeId,
  onNavigate,
  allNodes,
  isTopLayer,
}: MapLayerProps) {
  return (
    <div className="flex flex-col items-center">
      {/* Connection lines */}
      {!isTopLayer && (
        <div className="flex justify-around w-full px-8 h-6">
          {nodes.map((node) =>
            node.connections.map((connId) => {
              const target = allNodes.find((n) => n.id === connId);
              if (!target) return null;
              return (
                <ConnectionLine
                  key={`${node.id}-${connId}`}
                  from={node}
                  to={target}
                  allNodes={allNodes}
                />
              );
            })
          )}
        </div>
      )}

      {/* Nodes */}
      <div
        className="flex gap-6 justify-center py-2"
        style={{ minWidth: 200 }}
      >
        {nodes.map((node) => (
          <MapNodeComponent
            key={node.id}
            node={node}
            isAvailable={availableNodes.includes(node.id)}
            isCurrent={currentNodeId === node.id}
            onClick={() => onNavigate(node.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ConnectionLine({
  from,
  to,
}: {
  from: MapNode;
  to: MapNode;
  allNodes: MapNode[];
}) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-px h-full bg-border" />
    </div>
  );
}

interface MapNodeProps {
  node: MapNode;
  isAvailable: boolean;
  isCurrent: boolean;
  onClick: () => void;
}

function MapNodeComponent({ node, isAvailable, isCurrent, onClick }: MapNodeProps) {
  const colorClass = ROOM_COLORS[node.type];

  return (
    <div className="tooltip flex flex-col items-center">
      <button
        onClick={isAvailable ? onClick : undefined}
        disabled={!isAvailable && !isCurrent}
        className={cn(
          "map-node w-10 h-10 border-2 rounded-lg flex items-center justify-center font-mono text-sm font-bold transition-all",
          colorClass,
          node.cleared
            ? "opacity-25 border-dashed cursor-default"
            : isCurrent
            ? "ring-2 ring-gold ring-offset-1 ring-offset-bg"
            : isAvailable
            ? "available cursor-pointer hover:ring-1 hover:ring-current hover:ring-offset-1 hover:ring-offset-bg"
            : "opacity-30 cursor-default"
        )}
      >
        {node.cleared ? "·" : ROOM_ICONS[node.type]}
      </button>
      {isAvailable && (
        <span className="text-xs text-text-dim mt-1">{ROOM_LABELS[node.type]}</span>
      )}
      <div className="tooltip-content">
        {ROOM_LABELS[node.type]}
      </div>
    </div>
  );
}
