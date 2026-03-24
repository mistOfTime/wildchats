'use client';

import { useState, useEffect } from 'react';
import { supabase, type User, type Message } from '@/lib/supabase';
import { usePresence } from '@/lib/hooks/usePresence';
import UserList from './UserList';
import ChatWindow from './ChatWindow';
import ProfileView from './ProfileView';
import ProfileEdit from './ProfileEdit';
import NoteEditor from './NoteEditor';
import NoteViewer from './NoteViewer';

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
  const [editingNote, setEditingNote] = useState(false);
  const [currentNote, setCurrentNote] = useState<string>('');
  const [viewingNote, setViewingNote] = useState<User | null>(null);

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
    // First load users
    const { data: usersData } = await supabase
      .from('users')
      .select('*')
      .neq('id', currentUser.id)
      .order('online', { ascending: false })
      .order('username');
    
    if (!usersData) {
      setUsers([]);
      return;
    }

    // Then load notes separately
    const { data: notesData } = await supabase
      .from('user_notes')
      .select('*');
    
    // Combine users with their notes
    const usersWithNotes = usersData.map(user => {
      const note = notesData?.find(n => n.user_id === user.id);
      return {
        ...user,
        note: note || undefined
      };
    });
    
    setUsers(usersWithNotes);

    // Load current user's note
    const { data: noteData } = await supabase
      .from('user_notes')
      .select('note_text')
      .eq('user_id', currentUser.id)
      .single();
    
    if (noteData) {
      setCurrentNote(noteData.note_text);
    } else {
      setCurrentNote('');
    }
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
          onEditNote={() => setEditingNote(true)}
          onViewNote={(user) => setViewingNote(user)}
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
            
            // Force refresh by reloading users and current user
            await Promise.all([
              loadUsers(),
              onRefreshUser()
            ]);
            
            console.log('Refresh complete');
          }}
        />
      )}

      {/* Note Editor Modal */}
      {editingNote && (
        <NoteEditor
          userId={currentUser.id}
          currentNote={currentNote}
          onClose={() => setEditingNote(false)}
          onSave={async () => {
            setEditingNote(false);
            await loadUsers();
          }}
        />
      )}

      {/* Note Viewer Modal */}
      {viewingNote && viewingNote.note && (
        <NoteViewer
          noteOwnerId={viewingNote.id}
          noteOwnerName={viewingNote.username}
          noteOwnerAvatar={viewingNote.avatar_url}
          noteText={viewingNote.note.note_text}
          currentUserId={currentUser.id}
          onClose={() => setViewingNote(null)}
          onReply={(userId) => {
            setViewingNote(null);
            const user = users.find(u => u.id === userId);
            if (user) setSelectedUser(user);
          }}
        />
      )}
    </div>
  );
}
