import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',

      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
        applyTheme(newTheme);
      },

      setTheme: (theme: Theme) => {
        set({ theme });
        applyTheme(theme);
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        // Apply theme immediately after rehydration
        if (state) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

// Helper function to apply theme to document
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

// Initialize theme on page load
export function initializeTheme() {
  const storedTheme = localStorage.getItem('theme-storage');
  if (storedTheme) {
    try {
      const { state } = JSON.parse(storedTheme);
      applyTheme(state.theme || 'dark');
    } catch {
      applyTheme('dark');
    }
  } else {
    applyTheme('dark');
  }
}
