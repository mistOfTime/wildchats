import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  username: string;
  email: string;
  online: boolean;
  avatar_url?: string;
  last_seen?: string;
  created_at: string;
};

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  read: boolean;
  image_url?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  reply_to_id?: string;
  reply_to_text?: string;
  reply_to_sender?: string;
  reply_to_image_url?: string;
  created_at: string;
  sender?: User;
};

export type TypingIndicator = {
  id: string;
  user_id: string;
  chat_with_id: string;
  is_typing: boolean;
  updated_at: string;
};
