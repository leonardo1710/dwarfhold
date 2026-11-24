import { createContext, useContext } from "react";
import type { Activity, ColonyState, CraftItem, JobType } from "../types";

export interface ColonyContextValue {
  colony: ColonyState;
  paused: boolean;
  activities: Activity[];
  togglePaused: () => void;
  assignPerson: (id: string, assignment: JobType) => void;
  startCraft: (personId: string, item: CraftItem) => void;
  equipTool: (personId: string) => void;
  unequipItem: (personId: string) => void;
  sendExpedition: (personId: string, destination: string) => void;
}

export const ColonyContext = createContext<ColonyContextValue | null>(null);

export function useColony(): ColonyContextValue {
  const context = useContext(ColonyContext);
  if (!context) {
    throw new Error("useColony must be used inside <ColonyProvider>");
  }
  return context;
}
