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
    
    // Check user immediately without delay
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session) {
        await loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        await loadUserProfile(session.user.id);
      } else if (event === 'USER_UPDATED' && session?.user) {
        await loadUserProfile(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      // Get session synchronously from localStorage first for instant load
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        setCurrentUser(null);
        setLoading(false);
        return;
      }
      
      if (session?.user) {
        console.log('Session found, loading profile...');
        // Load profile in parallel with setting loading to false for faster UI
        loadUserProfile(session.user.id);
        setLoading(false);
      } else {
        console.log('No session found');
        setCurrentUser(null);
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error checking user:', error);
      setCurrentUser(null);
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('Loading user profile for:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }
      
      if (data) {
        console.log('User profile loaded:', data);
        setCurrentUser(data);
      } else {
        // Profile doesn't exist, create it
        console.log('Profile not found, creating...');
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert([{
              id: user.id,
              username: user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              email: user.email,
              online: true,
              last_seen: new Date().toISOString(),
            }])
            .select()
            .single();
          
          if (!createError && newProfile) {
            setCurrentUser(newProfile);
          }
        }
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
          <div className="inline-block p-3 bg-amber-800 rounded-full mb-4 shadow-lg ring-4 ring-yellow-600 animate-pulse">
            <img 
              src="https://tse3.mm.bing.net/th/id/OIP.7aJ7MqW3gaesL5SJALtnkgHaHO?rs=1&pid=ImgDetMain" 
              alt="CIT Logo" 
              className="w-16 h-16 rounded-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-white drop-shadow-lg font-extrabold">Wild</span>
            <span className="text-white drop-shadow-lg font-extrabold italic">Chats</span>
          </h1>
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
