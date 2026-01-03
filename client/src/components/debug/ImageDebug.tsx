import { useAuthStore } from '@/store/authStore';

export default function ImageDebug() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-background-card p-4 rounded-lg border border-white/10 max-w-md">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div className="text-xs space-y-1">
        <p>
          <strong>Avatar URL:</strong> {user.avatar || 'null'}
        </p>
        <p>
          <strong>Banner URL:</strong> {user.banner || 'null'}
        </p>
        {user.avatar && (
          <div>
            <strong>Avatar Test:</strong>
            <img
              src={user.avatar}
              alt="Avatar test"
              className="w-16 h-16 mt-1 border border-green-500"
              onError={(e) => {
                console.error('Avatar failed to load:', user.avatar);
                e.currentTarget.style.borderColor = 'red';
              }}
              onLoad={() => console.log('Avatar loaded successfully:', user.avatar)}
            />
          </div>
        )}
        {user.banner && (
          <div>
            <strong>Banner Test:</strong>
            <img
              src={user.banner}
              alt="Banner test"
              className="w-32 h-10 mt-1 border border-green-500"
              onError={(e) => {
                console.error('Banner failed to load:', user.banner);
                e.currentTarget.style.borderColor = 'red';
              }}
              onLoad={() => console.log('Banner loaded successfully:', user.banner)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
