import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Reply, Edit2, Trash2, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import {
  useNewsComments,
  useEventComments,
  useCreateNewsComment,
  useCreateEventComment,
  useUpdateComment,
  useDeleteComment,
  type Comment,
} from '@/hooks/useComments';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

interface CommentSectionProps {
  type: 'news' | 'event';
  slug: string;
}

function CommentItem({
  comment,
  onReply,
  onEdit,
  onDelete,
  level = 0,
}: {
  comment: Comment;
  onReply: (parentId: string) => void;
  onEdit: (comment: Comment) => void;
  onDelete: (id: string) => void;
  level?: number;
}) {
  const { t } = useTranslation();
  const { user, hasPermission } = useAuthStore();
  const [showReplies, setShowReplies] = useState(true);
  const canModerate = hasPermission('comments.moderate');
  const isOwner = user?.id === comment.author.id;

  return (
    <div className={cn('', level > 0 && 'ml-8 border-l-2 border-gray-100 dark:border-white/10 pl-4')}>
      <div className="py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${comment.author.id}`}>
              <img
                src={comment.author.avatar || '/default-avatar.png'}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            </Link>
            <div>
              <Link
                to={`/profile/${comment.author.id}`}
                className="font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
              >
                {comment.author.username}
              </Link>
              <span className="text-sm text-gray-500 dark:text-gray-500 ml-2">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: sv,
                })}
              </span>
            </div>
          </div>

          {(isOwner || canModerate) && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(comment)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"
                title={t('common.edit', 'Redigera')}
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(comment.id)}
                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400"
                title={t('common.delete', 'Ta bort')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="prose dark:prose-invert prose-sm max-w-none">
          <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{comment.content}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-3">
          {level < 2 && (
            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <Reply className="w-4 h-4" />
              {t('comments.reply', 'Svara')}
            </button>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div>
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-2"
          >
            {showReplies ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {comment.replies.length} {t('comments.replies', 'svar')}
          </button>
          <AnimatePresence>
            {showReplies && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    level={level + 1}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ type, slug }: CommentSectionProps) {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editContent, setEditContent] = useState('');

  const { data: commentsData, isLoading } = type === 'news'
    ? useNewsComments(slug, page)
    : useEventComments(slug, page);

  const createNewsComment = useCreateNewsComment();
  const createEventComment = useCreateEventComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  const comments = commentsData?.data || [];
  const meta = commentsData?.meta;

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      if (type === 'news') {
        await createNewsComment.mutateAsync({
          slug,
          content: newComment,
          parentId: replyingTo || undefined,
        });
      } else {
        await createEventComment.mutateAsync({
          slug,
          content: newComment,
          parentId: replyingTo || undefined,
        });
      }
      toast.success(t('comments.posted', 'Kommentar publicerad!'));
      setNewComment('');
      setReplyingTo(null);
    } catch (error) {
      toast.error(t('comments.postError', 'Kunde inte posta kommentar'));
    }
  };

  const handleUpdateComment = async () => {
    if (!editingComment || !editContent.trim()) return;

    try {
      await updateComment.mutateAsync({
        id: editingComment.id,
        content: editContent,
      });
      toast.success(t('comments.updated', 'Kommentar uppdaterad'));
      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      toast.error(t('comments.updateError', 'Kunde inte uppdatera'));
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm(t('comments.confirmDelete', 'Vill du verkligen ta bort denna kommentar?'))) return;

    try {
      await deleteComment.mutateAsync(id);
      toast.success(t('comments.deleted', 'Kommentar borttagen'));
    } catch (error) {
      toast.error(t('comments.deleteError', 'Kunde inte ta bort'));
    }
  };

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
    setEditingComment(null);
  };

  const handleEdit = (comment: Comment) => {
    setEditingComment(comment);
    setEditContent(comment.content);
    setReplyingTo(null);
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <MessageCircle className="w-6 h-6" />
        {t('comments.title', 'Kommentarer')}
        {meta && <span className="text-gray-500">({meta.total})</span>}
      </h3>

      {/* Comment form */}
      {isAuthenticated ? (
        <div className="bg-white dark:bg-background-card rounded-xl border border-gray-200 dark:border-white/10 p-4 mb-6">
          {replyingTo && (
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span>{t('comments.replyingTo', 'Svarar på en kommentar')}</span>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                {t('common.cancel', 'Avbryt')}
              </button>
            </div>
          )}
          {editingComment ? (
            <>
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                <span>{t('comments.editing', 'Redigerar kommentar')}</span>
                <button
                  onClick={() => setEditingComment(null)}
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {t('common.cancel', 'Avbryt')}
                </button>
              </div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="input w-full min-h-[80px] mb-3"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleUpdateComment}
                  disabled={updateComment.isPending}
                  className="btn-primary"
                >
                  {updateComment.isPending ? t('common.saving', 'Sparar...') : t('common.save', 'Spara')}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <img
                  src={user?.avatar || '/default-avatar.png'}
                  alt=""
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="input w-full min-h-[80px]"
                  placeholder={t('comments.placeholder', 'Skriv en kommentar...')}
                />
              </div>
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleSubmitComment}
                  disabled={createNewsComment.isPending || createEventComment.isPending || !newComment.trim()}
                  className="btn-primary"
                >
                  <Send className="w-4 h-4" />
                  {(createNewsComment.isPending || createEventComment.isPending)
                    ? t('common.posting', 'Postar...')
                    : t('comments.post', 'Kommentera')}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 text-center mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:underline">
              {t('comments.loginToComment', 'Logga in för att kommentera')}
            </Link>
          </p>
        </div>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>{t('comments.empty', 'Inga kommentarer ännu. Var först med att kommentera!')}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-white/5">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {meta && meta.page < meta.totalPages && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setPage(page + 1)}
            className="btn-ghost"
          >
            {t('comments.loadMore', 'Ladda fler kommentarer')}
          </button>
        </div>
      )}
    </div>
  );
}
