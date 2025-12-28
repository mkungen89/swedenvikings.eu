import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function AuthCallback() {
  const { checkAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      await checkAuth();
      navigate('/', { replace: true });
    };

    handleCallback();
  }, [checkAuth, navigate]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loggar in...</p>
      </div>
    </div>
  );
}

