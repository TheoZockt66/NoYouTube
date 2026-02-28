// YouTube URL parsing utilities

/**
 * Extract channelId from various YouTube channel URL formats:
 * - https://www.youtube.com/channel/UC...
 * - https://www.youtube.com/@handle
 * - https://www.youtube.com/c/CustomName
 * - Just a channelId like "UC..."
 */
export function parseChannelInput(input: string): { type: 'channelId' | 'handle' | 'customUrl'; value: string } | null {
    const trimmed = input.trim();

    // Direct channelId (starts with UC)
    if (/^UC[\w-]{22}$/.test(trimmed)) {
        return { type: 'channelId', value: trimmed };
    }

    try {
        const url = new URL(trimmed);
        const path = url.pathname;

        // /channel/UC...
        const channelMatch = path.match(/^\/channel\/(UC[\w-]{22})/);
        if (channelMatch) {
            return { type: 'channelId', value: channelMatch[1] };
        }

        // /@handle
        const handleMatch = path.match(/^\/@([\w.-]+)/);
        if (handleMatch) {
            return { type: 'handle', value: handleMatch[1] };
        }

        // /c/CustomName
        const customMatch = path.match(/^\/c\/([\w.-]+)/);
        if (customMatch) {
            return { type: 'customUrl', value: customMatch[1] };
        }

        // /user/Username (legacy)
        const userMatch = path.match(/^\/user\/([\w.-]+)/);
        if (userMatch) {
            return { type: 'customUrl', value: userMatch[1] };
        }
    } catch {
        // Not a URL, check if it's a handle
        if (trimmed.startsWith('@')) {
            return { type: 'handle', value: trimmed.slice(1) };
        }
    }

    return null;
}

/**
 * Extract playlistId from various YouTube playlist URL formats:
 * - https://www.youtube.com/playlist?list=PL...
 * - Just a playlistId like "PL..."
 */
export function parsePlaylistInput(input: string): string | null {
    const trimmed = input.trim();

    // Direct playlistId
    if (/^(PL|UU|LL|FL|OL|RD|UL)[\w-]+$/.test(trimmed)) {
        return trimmed;
    }

    try {
        const url = new URL(trimmed);
        const listParam = url.searchParams.get('list');
        if (listParam) {
            return listParam;
        }
    } catch {
        // not a URL
    }

    return null;
}

/**
 * Format a YouTube video duration from ISO 8601 to human readable
 * e.g. "PT1H2M30S" -> "1:02:30"
 */
export function formatDuration(isoDuration: string | null): string {
    if (!isoDuration) return '';

    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '';

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Format view count to human readable (German style)
 */
export function formatViewCount(count: number | null): string {
    if (count === null || count === undefined) return '';
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace('.', ',')} Mio.`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace('.', ',')} Tsd.`;
    return count.toLocaleString('de-DE');
}

/**
 * Format relative time in German
 */
export function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMin < 1) return 'Gerade eben';
    if (diffMin < 60) return `vor ${diffMin} Min.`;
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    if (diffWeeks < 4) return `vor ${diffWeeks} Wo.`;
    if (diffMonths < 12) return `vor ${diffMonths} Mon.`;
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Default category colors
export const CATEGORY_COLORS = [
    '#0A84FF', // Blue
    '#FF3B30', // Red
    '#00C853', // Green  
    '#FF9500', // Orange
    '#AF52DE', // Purple
    '#FF2D55', // Pink
    '#5AC8FA', // Light Blue
    '#FFCC00', // Yellow
];
