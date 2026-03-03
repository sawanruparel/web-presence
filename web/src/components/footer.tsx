import { useTheme } from '../hooks/use-theme';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-1" aria-label="Theme switcher">
      <button
        onClick={() => setTheme('light')}
        title="Light mode"
        aria-label="Switch to light mode"
        className="p-1 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        style={{ color: !isDark ? 'var(--color-text)' : 'var(--color-text-muted)' }}
      >
        <SunIcon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        title="Dark mode"
        aria-label="Switch to dark mode"
        className="p-1 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        style={{ color: isDark ? 'var(--color-text)' : 'var(--color-text-muted)' }}
      >
        <MoonIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 text-sm flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center sm:gap-0" style={{ color: 'var(--color-text-muted)' }}>
      <span>© {year} · built by cursor, chatgpt, gemini.</span>
      <div className="flex items-center gap-4">
        <ThemeSwitcher />
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-700" />
        <a href="/rss" className="hover:underline">RSS</a>
        <a href="/resume" className="hover:underline">Resume</a>
        <a href="https://linkedin.com/in/sawanruparel" className="hover:underline" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </div>
    </footer>
  )
}