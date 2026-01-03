import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Pin, Lock, Eye, ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useForumCategory, useCreateThread } from '@/hooks/useForum';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

export default function ForumCategory() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const [page, setPage] = useState(1);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const { data, isLoading, error } = useForumCategory(slug!, page);
  const createThread = useCreateThread();

  const handleCreateThread = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error(t('forum.fillFields', 'Fyll i titel och innehåll'));
      return;
    }

    try {
      await createThread.mutateAsync({
        categoryId: data!.category.id,
        title: newTitle,
        content: newContent,
      });
      toast.success(t('forum.threadCreated', 'Tråd skapad!'));
      setShowNewThread(false);
      setNewTitle('');
      setNewContent('');
    } catch (error) {
      toast.error(t('forum.createError', 'Kunde inte skapa tråd'));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('forum.categoryNotFound', 'Kategori hittades inte')}
          </h2>
          <Link to="/forum" className="text-primary-600 dark:text-primary-400 hover:underline">
            {t('forum.backToForum', 'Tillbaka till forum')}
          </Link>
        </div>
      </div>
    );
  }

  const { category, threads, pagination } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6">
        <Link to="/forum" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
          {t('forum.title', 'Forum')}
        </Link>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span className="text-gray-900 dark:text-white font-medium">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-gray-600 dark:text-gray-400">{category.description}</p>
          )}
        </div>
        {isAuthenticated && !category.isLocked && (
          <button
            onClick={() => setShowNewThread(true)}
            className="btn-primary"
          >
            <Plus className="w-5 h-5" />
            {t('forum.newThread', 'Ny tråd')}
          </button>
        )}
      </div>

      {/* New Thread Form */}
      {showNewThread && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-background-card rounded-xl border border-gray-200 dark:border-white/10 p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('forum.createThread', 'Skapa ny tråd')}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('forum.threadTitle', 'Titel')}
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="input w-full"
                placeholder={t('forum.titlePlaceholder', 'Ange en beskrivande titel...')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('forum.content', 'Innehåll')}
              </label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="input w-full min-h-[150px]"
                placeholder={t('forum.contentPlaceholder', 'Skriv ditt inlägg...')}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewThread(false)}
                className="btn-ghost"
              >
                {t('common.cancel', 'Avbryt')}
              </button>
              <button
                onClick={handleCreateThread}
                disabled={createThread.isPending}
                className="btn-primary"
              >
                {createThread.isPending ? t('common.creating', 'Skapar...') : t('forum.post', 'Publicera')}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Threads List */}
      <div className="bg-white dark:bg-background-card rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
        {threads.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-600 dark:text-gray-400">
              {t('forum.noThreads', 'Inga trådar i denna kategori ännu')}
            </p>
            {isAuthenticated && !category.isLocked && (
              <button
                onClick={() => setShowNewThread(true)}
                className="btn-primary mt-4"
              >
                <Plus className="w-5 h-5" />
                {t('forum.beFirst', 'Skapa den första tråden')}
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {threads.map((thread, index) => (
              <motion.div
                key={thread.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/forum/thread/${thread.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  {/* Status icons */}
                  <div className="flex flex-col items-center gap-1 w-8">
                    {thread.isPinned && (
                      <Pin className="w-4 h-4 text-primary-500" aria-label={t('forum.pinned', 'Fäst')} />
                    )}
                    {thread.isLocked && (
                      <Lock className="w-4 h-4 text-gray-400" aria-label={t('forum.locked', 'Låst')} />
                    )}
                    {!thread.isPinned && !thread.isLocked && (
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                    )}
                  </div>

                  {/* Thread info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      'font-medium text-gray-900 dark:text-white truncate',
                      thread.isPinned && 'text-primary-600 dark:text-primary-400'
                    )}>
                      {thread.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500 mt-1">
                      <img
                        src={thread.author.avatar || '/default-avatar.png'}
                        alt=""
                        className="w-4 h-4 rounded-full"
                      />
                      <span>{thread.author.username}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(thread.createdAt), {
                          addSuffix: true,
                          locale: sv,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-6 text-sm text-gray-500 dark:text-gray-500">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{thread.postCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{thread.viewCount}</span>
                    </div>
                  </div>

                  {/* Last activity */}
                  <div className="hidden md:block text-right text-sm text-gray-500 dark:text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDistanceToNow(new Date(thread.lastPostAt), {
                        addSuffix: true,
                        locale: sv,
                      })}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="btn-ghost disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-gray-600 dark:text-gray-400">
            {t('common.pageOf', 'Sida {{page}} av {{total}}', { page, total: pagination.totalPages })}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === pagination.totalPages}
            className="btn-ghost disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
