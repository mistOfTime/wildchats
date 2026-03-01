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

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set offline on unmount
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      setOffline();
    };
  }, [userId]);
}
