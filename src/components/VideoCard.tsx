/* eslint-disable @next/next/no-img-element */
'use client';

import { VideoItem } from '@/lib/supabase';
import { formatRelativeTime, formatDuration, formatViewCount } from '@/lib/youtube-utils';
import { Eye, Bookmark, BookmarkCheck, EyeOff, Play } from 'lucide-react';

interface VideoCardProps {
    video: VideoItem;
    onToggleWatched?: (video: VideoItem) => void;
    onToggleBookmark?: (video: VideoItem) => void;
    onHide?: (video: VideoItem) => void;
    onPlay?: (video: VideoItem) => void;
}

export function VideoCard({ video, onToggleWatched, onToggleBookmark, onHide, onPlay }: VideoCardProps) {
    const thumbnail = video.thumbnail_high_url || video.thumbnail_medium_url || video.thumbnail_url;

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
                </div>
            </div>
        </div>
    );
}
