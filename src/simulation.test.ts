import { describe, expect, it } from "vitest";
import { advanceDay, dailyProduction } from "./simulation";
import type { ColonyState } from "./types";

const makeState = (overrides: Partial<ColonyState> = {}): ColonyState => ({
  day: 1,
  resources: { wood: 0, stone: 0, food: 5, tools: 0, weapons: 0, panFlutes: 0 },
  people: [
    { id: "d1", name: "Brom", title: "", icon: "", assignment: "woodcutting", species: "dwarf", equipment: null, task: null },
  ],
  activities: [],
  hungry: false,
  newcomerJoined: false,
  lastRaid: null,
  ...overrides,
});

describe("colony simulation", () => {
  it("produces assigned resources and feeds the company", () => {
    const state = makeState();
    expect(advanceDay(state)).toMatchObject({ day: 2, resources: { wood: 3, food: 4 }, hungry: false });
    expect(state.resources.wood).toBe(0);
  });

  it("does not produce local resources for a person on an expedition or forge task", () => {
    const state = makeState({
      people: [
        { id: "d1", name: "Brom", title: "", icon: "", assignment: "woodcutting", species: "dwarf", equipment: null, task: { kind: "expedition", destination: "crystal-cave", returnOnDay: 2 } },
        { id: "d2", name: "Yrsa", title: "", icon: "", assignment: "mining", species: "dwarf", equipment: null, task: { kind: "forge", item: "tool", doneOnDay: 3 } },
      ],
    });
    expect(dailyProduction(state)).toEqual({ wood: 0, stone: 0, food: 0, tools: 0, weapons: 0, panFlutes: 0 });
    expect(advanceDay(state)).toMatchObject({ resources: { wood: 0, stone: 0, food: 4 } });
  });

  it("enters hungry state when food cannot cover meals, restricts next day to farming, and recovers when fed", () => {
    const starving = makeState({
      resources: { wood: 0, stone: 0, food: 0, tools: 0, weapons: 0, panFlutes: 0 },
      people: [
        { id: "d1", name: "Brom", title: "", icon: "", assignment: "woodcutting", species: "dwarf", equipment: null, task: null },
        { id: "d2", name: "Yrsa", title: "", icon: "", assignment: null, species: "dwarf", equipment: null, task: null },
      ],
    });

    const day2 = advanceDay(starving);
    expect(day2.resources).toMatchObject({ wood: 3, food: 0 });
    expect(day2.hungry).toBe(true);
    expect(day2.activities[0]).toMatchObject({ day: 2, tone: "warning" });

    const fedDay2 = {
      ...day2,
      people: day2.people.map((person, index) => (index === 1 ? { ...person, assignment: "farming" as const } : person)),
    };
    const day3 = advanceDay(fedDay2);
    expect(day3.resources).toMatchObject({ wood: 3, food: 2 });
    expect(day3.hungry).toBe(false);
    expect(day3.activities[0]).toMatchObject({ day: 3, tone: "good" });
  });

  it("adds +1 production when a working resident equips a tool on a compatible job, respecting hunger", () => {
    const state = makeState({
      people: [
        { id: "d1", name: "Brom", title: "", icon: "", assignment: "woodcutting", species: "dwarf", equipment: "tool", task: null },
        { id: "d2", name: "Yrsa", title: "", icon: "", assignment: "mining", species: "dwarf", equipment: "tool", task: null },
      ],
    });
    expect(dailyProduction(state)).toMatchObject({ wood: 4, stone: 3, food: 0 });

    const hungryState = makeState({
      hungry: true,
      people: [
        { id: "d1", name: "Brom", title: "", icon: "", assignment: "woodcutting", species: "dwarf", equipment: "tool", task: null },
        { id: "d2", name: "Yrsa", title: "", icon: "", assignment: "farming", species: "dwarf", equipment: "tool", task: null },
      ],
    });
    expect(dailyProduction(hungryState)).toMatchObject({ wood: 0, stone: 0, food: 5 });
  });
  
});