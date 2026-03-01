import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export function useTypingIndicator(userId: string, chatWithId: string | null) {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>();

  const setTyping = async (isTyping: boolean) => {
    if (!chatWithId) return;

    await supabase
      .from('typing_indicators')
      .upsert({
        user_id: userId,
        chat_with_id: chatWithId,
        is_typing: isTyping,
        updated_at: new Date().toISOString()
      });
  };

  const handleTyping = () => {
    setTyping(true);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setTyping(false);
    };
  }, [chatWithId]);

  return { handleTyping };
}
