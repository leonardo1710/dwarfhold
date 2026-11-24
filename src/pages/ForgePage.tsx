import { useState } from "react";
import { Chronicle } from "../components/Chronicle";
import { craftBlocker, forgeWorker, RECIPES } from "../game/crafting";
import { useColony } from "../state/ColonyContext";
import type { CraftItem } from "../types";

const icons: Partial<Record<CraftItem, string>> = {
  tool: "⚒️",
  weapon: "⚔️",
};

export function ForgePage() {
  const { colony, activities, startCraft } = useColony();
  const [crafterId, setCrafterId] = useState(colony.people[0]?.id ?? "");
  const worker = forgeWorker(colony);
  const task = worker?.task?.kind === "forge" ? worker.task : null;

  return (
    <div className="forge-layout">
      <div className="center-stack">
        <section className="panel forge">
          <div>
            <small>EMBER FORGE</small>
            <h2>
              {worker && task
                ? `${worker.name} is forging a ${RECIPES[task.item]?.label}`
                : "The forge is free"}
            </h2>
            <p>
              {task
                ? `Done on day ${task.doneOnDay}. Today is day ${colony.day}.`
                : "One task at a time. The crafter does no other work until it is done."}
            </p>
          </div>
          <label>
            Crafter
            <select
              value={crafterId}
              onChange={(event) => setCrafterId(event.target.value)}
            >
              {colony.people.map((person) => (
                <option key={person.id} value={person.id} disabled={person.task !== null}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>
        </section>

        {(Object.keys(RECIPES) as CraftItem[]).map((item) => {
          const recipe = RECIPES[item];
          if (!recipe) return null;
          const blocker = craftBlocker(colony, crafterId, item);

          return (
            <section className="panel forge" key={item}>
              <div>
                <small>EMBER FORGE</small>
                <h2>Craft a {recipe.label}</h2>
                <p>
                  Takes {recipe.days} {recipe.days === 1 ? "day" : "days"}.{" "}
                  {blocker ?? "Materials are taken at the start."}
                </p>
              </div>
              <div className="recipe">
                <span>{recipe.cost.wood} 🪵</span>
                <i>+</i>
                <span>{recipe.cost.stone} 🪨</span>
                <i>→</i>
                <span>1 {icons[item]}</span>
                <button
                  disabled={blocker !== null}
                  onClick={() => startCraft(crafterId, item)}
                >
                  Forge {recipe.label}
                </button>
              </div>
            </section>
          );
        })}
      </div>

      <Chronicle activities={activities} />
    </div>
  );
}
