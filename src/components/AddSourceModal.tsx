/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { TextInput, Button, Stack, Group, Text, Badge, MultiSelect, Modal } from '@mantine/core';
import { Plus, Rss, Tv } from 'lucide-react';
import { supabase, Category } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';


interface AddSourceModalProps {
    opened: boolean;
    onClose: () => void;
    categories: Category[];
    onSourceAdded: () => void;
}

export function AddSourceModal({ opened, onClose, categories, onSourceAdded }: AddSourceModalProps) {
    const { user } = useAuth();
    const [sourceType, setSourceType] = useState<'channel' | 'playlist'>('channel');
    const [input, setInput] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resolvedInfo, setResolvedInfo] = useState<{ title: string; externalId: string; uploadsPlaylistId?: string } | null>(null);

    const handleResolve = async () => {
        setError('');
        setResolvedInfo(null);
        setLoading(true);

        try {
            const res = await fetch('/api/sources/resolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: sourceType, input }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Quelle konnte nicht gefunden werden');
            }

            const data = await res.json();
            setResolvedInfo(data);
        } catch (err: any) {
            setError(err.message || 'Fehler beim Auflösen der Quelle');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!user || !resolvedInfo) return;
        setLoading(true);
        setError('');

        try {
            // Add source
            const { data: source, error: sourceErr } = await supabase
                .from('sources')
                .insert({
                    user_id: user.id,
                    type: sourceType,
                    external_id: resolvedInfo.externalId,
                    title: resolvedInfo.title,
                    uploads_playlist_id: resolvedInfo.uploadsPlaylistId || null,
                    active: true,
                })
                .select()
                .single();

            if (sourceErr) {
                if (sourceErr.code === '23505') {
                    throw new Error('Diese Quelle wurde bereits hinzugefügt');
                }
                throw sourceErr;
            }

            // Add category assignments
            if (selectedCategories.length > 0 && source) {
                const assignments = selectedCategories.map(catId => ({
                    source_id: source.id,
                    category_id: catId,
                }));

                await supabase.from('source_categories').insert(assignments);
            }

            // Trigger initial sync
            fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceId: source.id }),
            }).catch(() => { }); // fire-and-forget

            onSourceAdded();
            handleReset();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Fehler beim Hinzufügen');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setInput('');
        setSourceType('channel');
        setSelectedCategories([]);
        setResolvedInfo(null);
        setError('');
    };

    const categoryOptions = categories.map(c => ({
        value: c.id,
        label: c.name,
    }));

    return (
        <Modal
            opened={opened}
            onClose={() => { handleReset(); onClose(); }}
            title="Quelle hinzufügen"
            size="lg"
            styles={{
                header: { backgroundColor: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,0.1)' },
                body: { backgroundColor: '#0a0a0a' },
                content: { backgroundColor: '#0a0a0a' },
            }}
        >
            <Stack gap="md">
                <Group gap="sm">
                    <Button
                        variant={sourceType === 'channel' ? 'filled' : 'subtle'}
                        leftSection={<Tv size={16} />}
                        onClick={() => { setSourceType('channel'); setResolvedInfo(null); }}
                        color={sourceType === 'channel' ? 'white' : 'gray'}
                        styles={sourceType === 'channel' ? {
                            root: { backgroundColor: '#fff', color: '#000' }
                        } : {}}
                    >
                        Kanal
                    </Button>
                    <Button
                        variant={sourceType === 'playlist' ? 'filled' : 'subtle'}
                        leftSection={<Rss size={16} />}
                        onClick={() => { setSourceType('playlist'); setResolvedInfo(null); }}
                        color={sourceType === 'playlist' ? 'white' : 'gray'}
                        styles={sourceType === 'playlist' ? {
                            root: { backgroundColor: '#fff', color: '#000' }
                        } : {}}
                    >
                        Playlist
                    </Button>
                </Group>

                <TextInput
                    label={sourceType === 'channel' ? 'Kanal-URL oder Channel-ID' : 'Playlist-URL oder Playlist-ID'}
                    placeholder={
                        sourceType === 'channel'
                            ? 'https://www.youtube.com/@MrBeast oder UC...'
                            : 'https://www.youtube.com/playlist?list=PL... oder PL...'
                    }
                    value={input}
                    onChange={(e) => setInput(e.currentTarget.value)}
                    styles={{
                        input: { backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' },
                        label: { color: 'rgba(255,255,255,0.7)' },
                    }}
                />

                {!resolvedInfo && (
                    <Button
                        onClick={handleResolve}
                        loading={loading}
                        disabled={!input.trim()}
                        styles={{ root: { backgroundColor: '#fff', color: '#000' } }}
                    >
                        Quelle prüfen
                    </Button>
                )}

                {resolvedInfo && (
                    <div className="resolve-result">
                        <Badge color="green" variant="light" size="sm">Gefunden</Badge>
                        <Text fw={600} mt="xs">{resolvedInfo.title}</Text>
                        <Text size="sm" style={{ opacity: 0.5 }}>{resolvedInfo.externalId}</Text>
                    </div>
                )}

                {resolvedInfo && (
                    <>
                        <MultiSelect
                            label="Kategorien (optional)"
                            placeholder="Kategorien auswählen..."
                            data={categoryOptions}
                            value={selectedCategories}
                            onChange={setSelectedCategories}
                            styles={{
                                input: { backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' },
                                label: { color: 'rgba(255,255,255,0.7)' },
                                dropdown: { backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' },
                            }}
                        />

                        <Button
                            onClick={handleAdd}
                            loading={loading}
                            leftSection={<Plus size={16} />}
                            styles={{ root: { backgroundColor: '#fff', color: '#000' } }}
                        >
                            Quelle hinzufügen
                        </Button>
                    </>
                )}

                {error && (
                    <Text c="red" size="sm">{error}</Text>
                )}
            </Stack>
        </Modal>
    );
}
