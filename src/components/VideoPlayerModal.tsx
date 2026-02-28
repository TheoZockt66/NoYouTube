'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface VideoPlayerModalProps {
    videoId: string;
    title: string;
    onClose: () => void;
}

export function VideoPlayerModal({ videoId, title, onClose }: VideoPlayerModalProps) {
    return (
        <div className="video-modal-overlay" onClick={onClose}>
            <div className="video-modal" onClick={(e) => e.stopPropagation()}>
                <div className="video-modal__header">
                    <h3 className="video-modal__title">{title}</h3>
                    <button className="video-modal__close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="video-modal__player">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                        title={title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            </div>
        </div>
    );
}
