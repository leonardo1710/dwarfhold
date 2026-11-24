import { advanceDay, appendActivity, jobLabel } from "../simulation";
import { completeCrafts, startCraft } from "../game/crafting";
import { equipItem, unequipItem } from "../game/equipment";
import { completeExpedition, failExpedition, startExpedition } from "../game/expeditions";
import type {
  Activity,
  ColonyState,
  CraftItem,
  Person,
  Equipment,
  ExpeditionResult,
  JobType,
} from "../types";

export type ColonyAction =
  | { type: "advanceDay" }
  | { type: "assignJob"; personId: string; job: JobType }
  | { type: "equip"; personId: string; item: Equipment }
  | { type: "unequip"; personId: string }
  | { type: "startCraft"; personId: string; item: CraftItem }
  | { type: "startExpedition"; personId: string; destination: string }
  | { type: "completeExpedition"; personId: string; result: ExpeditionResult }
  | { type: "failExpedition"; personId: string; message: string };

export const initialColony: ColonyState = {
  day: 12,
  resources: { wood: 14, stone: 9, food: 18, tools: 1, weapons: 0, panFlutes: 0 },
  people: [
    {
      id: "dwarf-1",
      name: "Bromli Copperkeg",
      title: "Hold Warden",
      icon: "🧔🏻",
      assignment: "mining",
      specialty: "mining",
      species: "dwarf",
      equipment: null,
      task: null,
    },
    {
      id: "dwarf-2",
      name: "Yrsa Flintbraid",
      title: "Trail Scout",
      icon: "🧔🏼‍♀️",
      assignment: "woodcutting",
      specialty: "woodcutting",
      species: "dwarf",
      equipment: null,
      task: null,
    },
    {
      id: "dwarf-3",
      name: "Dori Ashmantle",
      title: "Stone Singer",
      icon: "🧔🏽",
      assignment: null,
      species: "dwarf",
      equipment: null,
      task: null,
    },
  ],
  activities: [
    { id: 1, day: 12, message: "The forge fires are lit. Stonehome wakes." },
  ],
  hungry: false,
  newcomerJoined: false,
  lastRaid: null,
};

// A person with a task (expedition or forge) cannot take on anything else.
export function availablePerson(state: ColonyState, personId: string): Person | undefined {
  return state.people.find((person) => person.id === personId && person.task === null);
}

function updatePerson(state: ColonyState, personId: string, change: Partial<Person>): ColonyState {
  return {
    ...state,
    people: state.people.map((person) => (person.id === personId ? { ...person, ...change } : person)),
  };
}

// Newest entry first. The id continues from the newest entry, so it never repeats.
function record(state: ColonyState, message: string, tone?: Activity["tone"]): ColonyState {
  return { ...state, activities: appendActivity(state.activities, state.day, message, tone) };
}

export function colonyReducer(state: ColonyState, action: ColonyAction): ColonyState {
  switch (action.type) {
    case "advanceDay":
      return completeCrafts(advanceDay(state));

    case "assignJob": {
      const person = availablePerson(state, action.personId);
      if (!person) return state;
      return record(
        updatePerson(state, person.id, { assignment: action.job }),
        `${person.name} assigned to ${jobLabel(action.job)}.`,
      );
    }

    case "startExpedition":
      return startExpedition(state, action.personId, action.destination);

    case "completeExpedition":
      return completeExpedition(state, action.personId, action.result);

    case "failExpedition":
      return failExpedition(state, action.personId, action.message);

    // Filled in by D2.
    case "equip":
      return equipItem(state, action.personId, action.item);

    case "unequip":
      return unequipItem(state, action.personId);

    // Filled in by D3.
    case "startCraft":
      return startCraft(state, action.personId, action.item);
  }
}