# Manual Test Plan for Dwarfhold

This document defines the manual verification scenarios for requirements **D1 through D7**. Each packet adds or refines the concrete steps for its requirement as team decisions are finalized, and the full plan is executed on `master` before submission.

## Test Environment Setup

- Start both frontend and API servers with `npm run dev` (web at `http://localhost:5174`, API at `http://localhost:4200`).
- Open the browser Developer Tools (`Console`, `Network`, and `Application -> Local Storage`) to inspect requests, errors, and persisted state.
- For expedition fault-injection tests, use the built-in `blocked-pass` destination or server query switches (`?fail=true` and `?latency=<ms>`).

---

## D1 — Colony work and survival (15%)

1. **Daily production and meal consumption**
   - **Precondition:** Fresh colony (`day 12`, 3 dwarves: 1 mining, 1 woodcutting, 1 unassigned; `food: 18`).
   - **Action:** Let one simulation day advance (or unpause until `day 13`).
   - **Expected:** Stone increases by `2` (`9 -> 11`), wood increases by `3` (`14 -> 17`), food changes by `+0 - 3 = -3` (`18 -> 15`), and the Shift Ledger matches the actual per-day change.
2. **Single activity per resident (no double contribution)**
   - **Precondition:** Assign a dwarf to a local job, then send that same dwarf on an expedition (or assign them to a forge task once D3 is active).
   - **Action:** Advance a simulation day while the dwarf is away on the expedition or busy in the forge.
   - **Expected:** That dwarf produces `0` resources from their local job while away/crafting, while still counting toward daily food consumption.
3. **Food shortage consequence and recovery**
   - **Precondition:** Reduce stored food below the company's daily consumption (e.g., all dwarves unassigned until food runs out).
   - **Action:** Advance through a day where `food < people.length`, then restore food production and advance subsequent days.
   - **Expected:** Production happens before meals; when total food cannot cover everyone, food is clamped to `0`, `hungry` becomes `true`, a warning is recorded in the Hold Chronicle, and on the next day only Mushroom Farm (`farming`) produces (`woodcutting` and `mining` show `0 / day` in the Shift Ledger); once a day ends with everyone fed, `hungry` becomes `false`, full production resumes, and a recovery entry appears in the Hold Chronicle. While `hungry` is `true`, the Shift Ledger shows the hunger notice and the Send expedition button is disabled.

---

## D2 — Useful tools, weapons, and equipment (20%)

1. **Equip and return a tool**
   - **Precondition:** At least `1` tool in shared inventory and an unassigned or working dwarf with no equipped item.
   - **Action:** Equip a tool to the dwarf, inspect the roster and resource bar, then unequip/return the tool.
   - **Expected:** Stored `tools` decreases by `1` on equip and increases by `1` on return; the roster clearly shows who holds the tool; a dwarf cannot equip more than one tool, and a tool cannot be equipped by multiple dwarves simultaneously. The Equip and Return buttons are readable and fit the roster row.
2. **Tool production bonus on compatible local jobs**
   - **Precondition:** Equip a tool to a dwarf assigned to Woodcutting (and repeat for Deep Mining / Mushroom Farm).
   - **Action:** Advance one simulation day.
   - **Expected:** Output increases by `+1` unit of the assigned resource per day (e.g., Woodcutting `3 -> 4`, Deep Mining `2 -> 3`, Mushroom Farm `4 -> 5`), and the Shift Ledger reflects the boosted output.
3. **Weapon recipe and resource display**
   - **Precondition:** Open the Forge page with sufficient materials for a weapon.
   - **Action:** Inspect the displayed weapon recipe and craft a weapon.
   - **Expected:** The Forge page displays the TD-3 recipe cost (`4 wood + 3 stone -> 1 weapon`); crafting with at least `4 wood` and `3 stone` deducts `4 wood` and `3 stone` and increments `weapons` by `1` in the resource bar, while crafting with insufficient wood or stone leaves resources unchanged and records a warning in the Hold Chronicle.

---

## D3 — Crafting as colony work (10%)

1. **Start valid forge task (materials, eligible resident, duration)** *(TD-4: tool 1 day, weapon 2 days)*
   - **Precondition:** Sufficient materials and an eligible resident (present, not on an expedition, not already crafting).
   - **Action:** Start forging a tool (and in a separate check, a weapon).
   - **Expected:** Materials are deducted at the start; the UI shows who is crafting and on which day it completes; the crafter is marked busy and produces no local job output while crafting; upon reaching the completion day, the item is added to inventory and the resident becomes available again. The footer names the crafter while the forge is in use.
2. **Reject invalid crafting attempts**
   - **Precondition:** Test (a) insufficient materials, (b) a chosen crafter who is busy, (c) forge already occupied by an active task, and (d) a hungry hold.
   - **Action:** Try to start a forge task in each invalid state.
   - **Expected:** The recipe button is disabled and the reason is shown next to it; neither residents, resources nor the chronicle change.
3. **No immediate crafting**
   - **Action:** Start a tool while the simulation is paused.
   - **Expected:** The materials are taken, but the tool count does not rise until the day changes.

---

## D4 — Resilient expeditions (10%)

1. **Successful expedition in days, single reward**
   - **Precondition:** Fresh colony (`day 12`, `food: 18`), an eligible dwarf, The Old Mine (2 days).
   - **Action:** Send the expedition and let two days pass.
   - **Expected:** `2` rations leave the stores at departure; the panel and the roster show the traveller and return day `14`; the traveller does no local job and is not counted at meals; exactly one request is sent when day `14` begins, and the rewards (`+12 stone, +2 wood`) are added exactly once.
2. **Failed expedition recovery (`blocked-pass`, or the API not running)**
   - **Action:** Send a dwarf to Blocked Pass and wait for the return day. Repeat with the API stopped.
   - **Expected:** No rewards, a readable warning in the chronicle, and the dwarf is home and available. The rations are not refunded.
3. **Repeated clicks, second traveller, pause**
   - **Action:** Click "Send expedition" rapidly; try to send a second dwarf while one is away; send a dwarf while the simulation is paused and wait.
   - **Expected:** One departure and one ration deduction only; the second attempt is refused with a reason; while paused no request is sent and nothing changes until the simulation runs again.
4. **Invalid departures**
   - **Precondition:** (a) a hungry hold, (b) fewer rations than the journey needs, (c) a dwarf who is forging.
   - **Expected:** The button is disabled with the reason shown; neither residents nor resources change.
5. **Tool handling on expedition departure** *(TD-5: the traveller keeps the tool)*
   - **Precondition:** Equip a tool to an eligible dwarf, then send that dwarf to The Old Mine (no tool reward).
   - **Expected:** The stored tool count changes neither on departure nor on return; the roster still shows the tool on the traveller; the Return button is disabled while the dwarf is away and works again once the dwarf is back.

---

## D5 — Save and restore (10%)

1. **Persist and restore meaningful colony state across refresh**
   - **Precondition:** Advance days, change assignments, equip a tool, modify resources, and record chronicle entries.
   - **Action:** Refresh the browser (`F5` / `Ctrl+R`).
   - **Expected:** Day counter, resources, resident assignments/equipment/species, chronicle, and flags are restored accurately from `localStorage`.
2. **Corrupt or incompatible saved data fallback**
   - **Precondition:** Open DevTools `Application -> Local Storage` and edit the save entry to (a) invalid JSON, (b) missing/wrong schema version, or (c) invalid field types/negative resources.
   - **Action:** Refresh the browser.
   - **Expected:** The app does not crash; it falls back safely to a fresh colony state and informs the player via the UI/chronicle.
3. **Interrupted forge task and expedition on refresh** *(update once TD-6 is decided)*
   - **Precondition:** Start (a) an active forge task and (b) an in-flight expedition (`?latency=5000`), then refresh the browser before either finishes.
   - **Expected:** Both interrupted tasks follow the documented policy (e.g., day-based forge task resumes its remaining days; interrupted expedition returns the traveller with no reward or attack and logs an explanation in the chronicle).

---

## D6 — A new species joins Stonehome (20%)

1. **Newcomer arrival after first successful expedition to chosen destination** *(TD-7: Satyr after Ominous Dungeon)*
   - **Precondition:** `newcomerJoined` is false; send an eligible dwarf to the chosen destination (`Ominous Dungeon`).
   - **Action:** Complete the first expedition successfully, then complete a second expedition to the same destination.
   - **Expected:** The Satyr joins Stonehome after the first successful expedition (and does not join a second time on subsequent expeditions); a failed expedition to that destination does not trigger arrival.
2. **Distinct UI representation and visible capabilities/limitations**
   - **Precondition:** Inspect the roster and Forge page after the newcomer joins.
   - **Expected:** The Satyr is visually distinct from dwarves; their production difference (double food on Mushroom Farm) and crafting capability/limitation (can craft a pan flute for 4 wood; cannot wield standard tools; one equipped item max) are clearly visible before assignment or crafting.
3. **Participation in colony rules**
   - **Action:** Test daily food consumption (`+1` meal/day), job assignment, pan flute crafting and equipping to a dwarf (`+2` wood bonus), expedition eligibility, and browser refresh persistence with the Satyr in the hold.
   - **Expected:** All colony rules apply consistently without breaking invariants.

---

## D7 — Expedition consequences and defense (15%)

1. **Hostile attack on successful expedition with insufficient weapons** *(update destination, threshold, and loot details once TD-8 is finalized)*
   - **Precondition:** Stored `weapons` is below the defense threshold; send an eligible resident to the hostile destination.
   - **Action:** Complete the expedition successfully.
   - **Expected:** Attackers follow the traveller home; because weapons are below the threshold, a deterministic selection of stored resources is looted (never going below zero), and the raid outcome and losses are clearly displayed in the UI and chronicle.
2. **Successful defense when weapons meet or exceed threshold** *(update weapon consumption rule once TD-8 is finalized)*
   - **Precondition:** Forge enough weapons to reach or exceed the threshold; send an eligible resident to the hostile destination.
   - **Action:** Complete the expedition successfully.
   - **Expected:** Stonehome defends against the attack with no resource looting; weapons are preserved or consumed consistently according to the communicated rule, and the outcome is clearly shown.
3. **Failed expedition never triggers attack**
   - **Precondition:** Trigger a failed request (`?fail=true`) to the hostile destination.
   - **Expected:** The expedition fails cleanly, the traveller returns, and no hostile attack or looting occurs.