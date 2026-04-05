import { MapNode, RoomType } from "./types";

/** Map: 6 layers (0-5), each with 2-3 columns. Layer 5 = boss. */

const LAYER_TEMPLATES: Record<number, RoomType[][]> = {
  // [floor][layer] = possible room types (randomized per column)
  // Floor 1
  1: [
    ["monster"],                         // layer 0: always monster
    ["monster", "event"],               // layer 1
    ["shop", "rest"],                   // layer 2
    ["monster", "monster"],             // layer 3
    ["elite", "event"],                 // layer 4
    ["boss"],                           // layer 5
  ],
  // Floor 2
  2: [
    ["monster"],
    ["monster", "event"],
    ["elite", "shop"],
    ["monster", "rest"],
    ["elite", "event"],
    ["boss"],
  ],
  // Floor 3
  3: [
    ["monster"],
    ["elite", "event"],
    ["shop", "rest"],
    ["elite", "monster"],
    ["elite", "monster"],
    ["boss"],
  ],
};

export function generateMap(floor: number): MapNode[] {
  const template = LAYER_TEMPLATES[floor] || LAYER_TEMPLATES[3];
  const nodes: MapNode[] = [];

  // Generate nodes for each layer
  for (let layer = 0; layer < template.length; layer++) {
    const layerTypes = template[layer];
    const numNodes = layerTypes.length;

    for (let col = 0; col < numNodes; col++) {
      const type = layerTypes[col];
      nodes.push({
        id: `l${layer}c${col}`,
        layer,
        column: col,
        type,
        cleared: false,
        connections: [],
      });
    }
  }

  // Generate connections: each node connects to 1-2 nodes in next layer
  for (let layer = 0; layer < template.length - 1; layer++) {
    const currentLayerNodes = nodes.filter((n) => n.layer === layer);
    const nextLayerNodes = nodes.filter((n) => n.layer === layer + 1);

    // Ensure every next-layer node is reachable
    // and every current-layer node has at least 1 connection
    currentLayerNodes.forEach((node, i) => {
      // Primary connection: same or nearest column
      const primaryIdx = Math.min(i, nextLayerNodes.length - 1);
      const primary = nextLayerNodes[primaryIdx];
      if (!node.connections.includes(primary.id)) {
        node.connections.push(primary.id);
      }

      // Secondary connection: if multi-node layers, sometimes add branch
      if (nextLayerNodes.length > 1 && Math.random() > 0.5) {
        const altIdx = primaryIdx === 0 ? 1 : 0;
        const alt = nextLayerNodes[altIdx];
        if (!node.connections.includes(alt.id)) {
          node.connections.push(alt.id);
        }
      }
    });

    // Ensure all next-layer nodes are reachable
    nextLayerNodes.forEach((nextNode) => {
      const hasConnection = currentLayerNodes.some((n) =>
        n.connections.includes(nextNode.id)
      );
      if (!hasConnection) {
        // Connect from random current node
        const randomCurrent =
          currentLayerNodes[Math.floor(Math.random() * currentLayerNodes.length)];
        if (!randomCurrent.connections.includes(nextNode.id)) {
          randomCurrent.connections.push(nextNode.id);
        }
      }
    });
  }

  return nodes;
}

export function getAvailableNodes(
  map: MapNode[],
  currentNodeId: string | null
): string[] {
  if (!currentNodeId) {
    // Start: layer 0 nodes
    return map.filter((n) => n.layer === 0).map((n) => n.id);
  }

  const current = map.find((n) => n.id === currentNodeId);
  if (!current) return [];

  return current.connections.filter((id) => {
    const node = map.find((n) => n.id === id);
    return node && !node.cleared;
  });
}

export function getNodeById(map: MapNode[], id: string): MapNode | null {
  return map.find((n) => n.id === id) || null;
}

export function markNodeCleared(map: MapNode[], id: string): MapNode[] {
  return map.map((n) => (n.id === id ? { ...n, cleared: true } : n));
}

export function isMapComplete(map: MapNode[]): boolean {
  return map.every((n) => n.cleared);
}

export function getMapLayers(map: MapNode[]): MapNode[][] {
  const maxLayer = Math.max(...map.map((n) => n.layer));
  const layers: MapNode[][] = [];
  for (let i = 0; i <= maxLayer; i++) {
    layers.push(map.filter((n) => n.layer === i).sort((a, b) => a.column - b.column));
  }
  return layers;
}

export const ROOM_ICONS: Record<RoomType, string> = {
  monster: "M",
  elite: "E",
  event: "?",
  shop: "$",
  rest: "R",
  boss: "B",
};

export const ROOM_LABELS: Record<RoomType, string> = {
  monster: "Combat",
  elite: "Elite",
  event: "Event",
  shop: "Shop",
  rest: "Rest Site",
  boss: "Boss",
};

export const ROOM_COLORS: Record<RoomType, string> = {
  monster: "border-border-light text-text",
  elite: "border-gold text-gold",
  event: "border-sapphire text-sapphire",
  shop: "border-emerald text-emerald",
  rest: "border-text-dim text-text-dim",
  boss: "border-crimson text-crimson",
};
