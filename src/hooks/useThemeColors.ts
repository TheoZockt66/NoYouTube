'use client';

import { useCallback } from 'react';

/**
 * Hook for dark/light theme-aware colors (matching FitRepublic pattern)
 */
export function useThemeColors() {
    // For now, default dark mode (like FitRepublic)
    const isDark = true;

    const bg = isDark ? '#000000' : '#ffffff';
    const fg = isDark ? '#ffffff' : '#000000';
    const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const cardBg = isDark ? '#0a0a0a' : '#ffffff';
    const subtleBg = isDark ? '#111111' : '#f5f5f5';
    const subtleText = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';

    return { isDark, bg, fg, border, cardBg, subtleBg, subtleText };
}
