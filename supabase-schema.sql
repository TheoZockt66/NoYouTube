-- ============================================
-- NoYoutube – Supabase Database Schema
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. CATEGORIES
-- ============================================
create table public.categories (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    color text default '#0A84FF',
    icon text default 'folder',
    position int default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table public.categories enable row level security;

create policy "Users can manage own categories"
    on public.categories for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ============================================
-- 2. SOURCES (YouTube Channels & Playlists)
-- ============================================
create type public.source_type as enum ('channel', 'playlist');

create table public.sources (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    type public.source_type not null,
    external_id text not null,          -- YouTube channelId or playlistId
    title text not null,
    description text,
    thumbnail_url text,
    uploads_playlist_id text,           -- for channels: the "UU..." uploads playlist
    active boolean default true,
    last_sync_at timestamptz,
    last_seen_published_at timestamptz,
    last_video_id text,
    etag text,
    error_count int default 0,
    last_error text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(user_id, external_id)
);

alter table public.sources enable row level security;

create policy "Users can manage own sources"
    on public.sources for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ============================================
-- 3. SOURCE_CATEGORIES (n:m Zuordnung)
-- ============================================
create table public.source_categories (
    id uuid primary key default uuid_generate_v4(),
    source_id uuid not null references public.sources(id) on delete cascade,
    category_id uuid not null references public.categories(id) on delete cascade,
    created_at timestamptz default now(),
    unique(source_id, category_id)
);

alter table public.source_categories enable row level security;

create policy "Users can manage own source_categories"
    on public.source_categories for all
    using (
        exists (
            select 1 from public.sources s
            where s.id = source_id and s.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.sources s
            where s.id = source_id and s.user_id = auth.uid()
        )
    );

-- ============================================
-- 4. VIDEO_ITEMS
-- ============================================
create table public.video_items (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    video_id text not null,             -- YouTube videoId
    source_id uuid not null references public.sources(id) on delete cascade,
    title text not null,
    description text,
    channel_title text,
    channel_id text,
    thumbnail_url text,
    thumbnail_medium_url text,
    thumbnail_high_url text,
    published_at timestamptz not null,
    duration text,                      -- ISO 8601 duration
    view_count bigint,
    url text generated always as ('https://www.youtube.com/watch?v=' || video_id) stored,
    watched boolean default false,
    bookmarked boolean default false,
    hidden boolean default false,
    created_at timestamptz default now(),
    unique(user_id, video_id, source_id)
);

alter table public.video_items enable row level security;

create policy "Users can manage own video items"
    on public.video_items for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Index for feed queries
create index idx_video_items_user_published
    on public.video_items(user_id, published_at desc);

create index idx_video_items_source
    on public.video_items(source_id, published_at desc);

create index idx_video_items_video_id
    on public.video_items(user_id, video_id);

-- ============================================
-- 5. VIDEO_SUMMARIES (für KI – später)
-- ============================================
create table public.video_summaries (
    id uuid primary key default uuid_generate_v4(),
    video_id text not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    tldr text,
    bullets jsonb,                      -- ["point1", "point2", ...]
    why_relevant text,
    model_version text,
    input_type text default 'title_description', -- or 'transcript'
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(user_id, video_id)
);

alter table public.video_summaries enable row level security;

create policy "Users can manage own summaries"
    on public.video_summaries for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ============================================
-- 6. SYNC_LOG (für Debugging)
-- ============================================
create table public.sync_logs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    source_id uuid references public.sources(id) on delete set null,
    status text not null default 'started', -- started, success, error
    videos_found int default 0,
    videos_new int default 0,
    error_message text,
    started_at timestamptz default now(),
    completed_at timestamptz
);

alter table public.sync_logs enable row level security;

create policy "Users can view own sync logs"
    on public.sync_logs for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ============================================
-- VIEW: Feed mit Deduplizierung
-- ============================================
-- Dieses View gibt pro User deduplizierte Videos zurück
-- (ein Video erscheint nur einmal, auch wenn es über mehrere Sources kommt)
create or replace view public.deduplicated_feed as
select distinct on (vi.user_id, vi.video_id)
    vi.id,
    vi.user_id,
    vi.video_id,
    vi.title,
    vi.description,
    vi.channel_title,
    vi.channel_id,
    vi.thumbnail_url,
    vi.thumbnail_medium_url,
    vi.thumbnail_high_url,
    vi.published_at,
    vi.duration,
    vi.view_count,
    vi.url,
    vi.watched,
    vi.bookmarked,
    vi.hidden,
    vi.source_id,
    vi.created_at
from public.video_items vi
where vi.hidden = false
order by vi.user_id, vi.video_id, vi.published_at desc;
