# Quality Goals for Dwarfhold

This document defines the qualitative goals for **Dwarfhold**, why they matter for this application, the design decisions that support them, and how each goal is evaluated during development, testing, and the exam.

---

## 1. State Consistency and Determinism

### Why it matters
Dwarfhold is a day-based simulation where residents take jobs, equip items, craft goods, go on expeditions, and consume food while a timer advances days (`advanceDay`). If state is duplicated across components or mutated ad hoc, derived values (such as whether someone is available or what net food will be produced) can drift out of sync, and repeated actions or rapid clicks can produce contradictory state. Deterministic rules also make behaviour predictable for players and straightforward to test.

### Supporting decisions
- **Single reducer and pure game rules:** State transitions live in pure functions/reducer cases that take state and an action and return a new state without mutating inputs, reading wall-clock time, or calling `Math.random`.
- **Derived status rather than stored duplicates:** Availability and activity status are derived from `task` and `assignment` rather than stored as a separate flag that can contradict them.
- **Explicit invariants and single-activity rule:** A resident can participate in at most one activity at a time (local job, forge task, or expedition), tool counts are conserved across equip/unequip/expedition transitions (TD-2, TD-5), and resources are never allowed to drop below zero.
- **Shared production calculation:** Both the daily simulation and UI displays (such as the Shift Ledger) rely on the same underlying production logic so displayed numbers match actual daily effects.

### How it is evaluated
- **Unit tests (Vitest):** Pure rule tests and invariant tests verifying determinism, non-mutation, non-negative resources, tool conservation, single-reward application on expeditions, and rejection of invalid actions without side effects.
- **Manual test scenarios (`docs/TEST_PLAN.md`):** Rapid/repeated clicks during expeditions and crafting, plus checking that Shift Ledger figures match day-tick changes.

---

## 2. Resilience Under Failure and Corrupt Data

### Why it matters
Expeditions rely on an asynchronous HTTP request (`POST /api/expeditions`) that can be delayed, fail (`?fail=true`, `blocked-pass`, or network errors), or be interrupted when the user refreshes the page. In addition, browser storage (`localStorage`) can contain stale, malformed, or incompatible data across versions or manual edits. A failed request or bad save should never strand a resident permanently or crash the colony.

### Supporting decisions
- **Safe failure handling on expeditions:** When an expedition request fails, no rewards are applied, no hostile attack is triggered, and the travelling resident is returned to availability with a clear chronicle message.
- **Explicit interrupted-task policy across refreshes:** Day-based forge tasks continue based on `doneOnDay`, while in-flight expeditions whose HTTP request was lost on reload return the resident with no reward or attack and record the outcome in the chronicle (TD-6).
- **Versioned, validated persistence with fallback:** Saved data in `localStorage` includes a version identifier and passes structural/type validation on load (TD-9); invalid or incompatible data falls back cleanly to a fresh initial colony state and notifies the player.

### How it is evaluated
- **Unit tests (Vitest):** Tests for failed expedition actions, duplicate completion/failure events, persistence validation, and corrupt/version-mismatched save payloads.
- **Manual test scenarios (`docs/TEST_PLAN.md`):** Testing with `?fail=true`, `?latency=`, `blocked-pass`, browser refresh during tasks, and hand-edited/corrupt `localStorage` entries in browser DevTools.

---

## 3. Code Understandability and Maintainability

### Why it matters
Two developers are building features across multiple packets in a short timeframe, and every team member must be able to read, navigate, and explain any part of the codebase—including code written by their partner—without assistance during the individual exam. Over-engineered abstractions or monolithic components make code harder to trace and review.

### Supporting decisions
- **Clear module boundaries per domain:** Game rules and state management are separated from UI rendering, with dedicated modules for simulation, equipment, crafting, expeditions, persistence, species rules, and raid handling.
- **Small, focused changes and consistent naming:** Changes stay scoped to the active work packet and hot files are kept minimal, using consistent domain terminology (`Person`, `people`, `personId`) and readable formatting.
- **Documentation alongside implementation:** `README.md`, `docs/API.md`, `docs/QUALITY_GOALS.md`, and `docs/TEST_PLAN.md` are kept aligned with actual behaviour.

### How it is evaluated
- **Code reviews and builds:** Partner PR reviews, `npm run build` type-checking, and `npm run test` passing before merges.
- **Walkthroughs and explain-backs:** Each team member walks through their modules and explains the partner's code to verify shared comprehension.

---

## 4. Rule and State Visibility to the Player

### Why it matters
Many mechanics in Dwarfhold—food shortages, tool bonuses, forge costs and durations, expedition outcomes, new species traits/limitations, and raid defence thresholds—directly affect how the player manages Stonehome. If these rules or current states are hidden, the player cannot make informed decisions or tell why something happened.

### Supporting decisions
- **Clear UI feedback for shortages, active tasks, and outcomes:** Food shortage status and effects, active crafting/expedition states, and chronicle entries are surfaced clearly in the interface.
- **Transparent costs, capabilities, and thresholds:** Recipes, material costs, resident roles/species capabilities and limitations, and defence/expedition rules are communicated where the player acts on them.

### How it is evaluated
- **Manual test scenarios (`docs/TEST_PLAN.md`):** Walking through each requirement (`D1`–`D7`) in the browser to verify that state transitions, warnings, outcomes, and rules are visible and understandable.