import { describe, expect, it } from "vitest";
import { equipItem, unequipItem } from "./equipment";
import { colonyReducer, initialColony } from "../state/colonyReducer";
import type { ColonyState } from "../types";

const makeState = (overrides: Partial<ColonyState> = {}): ColonyState => ({
  day: 1,
  resources: { wood: 10, stone: 10, food: 10, tools: 1, weapons: 0, panFlutes: 0 },
  people: [
    { id: "d1", name: "Brom", title: "", icon: "", assignment: "mining", species: "dwarf", equipment: null, task: null },
    { id: "d2", name: "Yrsa", title: "", icon: "", assignment: "woodcutting", species: "dwarf", equipment: null, task: null },
  ],
  activities: [],
  hungry: false,
  newcomerJoined: false,
  lastRaid: null,
  ...overrides,
});

describe("equipment and weapon recipe rules", () => {
  it("equips a tool and returns it while conserving total tools", () => {
    const start = makeState();
    const equipped = equipItem(start, "d1", "tool");
    expect(equipped.resources.tools).toBe(0);
    expect(equipped.people[0].equipment).toBe("tool");

    // Cannot equip a second item onto d1 or equip when store has 0 tools
    expect(equipItem(equipped, "d1", "tool")).toBe(equipped);
    expect(equipItem(equipped, "d2", "tool")).toBe(equipped);

    const returned = unequipItem(equipped, "d1");
    expect(returned.resources.tools).toBe(1);
    expect(returned.people[0].equipment).toBeNull();
    expect(unequipItem(returned, "d1")).toBe(returned);
  });

  it("does not equip a tool to someone with an active task", () => {
    const busy = makeState({
      people: [
        { id: "d1", name: "Brom", title: "", icon: "", assignment: "mining", species: "dwarf", equipment: null, task: { kind: "expedition", destination: "crystal-cave", returnOnDay: 2 } },
      ],
    });
    expect(equipItem(busy, "d1", "tool")).toBe(busy);
  });

  it("does not mutate previous state and is deterministic", () => {
    const start = makeState();
    const snapshot = structuredClone(start);
    expect(equipItem(start, "d1", "tool")).toEqual(equipItem(start, "d1", "tool"));
    expect(start).toEqual(snapshot);
  });

  it("keeps the tool with a traveller and only returns it once they are home", () => {
    const equipped = colonyReducer(initialColony, { type: "equip", personId: "dwarf-3", item: "tool" });
    const away = colonyReducer(equipped, { type: "startExpedition", personId: "dwarf-3", destination: "old-mine" });
    expect(away.resources.tools).toBe(0);
    expect(colonyReducer(away, { type: "unequip", personId: "dwarf-3" })).toBe(away);

    const due = colonyReducer(colonyReducer(away, { type: "advanceDay" }), { type: "advanceDay" });
    const home = colonyReducer(due, {
      type: "completeExpedition",
      personId: "dwarf-3",
      result: { expeditionId: "exp-1", status: "completed", rewards: { stone: 12, wood: 2 }, message: "Back." },
    });
    expect(home.resources.tools).toBe(0);
    expect(home.people.find((person) => person.id === "dwarf-3")?.equipment).toBe("tool");

    const returned = colonyReducer(home, { type: "unequip", personId: "dwarf-3" });
    expect(returned.resources.tools).toBe(1);
  });
});