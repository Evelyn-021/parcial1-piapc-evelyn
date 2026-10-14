import { isWalkable, getCellCost, type GridMap, type GridPoint } from "../model/grid";

export interface WeightedNeighbor {
  readonly point: GridPoint;
  readonly cost: number;
}

const CARDINAL_DIRECTIONS: readonly GridPoint[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

export function walkableNeighbors(map: GridMap, point: GridPoint): WeightedNeighbor[] {
  const neighbors: WeightedNeighbor[] = [];

  for (const direction of CARDINAL_DIRECTIONS) {
    const candidate = {
      x: point.x + direction.x,
      y: point.y + direction.y,
    };
    if (isWalkable(map, candidate)) {
      neighbors.push({ point: candidate, cost: getCellCost(map, candidate) });
    }
  }

  return neighbors;
}

export function manhattanDistance(from: GridPoint, to: GridPoint): number {
  return Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
}
