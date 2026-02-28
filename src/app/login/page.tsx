'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextInput, PasswordInput, Button, Stack, Text, Anchor } from '@mantine/core';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Bitte E-Mail und Passwort eingeben.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                setError('Ungültige Anmeldedaten. Bitte versuche es erneut.');
                setLoading(false);
                return;
            }

            router.push('/');
        } catch (err) {
            setError('Verbindung zum Server fehlgeschlagen. Bitte prüfe deine Internetverbindung und versuche es erneut.');
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    No<span>YouTube</span>
                </div>
                <div className="auth-subtitle">
                    Melde dich an, um deinen Feed zu sehen.
                </div>

                <Stack gap="md">
                    <TextInput
                        label="E-Mail"
                        placeholder="deine@email.de"
                        value={email}
                        onChange={(e) => setEmail(e.currentTarget.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        styles={{
                            input: { backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' },
                            label: { color: 'rgba(255,255,255,0.7)' },
                        }}
                    />

                    <PasswordInput
                        label="Passwort"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.currentTarget.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        styles={{
                            input: { backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' },
                            label: { color: 'rgba(255,255,255,0.7)' },
                        }}
                    />

                    {error && <Text c="red" size="sm">{error}</Text>}

                    <Button
                        onClick={handleLogin}
                        loading={loading}
                        fullWidth
                        styles={{ root: { backgroundColor: '#fff', color: '#000' } }}
                    >
                        Anmelden
                    </Button>

                    <Text size="sm" ta="center" style={{ opacity: 0.5 }}>
                        Noch kein Konto?{' '}
                        <Anchor component={Link} href="/register" style={{ color: '#0A84FF' }}>
                            Registrieren
                        </Anchor>
                    </Text>
                </Stack>
            </div>
        </div>
    );
}
