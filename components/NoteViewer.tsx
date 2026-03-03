'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface NoteViewerProps {
  noteOwnerId: string;
  noteOwnerName: string;
  noteOwnerAvatar?: string;
  noteText: string;
  currentUserId: string;
  onClose: () => void;
  onReply: (userId: string) => void;
}

export default function NoteViewer({
  noteOwnerId,
  noteOwnerName,
  noteOwnerAvatar,
  noteText,
  currentUserId,
  onClose,
  onReply
}: NoteViewerProps) {
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleReply = async () => {
    if (!replyText.trim()) {
      setError('Reply cannot be empty');
      return;
    }

    setSending(true);
    setError('');

    try {
      // Send reply as a message with note as the replied-to content
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: noteOwnerId,
          text: replyText.trim(),
          read: false,
          reply_to_text: `📝 Note: ${noteText}`,
          reply_to_sender: noteOwnerId
        });

      if (messageError) throw messageError;

      // Close viewer and open chat with the user
      onReply(noteOwnerId);
    } catch (err: any) {
      console.error('Error sending reply:', err);
      setError(err.message || 'Failed to send reply');
    } finally {
      setSending(false);
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-800 to-yellow-600 p-4 rounded-t-2xl">
          <div className="flex items-center gap-3">
            {noteOwnerAvatar ? (
              <img
                src={noteOwnerAvatar}
                alt={noteOwnerName}
                className="w-12 h-12 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-semibold border-2 border-white">
                {getInitials(noteOwnerName)}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">
                {noteOwnerName}'s Note
              </h2>
              <p className="text-xs text-white/80">Click reply to send a message</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Note Content */}
        <div className="p-6 space-y-4">
          <div className="bg-gradient-to-r from-amber-50 to-red-50 border-l-4 border-yellow-600 p-4 rounded-lg">
            <p className="text-gray-900 text-base leading-relaxed">
              {noteText}
            </p>
          </div>

          {/* Reply Section */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Reply to this note
            </label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              maxLength={200}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none text-gray-900"
              placeholder="Write your reply..."
            />
            <p className="text-xs text-gray-500 text-right">
              {replyText.length}/200 characters
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleReply}
                disabled={sending || !replyText.trim()}
                className="flex-1 bg-gradient-to-r from-red-800 to-yellow-600 text-white py-3 rounded-xl font-semibold hover:from-red-900 hover:to-yellow-700 transition disabled:opacity-50 shadow-lg"
              >
                {sending ? 'Sending...' : 'Send Reply'}
              </button>
              <button
                onClick={onClose}
                disabled={sending}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
