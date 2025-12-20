import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, accessToken, getCurrentUser } = useAuthStore();

  useEffect(() => {
    if (accessToken && !isAuthenticated) {
      getCurrentUser();
    }
  }, [accessToken, isAuthenticated, getCurrentUser]);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

