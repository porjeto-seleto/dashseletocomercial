import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading, adminLoading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('ProtectedRoute check:', { 
      user: !!user, 
      loading, 
      adminLoading, 
      isAdmin, 
      requireAdmin 
    });
    
    // Wait for both auth loading and admin loading to complete
    if (!loading && !adminLoading) {
      if (!user) {
        console.log('No user, redirecting to auth');
        navigate('/auth');
        return;
      }
      
      if (requireAdmin && !isAdmin) {
        console.log('Admin required but user is not admin, redirecting to home');
        navigate('/');
        return;
      }
    }
  }, [user, loading, adminLoading, isAdmin, requireAdmin, navigate]);

  // Show loading while either auth or admin status is loading
  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        <div className="ml-4 text-muted-foreground">
          {loading ? 'Carregando autenticação...' : 'Verificando permissões...'}
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    console.log('Blocking admin access - user is not admin');
    return null;
  }

  return <>{children}</>;
};