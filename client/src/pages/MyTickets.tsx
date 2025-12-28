import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, MessageSquare, Clock, CheckCircle, Loader2, X, Send } from 'lucide-react';
import { useMyTickets, useCreateTicket, useTicket, useAddTicketMessage, useCloseTicket } from '@/hooks/useTickets';
import toast from 'react-hot-toast';

export default function MyTickets() {
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'question' as const,
    priority: 'medium' as const,
  });
  
  const { data, isLoading, error } = useMyTickets(page, 20);
  const { data: selectedTicket, isLoading: loadingTicket } = useTicket(selectedTicketId || '');
  const createTicket = useCreateTicket();
  const addMessage = useAddTicketMessage();
  const closeTicket = useCloseTicket();
  
  const tickets = data?.data ?? [];

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    open: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Öppen' },
    in_progress: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pågår' },
    waiting: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Väntar' },
    resolved: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Löst' },
    closed: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Stängd' },
  };

  const categoryLabels: Record<string, string> = {
    bug: 'Bug',
    question: 'Fråga',
    report: 'Rapport',
    appeal: 'Överklagan',
    other: 'Annat',
  };

  const handleCreateTicket = async () => {
    if (!newTicket.title || !newTicket.description) {
      toast.error('Titel och beskrivning krävs');
      return;
    }
    try {
      await createTicket.mutateAsync(newTicket);
      toast.success('Ticket skapad!');
      setShowCreate(false);
      setNewTicket({ title: '', description: '', category: 'question', priority: 'medium' });
    } catch {
      toast.error('Kunde inte skapa ticket');
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

  const handleCloseTicket = async () => {
    if (!selectedTicketId) return;
    try {
      await closeTicket.mutateAsync(selectedTicketId);
      toast.success('Ticket stängd');
      setSelectedTicketId(null);
    } catch {
      toast.error('Kunde inte stänga ticket');
    }
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-gray-400">Laddar tickets...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <p className="text-red-400">Ett fel uppstod vid laddning av tickets.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold mb-2">Mina Tickets</h1>
              <p className="text-gray-400">Hantera dina supportärenden</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary"
            >
              <Plus className="w-5 h-5" />
              Ny Ticket
            </button>
          </div>

          {/* Tickets List */}
          <div className="space-y-4">
            {tickets.map((ticket) => {
              const status = statusColors[ticket.status] || statusColors.open;
              return (
                <div key={ticket.id} className="card-hover p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold">{ticket.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                        <span className="px-2 py-0.5 bg-white/10 rounded text-xs text-gray-400">
                          {categoryLabels[ticket.category]}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(ticket.createdAt).toLocaleDateString('sv-SE')}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {ticket._count?.messages || 0} meddelanden
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className="btn-secondary text-sm"
                    >
                      Visa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {tickets.length === 0 && (
            <div className="text-center py-16">
              <CheckCircle className="w-12 h-12 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 mb-4">Du har inga tickets.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="btn-primary"
              >
                <Plus className="w-5 h-5" />
                Skapa din första ticket
              </button>
            </div>
          )}
        </motion.div>

        {/* Create Ticket Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card p-6 w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-semibold">Ny Ticket</h2>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="label">Titel</label>
                  <input
                    type="text"
                    value={newTicket.title}
                    onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                    className="input"
                    placeholder="Kort beskrivning av problemet"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Kategori</label>
                    <select
                      value={newTicket.category}
                      onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as typeof newTicket.category })}
                      className="input"
                    >
                      <option value="question">Fråga</option>
                      <option value="bug">Bug</option>
                      <option value="report">Rapport</option>
                      <option value="appeal">Överklagan</option>
                      <option value="other">Annat</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Prioritet</label>
                    <select
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as typeof newTicket.priority })}
                      className="input"
                    >
                      <option value="low">Låg</option>
                      <option value="medium">Medium</option>
                      <option value="high">Hög</option>
                      <option value="urgent">Brådskande</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="label">Beskrivning</label>
                  <textarea
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    className="input resize-none"
                    rows={4}
                    placeholder="Beskriv ditt ärende i detalj..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">
                  Avbryt
                </button>
                <button
                  onClick={handleCreateTicket}
                  disabled={createTicket.isPending}
                  className="btn-primary flex-1"
                >
                  {createTicket.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Skapa'}
                </button>
              </div>
            </motion.div>
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
                        <span className="text-sm text-gray-400">
                          {categoryLabels[selectedTicket.category]}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setSelectedTicketId(null)} className="text-gray-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    {/* Original description */}
                    <div className="p-4 bg-background-darker rounded-lg">
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
                          <span className="font-medium">{message.author.username}</span>
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
                  {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="input flex-1"
                        placeholder="Skriv ett svar..."
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
                  
                  {/* Close button */}
                  {selectedTicket.status !== 'closed' && (
                    <button
                      onClick={handleCloseTicket}
                      disabled={closeTicket.isPending}
                      className="btn-secondary mt-4 w-full"
                    >
                      {closeTicket.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Stäng ticket'}
                    </button>
                  )}
                </>
              ) : (
                <p className="text-gray-400 text-center py-8">Ticket kunde inte hittas.</p>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
