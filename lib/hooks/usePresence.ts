import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function usePresence(userId: string) {
  useEffect(() => {
    // Set user online
    const setOnline = async () => {
      await supabase
        .from('users')
        .update({ online: true, last_seen: new Date().toISOString() })
        .eq('id', userId);
    };

    // Set user offline
    const setOffline = async () => {
      await supabase
        .from('users')
        .update({ online: false, last_seen: new Date().toISOString() })
        .eq('id', userId);
    };

    setOnline();

    // Update presence every 30 seconds
    const interval = setInterval(setOnline, 30000);

    // Handle page visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline();
      } else {
        setOnline();
      }
    };

    // Handle browser close/refresh
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable offline status on page close
      const data = new FormData();
      data.append('userId', userId);
      
      // Synchronous update for immediate effect
      navigator.sendBeacon?.('/api/offline', data) || setOffline();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Set offline on unmount
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setOffline();
    };
  }, [userId]);
}
