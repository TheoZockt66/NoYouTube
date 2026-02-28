/* eslint-disable @typescript-eslint/no-unused-vars */
// YouTube Data API v3 helper (server-side)

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// RSS Feed base URL for channels
const YOUTUBE_RSS_BASE = 'https://www.youtube.com/feeds/videos.xml';

interface YouTubeChannelInfo {
    channelId: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    uploadsPlaylistId: string;
}

interface YouTubePlaylistInfo {
    playlistId: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    channelTitle: string;
    itemCount: number;
}

interface YouTubeVideoInfo {
    videoId: string;
    title: string;
    description: string;
    channelTitle: string;
    channelId: string;
    publishedAt: string;
    thumbnailUrl: string;
    thumbnailMediumUrl: string;
    thumbnailHighUrl: string;
}

// ==========================================
// RSS Feed Fetching (quota-free!)
// ==========================================

export async function fetchChannelRSS(channelId: string): Promise<YouTubeVideoInfo[]> {
    const url = `${YOUTUBE_RSS_BASE}?channel_id=${channelId}`;
    const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min
    if (!res.ok) throw new Error(`RSS fetch failed for channel ${channelId}: ${res.status}`);

    const xml = await res.text();
    return parseAtomFeed(xml);
}

export async function fetchPlaylistRSS(playlistId: string): Promise<YouTubeVideoInfo[]> {
    const url = `${YOUTUBE_RSS_BASE}?playlist_id=${playlistId}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`RSS fetch failed for playlist ${playlistId}: ${res.status}`);

    const xml = await res.text();
    return parseAtomFeed(xml);
}

function parseAtomFeed(xml: string): YouTubeVideoInfo[] {
    const videos: YouTubeVideoInfo[] = [];

    // Simple XML parsing for Atom feed entries
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
        const entry = match[1];

        const videoId = extractTag(entry, 'yt:videoId');
        const title = extractTag(entry, 'title');
        const channelId = extractTag(entry, 'yt:channelId');
        const published = extractTag(entry, 'published');

        // Extract author name
        const authorMatch = entry.match(/<author>\s*<name>(.*?)<\/name>/);
        const channelTitle = authorMatch ? authorMatch[1] : '';

        // Extract media:group thumbnail (not used directly, we construct URLs from videoId)
        const thumbMatch = entry.match(/url="(https:\/\/i[\d]*.ytimg\.com\/vi\/[^"]+)"/);
        const _thumbnailFromFeed = thumbMatch ? thumbMatch[1] : null;

        if (videoId && title) {
            videos.push({
                videoId,
                title: decodeXmlEntities(title),
                description: extractTag(entry, 'media:description') || '',
                channelTitle: decodeXmlEntities(channelTitle),
                channelId: channelId || '',
                publishedAt: published || new Date().toISOString(),
                thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/default.jpg`,
                thumbnailMediumUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
                thumbnailHighUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            });
        }
    }

    return videos;
}

function extractTag(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
    const match = xml.match(regex);
    return match ? match[1].trim() : '';
}

function decodeXmlEntities(text: string): string {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'");
}

// ==========================================
// Duration fetching (for Shorts filtering)
// ==========================================

/**
 * Batch-fetch video durations from YouTube Data API v3.
 * Returns a map of videoId → ISO 8601 duration string (e.g. "PT1M30S").
 * Handles up to 50 IDs per call.
 */
export async function fetchVideoDurations(videoIds: string[]): Promise<Map<string, string>> {
    const durations = new Map<string, string>();
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'your-youtube-api-key') return durations;
    if (videoIds.length === 0) return durations;

    // YouTube API allows max 50 IDs per request
    const chunks = [];
    for (let i = 0; i < videoIds.length; i += 50) {
        chunks.push(videoIds.slice(i, i + 50));
    }

    for (const chunk of chunks) {
        try {
            const ids = chunk.join(',');
            const url = `${YOUTUBE_API_BASE}/videos?part=contentDetails&id=${ids}&key=${YOUTUBE_API_KEY}`;
            const res = await fetch(url);
            if (!res.ok) continue;

            const data = await res.json();
            for (const item of (data.items || [])) {
                const duration = item.contentDetails?.duration;
                if (duration) {
                    durations.set(item.id, duration);
                }
            }
        } catch {
            // Silently continue if API call fails
        }
    }

    return durations;
}

/**
 * Parse ISO 8601 duration (e.g. "PT1M30S") to total seconds.
 */
export function parseDurationToSeconds(iso: string): number {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    return hours * 3600 + minutes * 60 + seconds;
}

// ==========================================
// YouTube Data API v3 (for validation/metadata)
// ==========================================

export async function resolveChannel(input: string): Promise<YouTubeChannelInfo | null> {
    if (!YOUTUBE_API_KEY) return null;

    // Try searching by handle or custom URL
    let url: string;

    if (input.startsWith('UC') && input.length === 24) {
        // Direct channelId
        url = `${YOUTUBE_API_BASE}/channels?part=snippet,contentDetails&id=${input}&key=${YOUTUBE_API_KEY}`;
    } else if (input.startsWith('@')) {
        // Handle
        url = `${YOUTUBE_API_BASE}/channels?part=snippet,contentDetails&forHandle=${input.slice(1)}&key=${YOUTUBE_API_KEY}`;
    } else {
        // Search
        url = `${YOUTUBE_API_BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(input)}&maxResults=1&key=${YOUTUBE_API_KEY}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.items?.length) return null;

        const channelId = data.items[0].snippet.channelId || data.items[0].id.channelId;
        // Re-fetch with channel details
        url = `${YOUTUBE_API_BASE}/channels?part=snippet,contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;
    }

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.items?.length) return null;

    const item = data.items[0];
    return {
        channelId: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails?.default?.url || '',
        uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads || '',
    };
}

export async function resolvePlaylist(playlistId: string): Promise<YouTubePlaylistInfo | null> {
    if (!YOUTUBE_API_KEY) return null;

    const url = `${YOUTUBE_API_BASE}/playlists?part=snippet,contentDetails&id=${playlistId}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.items?.length) return null;

    const item = data.items[0];
    return {
        playlistId: item.id,
        title: item.snippet.title,
        description: item.snippet.description || '',
        thumbnailUrl: item.snippet.thumbnails?.default?.url || '',
        channelTitle: item.snippet.channelTitle || '',
        itemCount: item.contentDetails?.itemCount || 0,
    };
}

export async function fetchPlaylistItems(
    playlistId: string,
    maxResults: number = 20,
    pageToken?: string
): Promise<{ videos: YouTubeVideoInfo[]; nextPageToken?: string }> {
    if (!YOUTUBE_API_KEY) return { videos: [] };

    let url = `${YOUTUBE_API_BASE}/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
    if (pageToken) url += `&pageToken=${pageToken}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`API fetch failed: ${res.status}`);

    const data = await res.json();

    const videos: YouTubeVideoInfo[] = (data.items || []).map((item: Record<string, unknown>) => {
        const snippet = item.snippet as Record<string, unknown>;
        const resourceId = snippet.resourceId as Record<string, string>;
        const thumbnails = snippet.thumbnails as Record<string, Record<string, string>>;
        return {
            videoId: resourceId.videoId,
            title: snippet.title as string,
            description: (snippet.description as string) || '',
            channelTitle: (snippet.channelTitle as string) || '',
            channelId: (snippet.channelId as string) || '',
            publishedAt: snippet.publishedAt as string,
            thumbnailUrl: thumbnails?.default?.url || '',
            thumbnailMediumUrl: thumbnails?.medium?.url || '',
            thumbnailHighUrl: thumbnails?.high?.url || '',
        };
    });

    return {
        videos,
        nextPageToken: data.nextPageToken,
    };
}

/**
 * Fetch ALL videos from a playlist by paginating through all pages.
 * Falls back to RSS (max 15) if no API key or if API key is invalid/exhausted.
 */
export async function fetchAllPlaylistItems(playlistId: string): Promise<YouTubeVideoInfo[]> {
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY.trim() === '') {
        // Fallback to RSS (max 15 items)
        return fetchPlaylistRSS(playlistId);
    }

    try {
        const allVideos: YouTubeVideoInfo[] = [];
        let pageToken: string | undefined;

        do {
            const result = await fetchPlaylistItems(playlistId, 50, pageToken);
            allVideos.push(...result.videos);
            pageToken = result.nextPageToken;
        } while (pageToken);

        return allVideos;
    } catch (error) {
        console.warn('YouTube API fetch failed (invalid key or quota exceeded). Falling back to RSS feed.', error);
        // Fallback to RSS if the API request fails
        return fetchPlaylistRSS(playlistId);
    }
}
