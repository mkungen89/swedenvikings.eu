import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, ChevronRight, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useForumCategories } from '@/hooks/useForum';
import { cn } from '@/utils/cn';

export default function Forum() {
  const { t } = useTranslation();
  const { data: categories, isLoading, error } = useForumCategories();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('forum.error', 'Kunde inte ladda forum')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('common.tryAgain', 'Vänligen försök igen senare')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('forum.title', 'Forum')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('forum.subtitle', 'Diskutera med andra medlemmar')}
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {categories?.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={`/forum/${category.slug}`}
              className={cn(
                'block bg-white dark:bg-background-card rounded-xl border border-gray-200 dark:border-white/10',
                'hover:border-primary-500/50 dark:hover:border-primary-500/50 transition-all duration-200',
                'hover:shadow-lg dark:hover:shadow-primary-500/10',
                category.isLocked && 'opacity-75'
              )}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
                    {category.isLocked ? (
                      <Lock className="w-6 h-6 text-white" />
                    ) : (
                      <MessageSquare className="w-6 h-6 text-white" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {category.name}
                      </h2>
                      {category.isLocked && (
                        <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-white/10 rounded-full text-gray-600 dark:text-gray-400">
                          {t('forum.locked', 'Låst')}
                        </span>
                      )}
                    </div>
                    {category.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {category.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {category.threadCount} {t('forum.threads', 'trådar')}
                      </span>
                    </div>
                  </div>

                  {/* Latest thread */}
                  {category.latestThread && (
                    <div className="hidden md:block text-right text-sm">
                      <p className="text-gray-900 dark:text-white font-medium truncate max-w-xs">
                        {category.latestThread.title}
                      </p>
                      <div className="flex items-center justify-end gap-2 text-gray-500 dark:text-gray-500 mt-1">
                        <img
                          src={category.latestThread.author.avatar || '/default-avatar.png'}
                          alt=""
                          className="w-5 h-5 rounded-full"
                        />
                        <span>{category.latestThread.author.username}</span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(category.latestThread.lastPostAt), {
                            addSuffix: true,
                            locale: sv,
                          })}
                        </span>
                      </div>
                    </div>
                  )}

                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}

        {(!categories || categories.length === 0) && (
          <div className="text-center py-12 bg-white dark:bg-background-card rounded-xl border border-gray-200 dark:border-white/10">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('forum.empty', 'Inga kategorier')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('forum.emptyDescription', 'Forum har inte konfigurerats ännu')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
