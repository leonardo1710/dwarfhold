import { describe, expect, it } from "vitest";
import { completeExpedition, dueTraveller, expeditionBlocker, failExpedition, startExpedition } from "./expeditions";
import { colonyReducer } from "../state/colonyReducer";
import type { ColonyState, ExpeditionResult, Person } from "../types";

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
  resources: { wood: 0, stone: 0, food: 10, tools: 0, weapons: 0, panFlutes: 0 },
  people: [person("d1"), person("d2", { assignment: null })],
  activities: [],
  hungry: false,
  newcomerJoined: false,
  lastRaid: null,
  ...overrides,
});

const found: ExpeditionResult = {
  expeditionId: "exp-1",
  status: "completed",
  rewards: { stone: 12, wood: 2 },
  message: "Found a seam.",
};

const nextDay = (state: ColonyState): ColonyState => colonyReducer(state, { type: "advanceDay" });

describe("expeditions", () => {
  it("takes one ration per day of travel and sets the return day", () => {
    const away = startExpedition(makeState(), "d2", "old-mine");
    expect(away.resources.food).toBe(8);
    expect(away.people[1].task).toEqual({ kind: "expedition", destination: "old-mine", returnOnDay: 7 });
  });

  it("returns the state unchanged for every invalid departure", () => {
    const hungry = makeState({ hungry: true });
    const noFood = makeState({ resources: { wood: 0, stone: 0, food: 1, tools: 0, weapons: 0, panFlutes: 0 } });
    const forging = makeState({ people: [person("d1", { task: { kind: "forge", item: "tool", doneOnDay: 6 } })] });
    const away = startExpedition(makeState(), "d1", "crystal-cave");

    expect(startExpedition(hungry, "d1", "crystal-cave")).toBe(hungry);
    expect(startExpedition(noFood, "d1", "old-mine")).toBe(noFood);
    expect(startExpedition(forging, "d1", "crystal-cave")).toBe(forging);
    expect(startExpedition(away, "d1", "crystal-cave")).toBe(away);
    expect(startExpedition(away, "d2", "crystal-cave")).toBe(away);
    expect(startExpedition(makeState(), "d1", "nowhere")).toEqual(makeState());
  });

  it("names the reason a departure is refused", () => {
    expect(expeditionBlocker(makeState(), "d1", "crystal-cave")).toBeNull();
    expect(expeditionBlocker(makeState({ hungry: true }), "d1", "crystal-cave")).toContain("hungry");
    expect(expeditionBlocker(startExpedition(makeState(), "d1", "crystal-cave"), "d2", "old-mine")).toContain("under way");
  });

  it("does not feed or employ the traveller while away", () => {
    const away = startExpedition(makeState(), "d1", "old-mine");
    const day6 = nextDay(away);
    expect(day6.resources).toMatchObject({ stone: 0, food: 7 });
    expect(dueTraveller(day6)).toBeUndefined();
  });

  it("ignores a result that arrives before the return day", () => {
    const away = startExpedition(makeState(), "d1", "old-mine");
    expect(completeExpedition(away, "d1", found)).toBe(away);
    expect(failExpedition(away, "d1", "Rockfall.")).toBe(away);
  });

  it("applies the reward exactly once on the return day", () => {
    const due = nextDay(nextDay(startExpedition(makeState(), "d1", "old-mine")));
    expect(dueTraveller(due)?.id).toBe("d1");

    const home = completeExpedition(due, "d1", found);
    expect(home.resources).toMatchObject({ stone: 12, wood: 2 });
    expect(home.people[0].task).toBeNull();
    expect(completeExpedition(home, "d1", found)).toBe(home);
  });

  it("brings the traveller home without a reward when the request fails", () => {
    const due = nextDay(startExpedition(makeState(), "d1", "blocked-pass"));
    const home = failExpedition(due, "d1", "Rockfall.");
    expect(home.people[0].task).toBeNull();
    expect(home.resources).toEqual(due.resources);
    expect(home.activities[0]).toMatchObject({ message: "Rockfall.", tone: "warning" });
  });

  it("ignores reward keys and amounts it does not know", () => {
    const due = nextDay(startExpedition(makeState(), "d1", "crystal-cave"));
    const odd = { ...found, rewards: { stone: 3, gold: 5, wood: "many" } } as unknown as ExpeditionResult;
    const home = completeExpedition(due, "d1", odd);
    expect(home.resources).toEqual({ ...due.resources, stone: 3 });
  });
});
