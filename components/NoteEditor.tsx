'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface NoteEditorProps {
  userId: string;
  currentNote?: string;
  onClose: () => void;
  onSave: () => void;
}

export default function NoteEditor({ userId, currentNote = '', onClose, onSave }: NoteEditorProps) {
  const [noteText, setNoteText] = useState(currentNote);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!noteText.trim()) {
      setError('Note cannot be empty');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Check if note exists
      const { data: existingNote } = await supabase
        .from('user_notes')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingNote) {
        // Update existing note
        const { error: updateError } = await supabase
          .from('user_notes')
          .update({
            note_text: noteText.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (updateError) throw updateError;
      } else {
        // Create new note
        const { error: insertError } = await supabase
          .from('user_notes')
          .insert({
            user_id: userId,
            note_text: noteText.trim()
          });

        if (insertError) throw insertError;
      }

      onSave();
    } catch (err: any) {
      console.error('Error saving note:', err);
      setError(err.message || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your note?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_notes')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      onSave();
    } catch (err: any) {
      console.error('Error deleting note:', err);
      setError(err.message || 'Failed to delete note');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-800 to-yellow-600 p-4 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white text-center">
            Your Note
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Share what's on your mind. Everyone can see your note!
          </p>

          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            maxLength={100}
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none text-gray-900"
            placeholder="What's on your mind?"
          />
          <p className="text-xs text-gray-500 text-right">
            {noteText.length}/100 characters
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !noteText.trim()}
              className="flex-1 bg-gradient-to-r from-red-800 to-yellow-600 text-white py-3 rounded-xl font-semibold hover:from-red-900 hover:to-yellow-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Note'}
            </button>
            {currentNote && (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-3 bg-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-200 transition disabled:opacity-50"
              >
                Delete
              </button>
            )}
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
