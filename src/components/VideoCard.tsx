/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { VideoItem } from '@/lib/supabase';
import { formatRelativeTime, formatDuration, formatViewCount } from '@/lib/youtube-utils';
import { Eye, Bookmark, BookmarkCheck, EyeOff, Play, Sparkles } from 'lucide-react';
import { SummaryModal } from './SummaryModal';

interface SummaryData {
    tldr: string;
    topics: string[];
    facts: string[];
    sources_mentioned: string[];
    why_relevant: string;
}

interface VideoCardProps {
    video: VideoItem;
    onToggleWatched?: (video: VideoItem) => void;
    onToggleBookmark?: (video: VideoItem) => void;
    onHide?: (video: VideoItem) => void;
    onPlay?: (video: VideoItem) => void;
    accessToken?: string;
}

export function VideoCard({ video, onToggleWatched, onToggleBookmark, onHide, onPlay, accessToken }: VideoCardProps) {
    const thumbnail = video.thumbnail_high_url || video.thumbnail_medium_url || video.thumbnail_url;
    const isChannel = video.source?.type === 'channel';

    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryModalOpen, setSummaryModalOpen] = useState(false);
    const [summaryError, setSummaryError] = useState('');

    const handleSummarize = async () => {
        setSummaryModalOpen(true);

        // If already loaded, just show the modal
        if (summary) return;

        setSummaryLoading(true);
        setSummaryError('');

        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

            const res = await fetch('/api/summarize', {
                method: 'POST',
                headers,
                body: JSON.stringify({ videoItemId: video.id }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Zusammenfassung fehlgeschlagen');
            }

            // Parse the response — bullets is a JSONB object with topics, facts, sources_mentioned
            const raw = data.summary;
            const bullets = typeof raw.bullets === 'object' && !Array.isArray(raw.bullets)
                ? raw.bullets
                : { topics: [], facts: Array.isArray(raw.bullets) ? raw.bullets : [], sources_mentioned: [] };

            setSummary({
                tldr: raw.tldr || '',
                topics: bullets.topics || [],
                facts: bullets.facts || [],
                sources_mentioned: bullets.sources_mentioned || [],
                why_relevant: raw.why_relevant || '',
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Fehler';
            setSummaryError(message);
        } finally {
            setSummaryLoading(false);
        }
    };

    return (
        <>
            <div className={`video-card ${video.watched ? 'video-card--watched' : ''}`}>
                <div
                    className="video-card__thumbnail"
                    onClick={() => onPlay?.(video)}
                    role="button"
                    tabIndex={0}
                >
                    {thumbnail && (
                        <img
                            src={thumbnail}
                            alt={video.title}
                            loading="lazy"
                        />
                    )}
                    <div className="video-card__play-overlay">
                        <Play size={32} fill="white" />
                    </div>
                    {video.duration && (
                        <span className="video-card__duration">
                            {formatDuration(video.duration)}
                        </span>
                    )}
                </div>

                <div className="video-card__body">
                    <h3 className="video-card__title" onClick={() => onPlay?.(video)}>
                        {video.title}
                    </h3>

                    <div className="video-card__meta">
                        <span className="video-card__channel">{video.channel_title}</span>
                        <span className="video-card__dot">·</span>
                        <span className="video-card__date">{formatRelativeTime(video.published_at)}</span>
                        {video.view_count !== null && video.view_count !== undefined && (
                            <>
                                <span className="video-card__dot">·</span>
                                <span className="video-card__views">
                                    {formatViewCount(video.view_count)} Aufrufe
                                </span>
                            </>
                        )}
                    </div>

                    <div className="video-card__actions">
                        <button
                            className={`video-card__action ${video.watched ? 'video-card__action--active' : ''}`}
                            onClick={() => onToggleWatched?.(video)}
                            title={video.watched ? 'Als ungesehen markieren' : 'Als gesehen markieren'}
                        >
                            <Eye size={16} />
                        </button>
                        <button
                            className={`video-card__action ${video.bookmarked ? 'video-card__action--active' : ''}`}
                            onClick={() => onToggleBookmark?.(video)}
                            title={video.bookmarked ? 'Lesezeichen entfernen' : 'Lesezeichen setzen'}
                        >
                            {video.bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                        </button>
                        <button
                            className="video-card__action"
                            onClick={() => onHide?.(video)}
                            title="Video ausblenden"
                        >
                            <EyeOff size={16} />
                        </button>

                        {/* AI Summary button — only for channel videos */}
                        {isChannel && (
                            <button
                                className={`video-card__action video-card__action--ai ${summary ? 'video-card__action--active' : ''}`}
                                onClick={handleSummarize}
                                title="KI-Zusammenfassung"
                            >
                                <Sparkles size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Modal */}
            <SummaryModal
                opened={summaryModalOpen}
                onClose={() => setSummaryModalOpen(false)}
                summary={summary}
                loading={summaryLoading}
                error={summaryError}
                videoTitle={video.title}
                channelTitle={video.channel_title || ''}
            />
        </>
    );
}
