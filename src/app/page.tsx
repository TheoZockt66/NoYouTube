'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Stack, Title, Group, Button, Text, Loader, Badge } from '@mantine/core';
import { RefreshCw, Plus, Bookmark, LayoutGrid, CalendarDays } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase, Category, VideoItem } from '@/lib/supabase';

function authHeaders(accessToken: string | undefined) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    return headers;
}
import { VideoCard } from '@/components/VideoCard';
import { VideoPlayerModal } from '@/components/VideoPlayerModal';
import { AnimatedTabs } from '@/components/AnimatedTabs';

export default function FeedPage() {
    const router = useRouter();
    const { user, loading: authLoading, session } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [activeFilter, setActiveFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [viewMode, setViewMode] = useState<'date' | 'grid'>('date');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Load categories
    useEffect(() => {
        if (!user) return;
        supabase
            .from('categories')
            .select('*')
            .eq('user_id', user.id)
            .order('position', { ascending: true })
            .then(({ data }) => {
                setCategories(data || []);
            });
    }, [user]);

    // Load feed

    const loadFeed = useCallback(async (pageNum: number = 1, append: boolean = false) => {
        if (!user) return;
        setLoading(true);

        try {
            const params = new URLSearchParams({
                userId: user.id,
                page: String(pageNum),
                limit: '20',
                filter: activeFilter,
            });

            if (activeCategory !== 'all') {
                params.set('categoryId', activeCategory);
            }

            const res = await fetch(`/api/feed?${params}`, {
                headers: authHeaders(session?.access_token),
            });
            const data = await res.json();

            if (append) {
                setVideos(prev => [...prev, ...(data.videos || [])]);
            } else {
                setVideos(data.videos || []);
            }
            setHasMore(data.hasMore || false);
            setTotalCount(data.total || 0);
        } catch (err) {
            console.error('Feed load error:', err);
        } finally {
            setLoading(false);
        }
    }, [user, session, activeCategory, activeFilter]);

    useEffect(() => {
        setPage(1);
        loadFeed(1, false);
    }, [loadFeed]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadFeed(nextPage, true);
    };

    const handleSync = async () => {
        if (!user || syncing) return;
        setSyncing(true);

        try {
            await fetch('/api/sync', {
                method: 'POST',
                headers: authHeaders(session?.access_token),
                body: JSON.stringify({ userId: user.id }),
            });

            // Reload feed after sync
            await loadFeed(1, false);
            setPage(1);
        } catch (err) {
            console.error('Sync error:', err);
        } finally {
            setSyncing(false);
        }
    };

    const handleToggleWatched = async (video: VideoItem) => {
        await supabase
            .from('video_items')
            .update({ watched: !video.watched })
            .eq('id', video.id);

        setVideos(prev => prev.map(v =>
            v.id === video.id ? { ...v, watched: !v.watched } : v
        ));
    };

    const handleToggleBookmark = async (video: VideoItem) => {
        await supabase
            .from('video_items')
            .update({ bookmarked: !video.bookmarked })
            .eq('id', video.id);

        setVideos(prev => prev.map(v =>
            v.id === video.id ? { ...v, bookmarked: !v.bookmarked } : v
        ));
    };

    const handleHideVideo = async (video: VideoItem) => {
        await supabase
            .from('video_items')
            .update({ hidden: true })
            .eq('id', video.id);

        setVideos(prev => prev.filter(v => v.id !== video.id));
    };

    if (authLoading) {
        return (
            <Container size="sm" py="xl" style={{ display: 'flex', justifyContent: 'center' }}>
                <Loader color="white" />
            </Container>
        );
    }

    if (!user) return null;

    // Category tabs
    const categoryTabs = [
        { id: 'all', label: 'Alle' },
        ...categories.map(c => ({ id: c.id, label: c.name })),
        { id: 'bookmarks', label: '⭐ Merkliste' },
    ];

    const filterTabs = [
        { id: 'all', label: 'Alle' },
        { id: 'channel', label: 'Kanäle' },
        { id: 'playlist', label: 'Playlists' },
    ];

    return (
        <Container size="md" px="md" py="lg">
            <Stack gap="lg">
                {/* Header */}
                <Group justify="space-between" align="center">
                    <div>
                        <Title order={1} style={{ fontSize: 28 }}>
                            No<span style={{ color: '#FF0000' }}>YouTube</span>
                        </Title>
                        <Text size="sm" style={{ opacity: 0.4 }}>
                            Dein personalisierter Feed
                        </Text>
                    </div>
                    <Button
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={handleSync}
                        loading={syncing}
                        leftSection={<RefreshCw size={14} />}
                    >
                        Sync
                    </Button>
                </Group>

                {/* Category tabs */}
                <AnimatedTabs
                    tabs={categoryTabs}
                    activeTab={activeCategory}
                    onTabChange={(id) => {
                        setActiveCategory(id);
                        setPage(1);
                    }}
                />

                {/* Filter tabs */}
                <Group gap="xs">
                    <AnimatedTabs
                        tabs={filterTabs}
                        activeTab={activeFilter}
                        onTabChange={(id) => {
                            setActiveFilter(id);
                            setPage(1);
                        }}
                    />
                    {totalCount > 0 && (
                        <Badge variant="light" color="gray" size="sm">
                            {totalCount} Videos
                        </Badge>
                    )}
                    <button
                        className="video-card__action"
                        onClick={() => setViewMode(viewMode === 'date' ? 'grid' : 'date')}
                        title={viewMode === 'date' ? 'Grid-Ansicht' : 'Zeitansicht'}
                        style={{ marginLeft: 'auto' }}
                    >
                        {viewMode === 'date' ? <LayoutGrid size={18} /> : <CalendarDays size={18} />}
                    </button>
                </Group>

                {/* Syncing indicator */}
                {syncing && (
                    <div className="sync-indicator">
                        <div className="sync-indicator__dot" />
                        Synchronisiere neue Videos...
                    </div>
                )}

                {/* Video grid */}
                {loading && videos.length === 0 ? (
                    <Stack gap="md">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />
                        ))}
                    </Stack>
                ) : videos.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">
                            <Bookmark size={28} />
                        </div>
                        <div className="empty-state__title">Noch keine Videos</div>
                        <div className="empty-state__description">
                            Füge Kanäle oder Playlists hinzu, um deinen Feed zu füllen.
                        </div>
                        <Button
                            mt="lg"
                            leftSection={<Plus size={16} />}
                            onClick={() => router.push('/sources')}
                            styles={{ root: { backgroundColor: '#fff', color: '#000' } }}
                        >
                            Quellen hinzufügen
                        </Button>
                    </div>
                ) : viewMode === 'grid' ? (
                    /* Grid view — flat list */
                    <div className="video-grid">
                        {videos.map(video => (
                            <VideoCard
                                key={video.id}
                                video={video}
                                onPlay={(v) => setPlayingVideo(v)}
                                onToggleWatched={handleToggleWatched}
                                onToggleBookmark={handleToggleBookmark}
                                onHide={handleHideVideo}
                                accessToken={session?.access_token}
                            />
                        ))}
                    </div>
                ) : (
                    /* Date-grouped view */
                    <Stack gap="xl">
                        {(() => {
                            const groups: { label: string; videos: VideoItem[] }[] = [];
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const yesterday = new Date(today);
                            yesterday.setDate(yesterday.getDate() - 1);

                            const formatDateLabel = (date: Date) => {
                                const d = new Date(date);
                                d.setHours(0, 0, 0, 0);
                                if (d.getTime() === today.getTime()) return 'Heute';
                                if (d.getTime() === yesterday.getTime()) return 'Gestern';
                                return d.toLocaleDateString('de-DE', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                });
                            };

                            let currentLabel = '';
                            for (const video of videos) {
                                const label = formatDateLabel(new Date(video.published_at));
                                if (label !== currentLabel) {
                                    currentLabel = label;
                                    groups.push({ label, videos: [] });
                                }
                                groups[groups.length - 1].videos.push(video);
                            }

                            return groups.map((group) => (
                                <div key={group.label}>
                                    <Text
                                        size="sm"
                                        fw={600}
                                        mb="sm"
                                        style={{ opacity: 0.5, textTransform: 'capitalize' }}
                                    >
                                        {group.label}
                                    </Text>
                                    <div className="video-grid">
                                        {group.videos.map(video => (
                                            <VideoCard
                                                key={video.id}
                                                video={video}
                                                onPlay={(v) => setPlayingVideo(v)}
                                                onToggleWatched={handleToggleWatched}
                                                onToggleBookmark={handleToggleBookmark}
                                                onHide={handleHideVideo}
                                                accessToken={session?.access_token}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ));
                        })()}
                    </Stack>
                )}

                {/* Load more */}
                {hasMore && !loading && (
                    <Button
                        variant="subtle"
                        color="gray"
                        fullWidth
                        onClick={handleLoadMore}
                    >
                        Mehr laden
                    </Button>
                )}

                {loading && videos.length > 0 && (
                    <Group justify="center" py="md">
                        <Loader size="sm" color="gray" />
                    </Group>
                )}
            </Stack>

            {/* Video Player Modal */}
            {playingVideo && (
                <VideoPlayerModal
                    videoId={playingVideo.video_id}
                    videoItemId={playingVideo.id}
                    title={playingVideo.title}
                    userId={user?.id || ''}
                    onClose={() => {
                        setPlayingVideo(null);
                        // Mark as watched
                        if (!playingVideo.watched) {
                            handleToggleWatched(playingVideo);
                        }
                    }}
                />
            )}
        </Container>
    );
}
