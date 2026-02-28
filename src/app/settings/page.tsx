'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Stack, Title, Text, Loader, Button } from '@mantine/core';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
    const router = useRouter();
    const { user, loading: authLoading, signOut } = useAuth();
    const [stats, setStats] = useState({ sources: 0, videos: 0, categories: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user) return;

        Promise.all([
            supabase.from('sources').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('video_items').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('categories').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        ]).then(([s, v, c]) => {
            setStats({
                sources: s.count || 0,
                videos: v.count || 0,
                categories: c.count || 0,
            });
            setLoading(false);
        });
    }, [user]);

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
