import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEventsList } from '@/hooks/useEvents';

export default function Events() {
  const [page, setPage] = useState(1);
  const [showPast, setShowPast] = useState(false);
  const { data, isLoading, error } = useEventsList(page, 12, showPast);
  
  const events = data?.data ?? [];
  const meta = data?.meta;

  if (isLoading) {
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-gray-400">Laddar events...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <p className="text-red-400">Ett fel uppstod vid laddning av events.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="font-display text-4xl font-bold mb-4">Events</h1>
          <p className="text-gray-400 mb-6">
            Kommande operationer och events. Anmäl dig för att delta!
          </p>
          
          {/* Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => { setShowPast(false); setPage(1); }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !showPast ? 'bg-primary-600 text-white' : 'bg-background-lighter text-gray-400 hover:text-white'
              }`}
            >
              Kommande
            </button>
            <button
              onClick={() => { setShowPast(true); setPage(1); }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                showPast ? 'bg-primary-600 text-white' : 'bg-background-lighter text-gray-400 hover:text-white'
              }`}
            >
              Tidigare
            </button>
          </div>
        </motion.div>

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {events.map((event, index) => {
            const eventDate = new Date(event.startDate);
            const isUpcoming = eventDate > new Date();

            return (
              <motion.article
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <Link to={`/events/${event.slug}`}>
                  <div className="card-hover overflow-hidden">
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden bg-background-darker">
                      {event.image ? (
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="w-16 h-16 text-gray-600" />
                        </div>
                      )}
                      {isUpcoming && (
                        <div className="absolute top-3 left-3 px-2 py-1 bg-green-500/90 text-white text-xs font-medium rounded">
                          Kommande
                        </div>
                      )}
                      {/* Date Badge */}
                      <div className="absolute top-3 right-3 bg-background-darker/90 rounded-lg p-2 text-center min-w-[60px]">
                        <div className="text-2xl font-bold text-primary-400">
                          {eventDate.getDate()}
                        </div>
                        <div className="text-xs text-gray-400 uppercase">
                          {eventDate.toLocaleDateString('sv-SE', { month: 'short' })}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h2 className="font-display font-semibold text-xl mb-2 group-hover:text-primary-400 transition-colors">
                        {event.title}
                      </h2>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {event.description}
                      </p>

                      {/* Meta */}
                      <div className="grid grid-cols-2 gap-3 text-sm text-gray-400 mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {eventDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {event.location || 'TBA'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {event.participantCount || 0}/{event.maxParticipants || '∞'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {event.organizer?.username || 'Unknown'}
                        </div>
                      </div>

                      {/* Progress bar */}
                      {event.maxParticipants && (
                        <div className="mb-4">
                          <div className="h-1.5 bg-background-darker rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all"
                              style={{ width: `${((event.participantCount || 0) / event.maxParticipants) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <span className="text-primary-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 text-sm">
                        Se detaljer
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.article>
            );
          })}
        </div>

        {/* Empty state */}
        {events.length === 0 && (
          <div className="text-center py-16">
            <Calendar className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">
              {showPast ? 'Inga tidigare events.' : 'Inga kommande events just nu.'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="mt-12 flex justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary px-4 py-2 disabled:opacity-50"
            >
              Föregående
            </button>
            <div className="flex items-center gap-2 px-4">
              <span className="text-gray-400">
                Sida {page} av {meta.totalPages}
              </span>
            </div>
            <button
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="btn-secondary px-4 py-2 disabled:opacity-50"
            >
              Nästa
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
