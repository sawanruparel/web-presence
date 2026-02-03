import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme');
            if (saved === 'light' || saved === 'dark' || saved === 'system') {
                return saved;
            }
        }
        return 'system';
    });

    useEffect(() => {
        const root = document.documentElement;
        const systemQuery = window.matchMedia('(prefers-color-scheme: dark)');

        // Function to apply the correct class
        const applyTheme = () => {
            // Remove both classes first
            root.classList.remove('light', 'dark');

            if (theme === 'system') {
                // If system, we don't force a class on basic setup because we used @media
                // But to be explicit and compatible with tailwind dark: selectors if ever used:
                // const isDark = systemQuery.matches;
                // if (isDark) root.classList.add('dark');
                // BUT our CSS relies on :root:not(.light) for system dark.
                // So for system, we just remove both classes.
            } else {
                root.classList.add(theme);
                // Also save to local storage
                localStorage.setItem('theme', theme);
            }
        };

        applyTheme();

        // If theme is system, we might want to listen to changes?
        // Our CSS @media handles system changes automatically if we don't have .light or .dark class.
        // So we don't need a JS listener for updating the DOM classes if we just leave them off.

        // However, if we're saving to localStorage, we should do it when theme changes.
        if (theme === 'system') {
            localStorage.removeItem('theme');
        } else {
            localStorage.setItem('theme', theme);
        }

    }, [theme]);

    return { theme, setTheme };
}
