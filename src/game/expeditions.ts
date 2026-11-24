import { appendActivity } from "../simulation";
import type { ColonyState, ExpeditionResult, Person, ResourceKey, Task } from "../types";

export type Destination = {
  label: string;
  days: number;
};

export const DESTINATIONS: Record<string, Destination> = {
  "crystal-cave": { label: "Crystal Cave", days: 1 },
  "old-mine": { label: "The Old Mine", days: 2 },
  "blocked-pass": { label: "Blocked Pass", days: 1 },
};

export function traveller(state: ColonyState): Person | undefined {
  return state.people.find((person) => person.task?.kind === "expedition");
}

export function dueTraveller(state: ColonyState): Person | undefined {
  const person = traveller(state);
  const task = person?.task;
  if (!person || task?.kind !== "expedition" || task.returnOnDay > state.day) return undefined;
  return person;
}

export function expeditionBlocker(state: ColonyState, personId: string, destination: string): string | null {
  const place = DESTINATIONS[destination];
  if (!place) return "That destination is not on the hold map.";
  if (state.hungry) return "The hold is hungry. Nobody leaves until everyone is fed.";
  if (traveller(state)) return "An expedition is already under way.";

  const person = state.people.find((entry) => entry.id === personId);
  if (!person || person.task !== null) return "Choose someone who is free.";

  if (state.resources.food < place.days) {
    return `Needs ${place.days} ${place.days === 1 ? "ration" : "rations"} for the journey.`;
  }
  return null;
}

export function startExpedition(state: ColonyState, personId: string, destination: string): ColonyState {
  const place = DESTINATIONS[destination];
  const person = state.people.find((entry) => entry.id === personId);
  if (!place || !person || expeditionBlocker(state, personId, destination) !== null) return state;

  const task: Task = { kind: "expedition", destination, returnOnDay: state.day + place.days };
  return {
    ...state,
    resources: { ...state.resources, food: state.resources.food - place.days },
    people: state.people.map((entry) => (entry.id === person.id ? { ...entry, task } : entry)),
    activities: appendActivity(
      state.activities,
      state.day,
      `${person.name} departed for ${place.label} with ${place.days} ${place.days === 1 ? "ration" : "rations"}. Back on day ${task.returnOnDay}.`,
    ),
  };
}

export function completeExpedition(state: ColonyState, personId: string, result: ExpeditionResult): ColonyState {
  const person = dueTraveller(state);
  if (!person || person.id !== personId) return state;

  const resources = { ...state.resources };
  for (const key of Object.keys(resources) as ResourceKey[]) {
    const amount = result.rewards[key];
    if (typeof amount === "number" && Number.isFinite(amount)) resources[key] += amount;
  }

  return {
    ...state,
    resources,
    people: state.people.map((entry) => (entry.id === person.id ? { ...entry, task: null } : entry)),
    activities: appendActivity(state.activities, state.day, result.message, "good"),
  };
}

export function failExpedition(state: ColonyState, personId: string, message: string): ColonyState {
  const person = dueTraveller(state);
  if (!person || person.id !== personId) return state;

  return {
    ...state,
    people: state.people.map((entry) => (entry.id === person.id ? { ...entry, task: null } : entry)),
    activities: appendActivity(state.activities, state.day, message, "warning"),
  };
}
