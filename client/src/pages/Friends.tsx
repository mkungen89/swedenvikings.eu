import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, UserPlus, UserMinus, Mail, Clock, Check, X, Ban } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import {
  useFriends,
  useFriendRequests,
  useSentFriendRequests,
  useBlockedUsers,
  useAcceptFriendRequest,
  useCancelFriendRequest,
  useRemoveFriend,
  useUnblockUser,
} from '@/hooks/useFriends';
import { useStartConversation } from '@/hooks/useMessages';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

type Tab = 'friends' | 'requests' | 'sent' | 'blocked';

export default function Friends() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('friends');

  const { data: friendsData, isLoading: loadingFriends } = useFriends();
  const { data: requestsData, isLoading: loadingRequests } = useFriendRequests();
  const { data: sentData, isLoading: loadingSent } = useSentFriendRequests();
  const { data: blockedData, isLoading: loadingBlocked } = useBlockedUsers();

  const acceptRequest = useAcceptFriendRequest();
  const cancelRequest = useCancelFriendRequest();
  const removeFriend = useRemoveFriend();
  const unblockUser = useUnblockUser();
  const startConversation = useStartConversation();

  const friends = friendsData?.data || [];
  const requests = requestsData?.data || [];
  const sent = sentData?.data || [];
  const blocked = blockedData?.data || [];

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptRequest.mutateAsync(requestId);
      toast.success(t('friends.requestAccepted', 'Vänförfrågan accepterad!'));
    } catch (error) {
      toast.error(t('friends.acceptError', 'Kunde inte acceptera'));
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await cancelRequest.mutateAsync(requestId);
      toast.success(t('friends.requestCancelled', 'Vänförfrågan avbruten'));
    } catch (error) {
      toast.error(t('friends.cancelError', 'Kunde inte avbryta'));
    }
  };

  const handleRemoveFriend = async (userId: string) => {
    if (!confirm(t('friends.confirmRemove', 'Vill du verkligen ta bort denna vän?'))) return;

    try {
      await removeFriend.mutateAsync(userId);
      toast.success(t('friends.removed', 'Vän borttagen'));
    } catch (error) {
      toast.error(t('friends.removeError', 'Kunde inte ta bort'));
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await unblockUser.mutateAsync(userId);
      toast.success(t('friends.unblocked', 'Användare avblockerad'));
    } catch (error) {
      toast.error(t('friends.unblockError', 'Kunde inte avblockera'));
    }
  };

  const handleStartConversation = async (userId: string) => {
    try {
      const conv = await startConversation.mutateAsync(userId);
      window.location.href = `/messages?conversation=${conv.id}`;
    } catch (error) {
      toast.error(t('messages.startError', 'Kunde inte starta konversation'));
    }
  };

  const tabs = [
    { id: 'friends' as Tab, label: t('friends.myFriends', 'Mina vänner'), count: friends.length, icon: Users },
    { id: 'requests' as Tab, label: t('friends.requests', 'Förfrågningar'), count: requests.length, icon: UserPlus },
    { id: 'sent' as Tab, label: t('friends.sent', 'Skickade'), count: sent.length, icon: Clock },
    { id: 'blocked' as Tab, label: t('friends.blocked', 'Blockerade'), count: blocked.length, icon: Ban },
  ];

  const isLoading = loadingFriends || loadingRequests || loadingSent || loadingBlocked;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
        <Users className="w-8 h-8" />
        {t('friends.title', 'Vänner')}
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors',
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-background-card text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count > 0 && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-background-card rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            {/* Friends List */}
            {activeTab === 'friends' && (
              friends.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>{t('friends.noFriends', 'Du har inga vänner ännu')}</p>
                  <p className="text-sm mt-2">{t('friends.findFriends', 'Besök andras profiler för att skicka vänförfrågningar')}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {friends.map((friend, index) => (
                    <motion.div
                      key={friend.friendshipId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <Link to={`/profile/${friend.id}`} className="flex items-center gap-3">
                        <img
                          src={friend.avatar || '/default-avatar.png'}
                          alt=""
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {friend.username}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('friends.since', 'Vänner sedan')} {formatDistanceToNow(new Date(friend.friendsSince), {
                              locale: sv,
                            })}
                          </p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartConversation(friend.id)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400"
                          title={t('messages.send', 'Skicka meddelande')}
                        >
                          <Mail className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleRemoveFriend(friend.id)}
                          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                          title={t('friends.remove', 'Ta bort vän')}
                        >
                          <UserMinus className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            )}

            {/* Requests */}
            {activeTab === 'requests' && (
              requests.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>{t('friends.noRequests', 'Inga väntande vänförfrågningar')}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {requests.map((request, index) => (
                    <motion.div
                      key={request.requestId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 flex items-center justify-between"
                    >
                      <Link to={`/profile/${request.from?.id}`} className="flex items-center gap-3">
                        <img
                          src={request.from?.avatar || '/default-avatar.png'}
                          alt=""
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {request.from?.username}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(request.sentAt), {
                              addSuffix: true,
                              locale: sv,
                            })}
                          </p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAcceptRequest(request.requestId)}
                          disabled={acceptRequest.isPending}
                          className="btn-primary py-1.5"
                        >
                          <Check className="w-4 h-4" />
                          {t('friends.accept', 'Acceptera')}
                        </button>
                        <button
                          onClick={() => handleCancelRequest(request.requestId)}
                          disabled={cancelRequest.isPending}
                          className="btn-ghost py-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
                        >
                          <X className="w-4 h-4" />
                          {t('friends.decline', 'Avvisa')}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            )}

            {/* Sent */}
            {activeTab === 'sent' && (
              sent.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>{t('friends.noSent', 'Inga skickade vänförfrågningar')}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {sent.map((request, index) => (
                    <motion.div
                      key={request.requestId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 flex items-center justify-between"
                    >
                      <Link to={`/profile/${request.to?.id}`} className="flex items-center gap-3">
                        <img
                          src={request.to?.avatar || '/default-avatar.png'}
                          alt=""
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {request.to?.username}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('friends.pending', 'Väntar på svar')} • {formatDistanceToNow(new Date(request.sentAt), {
                              addSuffix: true,
                              locale: sv,
                            })}
                          </p>
                        </div>
                      </Link>
                      <button
                        onClick={() => handleCancelRequest(request.requestId)}
                        disabled={cancelRequest.isPending}
                        className="btn-ghost py-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
                      >
                        <X className="w-4 h-4" />
                        {t('friends.cancel', 'Avbryt')}
                      </button>
                    </motion.div>
                  ))}
                </div>
              )
            )}

            {/* Blocked */}
            {activeTab === 'blocked' && (
              blocked.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Ban className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>{t('friends.noBlocked', 'Inga blockerade användare')}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {blocked.map((blockedUser: any, index) => (
                    <motion.div
                      key={blockedUser.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={blockedUser.avatar || '/default-avatar.png'}
                          alt=""
                          className="w-12 h-12 rounded-full opacity-50"
                        />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {blockedUser.username}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('friends.blockedOn', 'Blockerad')} {formatDistanceToNow(new Date(blockedUser.blockedAt), {
                              addSuffix: true,
                              locale: sv,
                            })}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnblock(blockedUser.id)}
                        disabled={unblockUser.isPending}
                        className="btn-ghost py-1.5"
                      >
                        {t('friends.unblock', 'Avblockera')}
                      </button>
                    </motion.div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
