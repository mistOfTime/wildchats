'use client';

import { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load and apply saved theme on mount - default to light mode (no dark class)
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    
    // If no saved theme, default to light mode (maroon/gold)
    if (!savedTheme || savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
    }

    // Handle email confirmation callback
    const handleAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      
      if (accessToken) {
        // Clear the hash from URL
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    handleAuthCallback();
    
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session) {
        await loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      } else if (event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          await loadUserProfile(session.user.id);
        }
      } else if (event === 'USER_UPDATED') {
        if (session?.user) {
          await loadUserProfile(session.user.id);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session check timeout')), 3000)
      );
      
      const sessionPromise = authService.getSession();
      
      const session = await Promise.race([sessionPromise, timeoutPromise]) as any;
      
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
      }
    } catch (error: any) {
      // Silently handle timeout - just show login page
      if (error?.message === 'Session check timeout') {
        console.log('Session check timed out, showing login page');
      } else {
        console.error('Error checking user:', error);
      }
      
      // Always show login page on any error
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('Loading user profile for:', userId);
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile load timeout')), 5000)
      );
      
      const loadPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      const { data, error } = await Promise.race([loadPromise, timeoutPromise]) as any;
      
      if (error) {
        console.error('Error loading profile:', error);
        return;
      }
      
      if (data) {
        console.log('User profile loaded:', data);
        setCurrentUser(data);
      }
    } catch (error: any) {
      console.error('Failed to load user profile:', error);
    }
  };

  const handleLoginSuccess = async () => {
    console.log('Login success callback triggered');
    await checkUser();
  };

  const handleLogout = async () => {
    try {
      // First set user offline
      if (currentUser?.id) {
        await supabase
          .from('users')
          .update({ 
            online: false,
            last_seen: new Date().toISOString()
          })
          .eq('id', currentUser.id);
      }
      
      // Then logout
      await authService.logout();
      setCurrentUser(null);
      setAuthView('login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-600 via-orange-500 to-yellow-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    if (authView === 'signup') {
      return (
        <SignUp
          onSuccess={handleLoginSuccess}
          onSwitchToLogin={() => setAuthView('login')}
        />
      );
    }

    if (authView === 'forgot-password') {
      return (
        <ForgotPassword
          onBack={() => setAuthView('login')}
        />
      );
    }

    return (
      <LoginForm
        onSuccess={handleLoginSuccess}
        onSwitchToSignUp={() => setAuthView('signup')}
        onForgotPassword={() => setAuthView('forgot-password')}
      />
    );
  }

  const refreshCurrentUser = async () => {
    if (currentUser?.id) {
      await loadUserProfile(currentUser.id);
    }
  };

  return <ChatLayout currentUser={currentUser} onLogout={handleLogout} onRefreshUser={refreshCurrentUser} />;
}
