import type { Metadata, Viewport } from "next";
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import AuthProvider from '@/components/AuthProvider';
import { NavBarWrapper } from '@/components/NavBarWrapper';
import { theme } from '@/lib/theme';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import "./globals.css";

export const metadata: Metadata = {
    title: "NoYoutube - Dein YouTube Feed",
    description: "Personalisierter YouTube Feed ohne Ablenkung",
    applicationName: 'NoYoutube',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    themeColor: '#000000',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="de" suppressHydrationWarning>
            <head>
                <ColorSchemeScript defaultColorScheme="dark" />
            </head>
            <body style={{ paddingBottom: '80px' }}>
                <MantineProvider theme={theme} defaultColorScheme="dark">
                    <Notifications position="top-center" />
                    <AuthProvider>
                        {children}
                        <NavBarWrapper />
                    </AuthProvider>
                </MantineProvider>
            </body>
        </html>
    );
}
