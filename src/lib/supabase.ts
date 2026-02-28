import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// TypeScript Interfaces
// ============================================

export interface Category {
    id: string;
    user_id: string;
    name: string;
    color: string;
    icon: string;
    position: number;
    created_at: string;
    updated_at: string;
}

export type SourceType = 'channel' | 'playlist';

export interface Source {
    id: string;
    user_id: string;
    type: SourceType;
    external_id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    uploads_playlist_id: string | null;
    active: boolean;
    last_sync_at: string | null;
    last_seen_published_at: string | null;
    last_video_id: string | null;
    etag: string | null;
    error_count: number;
    last_error: string | null;
    title_filter: string | null;
    created_at: string;
    updated_at: string;
    // joined
    categories?: Category[];
}

export interface SourceCategory {
    id: string;
    source_id: string;
    category_id: string;
    created_at: string;
}

export interface VideoItem {
    id: string;
    user_id: string;
    video_id: string;
    source_id: string;
    title: string;
    description: string | null;
    channel_title: string | null;
    channel_id: string | null;
    thumbnail_url: string | null;
    thumbnail_medium_url: string | null;
    thumbnail_high_url: string | null;
    published_at: string;
    duration: string | null;
    view_count: number | null;
    url: string;
    watched: boolean;
    bookmarked: boolean;
    hidden: boolean;
    created_at: string;
    // joined
    source?: Source;
}

export interface VideoSummary {
    id: string;
    video_id: string;
    user_id: string;
    tldr: string | null;
    bullets: string[] | null;
    why_relevant: string | null;
    model_version: string | null;
    input_type: string;
    created_at: string;
    updated_at: string;
}

export interface SyncLog {
    id: string;
    user_id: string;
    source_id: string | null;
    status: string;
    videos_found: number;
    videos_new: number;
    error_message: string | null;
    started_at: string;
    completed_at: string | null;
}
