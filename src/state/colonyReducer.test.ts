import { describe, expect, it } from "vitest";
import { colonyReducer, initialColony, type ColonyAction } from "./colonyReducer";

const depart: ColonyAction = { type: "startExpedition", personId: "dwarf-3", destination: "crystal-cave" };

describe("colony reducer", () => {
  it("does not reassign a person who is away", () => {
    const away = colonyReducer(initialColony, depart);
    expect(colonyReducer(away, { type: "assignJob", personId: "dwarf-3", job: "mining" })).toBe(away);
  });

  it("keeps the chronicle at 16 entries with unique ids", () => {
    let state = initialColony;
    for (let i = 0; i < 20; i++) {
      state = colonyReducer(state, { type: "assignJob", personId: "dwarf-3", job: i % 2 ? "mining" : "farming" });
    }
    expect(state.activities).toHaveLength(16);
    expect(new Set(state.activities.map((activity) => activity.id)).size).toBe(16);
  });

  it("does not mutate the previous state and is deterministic", () => {
    const before = structuredClone(initialColony);
    expect(colonyReducer(initialColony, depart)).toEqual(colonyReducer(initialColony, depart));
    expect(initialColony).toEqual(before);
  });
});
