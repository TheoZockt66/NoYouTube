'use client';

import { useState } from 'react';
import { TextInput, PasswordInput, Button, Stack, Text, Anchor } from '@mantine/core';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleRegister = async () => {
        if (!email || !password) {
            setError('Bitte alle Felder ausfüllen.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwörter stimmen nicht überein.');
            return;
        }

        if (password.length < 6) {
            setError('Passwort muss mindestens 6 Zeichen lang sein.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.signUp({ email, password });

            if (error) {
                setError(error.message);
                setLoading(false);
                return;
            }

            setSuccess(true);
            setLoading(false);
        } catch (err) {
            setError('Verbindung zum Server fehlgeschlagen. Bitte prüfe deine Internetverbindung und versuche es erneut.');
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-card" style={{ textAlign: 'center' }}>
                    <div className="auth-logo">
                        No<span>YouTube</span>
                    </div>
                    <Stack gap="md" mt="xl">
                        <Text fw={600} size="lg">Registrierung erfolgreich!</Text>
                        <Text size="sm" style={{ opacity: 0.6 }}>
                            Bitte prüfe deine E-Mail und bestätige dein Konto.
                        </Text>
                        <Button
                            component={Link}
                            href="/login"
                            styles={{ root: { backgroundColor: '#fff', color: '#000' } }}
                        >
                            Zur Anmeldung
                        </Button>
                    </Stack>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    No<span>YouTube</span>
                </div>
                <div className="auth-subtitle">
                    Erstelle ein Konto für deinen personalisierten Feed.
                </div>

                <Stack gap="md">
                    <TextInput
                        label="E-Mail"
                        placeholder="deine@email.de"
                        value={email}
                        onChange={(e) => setEmail(e.currentTarget.value)}
                        styles={{
                            input: { backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' },
                            label: { color: 'rgba(255,255,255,0.7)' },
                        }}
                    />

                    <PasswordInput
                        label="Passwort"
                        placeholder="Mindestens 6 Zeichen"
                        value={password}
                        onChange={(e) => setPassword(e.currentTarget.value)}
                        styles={{
                            input: { backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' },
                            label: { color: 'rgba(255,255,255,0.7)' },
                        }}
                    />

                    <PasswordInput
                        label="Passwort bestätigen"
                        placeholder="Passwort wiederholen"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                        styles={{
                            input: { backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' },
                            label: { color: 'rgba(255,255,255,0.7)' },
                        }}
                    />

                    {error && <Text c="red" size="sm">{error}</Text>}

                    <Button
                        onClick={handleRegister}
                        loading={loading}
                        fullWidth
                        styles={{ root: { backgroundColor: '#fff', color: '#000' } }}
                    >
                        Registrieren
                    </Button>

                    <Text size="sm" ta="center" style={{ opacity: 0.5 }}>
                        Bereits ein Konto?{' '}
                        <Anchor component={Link} href="/login" style={{ color: '#0A84FF' }}>
                            Anmelden
                        </Anchor>
                    </Text>
                </Stack>
            </div>
        </div>
    );
}
