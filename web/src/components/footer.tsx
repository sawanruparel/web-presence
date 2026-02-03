import { useTheme } from '../hooks/use-theme';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

function ThemeCallback() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const Icon = theme === 'system' ? ComputerDesktopIcon : theme === 'light' ? SunIcon : MoonIcon;
  const label = theme === 'system' ? 'System Theme' : theme === 'light' ? 'Light Mode' : 'Dark Mode';

  return (
    <button
      onClick={toggleTheme}
      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title={`Current: ${label}. Click to switch.`}
      aria-label="Switch theme"
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 text-sm flex justify-between items-center" style={{ color: 'var(--color-text-muted)' }}>
      <div className="flex items-center gap-4">
        <span>© {year} · built by cursor, chatgpt, gemini.</span>
      </div>
      <div className="flex gap-4 items-center">
        <ThemeCallback />
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-2" />
        <a href="/rss" className="hover:underline">RSS</a>
        <a href="/resume" className="hover:underline">Resume</a>
        <a href="https://linkedin.com/in/sawanruparel" className="hover:underline" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </div>
    </footer>
  )
}