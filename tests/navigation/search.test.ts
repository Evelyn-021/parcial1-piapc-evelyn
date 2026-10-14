import { describe, expect, it } from "vitest";
import { createGridMap, isWalkable, type GridPoint } from "../../src/domain/model/grid";
import { findPathAStar, findPathBfs } from "../../src/domain/navigation/search";

const START: GridPoint = { x: 0, y: 0 };
const GOAL: GridPoint = { x: 4, y: 0 };
const DETOUR_MAP = createGridMap(5, 5, [
  { x: 2, y: 0 },
  { x: 2, y: 1 },
  { x: 2, y: 2 },
  { x: 2, y: 3 },
]);

// Common 5x3 fixture from the guided practice
const COMMON_START: GridPoint = { x: 0, y: 1 };
const COMMON_GOAL: GridPoint = { x: 4, y: 1 };
const COMMON_FREE_MAP = createGridMap(5, 3, []);
const COMMON_BLOCKED_MAP = createGridMap(5, 3, [
  { x: 2, y: 0 },
  { x: 2, y: 1 },
  { x: 2, y: 2 },
]);

describe.each([
  ["BFS", findPathBfs],
  ["A*", findPathAStar],
] as const)("%s", (_name, findPath) => {
  it("finds an optimal walkable route", () => {
    const result = findPath(DETOUR_MAP, START, GOAL);

    expect(result.status).toBe("success");
    expect(result.totalCost).toBe(12);
    expect(result.path[0]).toEqual(START);
    expect(result.path.at(-1)).toEqual(GOAL);
    expect(result.path.every((point) => isWalkable(DETOUR_MAP, point))).toBe(true);
    expect(result.expandedNodes).toBeGreaterThan(0);
    expect(result.maximumFrontier).toBeGreaterThan(0);
  });

  it("returns a one-cell path when start equals goal", () => {
    const result = findPath(DETOUR_MAP, START, START);

    expect(result.status).toBe("success");
    expect(result.path).toEqual([START]);
    expect(result.totalCost).toBe(0);
    expect(result.explored).toEqual([START]);
    expect(result.expandedNodes).toBe(1);
    expect(result.maximumFrontier).toBe(1);
  });

  it("reports invalid endpoints without exploring", () => {
    const invalidStart = findPath(DETOUR_MAP, { x: -1, y: 0 }, GOAL);
    const invalidGoal = findPath(DETOUR_MAP, START, { x: 2, y: 0 });

    expect(invalidStart.status).toBe("invalid-start");
    expect(invalidGoal.status).toBe("invalid-goal");
    expect(invalidGoal.expandedNodes).toBe(0);
  });

  it("reports an unreachable goal explicitly", () => {
    const splitMap = createGridMap(3, 3, [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ]);
    const result = findPath(splitMap, { x: 0, y: 1 }, { x: 2, y: 1 });

    expect(result.status).toBe("unreachable");
    expect(result.path).toEqual([]);
    expect(result.totalCost).toBeNull();
    expect(result.expandedNodes).toBe(3);
    expect(result.maximumFrontier).toBe(2);
    expect(result.explored).toEqual([
      { x: 0, y: 1 },
      { x: 0, y: 0 },
      { x: 0, y: 2 },
    ]);
  });
});

describe("algorithm comparison", () => {
  it("A* preserves optimal cost while expanding no more nodes than BFS", () => {
    const bfs = findPathBfs(DETOUR_MAP, START, GOAL);
    const astar = findPathAStar(DETOUR_MAP, START, GOAL);

    expect(astar.totalCost).toBe(bfs.totalCost);
    expect(astar.expandedNodes).toBeLessThanOrEqual(bfs.expandedNodes);
  });
});

describe("common fixture 5x3 (BASE-02, BASE-03, BASE-04)", () => {
  describe.each([
    ["BFS", findPathBfs],
    ["A*", findPathAStar],
  ] as const)("%s on free 5x3 grid", (_name, findPath) => {
    it("finds 4-step path with cost 4 from (0,1) to (4,1)", () => {
      const result = findPath(COMMON_FREE_MAP, COMMON_START, COMMON_GOAL);

      expect(result.status).toBe("success");
      expect(result.path.length).toBe(5); // 5 points = 4 steps
      expect(result.path[0]).toEqual(COMMON_START);
      expect(result.path.at(-1)).toEqual(COMMON_GOAL);
      expect(result.totalCost).toBe(4); // path.length - 1 = 4
      expect(result.expandedNodes).toBeGreaterThan(0);
      expect(result.maximumFrontier).toBeGreaterThan(0);
    });

    it("reports expanded nodes and maximum frontier", () => {
      const result = findPath(COMMON_FREE_MAP, COMMON_START, COMMON_GOAL);

      // These metrics should be available per BASE-02
      expect(typeof result.expandedNodes).toBe("number");
      expect(result.expandedNodes).toBeGreaterThan(0);
      expect(typeof result.maximumFrontier).toBe("number");
      expect(result.maximumFrontier).toBeGreaterThan(0);
      expect(Array.isArray(result.explored)).toBe(true);
    });
  });

  describe("start equals goal", () => {
    it("BFS returns success with cost 0", () => {
      const result = findPathBfs(COMMON_FREE_MAP, COMMON_START, COMMON_START);

      expect(result.status).toBe("success");
      expect(result.path).toEqual([COMMON_START]);
      expect(result.totalCost).toBe(0);
      expect(result.expandedNodes).toBe(1);
    });

    it("A* returns success with cost 0", () => {
      const result = findPathAStar(COMMON_FREE_MAP, COMMON_START, COMMON_START);

      expect(result.status).toBe("success");
      expect(result.path).toEqual([COMMON_START]);
      expect(result.totalCost).toBe(0);
      expect(result.expandedNodes).toBe(1);
    });
  });

  describe("unreachable goal (barrier at x=2)", () => {
    it("BFS reports unreachable", () => {
      const result = findPathBfs(COMMON_BLOCKED_MAP, COMMON_START, COMMON_GOAL);

      expect(result.status).toBe("unreachable");
      expect(result.path).toEqual([]);
      expect(result.totalCost).toBeNull();
      expect(result.expandedNodes).toBeGreaterThan(0);
    });

    it("A* reports unreachable", () => {
      const result = findPathAStar(COMMON_BLOCKED_MAP, COMMON_START, COMMON_GOAL);

      expect(result.status).toBe("unreachable");
      expect(result.path).toEqual([]);
      expect(result.totalCost).toBeNull();
      expect(result.expandedNodes).toBeGreaterThan(0);
    });
  });

  describe("invalid endpoints", () => {
    it("BFS reports invalid-start for (-1,1)", () => {
      const result = findPathBfs(COMMON_FREE_MAP, { x: -1, y: 1 }, COMMON_GOAL);

      expect(result.status).toBe("invalid-start");
      expect(result.expandedNodes).toBe(0);
    });

    it("BFS reports invalid-goal for (5,1)", () => {
      const result = findPathBfs(COMMON_FREE_MAP, COMMON_START, { x: 5, y: 1 });

      expect(result.status).toBe("invalid-goal");
      expect(result.expandedNodes).toBe(0);
    });

    it("A* reports invalid-start for (-1,1)", () => {
      const result = findPathAStar(COMMON_FREE_MAP, { x: -1, y: 1 }, COMMON_GOAL);

      expect(result.status).toBe("invalid-start");
      expect(result.expandedNodes).toBe(0);
    });

    it("A* reports invalid-goal for (5,1)", () => {
      const result = findPathAStar(COMMON_FREE_MAP, COMMON_START, { x: 5, y: 1 });

      expect(result.status).toBe("invalid-goal");
      expect(result.expandedNodes).toBe(0);
    });
  });

  describe("BFS vs A* comparison on free 5x3", () => {
    it("both find valid 4-step path with cost 4", () => {
      const bfs = findPathBfs(COMMON_FREE_MAP, COMMON_START, COMMON_GOAL);
      const astar = findPathAStar(COMMON_FREE_MAP, COMMON_START, COMMON_GOAL);

      expect(bfs.status).toBe("success");
      expect(astar.status).toBe("success");
      expect(bfs.path.length).toBe(5);
      expect(astar.path.length).toBe(5);
      expect(bfs.totalCost).toBe(4);
      expect(astar.totalCost).toBe(4);
    });

    it("A* expands no more nodes than BFS", () => {
      const bfs = findPathBfs(COMMON_FREE_MAP, COMMON_START, COMMON_GOAL);
      const astar = findPathAStar(COMMON_FREE_MAP, COMMON_START, COMMON_GOAL);

      expect(astar.expandedNodes).toBeLessThanOrEqual(bfs.expandedNodes);
    });
  });
});

// Variant A: terreno lento (A-AC1, A-AC2, A-AC3)
const SLOW_START: GridPoint = { x: 0, y: 1 };
const SLOW_GOAL: GridPoint = { x: 4, y: 1 };

// 5x3 grid with slow terrain (cost 5) at (1,1), (2,1), (3,1)
const SLOW_MAP = createGridMap(5, 3, [], [
  [{ x: 1, y: 1 }, 5],
  [{ x: 2, y: 1 }, 5],
  [{ x: 3, y: 1 }, 5],
]);

// Same grid with all costs = 1 (restored)
const RESTORED_MAP = createGridMap(5, 3, []);

describe("variant A: terreno lento (A-AC1, A-AC2, A-AC3)", () => {
  describe("A* weighted finds cheaper detour (A-AC1)", () => {
    it("returns 6-step path with cost 6 avoiding slow row", () => {
      const result = findPathAStar(SLOW_MAP, SLOW_START, SLOW_GOAL);

      expect(result.status).toBe("success");
      expect(result.path.length).toBe(7); // 7 points = 6 steps
      expect(result.path[0]).toEqual(SLOW_START);
      expect(result.path.at(-1)).toEqual(SLOW_GOAL);
      expect(result.totalCost).toBe(6);
    });

    it("detour goes around the slow row (either up or down)", () => {
      const result = findPathAStar(SLOW_MAP, SLOW_START, SLOW_GOAL);

      // Path should not go through (1,1), (2,1), (3,1) since they cost 5
      const middleRow = result.path.filter((p) => p.y === 1 && p.x >= 1 && p.x <= 3);
      expect(middleRow.length).toBe(0);
    });
  });

  describe("A* with uniform costs restores direct path (A-AC2)", () => {
    it("returns 4-step path with cost 4 when slow row restored to 1", () => {
      const result = findPathAStar(RESTORED_MAP, SLOW_START, SLOW_GOAL);

      expect(result.status).toBe("success");
      expect(result.path.length).toBe(5); // 5 points = 4 steps
      expect(result.path[0]).toEqual(SLOW_START);
      expect(result.path.at(-1)).toEqual(SLOW_GOAL);
      expect(result.totalCost).toBe(4);
    });

    it("direct path goes through (1,1), (2,1), (3,1)", () => {
      const result = findPathAStar(RESTORED_MAP, SLOW_START, SLOW_GOAL);

      const middleRow = result.path.filter((p) => p.y === 1 && p.x >= 1 && p.x <= 3);
      expect(middleRow.length).toBe(3); // (1,1), (2,1), (3,1)
    });
  });

  describe("BFS ignores weights (A-AC1, A-AC3)", () => {
    it("BFS on slow map returns 4-step direct path (ignores costs)", () => {
      const result = findPathBfs(SLOW_MAP, SLOW_START, SLOW_GOAL);

      expect(result.status).toBe("success");
      expect(result.path.length).toBe(5); // 5 points = 4 steps
      expect(result.path[0]).toEqual(SLOW_START);
      expect(result.path.at(-1)).toEqual(SLOW_GOAL);
      // BFS totalCost is steps (path.length - 1) = 4
      expect(result.totalCost).toBe(4);
    });

    it("BFS path goes through slow row", () => {
      const result = findPathBfs(SLOW_MAP, SLOW_START, SLOW_GOAL);

      const middleRow = result.path.filter((p) => p.y === 1 && p.x >= 1 && p.x <= 3);
      expect(middleRow.length).toBe(3); // (1,1), (2,1), (3,1)
    });
  });

  describe("direct route cost calculation", () => {
    it("direct route through slow row has cost 16 (5+5+5+1)", () => {
      // Manually compute cost of direct path: (0,1)->(1,1)[5]->(2,1)[5]->(3,1)[5]->(4,1)[1] = 16
      const directPath: GridPoint[] = [
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
        { x: 4, y: 1 },
      ];
      let cost = 0;
      for (let i = 1; i < directPath.length; i++) {
        const point = directPath[i];
        if (point) {
          cost += SLOW_MAP.cellCosts.get(`${point.x},${point.y}`) ?? 1;
        }
      }
      expect(cost).toBe(16);
    });
  });
});

// Integration tests for calculateRoute consumer (A-AC3)
import { calculateRoute } from "../../src/application/simulation/navigationDemo";

describe("calculateRoute integration (A-AC3)", () => {
  it("A* via calculateRoute finds cheaper detour with slow terrain", () => {
    const result = calculateRoute(SLOW_MAP, SLOW_START, SLOW_GOAL, "astar");

    expect(result.status).toBe("success");
    expect(result.algorithm).toBe("astar");
    expect(result.path.length).toBe(7); // 7 points = 6 steps
    expect(result.path[0]).toEqual(SLOW_START);
    expect(result.path.at(-1)).toEqual(SLOW_GOAL);
    expect(result.totalCost).toBe(6);
  });

  it("A* via calculateRoute restores direct path when costs uniform", () => {
    const result = calculateRoute(RESTORED_MAP, SLOW_START, SLOW_GOAL, "astar");

    expect(result.status).toBe("success");
    expect(result.algorithm).toBe("astar");
    expect(result.path.length).toBe(5); // 5 points = 4 steps
    expect(result.path[0]).toEqual(SLOW_START);
    expect(result.path.at(-1)).toEqual(SLOW_GOAL);
    expect(result.totalCost).toBe(4);
  });

  it("BFS via calculateRoute ignores weights (unitary behavior)", () => {
    const result = calculateRoute(SLOW_MAP, SLOW_START, SLOW_GOAL, "bfs");

    expect(result.status).toBe("success");
    expect(result.algorithm).toBe("bfs");
    expect(result.path.length).toBe(5); // 5 points = 4 steps
    expect(result.path[0]).toEqual(SLOW_START);
    expect(result.path.at(-1)).toEqual(SLOW_GOAL);
    expect(result.totalCost).toBe(4); // BFS uses steps = path.length - 1
  });
});
