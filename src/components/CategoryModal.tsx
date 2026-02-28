/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { TextInput, Button, Stack, Text, Modal, ColorSwatch, Group } from '@mantine/core';
import { supabase, Category } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { CATEGORY_COLORS } from '@/lib/youtube-utils';

interface CategoryModalProps {
    opened: boolean;
    onClose: () => void;
    onSaved: () => void;
    category?: Category | null; // null = create, defined = edit
}

export function CategoryModal({ opened, onClose, onSaved, category }: CategoryModalProps) {
    const { user } = useAuth();
    const [name, setName] = useState(category?.name || '');
    const [color, setColor] = useState(category?.color || CATEGORY_COLORS[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isEdit = !!category;

    const handleSave = async () => {
        if (!user || !name.trim()) return;
        setLoading(true);
        setError('');

        try {
            if (isEdit && category) {
                const { error: err } = await supabase
                    .from('categories')
                    .update({ name: name.trim(), color, updated_at: new Date().toISOString() })
                    .eq('id', category.id);
                if (err) throw err;
            } else {
                const { error: err } = await supabase
                    .from('categories')
                    .insert({
                        user_id: user.id,
                        name: name.trim(),
                        color,
                    });
                if (err) throw err;
            }

            onSaved();
            setName('');
            setColor(CATEGORY_COLORS[0]);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Fehler beim Speichern');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={isEdit ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
            styles={{
                header: { backgroundColor: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,0.1)' },
                body: { backgroundColor: '#0a0a0a' },
                content: { backgroundColor: '#0a0a0a' },
            }}
        >
            <Stack gap="md">
                <TextInput
                    label="Name"
                    placeholder="z.B. Tech, News, Sport..."
                    value={name}
                    onChange={(e) => setName(e.currentTarget.value)}
                    styles={{
                        input: { backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' },
                        label: { color: 'rgba(255,255,255,0.7)' },
                    }}
                />

                <div>
                    <Text size="sm" mb="xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Farbe</Text>
                    <Group gap="xs">
                        {CATEGORY_COLORS.map((c) => (
                            <ColorSwatch
                                key={c}
                                color={c}
                                onClick={() => setColor(c)}
                                style={{
                                    cursor: 'pointer',
                                    border: color === c ? '2px solid white' : '2px solid transparent',
                                    borderRadius: '50%',
                                }}
                                size={32}
                            />
                        ))}
                    </Group>
                </div>

                <Button
                    onClick={handleSave}
                    loading={loading}
                    disabled={!name.trim()}
                    styles={{ root: { backgroundColor: '#fff', color: '#000' } }}
                >
                    {isEdit ? 'Speichern' : 'Erstellen'}
                </Button>

                {error && <Text c="red" size="sm">{error}</Text>}
            </Stack>
        </Modal>
    );
}
