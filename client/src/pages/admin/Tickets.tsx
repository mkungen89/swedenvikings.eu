import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MessageSquare, Clock, User, Loader2, X, Send } from 'lucide-react';
import { useAllTickets, useTicket, useAssignTicket, useUpdateTicketStatus, useAddTicketMessage } from '@/hooks/useTickets';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Öppen' },
  in_progress: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pågår' },
  waiting: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Väntar' },
  resolved: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Löst' },
  closed: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Stängd' },
};

const priorityColors: Record<string, { bg: string; text: string }> = {
  low: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
  medium: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  urgent: { bg: 'bg-red-500/20', text: 'text-red-400' },
};

const categoryLabels: Record<string, string> = {
  bug: 'Bug',
  question: 'Fråga',
  report: 'Rapport',
  appeal: 'Överklagan',
  other: 'Annat',
};

export default function AdminTickets() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  
  const { data, isLoading, error } = useAllTickets(page, 20, { status: statusFilter || undefined });
  const { data: selectedTicket, isLoading: loadingTicket } = useTicket(selectedTicketId || '');
  const assignTicket = useAssignTicket();
  const updateStatus = useUpdateTicketStatus();
  const addMessage = useAddTicketMessage();
  
  const tickets = data?.data ?? [];
  const meta = data?.meta;

  const handleAssignToMe = async (ticketId: string) => {
    try {
      await assignTicket.mutateAsync({ ticketId, assignedToId: user?.id });
      toast.success('Ticket tilldelad till dig');
    } catch {
      toast.error('Kunde inte tilldela ticket');
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicketId) return;
    try {
      await updateStatus.mutateAsync({ ticketId: selectedTicketId, status });
      toast.success('Status uppdaterad');
    } catch {
      toast.error('Kunde inte uppdatera status');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTicketId || !newMessage.trim()) return;
    try {
      await addMessage.mutateAsync({ ticketId: selectedTicketId, content: newMessage });
      setNewMessage('');
    } catch {
      toast.error('Kunde inte skicka meddelande');
    }
  };

  const filteredTickets = tickets.filter((ticket) =>
    ticket.title.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate stats
  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const waitingCount = tickets.filter(t => t.status === 'waiting').length;
  const urgentCount = tickets.filter(t => t.priority === 'urgent').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-400">Laddar tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400">Ett fel uppstod vid laddning av tickets.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold mb-2">Tickets</h1>
        <p className="text-gray-400">Hantera supportärenden</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-gray-400 mb-1">Öppna</div>
          <div className="text-2xl font-bold text-green-400">{openCount}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-400 mb-1">Pågår</div>
          <div className="text-2xl font-bold text-yellow-400">{inProgressCount}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-400 mb-1">Väntar på svar</div>
          <div className="text-2xl font-bold text-orange-400">{waitingCount}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-400 mb-1">Brådskande</div>
          <div className="text-2xl font-bold text-red-400">{urgentCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Sök tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input w-auto"
        >
          <option value="">Alla status</option>
          <option value="open">Öppna</option>
          <option value="in_progress">Pågår</option>
          <option value="waiting">Väntar</option>
          <option value="resolved">Lösta</option>
          <option value="closed">Stängda</option>
        </select>
      </div>

      {/* Tickets List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {filteredTickets.map((ticket) => {
          const status = statusColors[ticket.status] || statusColors.open;
          const priority = priorityColors[ticket.priority] || priorityColors.medium;
          return (
            <div key={ticket.id} className="card-hover p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${priority.bg} ${priority.text}`}>
                      {ticket.priority}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                    <span className="px-2 py-0.5 bg-white/10 rounded text-xs text-gray-400">
                      {categoryLabels[ticket.category]}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2">{ticket.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {ticket.createdBy?.username || 'Unknown'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(ticket.createdAt).toLocaleDateString('sv-SE')}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {ticket._count?.messages || 0} meddelanden
                    </div>
                    {ticket.assignedTo && (
                      <div className="text-primary-400">
                        Tilldelad: {ticket.assignedTo.username}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!ticket.assignedTo && (
                    <button
                      onClick={() => handleAssignToMe(ticket.id)}
                      disabled={assignTicket.isPending}
                      className="btn-secondary text-sm"
                    >
                      {assignTicket.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ta över'}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className="btn-primary text-sm"
                  >
                    Öppna
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>

      {filteredTickets.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Inga tickets matchar dina filter.
        </div>
      )}

      {/* View Ticket Modal */}
      {selectedTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
          >
            {loadingTicket ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : selectedTicket ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-display text-xl font-semibold">{selectedTicket.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[selectedTicket.status]?.bg} ${statusColors[selectedTicket.status]?.text}`}>
                        {statusColors[selectedTicket.status]?.label}
                      </span>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                        className="input py-1 px-2 text-xs w-auto"
                      >
                        <option value="open">Öppen</option>
                        <option value="in_progress">Pågår</option>
                        <option value="waiting">Väntar</option>
                        <option value="resolved">Löst</option>
                        <option value="closed">Stängd</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={() => setSelectedTicketId(null)} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {/* Original description */}
                  <div className="p-4 bg-background-darker rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{selectedTicket.createdBy?.username}</span>
                      <span className="text-xs text-gray-500">Skapare</span>
                    </div>
                    <p className="text-gray-300">{selectedTicket.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(selectedTicket.createdAt).toLocaleString('sv-SE')}
                    </p>
                  </div>
                  
                  {/* Messages */}
                  {selectedTicket.messages?.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg ${message.isStaff ? 'bg-primary-600/20 ml-8' : 'bg-background-darker mr-8'}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{message.author?.username}</span>
                        {message.isStaff && (
                          <span className="px-2 py-0.5 bg-primary-600/30 text-primary-400 text-xs rounded">Staff</span>
                        )}
                      </div>
                      <p className="text-gray-300">{message.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(message.createdAt).toLocaleString('sv-SE')}
                      </p>
                    </div>
                  ))}
                </div>
                
                {/* Reply input */}
                {selectedTicket.status !== 'closed' && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="input flex-1"
                      placeholder="Skriv ett svar (som staff)..."
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={addMessage.isPending || !newMessage.trim()}
                      className="btn-primary"
                    >
                      {addMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-400 text-center py-8">Ticket kunde inte hittas.</p>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
