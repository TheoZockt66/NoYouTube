/* eslint-disable @next/next/no-img-element */
'use client';

import { Text, Stack, Group, Badge, Loader, Modal } from '@mantine/core';
import { Sparkles, BookOpen, Lightbulb, Link2, X } from 'lucide-react';

interface SummaryData {
    tldr: string;
    topics: string[];
    facts: string[];
    sources_mentioned: string[];
    why_relevant: string;
}

interface SummaryModalProps {
    opened: boolean;
    onClose: () => void;
    summary: SummaryData | null;
    loading: boolean;
    error: string;
    videoTitle: string;
    channelTitle: string;
}

export function SummaryModal({ opened, onClose, summary, loading, error, videoTitle, channelTitle }: SummaryModalProps) {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <Sparkles size={16} color="#a855f7" />
                    <Text fw={600} size="sm">KI-Zusammenfassung</Text>
                </Group>
            }
            size="lg"
            styles={{
                header: { backgroundColor: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,0.1)' },
                body: { backgroundColor: '#0a0a0a' },
                content: { backgroundColor: '#0a0a0a' },
                close: { color: 'rgba(255,255,255,0.5)' },
            }}
        >
            {/* Video info */}
            <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Text size="sm" fw={600} lineClamp={2}>{videoTitle}</Text>
                <Text size="xs" c="dimmed">{channelTitle}</Text>
            </div>

            {loading && (
                <Stack align="center" py="xl" gap="sm">
                    <Loader size="sm" color="violet" />
                    <Text size="sm" c="dimmed">Zusammenfassung wird erstellt...</Text>
                </Stack>
            )}

            {error && (
                <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.15)' }}>
                    <Group gap="xs">
                        <X size={14} color="#FF3B30" />
                        <Text size="sm" c="red">{error}</Text>
                    </Group>
                </div>
            )}

            {summary && (
                <Stack gap="md">
                    {/* TLDR */}
                    <div className="summary-section">
                        <div className="summary-section__header">
                            <Sparkles size={14} />
                            <span>Zusammenfassung</span>
                        </div>
                        <Text size="sm" style={{ lineHeight: 1.6 }}>{summary.tldr}</Text>
                    </div>

                    {/* Topics */}
                    {summary.topics && summary.topics.length > 0 && (
                        <div className="summary-section">
                            <div className="summary-section__header">
                                <BookOpen size={14} />
                                <span>Themen</span>
                            </div>
                            <Group gap="xs" style={{ flexWrap: 'wrap' }}>
                                {summary.topics.map((topic, i) => (
                                    <Badge key={i} variant="light" color="violet" size="sm" radius="sm">
                                        {topic}
                                    </Badge>
                                ))}
                            </Group>
                        </div>
                    )}

                    {/* Facts */}
                    {summary.facts && summary.facts.length > 0 && (
                        <div className="summary-section">
                            <div className="summary-section__header">
                                <Lightbulb size={14} />
                                <span>Wichtige Fakten</span>
                            </div>
                            <ul className="summary-facts">
                                {summary.facts.map((fact, i) => (
                                    <li key={i}>{fact}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Sources mentioned */}
                    {summary.sources_mentioned && summary.sources_mentioned.length > 0 && (
                        <div className="summary-section">
                            <div className="summary-section__header">
                                <Link2 size={14} />
                                <span>Erwähnte Quellen & Referenzen</span>
                            </div>
                            <Stack gap={4}>
                                {summary.sources_mentioned.map((source, i) => (
                                    <Text key={i} size="sm" style={{ opacity: 0.8, paddingLeft: 8, borderLeft: '2px solid rgba(168,85,247,0.3)' }}>
                                        {source}
                                    </Text>
                                ))}
                            </Stack>
                        </div>
                    )}

                    {/* Why relevant */}
                    {summary.why_relevant && (
                        <div className="summary-section summary-section--highlight">
                            <Text size="sm" style={{ lineHeight: 1.5, fontStyle: 'italic', opacity: 0.8 }}>
                                💡 {summary.why_relevant}
                            </Text>
                        </div>
                    )}

                    {/* Model info */}
                    <Text size="xs" c="dimmed" ta="center" mt="xs">
                        Generiert mit Gemini AI · Basierend auf Titel & Beschreibung
                    </Text>
                </Stack>
            )}
        </Modal>
    );
}
