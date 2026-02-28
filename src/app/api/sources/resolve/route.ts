/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { resolveChannel, resolvePlaylist } from '@/lib/youtube-api';
import { parseChannelInput, parsePlaylistInput } from '@/lib/youtube-utils';

export async function POST(request: NextRequest) {
    try {
        const { type, input } = await request.json();

        if (!input || !type) {
            return NextResponse.json({ error: 'Typ und Eingabe erforderlich' }, { status: 400 });
        }

        if (type === 'channel') {
            const parsed = parseChannelInput(input);
            if (!parsed) {
                return NextResponse.json({ error: 'Ungültige Kanal-URL oder ID' }, { status: 400 });
            }

            // Try to resolve via YouTube API
            const apiKey = process.env.YOUTUBE_API_KEY;
            if (apiKey) {
                let searchValue = parsed.value;
                if (parsed.type === 'handle') searchValue = '@' + parsed.value;

                const channelInfo = await resolveChannel(searchValue);
                if (channelInfo) {
                    return NextResponse.json({
                        title: channelInfo.title,
                        externalId: channelInfo.channelId,
                        uploadsPlaylistId: channelInfo.uploadsPlaylistId,
                        thumbnailUrl: channelInfo.thumbnailUrl,
                        description: channelInfo.description,
                    });
                }
            }

            // Fallback: try RSS feed to validate
            if (parsed.type === 'channelId') {
                try {
                    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${parsed.value}`;
                    const res = await fetch(rssUrl);
                    if (res.ok) {
                        const xml = await res.text();
                        const titleMatch = xml.match(/<title>([\s\S]*?)<\/title>/);
                        const title = titleMatch ? titleMatch[1].trim() : parsed.value;
                        return NextResponse.json({
                            title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
                            externalId: parsed.value,
                        });
                    }
                } catch { }
            }

            // No API key and no RSS: accept the input as-is
            return NextResponse.json({
                title: parsed.value,
                externalId: parsed.value,
            });
        }

        if (type === 'playlist') {
            const playlistId = parsePlaylistInput(input);
            if (!playlistId) {
                return NextResponse.json({ error: 'Ungültige Playlist-URL oder ID' }, { status: 400 });
            }

            // Try YouTube API
            const apiKey = process.env.YOUTUBE_API_KEY;
            if (apiKey) {
                const playlistInfo = await resolvePlaylist(playlistId);
                if (playlistInfo) {
                    return NextResponse.json({
                        title: playlistInfo.title,
                        externalId: playlistInfo.playlistId,
                        thumbnailUrl: playlistInfo.thumbnailUrl,
                        description: playlistInfo.description,
                    });
                }
            }

            // Fallback: try RSS
            try {
                const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
                const res = await fetch(rssUrl);
                if (res.ok) {
                    const xml = await res.text();
                    const titleMatch = xml.match(/<title>([\s\S]*?)<\/title>/);
                    const title = titleMatch ? titleMatch[1].trim() : playlistId;
                    return NextResponse.json({
                        title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
                        externalId: playlistId,
                    });
                }
            } catch { }

            return NextResponse.json({
                title: playlistId,
                externalId: playlistId,
            });
        }

        return NextResponse.json({ error: 'Ungültiger Typ' }, { status: 400 });
    } catch (error: any) {
        console.error('Resolve error:', error);
        return NextResponse.json({ error: error.message || 'Interner Fehler' }, { status: 500 });
    }
}
