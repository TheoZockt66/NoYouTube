/* eslint-disable @next/next/no-img-element */
'use client';

import { Text, Stack, Group, Badge, Loader, Modal, Divider } from '@mantine/core';
import { Sparkles, BookOpen, Lightbulb, Link2 } from 'lucide-react';

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
                <Group gap={8}>
                    <Sparkles size={16} color="#a855f7" />
                    <Text fw={600} size="sm">KI-Analyse</Text>
                </Group>
            }
            size="lg"
            styles={{
                header: { backgroundColor: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px' },
                body: { backgroundColor: '#0a0a0a', padding: '16px' },
                content: { backgroundColor: '#0a0a0a', borderRadius: 16 },
                close: { color: 'rgba(255,255,255,0.5)' },
            }}
        >
            {/* Video info header */}
            <div className="summary-video-header">
                <Text size="sm" fw={600} lineClamp={2}>{videoTitle}</Text>
                <Text size="xs" c="dimmed" mt={2}>{channelTitle}</Text>
            </div>

            {loading && (
                <Stack align="center" py="xl" gap="sm">
                    <Loader size="sm" color="violet" />
                    <Text size="sm" c="dimmed">Analysiere Video...</Text>
                </Stack>
            )}

            {error && (
                <div className="summary-error">
                    <Text size="sm" c="red">{error}</Text>
                </div>
            )}

            {summary && (
                <Stack gap="lg">
                    {/* TLDR / Zusammenfassung */}
                    <div>
                        <div className="summary-label">
                            <Sparkles size={13} />
                            Zusammenfassung
                        </div>
                        <Text size="sm" className="summary-text">
                            {summary.tldr}
                        </Text>
                    </div>

                    <Divider color="rgba(255,255,255,0.06)" />

                    {/* Themen als Tags */}
                    {summary.topics && summary.topics.length > 0 && (
                        <div>
                            <div className="summary-label">
                                <BookOpen size={13} />
                                Themen
                            </div>
                            <Group gap={6} style={{ flexWrap: 'wrap' }}>
                                {summary.topics.map((topic, i) => (
                                    <Badge
                                        key={i}
                                        variant="light"
                                        color="violet"
                                        size="sm"
                                        radius="sm"
                                        styles={{ root: { textTransform: 'none', fontWeight: 500 } }}
                                    >
                                        {topic}
                                    </Badge>
                                ))}
                            </Group>
                        </div>
                    )}

                    <Divider color="rgba(255,255,255,0.06)" />

                    {/* Fakten */}
                    {summary.facts && summary.facts.length > 0 && (
                        <div>
                            <div className="summary-label">
                                <Lightbulb size={13} />
                                Wichtige Fakten & Aussagen
                            </div>
                            <div className="summary-facts-list">
                                {summary.facts.map((fact, i) => (
                                    <div key={i} className="summary-fact-item">
                                        <span className="summary-fact-num">{i + 1}</span>
                                        <Text size="sm" className="summary-fact-text">{fact}</Text>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quellen */}
                    {summary.sources_mentioned && summary.sources_mentioned.length > 0 && (
                        <>
                            <Divider color="rgba(255,255,255,0.06)" />
                            <div>
                                <div className="summary-label">
                                    <Link2 size={13} />
                                    Erwähnte Quellen & Referenzen
                                </div>
                                <Stack gap={6}>
                                    {summary.sources_mentioned.map((source, i) => (
                                        <div key={i} className="summary-source-item">
                                            <Text size="sm">{source}</Text>
                                        </div>
                                    ))}
                                </Stack>
                            </div>
                        </>
                    )}

                    {/* Relevanz */}
                    {summary.why_relevant && (
                        <>
                            <Divider color="rgba(255,255,255,0.06)" />
                            <div className="summary-relevance">
                                <Text size="sm">
                                    💡 {summary.why_relevant}
                                </Text>
                            </div>
                        </>
                    )}

                    <Text size="xs" c="dimmed" ta="center" mt={4} style={{ opacity: 0.5 }}>
                        Generiert mit Gemini AI · Basierend auf Titel & Beschreibung
                    </Text>
                </Stack>
            )}
        </Modal>
    );
}
