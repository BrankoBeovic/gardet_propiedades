/**
 * Provides verified auth user via getUser + onAuthStateChange.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let subscription = null;

    const init = async () => {
      try {
        const response = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(response?.data?.user ?? null);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const authListener = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });
    subscription = authListener?.data?.subscription ?? null;

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Shared auth hook — prefer over duplicated getSession checks.
 */
export function useAuth() {
  return useContext(AuthContext);
}

export default AuthProvider;
