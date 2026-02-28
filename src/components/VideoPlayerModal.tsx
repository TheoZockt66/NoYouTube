'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Minimize2, Maximize2, Save, StickyNote } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface VideoPlayerModalProps {
    videoId: string;
    videoItemId: string;
    title: string;
    userId: string;
    onClose: () => void;
}

export function VideoPlayerModal({ videoId, videoItemId, title, userId, onClose }: VideoPlayerModalProps) {
    const [minimized, setMinimized] = useState(false);
    const [note, setNote] = useState('');
    const [savedNote, setSavedNote] = useState('');
    const [showNotes, setShowNotes] = useState(false);
    const [saving, setSaving] = useState(false);

    // Load existing note
    useEffect(() => {
        if (!videoItemId || !userId) return;
        supabase
            .from('video_notes')
            .select('note')
            .eq('video_item_id', videoItemId)
            .eq('user_id', userId)
            .maybeSingle()
            .then(({ data }) => {
                if (data?.note) {
                    setNote(data.note);
                    setSavedNote(data.note);
                }
            });
    }, [videoItemId, userId]);

    const handleSaveNote = useCallback(async () => {
        if (!videoItemId || !userId) return;
        setSaving(true);
        await supabase
            .from('video_notes')
            .upsert({
                video_item_id: videoItemId,
                user_id: userId,
                note: note.trim(),
                updated_at: new Date().toISOString(),
            }, { onConflict: 'video_item_id,user_id' });
        setSavedNote(note.trim());
        setSaving(false);
    }, [videoItemId, userId, note]);

    const hasUnsaved = note.trim() !== savedNote;

    if (minimized) {
        return (
            <div className="pip-player">
                <div className="pip-player__video">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                        title={title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
                <div className="pip-player__controls">
                    <span className="pip-player__title">{title}</span>
                    <div className="pip-player__buttons">
                        <button onClick={() => setMinimized(false)} title="Maximieren">
                            <Maximize2 size={14} />
                        </button>
                        <button onClick={onClose} title="Schließen">
                            <X size={14} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="video-modal-overlay" onClick={onClose}>
            <div className="video-modal" onClick={(e) => e.stopPropagation()}>
                <div className="video-modal__header">
                    <h3 className="video-modal__title">{title}</h3>
                    <div className="video-modal__header-actions">
                        <button
                            className={`video-modal__action ${showNotes ? 'video-modal__action--active' : ''}`}
                            onClick={() => setShowNotes(!showNotes)}
                            title="Notizen"
                        >
                            <StickyNote size={16} />
                        </button>
                        <button
                            className="video-modal__action"
                            onClick={() => setMinimized(true)}
                            title="Minimieren (Bild-in-Bild)"
                        >
                            <Minimize2 size={16} />
                        </button>
                        <button className="video-modal__close" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>
                <div className="video-modal__player">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                        title={title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>

                {/* Notes section */}
                {showNotes && (
                    <div className="video-modal__notes">
                        <textarea
                            className="video-modal__notes-input"
                            placeholder="Notizen zu diesem Video..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                        />
                        <div className="video-modal__notes-actions">
                            <span className="video-modal__notes-status">
                                {saving ? 'Speichert...' : hasUnsaved ? 'Ungespeichert' : savedNote ? 'Gespeichert ✓' : ''}
                            </span>
                            <button
                                className="video-modal__notes-save"
                                onClick={handleSaveNote}
                                disabled={saving || !hasUnsaved}
                            >
                                <Save size={14} />
                                Speichern
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
