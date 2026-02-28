'use client';

import { Modal, Stack, Text, Button, Group } from '@mantine/core';
import { Trash2 } from 'lucide-react';

interface ConfirmDialogProps {
    opened: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    confirmLabel?: string;
    loading?: boolean;
}

export function ConfirmDialog({
    opened,
    onClose,
    onConfirm,
    title = 'Löschen bestätigen',
    message,
    confirmLabel = 'Löschen',
    loading = false,
}: ConfirmDialogProps) {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title=""
            withCloseButton={false}
            size="sm"
            styles={{
                body: { backgroundColor: '#0a0a0a', textAlign: 'center', padding: '2rem' },
                content: { backgroundColor: '#0a0a0a' },
            }}
        >
            <Stack align="center" gap="lg">
                <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,59,48,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Trash2 size={28} color="#FF3B30" />
                </div>

                <Text fw={600} size="lg">{title}</Text>
                <Text size="sm" style={{ opacity: 0.6 }}>{message}</Text>

                <Group gap="md" w="100%">
                    <Button
                        variant="subtle"
                        color="gray"
                        flex={1}
                        onClick={onClose}
                    >
                        Abbrechen
                    </Button>
                    <Button
                        color="red"
                        flex={1}
                        onClick={onConfirm}
                        loading={loading}
                        styles={{ root: { backgroundColor: '#FF3B30' } }}
                    >
                        {confirmLabel}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
