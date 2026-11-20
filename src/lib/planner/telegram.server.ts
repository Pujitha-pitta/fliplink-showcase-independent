const TELEGRAM_API_URL = "https://api.telegram.org";

function botToken() {
  const token = process.env["TELEGRAM_BOT_TOKEN"]?.trim();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  return token;
}

export async function telegram(method: string, body: Record<string, unknown>) {
  const response = await fetch(`${TELEGRAM_API_URL}/bot${botToken()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const result = (await response.json().catch(() => null)) as
    | { ok?: boolean; result?: unknown; description?: string }
    | null;

  if (!response.ok || !result?.ok) {
    const message = result?.description ?? response.statusText ?? "unknown error";
    console.error(`Telegram ${method} failed [${response.status}]: ${message}`);
    throw new Error(`Telegram ${method} failed [${response.status}]: ${message}`);
  }

  return result.result;
}

export function sendText(chatId: number, text: string) {
  // Telegram caps messages at 4096 characters.
  return telegram("sendMessage", { chat_id: chatId, text: text.slice(0, 4000) });
}
