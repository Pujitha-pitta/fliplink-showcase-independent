// Pure rules for the Telegram day-planner bot (no server imports, safe to unit test).

export const MEMORY_WINDOW = 10; // remember the last 10 messages per chat
export const PLANNER_TIME_ZONE = "Asia/Kolkata";

/** Which AI writes the plan: the owner's free Gemini key when it's set, otherwise the built-in AI. */
export type PlannerRoute = "gemini-free" | "built-in";

export function pickPlannerRoute(geminiKey: string | undefined): PlannerRoute {
  return geminiKey && geminiKey.trim() ? "gemini-free" : "built-in";
}

/** Friendly Telegram reply when the AI call fails. */
export function aiErrorReply(status: number | undefined, route: PlannerRoute): string {
  if (route === "gemini-free") {
    if (status === 429)
      return "You've hit the free Gemini limit. Wait a minute and try again. If it keeps happening, the daily limit resets at midnight Pacific time (around 1:30 PM India time).";
    if (status === 400 || status === 401 || status === 403)
      return "My Gemini key isn't working. Please make a new key in Google AI Studio and update it.";
  } else {
    if (status === 429) return "I'm getting a lot of requests right now. Please try again in a minute.";
    if (status === 402) return "The planner has run out of AI credits for now. Please top up and try again.";
  }
  return "Sorry, I couldn't write your plan just now. Please try again in a moment.";
}

export type AccessDecision = "claim" | "allow" | "ignore";

/**
 * The bot answers only its owner. The first chat that ever messages the bot
 * becomes the owner; every other chat is ignored.
 */
export function decideAccess(ownerChatId: number | null, chatId: number): AccessDecision {
  if (ownerChatId === null) return "claim";
  return ownerChatId === chatId ? "allow" : "ignore";
}

export type StoredMessage = { role: "user" | "assistant"; content: string; created_at: string };

/** Oldest-first list of the most recent messages, capped at the memory window. */
export function recentHistory(messages: StoredMessage[], limit = MEMORY_WINDOW): StoredMessage[] {
  return [...messages]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(-limit);
}

export function buildSystemPrompt(now: Date = new Date()): string {
  const today = new Intl.DateTimeFormat("en-IN", {
    timeZone: PLANNER_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(now);

  return `You are my day planner. The user sends you a list of things to do today, sometimes with fixed times.
Turn it into a simple time-blocked plan for today.
Right now it is ${today} (India time).

Rules:
- Keep every time the user gives ("call amma at 8pm" stays at 8:00 PM).
- Workouts go in the morning unless the user says otherwise.
- Focus work (writing, studying, coding) gets a 60 to 90 minute block before lunch.
- Chores like laundry go in the afternoon.
- Leave short breaks between blocks. Nothing before 6:00 AM or after 10:00 PM.
- Reply with one line per block: start - end, then the task, in 12-hour time. End with one short, friendly line.
- No tables, no markdown symbols and no long explanations. If something is unclear, make a sensible guess and mention it in one short line.
- If the user just chats or asks to change the plan, reply briefly and update the plan.`;
}

export const WELCOME_TEXT = `Hi! I'm Pooja's Day Planner.

Send me a messy to-do list and I'll reply with a clean, time-blocked plan for today.

Try: plan my day: gym, write LinkedIn post, laundry, call amma at 8pm

Send /reset any time to clear what I remember.`;
