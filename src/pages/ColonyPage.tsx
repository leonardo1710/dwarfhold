import { useState } from "react";
import { Chronicle } from "../components/Chronicle";
import { DwarfRoster } from "../components/DwarfRoster";
import { DESTINATIONS, expeditionBlocker, traveller } from "../game/expeditions";
import { dailyProduction, jobLabel, mealsNeeded } from "../simulation";
import { useColony } from "../state/ColonyContext";
import type { ResourceKey } from "../types";

export function ColonyPage() {
  const {
    colony,
    activities,
    assignPerson,
    sendExpedition,
    equipTool,
    unequipItem,
  } = useColony();
  const [destination, setDestination] = useState("crystal-cave");
  const [expeditionPerson, setExpeditionPerson] = useState(colony.people[0]?.id ?? "");
  const blocker = expeditionBlocker(colony, expeditionPerson, destination);
  const away = traveller(colony);
  const journey = away?.task?.kind === "expedition" ? away.task : null;
  const days = DESTINATIONS[destination]?.days ?? 0;

  const gained = dailyProduction(colony);
  const netFood = gained.food - mealsNeeded(colony);

  const jobGainKey: Record<"woodcutting" | "mining" | "farming", ResourceKey> = {
    woodcutting: "wood",
    mining: "stone",
    farming: "food",
  };

  return (
    <div className="dashboard">
      <DwarfRoster
        people={colony.people}
        onAssign={assignPerson}
        availableTools={colony.resources.tools}
        onEquipTool={equipTool}
        onUnequip={unequipItem}
      />

      <section className="center-stack">
        <section className="panel production">
          <header>
            <div>
              <small>SHIFT LEDGER</small>
              <h2>Daily Production</h2>
            </div>
            <span>updates each day</span>
          </header>

          {colony.hungry && (
            <div className="net-line">
              <span className="loss">
                THE HOLD IS HUNGRY: ONLY FARMING PRODUCES AND NO EXPEDITION
                LEAVES UNTIL A DAY ENDS WITH EVERYONE FED
              </span>
            </div>
          )}

          <div className="job-grid">
            {(["woodcutting", "mining", "farming"] as const).map((job) => (
              <article key={job}>
                <b>
                  {job === "woodcutting"
                    ? "🌲"
                    : job === "mining"
                      ? "⛏️"
                      : "🍄"}
                </b>
                <h3>{jobLabel(job)}</h3>
                <p>
                  {
                    colony.people.filter(
                      (person) => person.assignment === job && person.task === null,
                    ).length
                  }{" "}
                  working
                </p>
                <strong>+{gained[jobGainKey[job]]} / day</strong>
              </article>
            ))}
          </div>

          <div className="net-line">
            <span>NET FOOD AFTER MEALS</span>
            <strong className={netFood >= 0 ? "gain" : "loss"}>
              {netFood >= 0 ? "+" : ""}
              {netFood}
            </strong>
          </div>
        </section>
      </section>

      <aside className="side-stack">
        <section className="panel expedition">
          <header>
            <div>
              <small>BEYOND THE GATE</small>
              <h2>Expedition</h2>
            </div>
            <b>🗺️</b>
          </header>

          <label>
            Scout
            <select
              value={expeditionPerson}
              onChange={(event) => setExpeditionPerson(event.target.value)}
            >
              {colony.people.map((person) => (
                <option key={person.id} value={person.id} disabled={person.task !== null}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Destination
            <select
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
            >
              {Object.entries(DESTINATIONS).map(([id, place]) => (
                <option key={id} value={id}>
                  {place.label} ({place.days} {place.days === 1 ? "day" : "days"})
                </option>
              ))}
            </select>
          </label>

          <button
            disabled={blocker !== null}
            onClick={() => sendExpedition(expeditionPerson, destination)}
          >
            {away ? "Beyond the gate…" : "Send expedition"}
          </button>
          <p>
            {away && journey
              ? `${away.name} is away at ${DESTINATIONS[journey.destination]?.label}. Back on day ${journey.returnOnDay}.`
              : blocker ?? `The journey takes ${days} ${days === 1 ? "ration" : "rations"} from the stores at departure.`}
          </p>
          <p>
            A traveller keeps an equipped tool and cannot work, forge or be
            reassigned until home.
          </p>
        </section>

        <Chronicle activities={activities} />
      </aside>
    </div>
  );
}