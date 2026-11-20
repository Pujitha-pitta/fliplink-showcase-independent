<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Telegram bot logic lives in `src/lib/planner/` (pure rules in `rules.ts`, server code in `*.server.ts`); the webhook route `src/routes/api/public/telegram/webhook.ts` only verifies Telegram's secret header and delegates. Why: keeps rules unit-testable and server secrets out of the client bundle.
- The Telegram webhook is registered against the stable `project--<id>-dev` URL with a secret derived from `TELEGRAM_API_KEY`; re-run `setWebhook` if the connection key changes. Why: the id-preview URL is auth-gated and Telegram can't reach it.
- Bot access is single-owner: the first private chat claims `bot_owner`; others are ignored. Why: mirrors the guide's "only my chat" lock without asking the user for a chat ID.
- Handle each Telegram `update_id` once (`processed_updates`) and always return 200. Why: Telegram retries deliveries, which would double-reply.
- The planner calls Google's OpenAI-compatible Gemini endpoint with the owner's `GEMINI_API_KEY` when set, and the Lovable AI Gateway only when it is absent; never fall back to the gateway on Gemini errors. Why: the owner wants plans to run on the free Gemini tier, not credits.
