import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { api } from '@/services/api';

export default function LinkAccount() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error('Ange en giltig kod');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/platform/link-code', {
        code: code.toUpperCase(),
      });

      toast.success('Ditt spelkonto har länkats!');

      // Redirect to settings after successful link
      setTimeout(() => {
        navigate('/settings');
      }, 1500);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Kunde inte länka kontot';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatCode = (value: string) => {
    // Remove non-alphanumeric characters
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();

    // Format as VIKING-XXXX
    if (cleaned.length <= 6) {
      return cleaned;
    }

    return cleaned.slice(0, 6) + '-' + cleaned.slice(6, 10);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCode(e.target.value);
    setCode(formatted);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="card p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">Länka spelkonto</h1>
              <p className="text-gray-400">Anslut ditt Xbox- eller PlayStation-konto</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <h2 className="text-xl font-semibold mb-3">Hur fungerar det?</h2>
            <ol className="text-gray-300 space-y-2">
              <li>
                <strong>Logga först in här på hemsidan</strong> med Discord eller Steam
              </li>
              <li>
                <strong>Anslut till vår Arma Reforger-server</strong> från din Xbox eller PlayStation
              </li>
              <li>
                <strong>Du får en länkningskod</strong> visad i spelet (t.ex. <code className="text-primary-400">VIKING-A7X9</code>)
              </li>
              <li>
                <strong>Ange koden nedan</strong> för att länka ditt spelkonto till din profil
              </li>
            </ol>
          </div>
        </div>

        {/* Link Form */}
        <div className="card p-8">
          <h2 className="font-display text-2xl font-bold mb-6">Ange din länkningskod</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">
                Länkningskod från spelet
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={handleCodeChange}
                placeholder="VIKING-XXXX"
                maxLength={11}
                className="input text-2xl font-mono text-center tracking-wider"
                disabled={loading}
                autoFocus
              />
              <p className="text-sm text-gray-400 mt-2">
                Koden är giltig i 24 timmar från då den genererades
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length < 7}
              className="btn-primary w-full text-lg py-3"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Länkar konto...
                </div>
              ) : (
                'Länka konto'
              )}
            </button>
          </form>

          {/* Help Section */}
          <div className="mt-8 pt-8 border-t border-gray-800">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Problem?
            </h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p>
                <strong className="text-gray-300">Har inte fått någon kod?</strong><br />
                Anslut till vår Arma Reforger-server så genereras koden automatiskt.
              </p>
              <p>
                <strong className="text-gray-300">Koden fungerar inte?</strong><br />
                Kontrollera att du skrev in koden korrekt. Den är giltig i 24 timmar.
              </p>
              <p>
                <strong className="text-gray-300">Behöver hjälp?</strong><br />
                Kontakta oss på Discord eller skapa ett <a href="/tickets" className="text-primary-400 hover:underline">supportärende</a>.
              </p>
            </div>
          </div>
        </div>

        {/* Platform Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="card p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-gray-800 flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.5 3.5l-10 5.5v7l10 5.5l10-5.5v-7l-10-5.5zm0 2.121l7.121 3.921l-7.121 3.921l-7.121-3.921l7.121-3.921zm-8 10.758v-4.758l8 4.4v4.758l-8-4.4zm10 4.4v-4.758l8-4.4v4.758l-8 4.4z"/>
              </svg>
            </div>
            <div className="font-semibold">Steam (PC)</div>
            <div className="text-xs text-gray-400">Automatiskt länkat</div>
          </div>

          <div className="card p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-[#107C10] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.102 21.033A11.947 11.947 0 0012 24a11.96 11.96 0 007.902-2.967L13.846 6.12l-9.744 14.913zm7.902.967c-2.164 0-4.26-.577-6.09-1.69L13.846 6.12l7.902 11.853A11.918 11.918 0 0112 22zm7.902-4.033L12 3.88 4.196 17.967C2.447 16.278 1.333 13.906 1.333 11.333 1.333 5.595 6.261.667 12 .667S22.667 5.595 22.667 11.333c0 2.573-1.114 4.945-2.863 6.634z"/>
              </svg>
            </div>
            <div className="font-semibold">Xbox</div>
            <div className="text-xs text-gray-400">Kräver länkningskod</div>
          </div>

          <div className="card p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-[#0070CC] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.985 2.596v17.548l3.015 1.76V6.688zM0 12.724V8.008l3.015-1.76v8.236zm14.03 9.16l-3.015-1.76v-17.548l3.015 1.76zm9.97-9.16V8.008l-3.015-1.76v8.236z"/>
              </svg>
            </div>
            <div className="font-semibold">PlayStation</div>
            <div className="text-xs text-gray-400">Kräver länkningskod</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
