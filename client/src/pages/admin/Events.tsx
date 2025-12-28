import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Users, Calendar } from 'lucide-react';

// Mock data
const events = [
  { id: '1', title: 'Operation Stormvind', startDate: '2024-01-20T19:00:00', participantCount: 32, maxParticipants: 64, isPublished: true },
  { id: '2', title: 'Träningskvall', startDate: '2024-01-25T18:00:00', participantCount: 12, maxParticipants: 20, isPublished: true },
  { id: '3', title: 'Nytt event (utkast)', startDate: '2024-02-01T19:00:00', participantCount: 0, maxParticipants: 50, isPublished: false },
];

export default function AdminEvents() {
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Events</h1>
          <p className="text-gray-400">Hantera events och operationer</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-5 h-5" />
          Skapa Event
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Sök events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Events Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event, index) => {
          const eventDate = new Date(event.startDate);
          const isUpcoming = eventDate > new Date();

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold mb-1">{event.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    {eventDate.toLocaleDateString('sv-SE')} {eventDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {!event.isPublished && (
                  <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                    Utkast
                  </span>
                )}
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Deltagare</span>
                  <span>{event.participantCount}/{event.maxParticipants}</span>
                </div>
                <div className="h-2 bg-background-darker rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                    style={{ width: `${(event.participantCount / event.maxParticipants) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button className="btn-secondary flex-1 text-sm">
                  <Edit2 className="w-4 h-4" />
                  Redigera
                </button>
                <button className="btn-secondary p-2" title="Visa deltagare">
                  <Users className="w-4 h-4" />
                </button>
                <button className="btn-danger p-2" title="Ta bort">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

