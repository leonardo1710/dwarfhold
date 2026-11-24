import { appendActivity } from "../simulation";
import type { ColonyState, Equipment, Person } from "../types";

// circular > dry
function updatePerson(state: ColonyState, personId: string, change: Partial<Person>): ColonyState {
  return {
    ...state,
    people: state.people.map((person) => (person.id === personId ? { ...person, ...change } : person)),
  };
}

//no tools equipped/available (panel) state = unchanged
export function equipItem(state: ColonyState, personId: string, item: Equipment): ColonyState {
  if (item !== "tool") return state;
  if (state.resources.tools < 1) return state;

  //person missing/task/equipped (panel) state = unchanged
  const person = state.people.find((entry) => entry.id === personId);
  if (!person || person.task !== null || person.equipment !== null) return state;

  //-1 tool, equip
  const nextState = updatePerson(
    {
      ...state,
      resources: {
        ...state.resources,
        tools: state.resources.tools - 1,
      },
    },
    person.id,
    { equipment: "tool" },
  );

  return {
    ...nextState, //copy nextState as is, change only desired values
    activities: appendActivity(nextState.activities, state.day, `${person.name} equipped a tool.`, "good"),
  };
}

export function unequipItem(state: ColonyState, personId: string): ColonyState {
  const person = state.people.find((entry) => entry.id === personId);
  if (!person || person.task !== null || person.equipment === null) return state;

  const returnedResource = person.equipment === "tool" ? "tools" : "panFlutes";
  const nextState = updatePerson(
    {
      ...state,
      resources: {
        ...state.resources,
        [returnedResource]: state.resources[returnedResource] + 1,
      },
    },
    person.id,
    { equipment: null },
  );

  const itemLabel = person.equipment === "tool" ? "tool" : "pan flute";
  return {
    ...nextState,
    activities: appendActivity(
      nextState.activities,
      state.day,
      `${person.name} returned a ${itemLabel} to stores.`,
    ),
  };
}
