'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Stack, Title, Text, Loader, Button, Group, ActionIcon } from '@mantine/core';
import { LogOut, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';

interface HiddenVideo {
    id: string;
    video_id: string;
    title: string;
    channel_title: string;
    thumbnail_url: string;
    published_at: string;
}

export default function SettingsPage() {
    const router = useRouter();
    const { user, loading: authLoading, signOut } = useAuth();
    const [stats, setStats] = useState({ sources: 0, videos: 0, categories: 0 });
    const [loading, setLoading] = useState(true);
    const [hiddenVideos, setHiddenVideos] = useState<HiddenVideo[]>([]);
    const [hiddenCount, setHiddenCount] = useState(0);
    const [showHidden, setShowHidden] = useState(false);
    const [unhidingAll, setUnhidingAll] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const loadStats = useCallback(async () => {
        if (!user) return;

        const [s, v, c, h] = await Promise.all([
            supabase.from('sources').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('video_items').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('categories').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('video_items').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('hidden', true),
        ]);

        setStats({
            sources: s.count || 0,
            videos: v.count || 0,
            categories: c.count || 0,
        });
        setHiddenCount(h.count || 0);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const loadHiddenVideos = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('video_items')
            .select('id, video_id, title, channel_title, thumbnail_url, published_at')
            .eq('user_id', user.id)
            .eq('hidden', true)
            .order('published_at', { ascending: false });
        setHiddenVideos(data || []);
    };

    const handleToggleHiddenList = async () => {
        if (!showHidden) {
            await loadHiddenVideos();
        }
        setShowHidden(!showHidden);
    };

    const handleUnhideAll = async () => {
        if (!user) return;
        setUnhidingAll(true);
        await supabase
            .from('video_items')
            .update({ hidden: false })
            .eq('user_id', user.id)
            .eq('hidden', true);
        setHiddenVideos([]);
        setHiddenCount(0);
        setShowHidden(false);
        setUnhidingAll(false);
    };

    const handleUnhideOne = async (videoId: string) => {
        await supabase
            .from('video_items')
            .update({ hidden: false })
            .eq('id', videoId);
        setHiddenVideos(prev => prev.filter(v => v.id !== videoId));
        setHiddenCount(prev => prev - 1);
    };

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    if (authLoading) {
        return (
            <Container size="sm" py="xl" style={{ display: 'flex', justifyContent: 'center' }}>
                <Loader color="white" />
            </Container>
        );
    }

    if (!user) return null;

    return (
        <Container size="sm" px="md" py="lg">
            <Stack gap="lg">
                <Title order={2}>Einstellungen</Title>

                {/* Account */}
                <div>
                    <div className="section-label">Konto</div>
                    <Stack gap="sm">
                        <div className="settings-item">
                            <div>
                                <div className="settings-item__label">E-Mail</div>
                                <div className="settings-item__desc">{user.email}</div>
                            </div>
                        </div>
                    </Stack>
                </div>

                {/* Stats */}
                <div>
                    <div className="section-label">Statistiken</div>
                    <Stack gap="sm">
                        <div className="settings-item">
                            <div className="settings-item__label">Quellen</div>
                            <Text fw={600}>{loading ? '...' : stats.sources}</Text>
                        </div>
                        <div className="settings-item">
                            <div className="settings-item__label">Videos</div>
                            <Text fw={600}>{loading ? '...' : stats.videos}</Text>
                        </div>
                        <div className="settings-item">
                            <div className="settings-item__label">Kategorien</div>
                            <Text fw={600}>{loading ? '...' : stats.categories}</Text>
                        </div>
                    </Stack>
                </div>

                {/* Hidden Videos */}
                <div>
                    <div className="section-label">Ausgeblendete Videos</div>
                    <Stack gap="sm">
                        <div className="settings-item">
                            <div>
                                <div className="settings-item__label">
                                    <Group gap="xs">
                                        <EyeOff size={14} />
                                        {hiddenCount} Videos ausgeblendet
                                    </Group>
                                </div>
                            </div>
                            <Group gap="xs">
                                {hiddenCount > 0 && (
                                    <>
                                        <Button
                                            size="xs"
                                            variant="subtle"
                                            color="gray"
                                            onClick={handleToggleHiddenList}
                                            rightSection={showHidden ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        >
                                            Verwalten
                                        </Button>
                                        <Button
                                            size="xs"
                                            variant="light"
                                            onClick={handleUnhideAll}
                                            loading={unhidingAll}
                                            leftSection={<Eye size={14} />}
                                            styles={{ root: { backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff' } }}
                                        >
                                            Alle einblenden
                                        </Button>
                                    </>
                                )}
                            </Group>
                        </div>

                        {showHidden && hiddenVideos.length > 0 && (
                            <Stack gap="xs">
                                {hiddenVideos.map(video => (
                                    <div key={video.id} className="settings-item" style={{ padding: '10px 12px' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <Text size="sm" fw={500} lineClamp={1}>{video.title}</Text>
                                            <Text size="xs" c="dimmed">{video.channel_title}</Text>
                                        </div>
                                        <ActionIcon
                                            variant="subtle"
                                            color="gray"
                                            size="sm"
                                            onClick={() => handleUnhideOne(video.id)}
                                            title="Einblenden"
                                        >
                                            <Eye size={14} />
                                        </ActionIcon>
                                    </div>
                                ))}
                            </Stack>
                        )}
                    </Stack>
                </div>

                {/* Info */}
                <div>
                    <div className="section-label">Über</div>
                    <Stack gap="sm">
                        <div className="settings-item">
                            <div>
                                <div className="settings-item__label">NoYoutube</div>
                                <div className="settings-item__desc">Version 1.0.0</div>
                            </div>
                        </div>
                        <div className="settings-item">
                            <div>
                                <div className="settings-item__label">Sync-Strategie</div>
                                <div className="settings-item__desc">
                                    RSS/Atom Feeds (quota-frei) + YouTube Data API v3 als Fallback
                                </div>
                            </div>
                        </div>
                    </Stack>
                </div>

                {/* Actions */}
                <Stack gap="sm" mt="md">
                    <Button
                        variant="subtle"
                        color="red"
                        leftSection={<LogOut size={16} />}
                        onClick={handleSignOut}
                        fullWidth
                    >
                        Abmelden
                    </Button>
                </Stack>

                <Text size="xs" ta="center" style={{ opacity: 0.3, marginTop: 32 }}>
                    Dein personalisierter YouTube-Feed ohne Ablenkung.
                </Text>
            </Stack>
        </Container>
    );
}
