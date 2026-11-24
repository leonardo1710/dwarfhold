import { describe, expect, it } from "vitest";
import { completeCrafts, craftBlocker, startCraft } from "./crafting";
import { colonyReducer } from "../state/colonyReducer";
import type { ColonyState, Person } from "../types";

const person = (id: string, change: Partial<Person> = {}): Person => ({
  id,
  name: id,
  title: "",
  icon: "",
  assignment: "mining",
  species: "dwarf",
  equipment: null,
  task: null,
  ...change,
});

const makeState = (overrides: Partial<ColonyState> = {}): ColonyState => ({
  day: 5,
  resources: { wood: 10, stone: 10, food: 10, tools: 0, weapons: 0, panFlutes: 0 },
  people: [person("d1"), person("d2", { assignment: "woodcutting" })],
  activities: [],
  hungry: false,
  newcomerJoined: false,
  lastRaid: null,
  ...overrides,
});

describe("crafting as colony work", () => {
  it("takes the materials at the start and occupies the crafter", () => {
    const forging = startCraft(makeState(), "d1", "tool");
    expect(forging.resources).toMatchObject({ wood: 7, stone: 8, tools: 0 });
    expect(forging.people[0].task).toEqual({ kind: "forge", item: "tool", doneOnDay: 6 });
  });

  it("returns the state unchanged for every invalid attempt", () => {
    const poor = makeState({ resources: { wood: 2, stone: 10, food: 10, tools: 0, weapons: 0, panFlutes: 0 } });
    const hungry = makeState({ hungry: true });
    const away = makeState({ people: [person("d1", { task: { kind: "expedition", destination: "old-mine", returnOnDay: 7 } })] });
    const occupied = startCraft(makeState(), "d1", "tool");

    expect(startCraft(poor, "d1", "tool")).toBe(poor);
    expect(startCraft(hungry, "d1", "tool")).toBe(hungry);
    expect(startCraft(away, "d1", "tool")).toBe(away);
    expect(startCraft(occupied, "d2", "weapon")).toBe(occupied);
    expect(startCraft(makeState(), "nobody", "tool")).toEqual(makeState());
    expect(startCraft(makeState(), "d1", "panFlute")).toEqual(makeState());
  });

  it("names the reason an attempt is refused", () => {
    expect(craftBlocker(makeState(), "d1", "tool")).toBeNull();
    expect(craftBlocker(makeState({ hungry: true }), "d1", "tool")).toContain("hungry");
    expect(craftBlocker(startCraft(makeState(), "d1", "tool"), "d2", "tool")).toContain("occupied");
  });

  it("finishes a tool at the next day change and the crafter produces nothing meanwhile", () => {
    const forging = startCraft(makeState(), "d1", "tool");
    const next = colonyReducer(forging, { type: "advanceDay" });
    expect(next.day).toBe(6);
    expect(next.resources).toMatchObject({ wood: 10, stone: 8, tools: 1 });
    expect(next.people[0].task).toBeNull();
  });

  it("needs two day changes for a weapon", () => {
    const forging = startCraft(makeState(), "d1", "weapon");
    const day6 = colonyReducer(forging, { type: "advanceDay" });
    expect(day6.resources.weapons).toBe(0);
    expect(day6.people[0].task).not.toBeNull();

    const day7 = colonyReducer(day6, { type: "advanceDay" });
    expect(day7.resources.weapons).toBe(1);
    expect(day7.people[0].task).toBeNull();
  });

  it("does nothing before the task is due, does not mutate, and is deterministic", () => {
    const forging = startCraft(makeState(), "d1", "weapon");
    const snapshot = structuredClone(forging);
    expect(completeCrafts(forging)).toBe(forging);
    expect(completeCrafts(makeState())).toEqual(makeState());
    expect(startCraft(makeState(), "d1", "tool")).toEqual(startCraft(makeState(), "d1", "tool"));
    expect(forging).toEqual(snapshot);
  });
});
