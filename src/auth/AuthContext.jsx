import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Extract our app-level user data from a Supabase auth user
  const extractUserData = (authUser) => {
    if (!authUser) return null;
    const meta = authUser.user_metadata || {};
    return {
      id: authUser.id,
      email: authUser.email,
      name: meta.name || authUser.email?.split('@')[0] || 'User',
      role: meta.role || 'Sales Rep',
      initials: meta.initials || (meta.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      avatar: meta.avatar || '#10B981',
    };
  };

  useEffect(() => {
    // Check existing session on mount
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(extractUserData(session.user));
        }
      } catch (err) {
        console.error('Auth session error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes (login, logout, token refresh)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session?.user) {
            const meta = session.user.user_metadata || {};
            if (meta.status === 'pending') {
              supabase.auth.signOut();
              setUser(null);
            } else {
              setUser(extractUserData(session.user));
            }
          } else {
            setUser(null);
          }
        }
      );

    return () => subscription?.unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const meta = data.user.user_metadata || {};
      if (meta.status === 'pending') {
        await supabase.auth.signOut();
        return { success: false, error: 'Your account is pending admin approval.' };
      }

      const userData = extractUserData(data.user);
      setUser(userData);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Connection error. Please try again.' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const signup = async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            role: 'Sales Rep',
            status: 'pending' // New users must be approved by an Admin
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }
      
      // Explicitly sign out right after sign up so they don't enter the app in a pending state
      await supabase.auth.signOut();

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Connection error. Please try again.' };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    if (!user) return { success: false, error: 'Not logged in' };

    try {
      // Verify current password by re-authenticating
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Validate new password
      if (newPassword.length < 6) {
        return { success: false, error: 'New password must be at least 6 characters' };
      }

      // Update password via Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to change password. Please try again.' };
    }
  };

  const resetUserPassword = async (email, newPassword) => {
    // Admin password reset requires service_role key (server-side)
    // For now, we'll use the admin API via Supabase client
    // Note: This only works if the current user has admin privileges
    return { success: false, error: 'Admin password reset requires server-side implementation' };
  };

  const addUser = async (newUser) => {
    // Creating users requires service_role key (server-side)
    // For now, users must be created via Supabase Dashboard
    console.warn('addUser: Users should be created via Supabase Dashboard');
  };

  return (
    <AuthContext.Provider value={{
      user, login, signup, logout, addUser, changePassword, resetUserPassword,
      loading, isAdmin: user?.role === 'Admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

export default AuthContext;
