-- Who the bot belongs to (only this chat gets replies)
CREATE TABLE public.bot_owner (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  chat_id bigint NOT NULL,
  first_name text,
  claimed_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.bot_owner TO service_role;
ALTER TABLE public.bot_owner ENABLE ROW LEVEL SECURITY;

-- Short chat memory per Telegram chat
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id bigint NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_messages_chat_created ON public.chat_messages (chat_id, created_at DESC);
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Telegram retries deliveries; remember which updates we already handled
CREATE TABLE public.processed_updates (
  update_id bigint PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.processed_updates TO service_role;
ALTER TABLE public.processed_updates ENABLE ROW LEVEL SECURITY;