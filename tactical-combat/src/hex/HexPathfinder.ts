import { hexKey, hexNeighbors, hexDistance, type Hex } from './HexCoord';
import { HexGrid } from './HexGrid';

interface PathNode {
  q: number;
  r: number;
  g: number;
  f: number;
  parent: string | null;
}

export function findPath(grid: HexGrid, start: Hex, end: Hex): Hex[] | null {
  if (!grid.isWalkable(end.q, end.r)) return null;

  const open = new Map<string, PathNode>();
  const closed = new Set<string>();
  const startKey = hexKey(start.q, start.r);

  open.set(startKey, {
    q: start.q, r: start.r,
    g: 0,
    f: hexDistance(start, end),
    parent: null,
  });

  while (open.size > 0) {
    let bestKey = '';
    let bestF = Infinity;
    for (const [key, node] of open) {
      if (node.f < bestF) {
        bestF = node.f;
        bestKey = key;
      }
    }

    const current = open.get(bestKey)!;
    if (current.q === end.q && current.r === end.r) {
      return reconstructPath(open, closed, current, startKey);
    }

    open.delete(bestKey);
    closed.add(bestKey);

    for (const neighbor of hexNeighbors(current.q, current.r)) {
      const nKey = hexKey(neighbor.q, neighbor.r);
      if (closed.has(nKey)) continue;
      if (!grid.isWalkable(neighbor.q, neighbor.r) && !(neighbor.q === end.q && neighbor.r === end.r)) continue;
      if (!grid.has(neighbor.q, neighbor.r)) continue;

      const g = current.g + 1;
      const existing = open.get(nKey);
      if (existing && g >= existing.g) continue;

      open.set(nKey, {
        q: neighbor.q, r: neighbor.r,
        g,
        f: g + hexDistance(neighbor, end),
        parent: bestKey,
      });
    }
  }

  return null;
}

function reconstructPath(
  open: Map<string, PathNode>,
  _closed: Set<string>,
  end: PathNode,
  startKey: string
): Hex[] {
  const allNodes = new Map<string, PathNode>(open);
  const path: Hex[] = [];
  let current: PathNode | undefined = end;
  const visited = new Set<string>();

  while (current) {
    const key = hexKey(current.q, current.r);
    if (visited.has(key)) break;
    visited.add(key);
    path.unshift({ q: current.q, r: current.r });
    if (key === startKey) break;
    if (current.parent) {
      current = allNodes.get(current.parent);
    } else {
      break;
    }
  }

  return path;
}

export function getReachable(grid: HexGrid, start: Hex, range: number): Map<string, number> {
  const reachable = new Map<string, number>();
  const queue: { q: number; r: number; cost: number }[] = [{ q: start.q, r: start.r, cost: 0 }];
  reachable.set(hexKey(start.q, start.r), 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.cost >= range) continue;

    for (const n of hexNeighbors(current.q, current.r)) {
      const key = hexKey(n.q, n.r);
      if (reachable.has(key)) continue;
      if (!grid.isWalkable(n.q, n.r)) continue;

      const cost = current.cost + 1;
      reachable.set(key, cost);
      queue.push({ q: n.q, r: n.r, cost });
    }
  }

  return reachable;
}
