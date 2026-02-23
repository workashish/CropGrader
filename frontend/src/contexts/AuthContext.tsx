import { createContext, useContext, ReactNode } from 'react';
import { User, Session, AuthResponse, AuthError } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ data: AuthResponse['data']; error: AuthError | null }>;  signIn: (email: string, password: string) => Promise<{ data: AuthResponse['data']; error: AuthError | null }>;  signOut: () => Promise<{ error: AuthError | null }>;
  isAuthenticated: boolean;
  requiresEmailConfirmation: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
