import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, User, Loader2 } from 'lucide-react';
import { useNewsArticle } from '@/hooks/useNews';

export default function NewsArticle() {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading, error } = useNewsArticle(slug || '');

  if (isLoading) {
    return (
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-gray-400">Laddar artikel...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-400">Artikeln kunde inte hittas.</p>
        <Link to="/news" className="text-primary-400 hover:underline mt-4 inline-block">
          Tillbaka till nyheter
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          to="/news"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka till nyheter
        </Link>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header Image */}
          {article.image && (
            <div className="rounded-2xl overflow-hidden mb-8">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-64 sm:h-96 object-cover"
              />
            </div>
          )}

          {/* Title */}
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            {article.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-8 pb-8 border-b border-white/10">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {article.author?.username || 'Unknown'}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(article.publishedAt || article.createdAt).toLocaleDateString('sv-SE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>

          {/* Content */}
          <div
            className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-a:text-primary-400"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </motion.article>
      </div>
    </div>
  );
}
