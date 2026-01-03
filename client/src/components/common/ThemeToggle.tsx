import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors duration-200"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative w-6 h-6">
        {/* Sun Icon (Light Mode) */}
        <motion.div
          initial={false}
          animate={{
            opacity: theme === 'light' ? 1 : 0,
            rotate: theme === 'light' ? 0 : 180,
            scale: theme === 'light' ? 1 : 0.5,
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <Sun className="w-6 h-6 text-amber-500" />
        </motion.div>

        {/* Moon Icon (Dark Mode) */}
        <motion.div
          initial={false}
          animate={{
            opacity: theme === 'dark' ? 1 : 0,
            rotate: theme === 'dark' ? 0 : -180,
            scale: theme === 'dark' ? 1 : 0.5,
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <Moon className="w-6 h-6 text-primary-400" />
        </motion.div>
      </div>
    </motion.button>
  );
}
