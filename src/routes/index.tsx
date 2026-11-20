import { createFileRoute } from "@tanstack/react-router";

const BOT_USERNAME = "DailyPlannerP_Bot";
const BOT_URL = `https://t.me/${BOT_USERNAME}`;

const TITLE = "Pooja's Day Planner — text your to-dos, get a planned day";
const DESCRIPTION =
  "A Telegram bot that turns your messy to-do list into a clean, time-blocked plan for today. Runs online, answers only you.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const PLAN = [
  { time: "7:00 – 8:00 AM", task: "Gym" },
  { time: "9:00 – 10:30 AM", task: "Write LinkedIn post" },
  { time: "2:00 – 2:45 PM", task: "Laundry" },
  { time: "8:00 – 8:30 PM", task: "Call amma" },
];

const STEPS = [
  { n: "01", title: "Open the bot", body: `Tap the button to open @${BOT_USERNAME} in Telegram and press Start.` },
  { n: "02", title: "It becomes yours", body: "The first chat to message the bot claims it. Everyone else is ignored." },
  { n: "03", title: "Send your list", body: "Gym, emails, laundry, a call at 8pm — any order. A plan comes back in seconds." },
];

function TelegramIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M21.9 4.3 18.7 19.4c-.2 1.1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.2 13 1.4 11.5c-1-.3-1.1-1 .2-1.5L20.5 2.8c.9-.3 1.7.2 1.4 1.5Z" />
    </svg>
  );
}

function Index() {
  return (
    <main className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-xl font-bold tracking-tight">Pooja's Day Planner</span>
        <a
          href={BOT_URL}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          @{BOT_USERNAME}
        </a>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-8 lg:grid-cols-[1.1fr_0.9fr] lg:pt-16">
        <div className="animate-rise">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Online 24/7 · no laptop needed
          </p>
          <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Text a messy list.
            <br />
            Get a <span className="marker">planned day.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Send your to-dos to your Telegram bot. It sorts them into time blocks — workouts in the morning, deep work
            before lunch, chores in the afternoon — and keeps every time you give it.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href={BOT_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-3 rounded-full bg-telegram px-7 py-4 text-base font-semibold text-telegram-foreground shadow-paper transition-transform hover:-translate-y-0.5"
            >
              <TelegramIcon />
              Open in Telegram
            </a>
            <span className="text-sm text-muted-foreground">Answers only you.</span>
          </div>
        </div>

        <div className="animate-rise relative [animation-delay:150ms]">
          <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-highlight/60 blur-3xl" />
          <div className="paper-lines relative rounded-[1.75rem] border border-border bg-card p-5 shadow-paper sm:p-7">
            <div className="mb-5 flex items-center gap-3 border-b border-border pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
                P
              </div>
              <div>
                <p className="font-semibold leading-tight">Pooja's Day Planner</p>
                <p className="text-xs text-muted-foreground">bot</p>
              </div>
            </div>

            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-md bg-bubble-out px-4 py-3 text-sm text-primary-foreground">
                plan my day: gym, write LinkedIn post, laundry, call amma at 8pm
              </p>
            </div>

            <div className="mt-4 max-w-[92%] rounded-2xl rounded-bl-md border border-border bg-bubble-in px-4 py-4">
              <ul className="space-y-2.5">
                {PLAN.map((block) => (
                  <li key={block.task} className="flex gap-4 text-sm">
                    <span className="w-32 shrink-0 font-mono text-xs leading-5 text-muted-foreground">{block.time}</span>
                    <span className="font-medium">{block.task}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted-foreground">Gaps are buffer time. You've got this!</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.n}>
              <p className="font-mono text-sm text-accent">{step.n}</p>
              <h2 className="mt-2 font-display text-2xl font-bold">{step.title}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-16">
          <div className="flex flex-wrap gap-x-8 gap-y-3 rounded-2xl border border-border bg-card px-6 py-5 text-sm">
            <span className="font-semibold">Commands</span>
            <span>
              <code className="font-mono text-primary">/start</code>{" "}
              <span className="text-muted-foreground">— how it works</span>
            </span>
            <span>
              <code className="font-mono text-primary">/reset</code>{" "}
              <span className="text-muted-foreground">— forget the chat and start fresh</span>
            </span>
            <span className="text-muted-foreground">It remembers your last 10 messages, so you can say "move gym to 6".</span>
          </div>
        </div>
      </section>
    </main>
  );
}
