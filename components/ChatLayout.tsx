'use client';

import { useState, useEffect } from 'react';
import { supabase, type User, type Message } from '@/lib/supabase';
import { usePresence } from '@/lib/hooks/usePresence';
import UserList from './UserList';
import ChatWindow from './ChatWindow';
import ProfileView from './ProfileView';
import ProfileEdit from './ProfileEdit';

interface ChatLayoutProps {
  currentUser: User;
  onLogout: () => void;
  onRefreshUser: () => Promise<void>;
}

export default function ChatLayout({ currentUser, onLogout, onRefreshUser }: ChatLayoutProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingProfile, setViewingProfile] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);

  usePresence(currentUser.id);

  useEffect(() => {
    loadUsers();
    
    // Subscribe to user changes
    const channel = supabase
      .channel('users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        loadUsers();
      })
      .subscribe();

    // Load theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .neq('id', currentUser.id)
      .order('online', { ascending: false })
      .order('username');
    
    if (data) setUsers(data);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark');
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-amber-50 via-red-50 to-yellow-50 dark:from-gray-900 dark:via-red-950 dark:to-gray-900 overflow-hidden max-w-full">
      {/* Mobile: Show user list or chat based on selection */}
      <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-shrink-0 overflow-hidden`}>
        <UserList
          users={filteredUsers}
          currentUser={currentUser}
          selectedUser={selectedUser}
          onSelectUser={setSelectedUser}
          onViewProfile={setViewingProfile}
          onLogout={onLogout}
          onToggleTheme={toggleTheme}
          theme={theme}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>
      
      {/* Chat Window - full width on mobile when user selected */}
      <div className={`${selectedUser ? 'flex' : 'hidden md:flex'} flex-1 overflow-hidden max-w-full`}>
        <ChatWindow
          currentUser={currentUser}
          selectedUser={selectedUser}
          onViewProfile={setViewingProfile}
          onBack={() => setSelectedUser(null)}
        />
      </div>

      {/* Profile View Modal */}
      {viewingProfile && (
        <ProfileView
          userId={viewingProfile}
          onClose={() => setViewingProfile(null)}
          onStartChat={(userId) => {
            const user = users.find(u => u.id === userId);
            if (user) setSelectedUser(user);
          }}
          isOwnProfile={viewingProfile === currentUser.id}
          onEditProfile={() => {
            setViewingProfile(null);
            setEditingProfile(true);
          }}
        />
      )}

      {/* Profile Edit Modal */}
      {editingProfile && (
        <ProfileEdit
          userId={currentUser.id}
          onClose={() => setEditingProfile(false)}
          onSave={async () => {
            console.log('Profile saved, refreshing...');
            setEditingProfile(false);
            await loadUsers();
            await onRefreshUser();
            console.log('Refresh complete');
          }}
        />
      )}
    </div>
  );
}
