import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Users, Clock, User, Loader2, Check, HelpCircle, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useEvent, useJoinEvent, useLeaveEvent } from '@/hooks/useEvents';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function EventDetails() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated, user, login } = useAuthStore();
  const { data: event, isLoading, error } = useEvent(slug || '');
  const joinEvent = useJoinEvent();
  const leaveEvent = useLeaveEvent();
  const [userStatus, setUserStatus] = useState<'going' | 'maybe' | 'not_going' | null>(null);

  // Check if user is already participating
  const currentUserParticipation = event?.participants?.find(p => p.user.id === user?.id);
  const effectiveStatus = userStatus || currentUserParticipation?.status || null;

  const handleJoin = async (status: 'going' | 'maybe') => {
    if (!slug) return;
    try {
      await joinEvent.mutateAsync({ slug, status });
      setUserStatus(status);
      toast.success(status === 'going' ? 'Du är nu anmäld!' : 'Du har anmält dig som osäker.');
    } catch {
      toast.error('Kunde inte anmäla dig till eventet.');
    }
  };

  const handleLeave = async () => {
    if (!slug) return;
    try {
      await leaveEvent.mutateAsync(slug);
      setUserStatus(null);
      toast.success('Du har lämnat eventet.');
    } catch {
      toast.error('Kunde inte lämna eventet.');
    }
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-gray-400">Laddar event...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-400">Eventet kunde inte hittas.</p>
        <Link to="/events" className="text-primary-400 hover:underline mt-4 inline-block">
          Tillbaka till events
        </Link>
      </div>
    );
  }

  const eventDate = new Date(event.startDate);
  const goingCount = event.participants?.filter(p => p.status === 'going').length || 0;
  const maybeCount = event.participants?.filter(p => p.status === 'maybe').length || 0;

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka till events
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header Image */}
          {event.image && (
            <div className="rounded-2xl overflow-hidden mb-8">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-64 sm:h-80 object-cover"
              />
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                {event.title}
              </h1>
              <p className="text-gray-400 text-lg mb-8">{event.description}</p>

              {/* Content */}
              {event.content && (
                <div
                  className="prose prose-invert prose-lg max-w-none prose-headings:font-display"
                  dangerouslySetInnerHTML={{ __html: event.content }}
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24">
                {/* Date & Time */}
                <div className="mb-6">
                  <div className="text-center p-4 bg-primary-600/20 rounded-xl mb-4">
                    <div className="text-4xl font-bold text-primary-400">
                      {eventDate.getDate()}
                    </div>
                    <div className="text-gray-400">
                      {eventDate.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-gray-300">
                      <Clock className="w-5 h-5 text-gray-500" />
                      {eventDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-3 text-gray-300">
                        <MapPin className="w-5 h-5 text-gray-500" />
                        {event.location}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-gray-300">
                      <Users className="w-5 h-5 text-gray-500" />
                      {goingCount}/{event.maxParticipants || '∞'} deltagare
                      {maybeCount > 0 && <span className="text-gray-500">({maybeCount} osäkra)</span>}
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                      <User className="w-5 h-5 text-gray-500" />
                      {event.organizer?.username || 'Unknown'}
                    </div>
                  </div>
                </div>

                {/* Join Button */}
                {isAuthenticated ? (
                  <div className="space-y-2">
                    {effectiveStatus === 'going' ? (
                      <button
                        onClick={handleLeave}
                        disabled={leaveEvent.isPending}
                        className="btn-secondary w-full flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4 text-green-400" />
                        Anmäld - Klicka för att lämna
                      </button>
                    ) : effectiveStatus === 'maybe' ? (
                      <>
                        <button
                          onClick={() => handleJoin('going')}
                          disabled={joinEvent.isPending}
                          className="btn-primary w-full"
                        >
                          Ändra till "Jag kommer!"
                        </button>
                        <button
                          onClick={handleLeave}
                          disabled={leaveEvent.isPending}
                          className="btn-secondary w-full flex items-center justify-center gap-2"
                        >
                          <HelpCircle className="w-4 h-4 text-yellow-400" />
                          Osäker - Klicka för att lämna
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleJoin('going')}
                          disabled={joinEvent.isPending}
                          className="btn-primary w-full"
                        >
                          {joinEvent.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                          ) : (
                            'Jag kommer!'
                          )}
                        </button>
                        <button
                          onClick={() => handleJoin('maybe')}
                          disabled={joinEvent.isPending}
                          className="btn-secondary w-full"
                        >
                          Kanske
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <button onClick={login} className="btn-primary w-full">
                    Logga in för att delta
                  </button>
                )}

                {/* Participants Preview */}
                {event.participants && event.participants.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h3 className="font-medium mb-3">Deltagare ({goingCount})</h3>
                    <div className="flex flex-wrap gap-2">
                      {event.participants.filter(p => p.status === 'going').slice(0, 8).map((p) => (
                        <div
                          key={p.user.id}
                          className="w-8 h-8 rounded-full bg-background-darker flex items-center justify-center text-xs font-medium border border-white/10 overflow-hidden"
                          title={p.user.username}
                        >
                          {p.user.avatar ? (
                            <img src={p.user.avatar} alt={p.user.username} className="w-full h-full object-cover" />
                          ) : (
                            p.user.username.charAt(0).toUpperCase()
                          )}
                        </div>
                      ))}
                      {goingCount > 8 && (
                        <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-xs text-primary-400">
                          +{goingCount - 8}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
