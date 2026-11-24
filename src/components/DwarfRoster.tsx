import { personStatus, jobLabel } from "../simulation";
import type { Person, JobType } from "../types";

const jobs: Exclude<JobType, null>[] = [
  "woodcutting",
  "mining",
  "farming",
];

interface Props {
  people: Person[];
  onAssign: (id: string, job: JobType) => void;
  availableTools: number;
  onEquipTool: (id: string) => void;
  onUnequip: (id: string) => void;
}

export function DwarfRoster({ people, onAssign, availableTools, onEquipTool, onUnequip }: Props) {
  const presentPeople = people.filter(
    (person) => personStatus(person) !== "expedition",
  ).length;

  return (
    <section className="panel roster">
      <header>
        <div>
          <small>THE COMPANY</small>
          <h2>Holdfolk</h2>
        </div>
        <span>
          {presentPeople} / {people.length} present
        </span>
      </header>

      <div className="dwarf-list">
        {people.map((person) => {
          const status = personStatus(person);
          const isBusyWithTask = person.task !== null;
          const specialty = person.specialty
            ? `Skilled in ${jobLabel(person.specialty)}`
            : "Generalist";
          const equippedLabel =
            person.equipment === "tool"
              ? "Equipped: Tool"
              : person.equipment === "panFlute"
                ? "Equipped: Pan Flute"
                : "Equipped: None";

          return (
            <article
              className={isBusyWithTask ? "dwarf away" : "dwarf"}
              key={person.id}
            >
              <div className="portrait">
                {person.icon}
                <i className={status} />
              </div>

              <div className="dwarf-details">
                <h3>{person.name}</h3>
                <p>
                  {person.title} · {specialty}
                </p>
                <p>{equippedLabel}</p>

                <select
                  value={person.task ? "task" : person.assignment ?? ""}
                  disabled={isBusyWithTask}
                  onChange={(event) =>
                    onAssign(
                      person.id,
                      (event.target.value || null) as JobType,
                    )
                  }
                >
                  <option value="">Unassigned</option>
                  {person.task && (
                    <option value="task">
                      {person.task.kind === "forge"
                        ? `Forging until day ${person.task.doneOnDay}`
                        : `Away until day ${person.task.returnOnDay}`}
                    </option>
                  )}
                  {jobs.map((job) => (
                    <option value={job} key={job}>
                      {jobLabel(job)}
                    </option>
                  ))}
                </select>

                {person.equipment === null && (
                  <button
                    type="button"
                    disabled={isBusyWithTask || availableTools < 1}
                    onClick={() => onEquipTool(person.id)}
                  >
                    Equip tool
                  </button>
                )}
                {person.equipment !== null && (
                  <button
                    type="button"
                    disabled={isBusyWithTask}
                    onClick={() => onUnequip(person.id)}
                  >
                    Return {person.equipment === "tool" ? "tool" : "pan flute"}
                  </button>
                )}
              </div>

              <span className="status">{status}</span>
            </article>
          );
        })}
      </div>
    </section>
  );
}