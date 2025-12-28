import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';

export default function Login() {
  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="card p-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center font-display font-bold text-white text-3xl mx-auto mb-6">
            SV
          </div>
          
          <h1 className="font-display text-2xl font-bold mb-2">
            Välkommen till Sweden Vikings
          </h1>
          <p className="text-gray-400 mb-8">
            Logga in med ditt Steam-konto för att få tillgång till alla funktioner.
          </p>

          <button
            onClick={login}
            className="btn-primary w-full text-lg py-3 mb-4"
          >
            <img src="/steam-logo.svg" alt="" className="w-6 h-6" />
            Logga in med Steam
          </button>

          <p className="text-sm text-gray-500">
            Genom att logga in godkänner du våra{' '}
            <a href="/rules" className="text-primary-400 hover:underline">
              regler
            </a>{' '}
            och användarvillkor.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

