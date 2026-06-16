import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getUserFromToken, isTokenExpired } from '@/utils/jwtDecoder';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (errorParam || !token) {
      const message =
        errorParam === 'no_account'
          ? "No account found for this Google address. Contact your account manager to get access."
          : 'Google sign-in failed. Please try again.';
      navigate('/login', { replace: true, state: { message } });
      return;
    }

    if (isTokenExpired(token)) {
      toast.error('Google sign-in failed', { description: 'Token expired. Please try again.' });
      navigate('/login', { replace: true });
      return;
    }

    const decodedUser = getUserFromToken(token);
    if (!decodedUser) {
      toast.error('Google sign-in failed', { description: 'Invalid token.' });
      navigate('/login', { replace: true });
      return;
    }

    localStorage.setItem('farmaze_token', token);
    localStorage.setItem('farmaze_user', JSON.stringify(decodedUser));

    // Full reload so AuthProvider's initializeAuth picks up the token and
    // RootRedirect routes by role (client_admin → /insights, client → /smart-order).
    window.location.replace('/');
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
        <p className="text-muted-foreground">Completing sign-in…</p>
      </div>
    </div>
  );
};

export default GoogleCallback;
