import type { Activity, ColonyState, Person, PersonStatus, JobType, Resources } from "./types";

export const production: Record<Exclude<JobType, null>, Partial<Resources>> = {
  woodcutting: { wood: 3 }, mining: { stone: 2 }, farming: { food: 4 },
};

const jobResourceKey: Record<Exclude<JobType, null>, keyof Resources> = {
  woodcutting: "wood",
  mining: "stone",
  farming: "food",
};

const CHRONICLE_LIMIT = 16;

export function dailyProduction(state: Pick<ColonyState, "people" | "hungry">): Resources {
  const gained: Resources = { wood: 0, stone: 0, food: 0, tools: 0, weapons: 0, panFlutes: 0 };

  state.people.forEach((person) => {
    if (person.task !== null || !person.assignment) return;
    if (state.hungry && person.assignment !== "farming") return;

    const output = production[person.assignment];

    Object.entries(output).forEach(([resource, amount]) => {
      gained[resource as keyof Resources] += amount ?? 0;
    });

    if (person.equipment === "tool") {
      gained[jobResourceKey[person.assignment]] += 1;
    }

  });  

  return gained;
}

export function mealsNeeded(state: Pick<ColonyState, "people">): number {
  return state.people.filter((person) => person.task?.kind !== "expedition").length;
}

export function appendActivity(activities: Activity[], day: number, message: string, tone?: Activity["tone"]): Activity[] {
  const id = (activities[0]?.id ?? 0) + 1;
  return [{ id, day, message, tone }, ...activities].slice(0, CHRONICLE_LIMIT);
}

export function advanceDay(state: ColonyState): ColonyState {
  const nextDay = state.day + 1;
  const gained = dailyProduction(state);
  const resources: Resources = {
    wood: state.resources.wood + gained.wood,
    stone: state.resources.stone + gained.stone,
    food: state.resources.food + gained.food - mealsNeeded(state),
    tools: state.resources.tools + gained.tools,
    weapons: state.resources.weapons + gained.weapons,
    panFlutes: state.resources.panFlutes + gained.panFlutes,
  };

  const hungry = resources.food < 0;
  if (hungry) {
    resources.food = 0;
  }

  let activities = state.activities;
  if (hungry) {
    activities = appendActivity(
      activities,
      nextDay,
      "Food stores ran dry! The hold goes hungry: only farming produces tomorrow.",
      "warning",
    );
  } else if (state.hungry) {
    activities = appendActivity(
      activities,
      nextDay,
      "Everyone was fed. The hold recovers from hunger and full work resumes.",
      "good",
    );
  }

  return { ...state, day: nextDay, resources, hungry, activities };
}

export const jobLabel = (job: JobType) => job ? ({ 
  woodcutting: "Woodcutting", 
  mining: "Deep Mining", 
  farming: "Mushroom Farm" 
}[job]) : "Unassigned";

export const personStatus = (person: Person): PersonStatus =>
  person.task ? person.task.kind : person.assignment ? "working" : "idle";
