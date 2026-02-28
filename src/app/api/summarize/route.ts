/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function getAuthClient(request: NextRequest) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || '';

    return createClient(url, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
    });
}

export async function POST(request: NextRequest) {
    try {
        const supabase = getAuthClient(request);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
        }

        const { videoItemId } = await request.json();
        if (!videoItemId) {
            return NextResponse.json({ error: 'videoItemId fehlt' }, { status: 400 });
        }

        // Fetch the video item
        const { data: video, error: videoErr } = await supabase
            .from('video_items')
            .select('*, source:sources(id, type)')
            .eq('id', videoItemId)
            .single();

        if (videoErr || !video) {
            return NextResponse.json({ error: 'Video nicht gefunden' }, { status: 404 });
        }

        // Only for channel videos
        if (video.source?.type === 'playlist') {
            return NextResponse.json({ error: 'Zusammenfassungen nur für Kanal-Videos verfügbar' }, { status: 400 });
        }

        // Check if summary already exists
        const { data: existing } = await supabase
            .from('video_summaries')
            .select('*')
            .eq('video_id', video.video_id)
            .eq('user_id', user.id)
            .maybeSingle();

        if (existing?.tldr) {
            return NextResponse.json({ summary: existing });
        }

        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: 'Gemini API Key nicht konfiguriert' }, { status: 500 });
        }

        // Build prompt from video title + description
        const videoTitle = video.title || '';
        const videoDesc = video.description || '';
        const channelName = video.channel_title || '';

        const prompt = `Du bist ein hilfreicher Assistent. Fasse das folgende YouTube-Video zusammen.

Video-Titel: ${videoTitle}
Kanal: ${channelName}
Beschreibung: ${videoDesc}

Erstelle eine Zusammenfassung im folgenden JSON-Format (auf Deutsch):
{
  "tldr": "Ein prägnanter Satz, der den Kern des Videos beschreibt",
  "bullets": ["Punkt 1", "Punkt 2", "Punkt 3", "Punkt 4", "Punkt 5"],
  "why_relevant": "Warum dieses Video sehenswert sein könnte"
}

Antworte NUR mit dem JSON, ohne Markdown-Code-Blocks oder andere Formatierung.`;

        // Call Gemini API
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

        const geminiRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 1024,
                },
            }),
        });

        if (!geminiRes.ok) {
            const errData = await geminiRes.text();
            console.error('Gemini API error:', errData);
            return NextResponse.json({ error: 'Gemini API Fehler' }, { status: 500 });
        }

        const geminiData = await geminiRes.json();
        const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Parse JSON from response
        let parsed: { tldr?: string; bullets?: string[]; why_relevant?: string } = {};
        try {
            // Remove potential markdown code blocks
            const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            parsed = JSON.parse(cleaned);
        } catch {
            // If JSON parse fails, use raw text as tldr
            parsed = { tldr: responseText.trim(), bullets: [], why_relevant: '' };
        }

        // Store summary in DB
        const summaryData = {
            user_id: user.id,
            video_id: video.video_id,
            tldr: parsed.tldr || '',
            bullets: parsed.bullets || [],
            why_relevant: parsed.why_relevant || '',
            model_version: GEMINI_MODEL,
            input_type: 'description',
        };

        const { data: saved, error: saveErr } = await supabase
            .from('video_summaries')
            .upsert(summaryData, { onConflict: 'user_id,video_id' })
            .select()
            .single();

        if (saveErr) {
            console.error('Save summary error:', saveErr);
            // Still return the summary even if save fails
            return NextResponse.json({ summary: summaryData });
        }

        return NextResponse.json({ summary: saved });
    } catch (error: any) {
        console.error('Summarize error:', error);
        return NextResponse.json({ error: error.message || 'Zusammenfassung fehlgeschlagen' }, { status: 500 });
    }
}
