import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
