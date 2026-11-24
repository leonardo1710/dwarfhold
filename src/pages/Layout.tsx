import { NavLink, Outlet } from "react-router";
import { ResourceBar } from "../components/ResourceBar";
import { forgeWorker } from "../game/crafting";
import { useColony } from "../state/ColonyContext";
import { DAY_MS } from "../state/ColonyProvider";

export function Layout() {
  const { colony, paused, togglePaused } = useColony();
  const worker = forgeWorker(colony);

  return (
    <main>
      <header className="masthead">
        <div className="brand">
          <b>⛏</b>
          <div>
            <small>THE DEEP REALMS OF</small>
            <h1>
              Dwarf<span>hold</span>
            </h1>
          </div>
        </div>

        <div className="hold-title">
          <small>COLONY</small>
          <strong>STONEHOME</strong>
          <span>Founded beneath Emberpeak</span>
        </div>

        <div className="day">
          <small>DEEP DAY</small>
          <strong>{colony.day}</strong>
          <button onClick={togglePaused}>
            {paused ? "Wake the hold" : "Pause"}
          </button>
        </div>
      </header>

      <nav className="main-nav" aria-label="Colony navigation">
        <NavLink to="/" end>
          Colony
        </NavLink>
        <NavLink to="/forge">Forge</NavLink>
      </nav>

      <ResourceBar resources={colony.resources} />
      <Outlet />

      <footer>
        <span>🔥 Forge: {worker ? `${worker.name} is forging` : "idle"}</span>
        <span>A deep day lasts {DAY_MS / 1000} seconds</span>
        <span>{paused ? "The hold is resting" : "⚙ Simulation active"}</span>
      </footer>
    </main>
  );
}
