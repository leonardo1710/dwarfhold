import type { ExpeditionResult } from "./types";

const REQUEST_TIMEOUT_MS = 8_000;

function isExpeditionResult(body: unknown): body is ExpeditionResult {
  if (typeof body !== "object" || body === null) return false;
  const { message, rewards } = body as { message?: unknown; rewards?: unknown };
  return typeof message === "string" && typeof rewards === "object" && rewards !== null;
}

async function errorMessage(response: Response): Promise<string> {
  const fallback = `Expedition failed (${response.status}).`;
  try {
    const body = (await response.json()) as { error?: unknown };
    return typeof body.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

export async function beginExpedition(dwarfId: string, destination: string): Promise<ExpeditionResult> {
  let response: Response;
  let body: unknown;
  try {
    response = await fetch("/api/expeditions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dwarfId, destination }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    body = response.ok ? await response.json() : null;
  } catch {
    throw new Error("No word came back from the expedition.");
  }

  if (!response.ok) throw new Error(await errorMessage(response));
  if (!isExpeditionResult(body)) throw new Error("The expedition's report could not be read.");
  return body;
}
