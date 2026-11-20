import { describe, expect, it } from "vitest";

import { MEMORY_WINDOW, decideAccess, pickPlannerRoute, recentHistory } from "@/lib/planner/rules";

describe("bot owner lock", () => {
  it("lets the first chat claim the bot", () => {
    expect(decideAccess(null, 111)).toBe("claim");
  });
  it("answers the owner's chat", () => {
    expect(decideAccess(111, 111)).toBe("allow");
  });
  it("ignores every other chat", () => {
    expect(decideAccess(111, 222)).toBe("ignore");
  });
});

describe("chat memory", () => {
  it("keeps only the last 10 messages, oldest first", () => {
    const messages = Array.from({ length: 15 }, (_, i) => ({
      role: "user" as const,
      content: `m${i}`,
      created_at: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(),
    })).reverse();
    const kept = recentHistory(messages);
    expect(MEMORY_WINDOW).toBe(10);
    expect(kept).toHaveLength(10);
    expect(kept[0]?.content).toBe("m5");
    expect(kept[9]?.content).toBe("m14");
  });
});

describe("which AI writes the plan", () => {
  it("uses the free Gemini key when it is set", () => {
    expect(pickPlannerRoute("AIzaExampleKey")).toBe("gemini-free");
  });
  it("falls back to the built-in AI only when no Gemini key is set", () => {
    expect(pickPlannerRoute(undefined)).toBe("built-in");
    expect(pickPlannerRoute("  ")).toBe("built-in");
  });
});
