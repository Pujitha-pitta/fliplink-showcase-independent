# FlipLink Showcase

A small Telegram day planner. Send the bot a free-form to-do list and it returns a time-blocked plan for the day. The web page introduces the bot and provides a Telegram link.

## Features

- Telegram bot receives private messages through a webhook.
- Gemini turns to-do lists into plans using the Google Gemini OpenAI-compatible API.
- Supabase stores the first bot owner, the last 10 chat messages, and processed update IDs.
- The first private chat to message the bot claims it. Other chats are ignored.
- `/start` and `/help` show usage instructions; `/reset` clears saved chat memory.
- The planner uses India time (`Asia/Kolkata`).

## Stack

- React, TanStack Start and TanStack Router
- Vite, Nitro and Tailwind CSS
- Supabase Postgres and Supabase JS
- Telegram Bot API
- Gemini API via the AI SDK

## Project layout

| Path | Purpose |
| --- | --- |
| `src/routes/index.tsx` | Landing page |
| `src/routes/api/public/telegram/webhook.ts` | Telegram webhook validation and update handling |
| `src/lib/planner/rules.ts` | Time zone, prompt, memory and access rules |
| `src/lib/planner/bot.server.ts` | Owner lock, memory, Gemini planning and command handling |
| `src/lib/planner/telegram.server.ts` | Direct Telegram Bot API client |
| `src/integrations/supabase/` | Supabase browser, server and database types |
| `supabase/migrations/` | Database schema migrations |

## Requirements

- [Bun](https://bun.sh/) (the repository includes `bun.lock`)
- A Supabase project
- A Telegram bot created with [@BotFather](https://t.me/BotFather)
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)
- A public HTTPS deployment URL to receive Telegram webhooks

## Local setup

1. Install dependencies:

   ```sh
   bun install
   ```

2. Copy `.env.example` to `.env` and fill in the values. Keep secret keys out of source control.

3. Apply the SQL migration in `supabase/migrations/` to the Supabase project (for example, paste it into the Supabase SQL Editor).

4. Start the app:

   ```sh
   bun run dev
   ```

The landing page is served by Vite. Telegram webhooks require a deployed public HTTPS URL; Telegram cannot call a local development server without a tunnel.

## Environment variables

| Variable | Required | Where it is used |
| --- | --- | --- |
| `SUPABASE_URL` | Yes | Server-side Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only database access for bot state; never expose to the browser |
| `SUPABASE_PUBLISHABLE_KEY` | For Supabase browser/auth features | Supabase client and auth middleware |
| `VITE_SUPABASE_URL` | For browser Supabase features | Public URL compiled into the browser bundle |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | For browser Supabase features | Public key compiled into the browser bundle |
| `TELEGRAM_BOT_TOKEN` | Yes | Telegram Bot API calls |
| `TELEGRAM_WEBHOOK_SECRET` | Yes | Verifies Telegram webhook requests |
| `GEMINI_API_KEY` | Yes for planning | Gemini plan generation |
| `DATABASE_URL` | Optional | Drizzle Kit database connection |

Use the same Supabase URL for `SUPABASE_URL` and `VITE_SUPABASE_URL`. Publishable keys are designed for client use; the service-role key and all bot/AI/webhook credentials must remain server-side.

## Configure the Telegram webhook

After deploying the app, set Telegram's webhook URL to:

```text
https://YOUR_DOMAIN/api/public/telegram/webhook
```

Choose a webhook secret containing 1–256 characters from letters, numbers, underscores, or hyphens. Set that value as `TELEGRAM_WEBHOOK_SECRET` in the deployment environment and register the webhook with Telegram's `setWebhook` method, passing it as `secret_token`. For example:

```sh
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://YOUR_DOMAIN/api/public/telegram/webhook","secret_token":"YOUR_WEBHOOK_SECRET"}'
```

To verify registration, call Telegram's `getWebhookInfo` method. Send `/start` to your bot in a private chat; that chat becomes the bot owner.

## Commands

- `/start` or `/help`: show instructions
- `/reset`: delete saved conversation memory

For a plan, send a list such as: `plan my day: gym, write a post, laundry, call amma at 8pm`.

## Scripts

```sh
bun run dev       # local development
bun run build     # production build
bun run preview   # preview the built app
bun run lint      # lint source
```

`bun run start` may be used by Node-based hosts after building, if enabled by the selected Nitro deployment preset.
