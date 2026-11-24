export type ResourceKey = "wood" | "stone" | "food" | "tools" | "weapons" | "panFlutes";
export type JobType = "woodcutting" | "mining" | "farming" | null;
export type PersonStatus = "idle" | "working" | "expedition" | "forge";
export type Species = "dwarf" | "satyr";
export type Equipment = "tool" | "panFlute";
export type CraftItem = Equipment | "weapon";
export type Task =
    | { kind: "expedition"; destination: string; returnOnDay: number }
    | { kind: "forge"; item: CraftItem; doneOnDay: number };
export interface Resources { wood: number; stone: number; food: number; tools: number; weapons: number; panFlutes: number }

export interface Person { 
    id: string;
     name: string; 
     title: string; 
     icon: string; 
     assignment: JobType; 
     species: Species; 
     equipment: Equipment | null; 
     task: Task | null; 
     specialty?: Exclude<JobType, null> 
}

export interface ColonyState { 
    day: number; 
    resources: Resources; 
    people: Person[]; 
    activities: Activity[]; 
    hungry: boolean; 
    newcomerJoined: boolean; 
    lastRaid: RaidResult | null 
}

export interface RaidResult { 
    day: number; 
    defended: boolean; 
    looted: Partial<Resources> 
}

export interface ExpeditionResult { 
    expeditionId: string; 
    status: "completed"; 
    rewards: Partial<Resources>; 
    message: string 
}

export interface Activity { 
    id: number; 
    day: number; 
    message: string; 
    tone?: "good" | "warning" 
}
