import type { Activity } from "../types";

export function Chronicle({ activities }: { activities: Activity[] }) {
  return (
    <section className="panel chronicle">
      <header>
        <div>
          <small>HOLD CHRONICLE</small>
          <h2>Recent activity</h2>
        </div>
      </header>

      <div className="chronicle-list">
        {activities.map((activity) => (
          <article className={activity.tone ?? ""} key={activity.id}>
            <span>DAY {activity.day}</span>
            <p>{activity.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
