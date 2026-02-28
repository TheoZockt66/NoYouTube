/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { VideoItem } from '@/lib/supabase';
import { formatRelativeTime, formatDuration, formatViewCount } from '@/lib/youtube-utils';
import { Eye, Bookmark, BookmarkCheck, EyeOff, Play, Sparkles, Loader2, ChevronUp } from 'lucide-react';

interface VideoSummaryData {
    tldr: string;
    bullets: string[];
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

    const [summary, setSummary] = useState<VideoSummaryData | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryOpen, setSummaryOpen] = useState(false);
    const [summaryError, setSummaryError] = useState('');

    const handleSummarize = async () => {
        if (summary) {
            setSummaryOpen(!summaryOpen);
            return;
        }

        setSummaryLoading(true);
        setSummaryError('');
        setSummaryOpen(true);

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

            setSummary({
                tldr: data.summary.tldr || '',
                bullets: data.summary.bullets || [],
                why_relevant: data.summary.why_relevant || '',
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Fehler';
            setSummaryError(message);
        } finally {
            setSummaryLoading(false);
        }
    };

    return (
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
                            disabled={summaryLoading}
                        >
                            {summaryLoading ? (
                                <Loader2 size={16} className="video-card__spin" />
                            ) : summaryOpen && summary ? (
                                <ChevronUp size={16} />
                            ) : (
                                <Sparkles size={16} />
                            )}
                        </button>
                    )}
                </div>

                {/* AI Summary display */}
                {summaryOpen && (
                    <div className="video-card__summary">
                        {summaryLoading && (
                            <div className="video-card__summary-loading">
                                <Loader2 size={16} className="video-card__spin" />
                                <span>Zusammenfassung wird erstellt...</span>
                            </div>
                        )}

                        {summaryError && (
                            <div className="video-card__summary-error">{summaryError}</div>
                        )}

                        {summary && (
                            <>
                                <div className="video-card__summary-tldr">
                                    <Sparkles size={12} />
                                    {summary.tldr}
                                </div>

                                {summary.bullets && summary.bullets.length > 0 && (
                                    <ul className="video-card__summary-bullets">
                                        {summary.bullets.map((bullet, i) => (
                                            <li key={i}>{bullet}</li>
                                        ))}
                                    </ul>
                                )}

                                {summary.why_relevant && (
                                    <div className="video-card__summary-relevant">
                                        {summary.why_relevant}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
