'use client';

import { type User } from '@/lib/supabase';

interface UserListProps {
  users: User[];
  currentUser: User;
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
  onViewProfile: (userId: string) => void;
  onLogout: () => void;
  onToggleTheme: () => void;
  theme: 'light' | 'dark';
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onEditNote: () => void;
  onViewNote: (user: User) => void;
}

export default function UserList({
  users,
  currentUser,
  selectedUser,
  onSelectUser,
  onViewProfile,
  onLogout,
  onToggleTheme,
  theme,
  searchQuery,
  onSearchChange,
  onEditNote,
  onViewNote
}: UserListProps) {
  const getLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return '';
    const date = new Date(lastSeen);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="w-full md:w-80 bg-gradient-to-b from-amber-50 to-red-50 dark:from-gray-900 dark:to-red-950 border-r border-amber-200 dark:border-red-900 flex flex-col shadow-xl">
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-amber-200 dark:border-red-900 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div 
            className="flex items-center gap-2 md:gap-3 cursor-pointer hover:opacity-80 transition flex-1 min-w-0"
            onClick={() => onViewProfile(currentUser.id)}
          >
            {currentUser.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.username}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-red-800 to-yellow-600 flex items-center justify-center text-white text-sm md:text-base font-semibold flex-shrink-0">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-black dark:text-white text-sm md:text-base truncate">
                {currentUser.username}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                View profile
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEditNote}
              className="p-2 hover:opacity-80 transition flex-shrink-0"
              title="Edit your note"
            >
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button
              onClick={onToggleTheme}
              className="p-2 hover:opacity-80 transition flex-shrink-0"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5 text-yellow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-yellow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search users..."
          className="w-full px-3 py-2 text-sm border border-amber-200 dark:border-red-900/50 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white/80 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300 focus:outline-none"
        />
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide smooth-scroll">
        {users.length === 0 ? (
          <div className="p-4 text-center text-red-600 dark:text-yellow-500">
            No users found
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className={`p-3 md:p-4 cursor-pointer border-b border-amber-200 dark:border-red-900 hover:bg-amber-100 dark:hover:bg-red-950/50 transition ${
                selectedUser?.id === user.id ? 'bg-gradient-to-r from-amber-100 to-red-100 dark:from-red-950 dark:to-yellow-950/30 shadow-inner' : ''
              }`}
            >
              <div className="flex items-center gap-2 md:gap-3">
                <div 
                  className="relative cursor-pointer flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewProfile(user.id);
                  }}
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover hover:opacity-80 transition "
                    />
                  ) : (
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-red-800 to-yellow-600 flex items-center justify-center text-white text-sm md:text-base font-semibold hover:opacity-80 transition ">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border-2 border-white dark:border-gray-900 ${
                      user.online ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  {/* Note indicator */}
                  {user.note && (
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewNote(user);
                      }}
                      className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-red-600 to-yellow-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-lg cursor-pointer hover:scale-105 transition-transform"
                      title="View note"
                    >
                      <span className="text-[10px] font-bold text-white whitespace-nowrap">Notes</span>
                    </span>
                  )}
                </div>
                <div 
                  className="flex-1 min-w-0"
                  onClick={() => onSelectUser(user)}
                >
                  <div className="font-semibold text-black dark:text-white truncate text-sm md:text-base">
                    {user.username}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 truncate">
                    {user.online ? 'Online' : getLastSeen(user.last_seen)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Logout Button */}
      <div className="p-3 md:p-4 border-t border-amber-200 dark:border-red-900 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
        <button
          onClick={onLogout}
          className="w-full bg-gradient-to-r from-red-800 to-yellow-600 text-white py-2.5 md:py-3 rounded-xl text-sm md:text-base font-semibold hover:from-red-900 hover:to-yellow-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
