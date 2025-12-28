import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Eye, Pin, Loader2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminNewsList, useCreateNews, useUpdateNews, useDeleteNews } from '@/hooks/useNews';
import toast from 'react-hot-toast';

export default function AdminNews() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editingArticle, setEditingArticle] = useState<string | null>(null);
  const [newArticle, setNewArticle] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'announcement',
    isPinned: false,
    isPublished: false,
  });
  
  const { data, isLoading, error } = useAdminNewsList(page, 20);
  const createNews = useCreateNews();
  const updateNews = useUpdateNews();
  const deleteNews = useDeleteNews();
  
  const articles = data?.data ?? [];
  const meta = data?.meta;

  const handleCreate = async () => {
    if (!newArticle.title || !newArticle.content) {
      toast.error('Titel och innehåll krävs');
      return;
    }
    try {
      await createNews.mutateAsync(newArticle);
      toast.success('Artikel skapad!');
      setShowCreate(false);
      setNewArticle({ title: '', excerpt: '', content: '', category: 'announcement', isPinned: false, isPublished: false });
    } catch {
      toast.error('Kunde inte skapa artikel');
    }
  };

  const handleTogglePublished = async (id: string, isPublished: boolean) => {
    try {
      await updateNews.mutateAsync({ id, isPublished: !isPublished });
      toast.success(isPublished ? 'Artikel avpublicerad' : 'Artikel publicerad!');
    } catch {
      toast.error('Kunde inte uppdatera artikel');
    }
  };

  const handleTogglePinned = async (id: string, isPinned: boolean) => {
    try {
      await updateNews.mutateAsync({ id, isPinned: !isPinned });
      toast.success(isPinned ? 'Artikel avfäst' : 'Artikel fäst!');
    } catch {
      toast.error('Kunde inte uppdatera artikel');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna artikel?')) return;
    try {
      await deleteNews.mutateAsync(id);
      toast.success('Artikel borttagen');
    } catch {
      toast.error('Kunde inte ta bort artikel');
    }
  };

  const filteredArticles = articles.filter((article) =>
    article.title.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-400">Laddar artiklar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400">Ett fel uppstod vid laddning av artiklar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Nyheter</h1>
          <p className="text-gray-400">Hantera nyhetsartiklar</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-5 h-5" />
          Ny Artikel
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Sök artiklar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Articles Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-darker">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Titel</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Kategori</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Författare</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Datum</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Åtgärder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredArticles.map((article) => (
                <tr key={article.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {article.isPinned && (
                        <Pin className="w-4 h-4 text-primary-400" />
                      )}
                      <span className="font-medium">{article.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm capitalize">
                    {article.category}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {article.author?.username || 'Unknown'}
                  </td>
                  <td className="px-6 py-4">
                    {article.isPublished ? (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                        Publicerad
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">
                        Utkast
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {new Date(article.createdAt).toLocaleDateString('sv-SE')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/news/${article.slug}`} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Visa">
                        <Eye className="w-4 h-4 text-gray-400" />
                      </Link>
                      <button
                        onClick={() => handleTogglePinned(article.id, article.isPinned)}
                        className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${article.isPinned ? 'text-primary-400' : 'text-gray-400'}`}
                        title={article.isPinned ? 'Avfäst' : 'Fäst'}
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTogglePublished(article.id, article.isPublished)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400"
                        title={article.isPublished ? 'Avpublicera' : 'Publicera'}
                      >
                        {article.isPublished ? '📤' : '📥'}
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                        title="Ta bort"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Visar {filteredArticles.length} av {meta?.total || articles.length} artiklar
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              Föregående
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!meta || page >= meta.totalPages}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              Nästa
            </button>
          </div>
        </div>
      </motion.div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold">Ny artikel</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="label">Titel</label>
                <input
                  type="text"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                  className="input"
                  placeholder="Artikel titel"
                />
              </div>
              
              <div>
                <label className="label">Kategori</label>
                <select
                  value={newArticle.category}
                  onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                  className="input"
                >
                  <option value="announcement">Meddelande</option>
                  <option value="update">Uppdatering</option>
                  <option value="event">Event</option>
                  <option value="changelog">Ändringslogg</option>
                  <option value="community">Community</option>
                </select>
              </div>
              
              <div>
                <label className="label">Sammanfattning</label>
                <textarea
                  value={newArticle.excerpt}
                  onChange={(e) => setNewArticle({ ...newArticle, excerpt: e.target.value })}
                  className="input resize-none"
                  rows={2}
                  placeholder="Kort beskrivning..."
                />
              </div>
              
              <div>
                <label className="label">Innehåll (HTML)</label>
                <textarea
                  value={newArticle.content}
                  onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                  className="input resize-none font-mono"
                  rows={8}
                  placeholder="<p>Artikelns innehåll...</p>"
                />
              </div>
              
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newArticle.isPinned}
                    onChange={(e) => setNewArticle({ ...newArticle, isPinned: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 text-primary-600"
                  />
                  <span>Fäst artikel</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newArticle.isPublished}
                    onChange={(e) => setNewArticle({ ...newArticle, isPublished: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 text-primary-600"
                  />
                  <span>Publicera direkt</span>
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">
                Avbryt
              </button>
              <button
                onClick={handleCreate}
                disabled={createNews.isPending}
                className="btn-primary flex-1"
              >
                {createNews.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Skapa'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
