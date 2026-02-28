/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchChannelRSS, fetchPlaylistRSS, fetchVideoDurations } from '@/lib/youtube-api';

// Create a Supabase client authenticated as the requesting user
function getAuthClient(request: NextRequest) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const authHeader = request.headers.get('Authorization') || '';
    const accessToken = authHeader.replace('Bearer ', '');

    const client = createClient(url, anonKey, {
        global: {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        },
    });
    return client;
}

export async function POST(request: NextRequest) {
    try {
        const { sourceId, userId } = await request.json();
        const supabase = getAuthClient(request);

        // If sourceId is given, sync just that source
        if (sourceId) {
            const { data: source, error } = await supabase
                .from('sources')
                .select('*')
                .eq('id', sourceId)
                .single();

            if (error || !source) {
                return NextResponse.json({ error: 'Quelle nicht gefunden' }, { status: 404 });
            }

            const result = await syncSource(supabase, source);
            return NextResponse.json(result);
        }

        // If userId is given, sync all sources for that user
        if (userId) {
            const { data: sources, error } = await supabase
                .from('sources')
                .select('*')
                .eq('user_id', userId)
                .eq('active', true);

            if (error || !sources) {
                return NextResponse.json({ error: 'Keine Quellen gefunden' }, { status: 404 });
            }

            const results = [];
            for (const source of sources) {
                try {
                    const result = await syncSource(supabase, source);
                    results.push(result);
                } catch (err: any) {
                    results.push({ sourceId: source.id, error: err.message });
                }
            }

            return NextResponse.json({ results });
        }

        return NextResponse.json({ error: 'sourceId oder userId erforderlich' }, { status: 400 });
    } catch (error: any) {
        console.error('Sync error:', error);
        return NextResponse.json({ error: error.message || 'Sync fehlgeschlagen' }, { status: 500 });
    }
}

async function syncSource(supabase: any, source: any) {
    const logEntry = {
        user_id: source.user_id,
        source_id: source.id,
        status: 'started',
        videos_found: 0,
        videos_new: 0,
        started_at: new Date().toISOString(),
    };

    const { data: log } = await supabase
        .from('sync_logs')
        .insert(logEntry)
        .select()
        .single();

    try {
        let videos;

        if (source.type === 'channel') {
            // Use RSS feed (quota-free)
            videos = await fetchChannelRSS(source.external_id);
        } else {
            // Playlist
            videos = await fetchPlaylistRSS(source.external_id);
        }

        // Filter only new videos since last sync
        if (source.last_seen_published_at) {
            const lastSeen = new Date(source.last_seen_published_at);
            videos = videos.filter(v => new Date(v.publishedAt) > lastSeen);
        }

        // Apply title filter if set on this source
        if (source.title_filter) {
            const filterLower = source.title_filter.toLowerCase();
            videos = videos.filter(v => v.title.toLowerCase().includes(filterLower));
        }

        let newCount = 0;

        for (const video of videos) {
            // Upsert video (skip duplicates)
            const { error: insertErr } = await supabase
                .from('video_items')
                .upsert({
                    user_id: source.user_id,
                    video_id: video.videoId,
                    source_id: source.id,
                    title: video.title,
                    description: video.description,
                    channel_title: video.channelTitle,
                    channel_id: video.channelId,
                    thumbnail_url: video.thumbnailUrl,
                    thumbnail_medium_url: video.thumbnailMediumUrl,
                    thumbnail_high_url: video.thumbnailHighUrl,
                    published_at: video.publishedAt,
                }, {
                    onConflict: 'user_id,video_id,source_id',
                    ignoreDuplicates: true,
                });

            if (!insertErr) newCount++;
        }

        // Batch-fetch durations for new videos (for Shorts filtering)
        if (videos.length > 0) {
            try {
                const videoIds = videos.map(v => v.videoId);
                const durations = await fetchVideoDurations(videoIds);

                for (const [videoId, duration] of durations) {
                    await supabase
                        .from('video_items')
                        .update({ duration })
                        .eq('user_id', source.user_id)
                        .eq('video_id', videoId);
                }
            } catch {
                // Duration fetch is optional, don't fail sync
            }
        }

        // Update source sync status
        const latestPublished = videos.length > 0
            ? videos.reduce((latest, v) => v.publishedAt > latest.publishedAt ? v : latest).publishedAt
            : source.last_seen_published_at;

        await supabase
            .from('sources')
            .update({
                last_sync_at: new Date().toISOString(),
                last_seen_published_at: latestPublished || source.last_seen_published_at,
                last_video_id: videos[0]?.videoId || source.last_video_id,
                error_count: 0,
                last_error: null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', source.id);

        // Update log
        if (log) {
            await supabase
                .from('sync_logs')
                .update({
                    status: 'success',
                    videos_found: videos.length,
                    videos_new: newCount,
                    completed_at: new Date().toISOString(),
                })
                .eq('id', log.id);
        }

        return {
            sourceId: source.id,
            title: source.title,
            videosFound: videos.length,
            videosNew: newCount,
            status: 'success',
        };
    } catch (err: any) {
        // Update source error count
        await supabase
            .from('sources')
            .update({
                error_count: (source.error_count || 0) + 1,
                last_error: err.message,
                updated_at: new Date().toISOString(),
            })
            .eq('id', source.id);

        // Update log
        if (log) {
            await supabase
                .from('sync_logs')
                .update({
                    status: 'error',
                    error_message: err.message,
                    completed_at: new Date().toISOString(),
                })
                .eq('id', log.id);
        }

        throw err;
    }
}
