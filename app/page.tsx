'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { authService } from '@/lib/auth';
import LoginForm from '@/components/LoginForm';
import SignUp from '@/components/SignUp';
import ForgotPassword from '@/components/ForgotPassword';
import ChatLayout from '@/components/ChatLayout';

type AuthView = 'login' | 'signup' | 'forgot-password';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authView, setAuthView] = useState<AuthView>('login');
  const currentUserRef = useRef<any>(null);

  // Keep ref in sync with state
  const setUser = (user: any) => {
    currentUserRef.current = user;
    setCurrentUser(user);
  };

  useEffect(() => {
    // Apply saved theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (!savedTheme || savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
    }

    // Handle email confirmation callback
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      window.history.replaceState(null, '', window.location.pathname);
    }

    // Check existing session on mount
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if ((event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
        loadUserProfile(session.user.id);
      }
      // SIGNED_IN is handled by handleLoginSuccess to avoid double-loading
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('Session found, loading profile...');
        await loadUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  const loadUserProfile = async (userId: string): Promise<boolean> => {
    try {
      // Race the DB query against a 3-second timeout
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('timeout') }), 3000)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error && error.message !== 'timeout' && error.code !== 'PGRST116') {
        console.error('Profile query error:', error);
      }

      if (data) {
        setUser(data);
        return true;
      }

      // Profile missing — create it
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const newProfile = {
          id: user.id,
          username: user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email,
          online: true,
          last_seen: new Date().toISOString(),
        };
        const { data: created, error: createError } = await supabase
          .from('users')
          .insert([newProfile])
          .select()
          .single();
        if (!createError && created) {
          setUser(created);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('loadUserProfile error:', error);
      return false;
    }
  };

  const buildTempUser = (session: any) => ({
    id: session.user.id,
    username:
      session.user.user_metadata?.username ||
      session.user.user_metadata?.full_name ||
      session.user.email?.split('@')[0] ||
      'User',
    email: session.user.email || '',
    online: true,
    created_at: new Date().toISOString(),
  });

  const handleLoginSuccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Try to load real profile with a 3s timeout
      const loaded = await loadUserProfile(session.user.id);

      // If DB was too slow, use a temp user object so UI doesn't block
      if (!loaded && !currentUserRef.current) {
        console.log('Using temp user after timeout');
        setUser(buildTempUser(session));
      }
    } catch (error) {
      console.error('handleLoginSuccess error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      if (currentUser?.id) {
        await supabase
          .from('users')
          .update({ online: false, last_seen: new Date().toISOString() })
          .eq('id', currentUser.id);
      }
      await authService.logout();
      setUser(null);
      setAuthView('login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshCurrentUser = async () => {
    if (currentUser?.id) {
      await loadUserProfile(currentUser.id);
    }
  };

  if (!currentUser) {
    if (authView === 'signup') {
      return <SignUp onSuccess={handleLoginSuccess} onSwitchToLogin={() => setAuthView('login')} />;
    }
    if (authView === 'forgot-password') {
      return <ForgotPassword onBack={() => setAuthView('login')} />;
    }
    return (
      <LoginForm
        onSuccess={handleLoginSuccess}
        onSwitchToSignUp={() => setAuthView('signup')}
        onForgotPassword={() => setAuthView('forgot-password')}
      />
    );
  }

  return <ChatLayout currentUser={currentUser} onLogout={handleLogout} onRefreshUser={refreshCurrentUser} />;
}
