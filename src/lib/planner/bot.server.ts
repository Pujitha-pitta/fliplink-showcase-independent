import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText, type ModelMessage } from "ai";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  MEMORY_WINDOW,
  WELCOME_TEXT,
  aiErrorReply,
  buildSystemPrompt,
  decideAccess,
  recentHistory,
} from "./rules";
import { sendText, telegram } from "./telegram.server";

// Free Gemini key from Google AI Studio, as in the guide.
const GEMINI_FREE_MODEL = "gemini-flash-lite-latest";
const GEMINI_OPENAI_URL = "https://generativelanguage.googleapis.com/v1beta/openai";

type TelegramMessage = {
  message_id: number;
  text?: string | undefined;
  chat: { id: number; type: string };
  from?: { first_name?: string | undefined } | undefined;
};

export type TelegramUpdate = { update_id: number; message?: TelegramMessage | undefined };

async function ownerChatId(): Promise<number | null> {
  const { data, error } = await supabaseAdmin.from("bot_owner").select("chat_id").eq("id", 1).maybeSingle();
  if (error) throw new Error(`Could not read bot owner: ${error.message}`);
  return data ? Number(data.chat_id) : null;
}

async function claimOwner(chatId: number, firstName: string | null): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("bot_owner")
    .upsert({ id: 1, chat_id: chatId, first_name: firstName }, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new Error(`Could not save bot owner: ${error.message}`);
  // Re-read in case another chat claimed it at the same moment.
  return (await ownerChatId()) === chatId;
}

async function loadHistory(chatId: number) {
  const { data, error } = await supabaseAdmin
    .from("chat_messages")
    .select("role, content, created_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false })
    .limit(MEMORY_WINDOW);
  if (error) throw new Error(`Could not load chat memory: ${error.message}`);
  return recentHistory((data ?? []) as Parameters<typeof recentHistory>[0]);
}

async function saveMessage(chatId: number, role: "user" | "assistant", content: string) {
  const { error } = await supabaseAdmin.from("chat_messages").insert({ chat_id: chatId, role, content });
  if (error) throw new Error(`Could not save chat memory: ${error.message}`);
}

function plannerModel() {
  const apiKey = process.env["GEMINI_API_KEY"]?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const gemini = createOpenAICompatible({
    name: "gemini",
    baseURL: GEMINI_OPENAI_URL,
    apiKey,
  });
  return gemini(GEMINI_FREE_MODEL);
}

async function writePlan(history: ModelMessage[]): Promise<string> {
  let streamError: unknown;
  const result = streamText({
    model: plannerModel(),
    instructions: buildSystemPrompt(),
    messages: history,
    maxRetries: 0,
    onError: ({ error }) => {
      streamError = error;
    },
  });
  const text = (await result.text).trim();
  if (streamError) throw streamError;
  return text;
}

/** Returns true when the update was new and handled. */
export async function markUpdateProcessed(updateId: number): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("processed_updates")
    .upsert({ update_id: updateId }, { onConflict: "update_id", ignoreDuplicates: true })
    .select("update_id");
  if (error) throw new Error(`Could not record update: ${error.message}`);
  return (data ?? []).length > 0;
}

export async function handleUpdate(update: TelegramUpdate): Promise<void> {
  const message = update.message;
  if (!message || message.chat.type !== "private") return;
  const chatId = message.chat.id;
  const text = message.text?.trim();

  const access = decideAccess(await ownerChatId(), chatId);
  if (access === "ignore") return;
  if (access === "claim" && !(await claimOwner(chatId, message.from?.first_name ?? null))) return;

  if (!text) {
    await sendText(chatId, "Send me your to-do list as a text message and I'll plan your day.");
    return;
  }

  if (text === "/start" || text === "/help") {
    await sendText(chatId, WELCOME_TEXT);
    return;
  }

  if (text === "/reset") {
    const { error } = await supabaseAdmin.from("chat_messages").delete().eq("chat_id", chatId);
    if (error) throw new Error(`Could not clear memory: ${error.message}`);
    await sendText(chatId, "Done, I've forgotten our chat. Send me a new list whenever you're ready.");
    return;
  }

  await telegram("sendChatAction", { chat_id: chatId, action: "typing" }).catch(() => undefined);

  await saveMessage(chatId, "user", text);
  const history = (await loadHistory(chatId)).map((m) => ({ role: m.role, content: m.content }) as ModelMessage);

  let reply: string;
  try {
    reply = await writePlan(history);
  } catch (error) {
    const status = (error as { statusCode?: number })?.statusCode;
    console.error(`Planner AI call failed (status ${status ?? "none"})`, error);
    if (error instanceof Error && error.message.includes("GEMINI_API_KEY is not configured")) {
      await sendText(chatId, "The planner is not configured yet. Add GEMINI_API_KEY to the server environment.");
      return;
    }
    await sendText(chatId, aiErrorReply(status));
    return;
  }
  if (!reply) reply = "Sorry, I couldn't write a plan for that. Could you send your list again?";

  await saveMessage(chatId, "assistant", reply);
  await sendText(chatId, reply);
}
