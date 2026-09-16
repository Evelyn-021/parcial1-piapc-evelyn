import { describe, expect, it } from "vitest";
import { computeGuardState, initialGuardState } from "../../src/domain/guard/guardState";

describe("guard state", () => {
  it("starts in patrullar", () => {
    expect(initialGuardState()).toBe("patrullar");
  });

  it("patrullar to investigar with valid sound", () => {
    const result = computeGuardState("patrullar", {
      soundHeard: true,
      visionVisible: false,
    });

    expect(result.state).toBe("investigar");
    expect(result.transition).toEqual({
      from: "patrullar",
      to: "investigar",
      reason: "sound",
    });
  });

  it("patrullar to perseguir with valid vision", () => {
    const result = computeGuardState("patrullar", {
      soundHeard: false,
      visionVisible: true,
    });

    expect(result.state).toBe("perseguir");
    expect(result.transition).toEqual({
      from: "patrullar",
      to: "perseguir",
      reason: "vision",
    });
  });

  it("sound and vision at same time goes to perseguir", () => {
    const result = computeGuardState("patrullar", {
      soundHeard: true,
      visionVisible: true,
    });

    expect(result.state).toBe("perseguir");
    expect(result.transition).toEqual({
      from: "patrullar",
      to: "perseguir",
      reason: "vision",
    });
  });

  it("investigar to perseguir with valid vision", () => {
    const result = computeGuardState("investigar", {
      soundHeard: false,
      visionVisible: true,
    });

    expect(result.state).toBe("perseguir");
    expect(result.transition).toEqual({
      from: "investigar",
      to: "perseguir",
      reason: "vision",
    });
  });

  it("perseguir stays in perseguir with vision", () => {
    const result = computeGuardState("perseguir", {
      soundHeard: false,
      visionVisible: true,
    });

    expect(result.state).toBe("perseguir");
    expect(result.transition).toBeNull();
  });

  it("perseguir stays in perseguir with sound only", () => {
    const result = computeGuardState("perseguir", {
      soundHeard: true,
      visionVisible: false,
    });

    expect(result.state).toBe("perseguir");
    expect(result.transition).toBeNull();
  });

  it("investigar stays in investigar with sound only", () => {
    const result = computeGuardState("investigar", {
      soundHeard: true,
      visionVisible: false,
    });

    expect(result.state).toBe("investigar");
    expect(result.transition).toBeNull();
  });

  it("patrullar stays in patrullar with no perception", () => {
    const result = computeGuardState("patrullar", {
      soundHeard: false,
      visionVisible: false,
    });

    expect(result.state).toBe("patrullar");
    expect(result.transition).toBeNull();
  });
});
