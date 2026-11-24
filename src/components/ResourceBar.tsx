import type { ResourceKey, Resources } from "../types";

const details: Partial<Record<ResourceKey, [string, string]>> = {
  wood: ["🪵", "Timber"],
  stone: ["🪨", "Stone"],
  food: ["🍄", "Rations"],
  tools: ["⚒️", "Tools"],
  weapons: ["⚔️", "Weapons"],
};

export function ResourceBar({ resources }: { resources: Resources }) {
  return (
    <section className="resource-bar">
      {Object.entries(resources).map(([key, value]) => {
        const detail = details[key as ResourceKey];
        if (!detail) return null;
        const [icon, label] = detail;

        return (
          <article key={key}>
            <span>{icon}</span>
            <div>
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          </article>
        );
      })}
    </section>
  );
}
