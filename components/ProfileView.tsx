'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ProfileViewProps {
  userId: string;
  onClose: () => void;
  onStartChat: (userId: string) => void;
  isOwnProfile?: boolean;
  onEditProfile?: () => void;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  online: boolean;
  last_seen: string | null;
}

export default function ProfileView({ userId, onClose, onStartChat, isOwnProfile, onEditProfile }: ProfileViewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
    
    // Subscribe to user status changes
    const channel = supabase
      .channel(`user-status:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          setProfile(payload.new as UserProfile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getLastSeenText = (lastSeen: string | null, online: boolean) => {
    if (online) return 'Online';
    if (!lastSeen) return 'Offline';
    
    const date = new Date(lastSeen);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="rounded-2xl p-8 max-w-md w-full" style={{ backgroundColor: 'white', color: 'black' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4" style={{ color: '#4b5563' }}>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="rounded-2xl p-8 max-w-md w-full" style={{ backgroundColor: 'white', color: 'black' }}>
          <p className="text-center" style={{ color: '#4b5563' }}>Profile not found</p>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 rounded-lg"
            style={{ backgroundColor: '#e5e7eb', color: 'black' }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl shadow-2xl max-w-sm md:max-w-md w-full overflow-hidden" style={{ backgroundColor: 'white', color: 'black' }}>
        {/* Header with close button */}
        <div className="relative h-28 md:h-32 bg-gradient-to-br from-red-800 to-yellow-600 overflow-hidden">
          {profile.cover_url && (
            <img
              src={profile.cover_url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Profile content */}
        <div className="px-6 md:px-8 pb-6 md:pb-8" style={{ backgroundColor: 'white' }}>
          {/* Avatar */}
          <div className="relative -mt-12 md:-mt-16 mb-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full  object-cover "
              />
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full  bg-gradient-to-br from-red-800 to-yellow-600 flex items-center justify-center ">
                <span className="text-3xl md:text-4xl font-bold text-white">
                  {getInitials(profile.username)}
                </span>
              </div>
            )}
            {/* Online status indicator */}
            <div className={`absolute bottom-2 right-2 w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-white ${
              profile.online ? 'bg-green-500' : 'bg-gray-400'
            }`}></div>
          </div>

          {/* Name and status */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
              {profile.username}
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mb-2 break-all">
              {profile.email}
            </p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${profile.online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-xs md:text-sm text-gray-600">
                {getLastSeenText(profile.last_seen, profile.online)}
              </span>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-6">
            <h3 className="text-xs md:text-sm font-semibold text-gray-700 mb-2">About</h3>
            <p className="text-sm md:text-base text-gray-600">
              {profile.bio || 'No bio yet'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {isOwnProfile ? (
              <button
                onClick={onEditProfile}
                className="w-full px-4 py-2.5 md:py-3 text-sm md:text-base bg-gradient-to-r from-red-800 to-yellow-600 text-white rounded-xl font-semibold hover:from-red-900 hover:to-yellow-700 transition shadow-lg"
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={() => {
                  onStartChat(userId);
                  onClose();
                }}
                className="w-full px-4 py-2.5 md:py-3 text-sm md:text-base bg-gradient-to-r from-red-800 to-yellow-600 text-white rounded-xl font-semibold hover:from-red-900 hover:to-yellow-700 transition shadow-lg"
              >
                Send Message
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
