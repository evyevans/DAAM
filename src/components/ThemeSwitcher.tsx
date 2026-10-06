'use client'

import { useThemeStore, type AppTheme } from '@/lib/themeStore';

const THEME_LABELS: Record<AppTheme, string> = {
  default:    'Default',
  night:      'Night Mode',
  colorblind: 'CBM',
  system:     'System',
};

export function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="flex rounded-lg border border-border overflow-hidden w-full" style={{ borderColor: 'var(--color-border, var(--border))' }}>
      {(['default', 'night', 'colorblind', 'system'] as const).map((mode) => (
        <button
          key={mode}
          onClick={() => setTheme(mode)}
          type="button"
          className={`
            flex-1 py-2.5 text-xs font-medium transition-all cursor-pointer capitalize
            ${theme === mode
              ? 'bg-accent text-text-on-accent'
              : 'bg-bg-surface text-text-secondary hover:bg-bg-primary'
            }
          `}
          style={{
             backgroundColor: theme === mode ? 'var(--color-accent, var(--accent))' : 'var(--color-bg-surface, var(--bg-primary))',
             color: theme === mode ? 'var(--color-text-on-accent, white)' : 'var(--color-text-secondary, var(--text-secondary))',
             border: 'none',
             outline: 'none',
          }}
        >
          {THEME_LABELS[mode]}
        </button>
      ))}
    </div>
  );
}
