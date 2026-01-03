import { useState, useEffect, useRef } from 'react';
// motion and AnimatePresence available for future animations
import { Mail, Send, Search, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
// socket.io-client available for real-time messaging
import { useAuthStore } from '@/store/authStore';
import {
  useConversations,
  useConversation,
  useSendMessage,
  useMarkConversationRead,
} from '@/hooks/useMessages';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

export default function Messages() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversationsData, isLoading: loadingConversations } = useConversations();
  const { data: conversationDetail, isLoading: loadingMessages } = useConversation(selectedConversationId || '');
  const sendMessage = useSendMessage();
  const markRead = useMarkConversationRead();

  const conversations = conversationsData?.data || [];

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationDetail?.messages]);

  // Mark as read when opening conversation
  useEffect(() => {
    if (selectedConversationId) {
      markRead.mutate(selectedConversationId);
    }
  }, [selectedConversationId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId) return;

    try {
      await sendMessage.mutateAsync({
        conversationId: selectedConversationId,
        content: newMessage,
      });
      setNewMessage('');
    } catch (error) {
      toast.error(t('messages.sendError', 'Kunde inte skicka meddelande'));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.participants.some((p) =>
      p.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
        <Mail className="w-8 h-8" />
        {t('messages.title', 'Meddelanden')}
      </h1>

      <div className="bg-white dark:bg-background-card rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="flex h-[600px]">
          {/* Conversations list */}
          <div className={cn(
            'w-full md:w-80 border-r border-gray-200 dark:border-white/10 flex flex-col',
            selectedConversationId && 'hidden md:flex'
          )}>
            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('messages.search', 'Sök konversationer...')}
                  className="input w-full pl-10"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {loadingConversations ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>{t('messages.noConversations', 'Inga konversationer')}</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={cn(
                      'w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5',
                      selectedConversationId === conv.id && 'bg-primary-50 dark:bg-primary-900/20'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={conv.participants[0]?.avatar || '/default-avatar.png'}
                        alt=""
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 dark:text-white truncate">
                            {conv.participants.map((p) => p.username).join(', ')}
                          </span>
                          {conv.unreadCount > 0 && (
                            <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-primary-500 rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {conv.lastMessage.sender.id === user?.id ? 'Du: ' : ''}
                            {conv.lastMessage.content}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(conv.updatedAt), {
                            addSuffix: true,
                            locale: sv,
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message area */}
          <div className={cn(
            'flex-1 flex flex-col',
            !selectedConversationId && 'hidden md:flex'
          )}>
            {selectedConversationId && conversationDetail ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversationId(null)}
                    className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <img
                    src={conversationDetail.conversation.participants[0]?.avatar || '/default-avatar.png'}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {conversationDetail.conversation.participants.map((p) => p.username).join(', ')}
                    </h3>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                    </div>
                  ) : conversationDetail.messages.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      <p>{t('messages.startConversation', 'Skriv ett meddelande för att starta konversationen')}</p>
                    </div>
                  ) : (
                    conversationDetail.messages.map((message, index) => {
                      const isMe = message.sender.id === user?.id;
                      const showAvatar = index === 0 || conversationDetail.messages[index - 1].sender.id !== message.sender.id;

                      return (
                        <div
                          key={message.id}
                          className={cn('flex gap-2', isMe ? 'justify-end' : 'justify-start')}
                        >
                          {!isMe && showAvatar && (
                            <img
                              src={message.sender.avatar || '/default-avatar.png'}
                              alt=""
                              className="w-8 h-8 rounded-full self-end"
                            />
                          )}
                          {!isMe && !showAvatar && <div className="w-8" />}
                          <div
                            className={cn(
                              'max-w-[70%] rounded-2xl px-4 py-2',
                              isMe
                                ? 'bg-primary-600 text-white rounded-br-md'
                                : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white rounded-bl-md'
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                            <p className={cn(
                              'text-xs mt-1',
                              isMe ? 'text-primary-200' : 'text-gray-400 dark:text-gray-500'
                            )}>
                              {format(new Date(message.createdAt), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200 dark:border-white/10">
                  <div className="flex gap-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={t('messages.placeholder', 'Skriv ett meddelande...')}
                      className="input flex-1 min-h-[44px] max-h-32 resize-none"
                      rows={1}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={sendMessage.isPending || !newMessage.trim()}
                      className="btn-primary self-end"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Mail className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>{t('messages.selectConversation', 'Välj en konversation för att visa meddelanden')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
