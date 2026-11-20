import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const updateSchema = z
  .object({
    update_id: z.number().int(),
    message: z
      .object({
        message_id: z.number().int(),
        text: z.string().max(4096).optional(),
        chat: z.object({ id: z.number().int(), type: z.string().max(32) }).passthrough(),
        from: z.object({ first_name: z.string().max(256).optional() }).passthrough().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

function expectedSecret(telegramApiKey: string) {
  return createHash("sha256").update(`telegram-webhook:${telegramApiKey}`).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const telegramKey = process.env["TELEGRAM_API_KEY"];
        if (!telegramKey) return new Response("Not configured", { status: 500 });

        const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        if (!safeEqual(secret, expectedSecret(telegramKey))) {
          return new Response("Unauthorized", { status: 401 });
        }

        const parsed = updateSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ ok: true, ignored: true });

        const { handleUpdate, markUpdateProcessed } = await import("@/lib/planner/bot.server");
        // Telegram retries deliveries; handle each update only once.
        if (!(await markUpdateProcessed(parsed.data.update_id))) {
          return Response.json({ ok: true, duplicate: true });
        }

        try {
          await handleUpdate(parsed.data);
        } catch (error) {
          console.error("Telegram update failed", error);
        }
        // Always 200 so Telegram doesn't keep re-sending the same message.
        return Response.json({ ok: true });
      },
    },
  },
});
