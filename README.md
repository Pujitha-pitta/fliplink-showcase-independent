# Telegram Day Planner (n8n)

This repository includes an importable n8n workflow that turns a Telegram to-do list into a time-blocked plan with Gemini, then replies in the same chat. The workflow is intended to run on your own laptop, as in the accompanying guide.

## Workflow

Import [`day-planner-agent.json`](./day-planner-agent.json) into n8n. It contains the guide's six-node flow:

1. **Telegram Trigger** receives messages.
2. **Only my chat** allows only the configured chat ID through.
3. **AI Agent** applies the day-planning prompt.
4. **Google Gemini Chat Model** generates the response.
5. **Simple Memory** keeps 10 previous interactions per chat.
6. **Send a text message** replies to the same Telegram chat.

The agent prompt preserves fixed times, schedules workouts in the morning and chores in the afternoon, leaves breaks, avoids planning before 6 AM or after 10 PM, and uses India time.

The workflow export contains no API keys or saved credentials. You add your Telegram and Gemini credentials inside n8n after importing it.

## What you need

- A laptop that can stay awake while the bot is running.
- Node.js 20.19–24, or Docker Desktop.
- Telegram on your phone.
- A Google account for a Gemini API key.
- `cloudflared` to give local n8n a temporary public HTTPS URL.

This setup uses self-hosted n8n, Telegram, Gemini's free API tier, and Cloudflare Quick Tunnels. Free API limits apply. The laptop, n8n, and tunnel must remain running for the bot to respond.

## 1. Start n8n locally

### Node.js

Check that Node is installed:

```sh
node --version
```

Start n8n:

```sh
npx n8n
```

Open [http://localhost:5678](http://localhost:5678). On first launch, create an n8n owner account and choose a strong password. Keep the terminal open while you use the bot.

### Docker alternative

```sh
docker volume create n8n_data
docker run -it --rm --name n8n -p 5678:5678 -e GENERIC_TIMEZONE="Asia/Kolkata" -e TZ="Asia/Kolkata" -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n
```

## 2. Create your Telegram bot

1. In Telegram, open the verified [@BotFather](https://t.me/BotFather) account.
2. Send `/newbot`.
3. Choose a display name and a username ending in `bot`.
4. Copy the bot token and keep it private.

In n8n, create a **Telegram API** credential with that token. Select the same credential on **Telegram Trigger** and **Send a text message**.

## 3. Create a Gemini API key

1. Open [Google AI Studio](https://aistudio.google.com/apikey) and sign in.
2. Create an API key and store it privately.
3. In n8n, create a **Google Gemini (PaLM) API** credential with that key.
4. Select the credential on **Google Gemini Chat Model** and choose an available Flash-Lite or Flash model.

The free tier has request limits. Do not send passwords or private documents to the bot.

## 4. Import and configure the workflow

1. In n8n, create a workflow and choose **Import from File**.
2. Select `day-planner-agent.json`.
3. Open **Telegram Trigger**, choose the Telegram credential, then save.
4. Open **Send a text message**, choose the same Telegram credential.
5. Open **Google Gemini Chat Model**, select the Gemini credential and an available Flash-Lite or Flash model.
6. In **Simple Memory**, keep **Session ID** set to the Telegram chat ID and **Context Window Length** set to `10`.

### Lock it to your chat

The **Only my chat** IF node has a placeholder value, `YOUR_CHAT_ID`. Replace it with your own Telegram chat ID before activating the workflow.

To find the ID:

1. In n8n, click **Execute workflow** so the Telegram Trigger listens.
2. Send a short message to your bot.
3. Open the Telegram Trigger execution output and read `message → chat → id`.
4. Open **Only my chat** and replace `YOUR_CHAT_ID` with that value. The workflow converts the incoming ID to a string for comparison.
5. Save the workflow.

The false branch is intentionally left unconnected, so messages from any other chat are ignored.

## 5. Give local n8n a public HTTPS URL

Telegram needs an HTTPS webhook to reach n8n. On Windows, install it with `winget install --id Cloudflare.cloudflared`, or use [Cloudflare's downloads page](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/). Then run this in a separate terminal:

```sh
cloudflared tunnel --url http://localhost:5678
```

Copy the temporary `https://…trycloudflare.com` URL that Cloudflare prints. Keep the tunnel terminal open.

Stop and restart n8n with that URL so it registers the correct public webhook address.

### Node.js / PowerShell

Replace the example domain with your current tunnel domain, including the trailing slash:

```powershell
$env:N8N_WEBHOOK_URL = "https://YOUR-TUNNEL.trycloudflare.com/"
$env:WEBHOOK_URL = "https://YOUR-TUNNEL.trycloudflare.com/"
$env:N8N_PROXY_HOPS = "1"
npx n8n
```

### Docker

Stop the existing container with Ctrl+C, then start it again with the tunnel URL:

```sh
docker run -it --rm --name n8n -p 5678:5678 \
  -e N8N_WEBHOOK_URL="https://YOUR-TUNNEL.trycloudflare.com/" \
  -e WEBHOOK_URL="https://YOUR-TUNNEL.trycloudflare.com/" \
  -e N8N_PROXY_HOPS=1 \
  -e GENERIC_TIMEZONE="Asia/Kolkata" -e TZ="Asia/Kolkata" \
  -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n
```

A Quick Tunnel gets a new random URL when restarted. If it changes, update both environment variables, restart n8n, and publish the workflow again.

## 6. Activate and try it

Click **Publish** (or **Activate** in older n8n versions). Send your bot:

```text
plan my day: gym, write LinkedIn post, laundry, call amma at 8pm
```

Gemini writes a fresh plan each time, so the exact time blocks can vary.

## Troubleshooting and safety

- **Bot does not reply:** Keep both n8n and `cloudflared` running. Check that the workflow is published, both Telegram nodes use the right credential, and the Gemini credential is valid.
- **Webhook URL error:** Restart n8n with both `N8N_WEBHOOK_URL` and `WEBHOOK_URL` set to the HTTPS tunnel URL.
- **Tunnel URL changed:** Update the URL, restart n8n and publish the workflow again.
- **Gemini 429 / resource exhausted:** Wait for the rate limit to reset, then retry.
- **Keep secrets private:** Never commit or share your Telegram token or Gemini key. If a token leaks, revoke it with BotFather and create a new one.
- **Protect n8n:** The tunnel exposes the n8n login page while it runs. Use a strong owner password and stop the tunnel when you are finished.

The repository also retains a separate web demo under `src/`. It is not used by this n8n workflow; the workflow runs without the web app or its Supabase database.
