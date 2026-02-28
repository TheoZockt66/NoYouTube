# NoYoutube

Personalisierter YouTube-Feed ohne Ablenkung. Baue deinen eigenen "Neueste Videos"-Feed aus YouTube-Kanälen und Playlists, organisiert in Kategorien.

## Features

- **Quellen hinzufügen**: YouTube-Kanäle und Playlists via URL oder ID
- **Kategorien**: Quellen in Kategorien organisieren (Tech, News, Sport, etc.)
- **Deduplizierter Feed**: Videos erscheinen nur einmal, auch wenn sie über mehrere Quellen kommen
- **Filter**: Alle / Nur Kanäle / Nur Playlists Tabs
- **Video-Player**: YouTube Embed direkt in der App
- **Gesehen/Gemerkt/Ausblenden**: Videos verwalten
- **Effiziente Synchronisierung**: RSS/Atom Feeds (quota-frei) + YouTube Data API v3 als Fallback
- **Dark Mode**: Trade Republic-inspiriertes Design

## Tech Stack

- **Next.js 16** (App Router)
- **Supabase** (Auth + PostgreSQL)
- **Mantine UI v8** (Component Library)
- **Framer Motion** (Animationen)
- **Lucide React** (Icons)
- **Vercel** (Deployment)

## Setup

1. **Supabase Projekt erstellen** auf [supabase.com](https://supabase.com)
2. **SQL Schema ausführen**: Kopiere `supabase-schema.sql` in den Supabase SQL Editor
3. **Environment Variables setzen**:
   ```bash
   cp .env.local.example .env.local
   # Trage deine Supabase-Daten ein
   ```
4. **Dependencies installieren & starten**:
   ```bash
   npm install
   npm run dev
   ```

## Environment Variables

| Variable | Beschreibung | Erforderlich |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Ja |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | Ja |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (für Sync) | Ja |
| `YOUTUBE_API_KEY` | YouTube Data API v3 Key | Optional |

## Datenmodell

- **categories**: Nutzerdefinierte Kategorien
- **sources**: YouTube-Kanäle und Playlists
- **source_categories**: n:m Zuordnung
- **video_items**: Alle Videos mit Deduplizierung
- **video_summaries**: KI-Zusammenfassungen (kommt später)
- **sync_logs**: Sync-Protokoll
