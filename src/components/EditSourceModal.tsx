/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { TextInput, Button, Stack, Text, MultiSelect, Modal } from '@mantine/core';
import { supabase, Source, Category } from '@/lib/supabase';

interface EditSourceModalProps {
    opened: boolean;
    onClose: () => void;
    onSaved: () => void;
    source: Source | null;
    categories: Category[];
}

export function EditSourceModal({ opened, onClose, onSaved, source, categories }: EditSourceModalProps) {
    const [title, setTitle] = useState('');
    const [titleFilter, setTitleFilter] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Load current data when modal opens
    useEffect(() => {
        if (opened && source) {
            setTitle(source.title);
            setTitleFilter(source.title_filter || '');
            setError('');

            // Load current category assignments
            supabase
                .from('source_categories')
                .select('category_id')
                .eq('source_id', source.id)
                .then(({ data }) => {
                    setSelectedCategories((data || []).map(d => d.category_id));
                });
        }
    }, [opened, source]);

    const handleSave = async () => {
        if (!source || !title.trim()) return;
        setLoading(true);
        setError('');

        try {
            // Update title
            const { error: updateErr } = await supabase
                .from('sources')
                .update({
                    title: title.trim(),
                    title_filter: titleFilter.trim() || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', source.id);

            if (updateErr) throw updateErr;

            // Update category assignments: delete old, insert new
            await supabase
                .from('source_categories')
                .delete()
                .eq('source_id', source.id);

            if (selectedCategories.length > 0) {
                const assignments = selectedCategories.map(catId => ({
                    source_id: source.id,
                    category_id: catId,
                }));
                await supabase.from('source_categories').insert(assignments);
            }

            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Fehler beim Speichern');
        } finally {
            setLoading(false);
        }
    };

    const categoryOptions = categories.map(c => ({
        value: c.id,
        label: c.name,
    }));

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Quelle bearbeiten"
            styles={{
                header: { backgroundColor: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,0.1)' },
                body: { backgroundColor: '#0a0a0a' },
                content: { backgroundColor: '#0a0a0a' },
            }}
        >
            <Stack gap="md">
                <TextInput
                    label="Titel"
                    placeholder="Name der Quelle"
                    value={title}
                    onChange={(e) => setTitle(e.currentTarget.value)}
                    styles={{
                        input: { backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' },
                        label: { color: 'rgba(255,255,255,0.7)' },
                    }}
                />

                <TextInput
                    label="Titel-Filter (optional)"
                    placeholder="z.B. Podcast, News, Review..."
                    description="Nur Videos mit diesem Text im Titel werden importiert"
                    value={titleFilter}
                    onChange={(e) => setTitleFilter(e.currentTarget.value)}
                    styles={{
                        input: { backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' },
                        label: { color: 'rgba(255,255,255,0.7)' },
                        description: { color: 'rgba(255,255,255,0.4)' },
                    }}
                />

                <MultiSelect
                    label="Kategorien"
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
                    onClick={handleSave}
                    loading={loading}
                    disabled={!title.trim()}
                    styles={{ root: { backgroundColor: '#fff', color: '#000' } }}
                >
                    Speichern
                </Button>

                {error && <Text c="red" size="sm">{error}</Text>}
            </Stack>
        </Modal>
    );
}
