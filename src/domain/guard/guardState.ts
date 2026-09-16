export type GuardStatus = "patrullar" | "investigar" | "perseguir";

export interface GuardPerceptionInput {
  readonly soundHeard: boolean;
  readonly visionVisible: boolean;
}

export interface GuardTransition {
  readonly from: GuardStatus;
  readonly to: GuardStatus;
  readonly reason: "sound" | "vision";
}

export interface GuardStateResult {
  readonly state: GuardStatus;
  readonly transition: GuardTransition | null;
}

const INITIAL_STATE: GuardStatus = "patrullar";

export function initialGuardState(): GuardStatus {
  return INITIAL_STATE;
}

export function computeGuardState(
  current: GuardStatus,
  input: GuardPerceptionInput,
): GuardStateResult {
  if (input.visionVisible) {
    if (current === "perseguir") {
      return { state: "perseguir", transition: null };
    }
    return {
      state: "perseguir",
      transition: { from: current, to: "perseguir", reason: "vision" },
    };
  }

  if (input.soundHeard) {
    if (current === "investigar") {
      return { state: "investigar", transition: null };
    }
    if (current === "perseguir") {
      return { state: "perseguir", transition: null };
    }
    return {
      state: "investigar",
      transition: { from: current, to: "investigar", reason: "sound" },
    };
  }

  return { state: current, transition: null };
}
