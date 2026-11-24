import { appendActivity } from "../simulation";
import type { ColonyState, CraftItem, Person, ResourceKey, Task } from "../types";

export type Recipe = {
  label: string;
  cost: { wood: number; stone: number };
  days: number;
  store: ResourceKey;
};

export const RECIPES: Partial<Record<CraftItem, Recipe>> = {
  tool: { label: "tool", cost: { wood: 3, stone: 2 }, days: 1, store: "tools" },
  weapon: { label: "weapon", cost: { wood: 4, stone: 3 }, days: 2, store: "weapons" },
};

export function forgeWorker(state: ColonyState): Person | undefined {
  return state.people.find((person) => person.task?.kind === "forge");
}

export function craftBlocker(state: ColonyState, personId: string, item: CraftItem): string | null {
  const recipe = RECIPES[item];
  if (!recipe) return "The forge has no recipe for this.";
  if (state.hungry) return "The hold is hungry. The forge stays cold until everyone is fed.";
  if (forgeWorker(state)) return "The forge is occupied.";

  const person = state.people.find((entry) => entry.id === personId);
  if (!person || person.task !== null) return "Choose someone who is free.";

  const { wood, stone } = state.resources;
  if (wood < recipe.cost.wood || stone < recipe.cost.stone) {
    return `Needs ${recipe.cost.wood} timber and ${recipe.cost.stone} stone.`;
  }
  return null;
}

export function startCraft(state: ColonyState, personId: string, item: CraftItem): ColonyState {
  const recipe = RECIPES[item];
  const person = state.people.find((entry) => entry.id === personId);
  if (!recipe || !person || craftBlocker(state, personId, item) !== null) return state;

  const task: Task = { kind: "forge", item, doneOnDay: state.day + recipe.days };
  return {
    ...state,
    resources: {
      ...state.resources,
      wood: state.resources.wood - recipe.cost.wood,
      stone: state.resources.stone - recipe.cost.stone,
    },
    people: state.people.map((entry) => (entry.id === person.id ? { ...entry, task } : entry)),
    activities: appendActivity(
      state.activities,
      state.day,
      `${person.name} starts forging a ${recipe.label}. Done on day ${task.doneOnDay}.`,
    ),
  };
}

export function completeCrafts(state: ColonyState): ColonyState {
  const worker = forgeWorker(state);
  const task = worker?.task;
  if (!worker || task?.kind !== "forge" || task.doneOnDay > state.day) return state;

  const recipe = RECIPES[task.item];
  if (!recipe) return state;

  return {
    ...state,
    resources: { ...state.resources, [recipe.store]: state.resources[recipe.store] + 1 },
    people: state.people.map((entry) => (entry.id === worker.id ? { ...entry, task: null } : entry)),
    activities: appendActivity(state.activities, state.day, `${worker.name} finished forging a ${recipe.label}.`, "good"),
  };
}
