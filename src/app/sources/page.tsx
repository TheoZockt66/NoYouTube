'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Stack, Title, Group, Button, Text, Loader, Badge, ActionIcon } from '@mantine/core';
import { Plus, Tv, ListVideo, Trash2, RefreshCw, AlertCircle, Edit2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase, Source, Category } from '@/lib/supabase';
import { AddSourceModal } from '@/components/AddSourceModal';
import { EditSourceModal } from '@/components/EditSourceModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { formatRelativeTime } from '@/lib/youtube-utils';

export default function SourcesPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [sources, setSources] = useState<Source[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [deleteSource, setDeleteSource] = useState<Source | null>(null);
    const [editSource, setEditSource] = useState<Source | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [syncingId, setSyncingId] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);

        const [sourcesRes, categoriesRes] = await Promise.all([
            supabase
                .from('sources')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false }),
            supabase
                .from('categories')
                .select('*')
                .eq('user_id', user.id)
                .order('position', { ascending: true }),
        ]);

        setSources(sourcesRes.data || []);
        setCategories(categoriesRes.data || []);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleDelete = async () => {
        if (!deleteSource) return;
        setDeleting(true);

        await supabase.from('sources').delete().eq('id', deleteSource.id);

        setSources(prev => prev.filter(s => s.id !== deleteSource.id));
        setDeleteSource(null);
        setDeleting(false);
    };

    const handleSyncSource = async (source: Source) => {
        setSyncingId(source.id);
        try {
            await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceId: source.id }),
            });
            await loadData();
        } catch (err) {
            console.error('Sync error:', err);
        } finally {
            setSyncingId(null);
        }
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
                {/* Header */}
                <Group justify="space-between" align="center">
                    <Title order={2}>Quellen</Title>
                    <Button
                        leftSection={<Plus size={16} />}
                        onClick={() => setShowAddModal(true)}
                        styles={{ root: { backgroundColor: '#fff', color: '#000' } }}
                    >
                        Hinzufügen
                    </Button>
                </Group>

                <Text size="sm" style={{ opacity: 0.5 }}>
                    YouTube-Kanäle und Playlists, die deinen Feed füllen.
                </Text>

                {/* Source list */}
                {loading ? (
                    <Stack gap="md">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 16 }} />
                        ))}
                    </Stack>
                ) : sources.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">
                            <Tv size={28} />
                        </div>
                        <div className="empty-state__title">Keine Quellen</div>
                        <div className="empty-state__description">
                            Füge YouTube-Kanäle oder Playlists hinzu, um neue Videos zu erhalten.
                        </div>
                    </div>
                ) : (
                    <Stack gap="sm">
                        {sources.map(source => (
                            <div key={source.id} className="source-card">
                                <div className="source-card__avatar">
                                    {source.type === 'channel' ? (
                                        <Tv size={20} style={{ color: 'var(--text-muted)' }} />
                                    ) : (
                                        <ListVideo size={20} style={{ color: 'var(--text-muted)' }} />
                                    )}
                                </div>

                                <div className="source-card__body">
                                    <div className="source-card__title">{source.title}</div>
                                    <div className="source-card__meta">
                                        <Badge
                                            size="xs"
                                            variant="light"
                                            color={source.type === 'channel' ? 'blue' : 'violet'}
                                            mr={4}
                                        >
                                            {source.type === 'channel' ? 'Kanal' : 'Playlist'}
                                        </Badge>
                                        {source.title_filter && (
                                            <Badge size="xs" variant="light" color="orange" mr={4}>
                                                Filter: {source.title_filter}
                                            </Badge>
                                        )}
                                        {source.last_sync_at && (
                                            <span>Sync: {formatRelativeTime(source.last_sync_at)}</span>
                                        )}
                                        {source.error_count > 0 && (
                                            <Badge size="xs" variant="light" color="red" ml={4} leftSection={<AlertCircle size={10} />}>
                                                Fehler
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="source-card__actions">
                                    <ActionIcon
                                        variant="subtle"
                                        color="gray"
                                        size="sm"
                                        onClick={() => setEditSource(source)}
                                    >
                                        <Edit2 size={14} />
                                    </ActionIcon>
                                    <ActionIcon
                                        variant="subtle"
                                        color="gray"
                                        size="sm"
                                        onClick={() => handleSyncSource(source)}
                                        loading={syncingId === source.id}
                                    >
                                        <RefreshCw size={14} />
                                    </ActionIcon>
                                    <ActionIcon
                                        variant="subtle"
                                        color="red"
                                        size="sm"
                                        onClick={() => setDeleteSource(source)}
                                    >
                                        <Trash2 size={14} />
                                    </ActionIcon>
                                </div>
                            </div>
                        ))}
                    </Stack>
                )}
            </Stack>

            {/* Add Source Modal */}
            <AddSourceModal
                opened={showAddModal}
                onClose={() => setShowAddModal(false)}
                categories={categories}
                onSourceAdded={loadData}
            />

            {/* Edit Source Modal */}
            <EditSourceModal
                opened={!!editSource}
                onClose={() => setEditSource(null)}
                onSaved={loadData}
                source={editSource}
                categories={categories}
            />

            {/* Delete Confirm */}
            <ConfirmDialog
                opened={!!deleteSource}
                onClose={() => setDeleteSource(null)}
                onConfirm={handleDelete}
                message={`"${deleteSource?.title}" und alle zugehörigen Videos werden gelöscht.`}
                loading={deleting}
            />
        </Container>
    );
}
