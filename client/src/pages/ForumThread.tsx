import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pin, Lock, Eye, ChevronLeft, ChevronRight, Edit2, Trash2, Send } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useForumThread, useCreatePost, useUpdatePost, useDeletePost, usePinThread, useLockThread } from '@/hooks/useForum';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

export default function ForumThread() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { isAuthenticated, user, hasPermission } = useAuthStore();
  const [page, setPage] = useState(1);
  const [replyContent, setReplyContent] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const { data, isLoading, error } = useForumThread(id!, page);
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const pinThread = usePinThread();
  const lockThread = useLockThread();

  const canModerate = hasPermission('forum.moderate');

  const handleReply = async () => {
    if (!replyContent.trim()) return;

    try {
      await createPost.mutateAsync({
        threadId: id!,
        content: replyContent,
      });
      toast.success(t('forum.replyPosted', 'Svar publicerat!'));
      setReplyContent('');
    } catch (error) {
      toast.error(t('forum.replyError', 'Kunde inte posta svar'));
    }
  };

  const handleUpdatePost = async (postId: string) => {
    if (!editContent.trim()) return;

    try {
      await updatePost.mutateAsync({
        id: postId,
        content: editContent,
      });
      toast.success(t('forum.postUpdated', 'Inlägg uppdaterat'));
      setEditingPostId(null);
      setEditContent('');
    } catch (error) {
      toast.error(t('forum.updateError', 'Kunde inte uppdatera'));
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm(t('forum.confirmDelete', 'Vill du verkligen ta bort detta inlägg?'))) return;

    try {
      await deletePost.mutateAsync(postId);
      toast.success(t('forum.postDeleted', 'Inlägg borttaget'));
    } catch (error) {
      toast.error(t('forum.deleteError', 'Kunde inte ta bort'));
    }
  };

  const handlePin = async () => {
    try {
      await pinThread.mutateAsync(id!);
      toast.success(data?.thread.isPinned ? t('forum.unpinned', 'Avfäst') : t('forum.pinned', 'Fäst'));
    } catch (error) {
      toast.error(t('forum.pinError', 'Kunde inte fästa/avfästa'));
    }
  };

  const handleLock = async () => {
    try {
      await lockThread.mutateAsync(id!);
      toast.success(data?.thread.isLocked ? t('forum.unlocked', 'Upplåst') : t('forum.locked', 'Låst'));
    } catch (error) {
      toast.error(t('forum.lockError', 'Kunde inte låsa/låsa upp'));
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
            {t('forum.threadNotFound', 'Tråd hittades inte')}
          </h2>
          <Link to="/forum" className="text-primary-600 dark:text-primary-400 hover:underline">
            {t('forum.backToForum', 'Tillbaka till forum')}
          </Link>
        </div>
      </div>
    );
  }

  const { thread, posts, pagination } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6 flex-wrap">
        <Link to="/forum" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
          {t('forum.title', 'Forum')}
        </Link>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        {thread.category && (
          <>
            <Link
              to={`/forum/${thread.category.slug}`}
              className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              {thread.category.name}
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </>
        )}
        <span className="text-gray-900 dark:text-white font-medium truncate">{thread.title}</span>
      </nav>

      {/* Thread Header */}
      <div className="bg-white dark:bg-background-card rounded-xl border border-gray-200 dark:border-white/10 p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {thread.isPinned && (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full">
                  <Pin className="w-3 h-3" />
                  {t('forum.pinned', 'Fäst')}
                </span>
              )}
              {thread.isLocked && (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded-full">
                  <Lock className="w-3 h-3" />
                  {t('forum.locked', 'Låst')}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {thread.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
              <div className="flex items-center gap-2">
                <img
                  src={thread.author.avatar || '/default-avatar.png'}
                  alt=""
                  className="w-6 h-6 rounded-full"
                />
                <Link
                  to={`/profile/${thread.author.id}`}
                  className="hover:text-primary-600 dark:hover:text-primary-400"
                >
                  {thread.author.username}
                </Link>
              </div>
              <span>•</span>
              <span>{format(new Date(thread.createdAt), 'PPp', { locale: sv })}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {thread.viewCount}
              </span>
            </div>
          </div>

          {canModerate && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePin}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  thread.isPinned
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400'
                )}
                title={thread.isPinned ? t('forum.unpin', 'Avfäst') : t('forum.pin', 'Fäst')}
              >
                <Pin className="w-5 h-5" />
              </button>
              <button
                onClick={handleLock}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  thread.isLocked
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400'
                )}
                title={thread.isLocked ? t('forum.unlock', 'Lås upp') : t('forum.lock', 'Lås')}
              >
                <Lock className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Thread content */}
        <div className="mt-6 prose dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap">{thread.content}</p>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-background-card rounded-xl border border-gray-200 dark:border-white/10 p-6"
          >
            {/* Post header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Link to={`/profile/${post.author.id}`}>
                  <img
                    src={post.author.avatar || '/default-avatar.png'}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                </Link>
                <div>
                  <Link
                    to={`/profile/${post.author.id}`}
                    className="font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    {post.author.username}
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {format(new Date(post.createdAt), 'PPp', { locale: sv })}
                  </p>
                </div>
              </div>

              {(user?.id === post.author.id || canModerate) && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingPostId(post.id);
                      setEditContent(post.content);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400"
                    title={t('common.edit', 'Redigera')}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                    title={t('common.delete', 'Ta bort')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Post content */}
            {editingPostId === post.id ? (
              <div className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="input w-full min-h-[100px]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingPostId(null)}
                    className="btn-ghost"
                  >
                    {t('common.cancel', 'Avbryt')}
                  </button>
                  <button
                    onClick={() => handleUpdatePost(post.id)}
                    disabled={updatePost.isPending}
                    className="btn-primary"
                  >
                    {t('common.save', 'Spara')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{post.content}</p>
              </div>
            )}
          </motion.div>
        ))}
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

      {/* Reply form */}
      {isAuthenticated && !thread.isLocked && (
        <div className="mt-6 bg-white dark:bg-background-card rounded-xl border border-gray-200 dark:border-white/10 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('forum.reply', 'Svara')}
          </h3>
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="input w-full min-h-[120px] mb-4"
            placeholder={t('forum.replyPlaceholder', 'Skriv ditt svar...')}
          />
          <div className="flex justify-end">
            <button
              onClick={handleReply}
              disabled={createPost.isPending || !replyContent.trim()}
              className="btn-primary"
            >
              <Send className="w-5 h-5" />
              {createPost.isPending ? t('common.posting', 'Postar...') : t('forum.postReply', 'Posta svar')}
            </button>
          </div>
        </div>
      )}

      {thread.isLocked && (
        <div className="mt-6 bg-gray-100 dark:bg-white/5 rounded-xl p-4 text-center text-gray-600 dark:text-gray-400">
          <Lock className="w-6 h-6 mx-auto mb-2" />
          {t('forum.threadLocked', 'Denna tråd är låst och kan inte längre besvaras')}
        </div>
      )}
    </div>
  );
}
