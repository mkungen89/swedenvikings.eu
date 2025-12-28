import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNewsList } from '@/hooks/useNews';

const categoryColors: Record<string, string> = {
  update: 'bg-blue-500/20 text-blue-400',
  announcement: 'bg-green-500/20 text-green-400',
  event: 'bg-purple-500/20 text-purple-400',
  changelog: 'bg-orange-500/20 text-orange-400',
  community: 'bg-pink-500/20 text-pink-400',
};

const categoryLabels: Record<string, string> = {
  update: 'Uppdatering',
  announcement: 'Meddelande',
  event: 'Event',
  changelog: 'Ändringslogg',
  community: 'Community',
};

export default function News() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useNewsList(page, 12);
  
  const newsArticles = data?.data ?? [];
  const meta = data?.meta;

  if (isLoading) {
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-gray-400">Laddar nyheter...</p>
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
            <p className="text-red-400">Ett fel uppstod vid laddning av nyheter.</p>
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
          <h1 className="font-display text-4xl font-bold mb-4">Nyheter</h1>
          <p className="text-gray-400">
            Senaste nyheterna och uppdateringarna från Sweden Vikings.
          </p>
        </motion.div>

        {/* News Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsArticles.map((article, index) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <Link to={`/news/${article.slug}`}>
                <div className="card-hover overflow-hidden">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden bg-background-darker">
                    {article.image ? (
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-600 text-6xl font-display">SV</span>
                      </div>
                    )}
                    {article.isPinned && (
                      <div className="absolute top-3 left-3 px-2 py-1 bg-primary-600 text-white text-xs font-medium rounded">
                        Fäst
                      </div>
                    )}
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-medium ${categoryColors[article.category] || 'bg-gray-500/20 text-gray-400'}`}>
                      {categoryLabels[article.category] || article.category}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h2 className="font-display font-semibold text-lg mb-2 group-hover:text-primary-400 transition-colors line-clamp-2">
                      {article.title}
                    </h2>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(article.publishedAt || article.createdAt).toLocaleDateString('sv-SE')}
                      </div>
                      <span className="text-primary-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Läs mer
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        {/* Empty state */}
        {newsArticles.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400">Inga nyheter att visa just nu.</p>
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
