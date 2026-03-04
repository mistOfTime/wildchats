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
  const [loading, setLoading] = useState(false); // Changed to false for instant load

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
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, loading profile...');
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
        return;
      }
      
      if (session?.user) {
        console.log('Session found, loading profile...');
        // Load profile without blocking UI
        loadUserProfile(session.user.id);
      } else {
        console.log('No session found');
        setCurrentUser(null);
      }
    } catch (error: any) {
      console.error('Error checking user:', error);
      setCurrentUser(null);
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
        console.log('User profile loaded successfully:', data);
        setCurrentUser(data);
        return;
      }
      
      // Profile doesn't exist, create it
      console.log('Profile not found, creating new profile...');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const newProfile = {
          id: user.id,
          username: user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email,
          online: true,
          last_seen: new Date().toISOString(),
        };
        
        console.log('Creating profile:', newProfile);
        
        const { data: createdProfile, error: createError } = await supabase
          .from('users')
          .insert([newProfile])
          .select()
          .single();
        
        if (createError) {
          console.error('Failed to create profile:', createError);
        } else if (createdProfile) {
          console.log('Profile created successfully:', createdProfile);
          setCurrentUser(createdProfile);
        }
      }
    } catch (error: any) {
      console.error('Failed to load user profile:', error);
    }
  };

  const handleLoginSuccess = async () => {
    console.log('Login success callback triggered');
    
    try {
      // Get session immediately
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('Session found, setting user immediately');
        
        // Try to load profile, but don't wait forever
        const profilePromise = loadUserProfile(session.user.id);
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2000));
        
        await Promise.race([profilePromise, timeoutPromise]);
        
        // If profile didn't load, create a temporary user object
        if (!currentUser) {
          console.log('Profile load timeout, creating temporary user');
          setCurrentUser({
            id: session.user.id,
            username: session.user.user_metadata?.username || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            online: true,
            created_at: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Login success error:', error);
    }
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
    // No loading screen - instant display
    return null;
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
