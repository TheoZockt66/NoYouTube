/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseDurationToSeconds } from '@/lib/youtube-api';

function getAuthClient(request: NextRequest) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const authHeader = request.headers.get('Authorization') || '';
    const accessToken = authHeader.replace('Bearer ', '');

    return createClient(url, anonKey, {
        global: {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        },
    });
}

/**
 * GET /api/feed?categoryId=xxx&page=1&limit=20&filter=all|channel|playlist
 * Liefert den deduplizierten Video-Feed
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const filter = searchParams.get('filter') || 'all'; // all, channel, playlist
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'userId erforderlich' }, { status: 400 });
    }

    const supabase = getAuthClient(request);
    const offset = (page - 1) * limit;

    try {
        let query;

        if (categoryId && categoryId !== 'all' && categoryId !== 'bookmarks') {
            // Feed for a specific category: join through source_categories
            query = supabase
                .from('video_items')
                .select(`
                    *,
                    source:sources!inner(
                        id, type, title, external_id,
                        source_categories!inner(category_id)
                    )
                `, { count: 'exact' })
                .eq('user_id', userId)
                .eq('hidden', false)
                .eq('source.source_categories.category_id', categoryId);
        } else if (categoryId === 'bookmarks') {
            // Bookmarked videos
            query = supabase
                .from('video_items')
                .select('*, source:sources(id, type, title, external_id)', { count: 'exact' })
                .eq('user_id', userId)
                .eq('hidden', false)
                .eq('bookmarked', true);
        } else {
            // All videos
            query = supabase
                .from('video_items')
                .select('*, source:sources(id, type, title, external_id)', { count: 'exact' })
                .eq('user_id', userId)
                .eq('hidden', false);
        }

        // Filter by source type
        if (filter === 'channel') {
            query = query.eq('source.type', 'channel');
        } else if (filter === 'playlist') {
            query = query.eq('source.type', 'playlist');
        }

        // Order and paginate
        const { data: videos, error, count } = await query
            .order('published_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        // Deduplicate by video_id (keep first = newest) and filter out Shorts
        const seen = new Set<string>();
        const deduped = (videos || []).filter(v => {
            if (seen.has(v.video_id)) return false;
            seen.add(v.video_id);
            // Filter out YouTube Shorts by title
            const titleLower = (v.title || '').toLowerCase();
            if (titleLower.includes('#shorts') || titleLower.includes('#short')) return false;
            // Filter out videos under 2 minutes (likely Shorts)
            if (v.duration) {
                const seconds = parseDurationToSeconds(v.duration);
                if (seconds > 0 && seconds < 120) return false;
            }
            return true;
        });

        return NextResponse.json({
            videos: deduped,
            total: count || 0,
            page,
            limit,
            hasMore: offset + limit < (count || 0),
        });
    } catch (error: any) {
        console.error('Feed error:', error);
        return NextResponse.json({ error: error.message || 'Feed-Fehler' }, { status: 500 });
    }
}
