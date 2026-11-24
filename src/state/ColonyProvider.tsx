import { useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { beginExpedition } from "../api";
import { ColonyContext } from "./ColonyContext";
import { colonyReducer, initialColony } from "./colonyReducer";
import { dueTraveller } from "../game/expeditions";
import type { CraftItem, JobType } from "../types";

export const DAY_MS = 10_000;

export function ColonyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(colonyReducer, initialColony);
  const [paused, setPaused] = useState(false);
  const requestRef = useRef(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => dispatch({ type: "advanceDay" }), DAY_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  useEffect(() => {
    const person = dueTraveller(state);
    if (!person || person.task?.kind !== "expedition" || requestRef.current) return;
    requestRef.current = true;
    const personId = person.id;
    const destination = person.task.destination;

    const report = async (): Promise<void> => {
      try {
        const result = await beginExpedition(personId, destination);
        dispatch({ type: "completeExpedition", personId, result });
      } catch (error) {
        const message = error instanceof Error ? error.message : "The expedition did not return.";
        dispatch({ type: "failExpedition", personId, message });
      } finally {
        requestRef.current = false;
      }
    };
    void report();
  }, [state]);

  const togglePaused = () => setPaused((wasPaused) => !wasPaused);
  const assignPerson = (personId: string, job: JobType) => dispatch({ type: "assignJob", personId, job });
  const startCraft = (personId: string, item: CraftItem) => dispatch({ type: "startCraft", personId, item });
  const equipTool = (personId: string) => dispatch({ type: "equip", personId, item: "tool" });
  const unequipItem = (personId: string) => dispatch({ type: "unequip", personId });

  const sendExpedition = (personId: string, destination: string) =>
    dispatch({ type: "startExpedition", personId, destination });

  return (
    <ColonyContext.Provider
      value={{
        colony: state,
        paused,
        activities: state.activities,
        togglePaused,
        assignPerson,
        startCraft,
        equipTool,
        unequipItem,
        sendExpedition,
      }}
    >
      {children}
    </ColonyContext.Provider>
  );
}