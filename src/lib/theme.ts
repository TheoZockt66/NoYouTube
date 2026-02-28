import { createTheme, MantineColorsTuple } from '@mantine/core';

// Trade Republic inspired – dark monochrome with YouTube-red accent
const darkColors: MantineColorsTuple = [
    '#1a1a1a',
    '#2a2a2a',
    '#3a3a3a',
    '#4a4a4a',
    '#666666',
    '#808080',
    '#999999',
    '#b3b3b3',
    '#cccccc',
    '#e6e6e6',
];

const primaryColors: MantineColorsTuple = [
    '#ffe6e6',
    '#ffcccc',
    '#ffb3b3',
    '#ff9999',
    '#ff8080',
    '#FF0000', // YouTube Red
    '#e60000',
    '#cc0000',
    '#b30000',
    '#990000',
];

const successColors: MantineColorsTuple = [
    '#e6f9f0',
    '#c3f0d9',
    '#9fe7c2',
    '#7bdeab',
    '#57d594',
    '#00C853',
    '#00b04a',
    '#009841',
    '#008038',
    '#00682f',
];

const infoColors: MantineColorsTuple = [
    '#e6f2ff',
    '#cce5ff',
    '#b3d9ff',
    '#99ccff',
    '#80bfff',
    '#0A84FF',
    '#0977e6',
    '#086acc',
    '#075db3',
    '#065099',
];

const dangerColors: MantineColorsTuple = [
    '#ffe6e6',
    '#ffcccc',
    '#ffb3b3',
    '#ff9999',
    '#ff8080',
    '#FF3B30',
    '#e6352b',
    '#cc2f26',
    '#b32921',
    '#99231c',
];

export const theme = createTheme({
    primaryColor: 'dark',
    colors: {
        dark: darkColors,
        primary: primaryColors,
        success: successColors,
        info: infoColors,
        danger: dangerColors,
    },
    black: '#000000',
    white: '#ffffff',
    defaultRadius: 'md',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    headings: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontWeight: '700',
        sizes: {
            h1: { fontSize: '32px', lineHeight: '1.2' },
            h2: { fontSize: '24px', lineHeight: '1.3' },
            h3: { fontSize: '20px', lineHeight: '1.4' },
            h4: { fontSize: '18px', lineHeight: '1.4' },
        },
    },
    components: {
        Button: {
            defaultProps: {
                size: 'md',
            },
        },
        Modal: {
            defaultProps: {
                centered: true,
                overlayProps: {
                    opacity: 0.55,
                    blur: 3,
                },
            },
        },
        TextInput: {
            defaultProps: {
                size: 'md',
            },
        },
        Select: {
            defaultProps: {
                size: 'md',
            },
        },
    },
});
