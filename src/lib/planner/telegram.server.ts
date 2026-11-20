const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

function keys() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const telegramKey = process.env["TELEGRAM_API_KEY"];
  if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
  if (!telegramKey) throw new Error("TELEGRAM_API_KEY is not configured");
  return { lovableKey, telegramKey };
}

export async function telegram(method: string, body: Record<string, unknown>) {
  const { lovableKey, telegramKey } = keys();
  const response = await fetch(`${GATEWAY_URL}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": telegramKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Telegram ${method} failed [${response.status}]: ${errorBody}`);
    throw new Error(`Telegram ${method} failed [${response.status}]: ${errorBody}`);
  }
  return response.json();
}

export function sendText(chatId: number, text: string) {
  // Telegram caps messages at 4096 characters.
  return telegram("sendMessage", { chat_id: chatId, text: text.slice(0, 4000) });
}
