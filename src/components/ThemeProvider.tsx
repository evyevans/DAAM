'use client'

import { useEffect, useState } from 'react';
import { useThemeStore } from '@/lib/themeStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Remove all theme classes first
    document.documentElement.classList.remove(
      'theme-night',
      'theme-colorblind',
      'theme-system'
    );

    // Apply theme class (default = no class needed)
    if (theme !== 'default') {
      document.documentElement.classList.add(`theme-${theme}`);
    }
  }, [theme, mounted]);

  // Optionally, if you want SSR hydration to not flash, you'd use a raw blocking script in layout.
  // We just return children. Classes will update on the client almost instantly.
  return <>{children}</>;
}
