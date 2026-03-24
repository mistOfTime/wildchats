'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import CoverPhotoEditor from './CoverPhotoEditor';

interface ProfileEditProps {
  userId: string;
  onClose: () => void;
  onSave: () => void;
}

interface UserProfile {
  username: string;
  bio: string;
  avatar_url: string;
  cover_url: string;
}

export default function ProfileEdit({ userId, onClose, onSave }: ProfileEditProps) {
  const [profile, setProfile] = useState<UserProfile>({
    username: '',
    bio: '',
    avatar_url: '',
    cover_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>('');
  const [editingCover, setEditingCover] = useState(false);
  const [tempCoverUrl, setTempCoverUrl] = useState<string>('');

  useEffect(() => {
    loadProfile();
  }, [userId]);

  useEffect(() => {
    setPreviewUrl(profile.avatar_url);
    setCoverPreviewUrl(profile.cover_url);
  }, [profile.avatar_url, profile.cover_url]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username, bio, avatar_url, cover_url')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile({
        username: data.username || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || '',
        cover_url: data.cover_url || '',
      });
      setPreviewUrl(data.avatar_url || '');
      setCoverPreviewUrl(data.cover_url || '');
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError('');
    
    // Show preview immediately using FileReader
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);

    try {
      // Create a unique file name with timestamp to avoid conflicts
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const fileName = `${userId}-avatar-${timestamp}-${random}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`avatars/${oldPath}`]);
        }
      }

      // Wait a bit to avoid lock conflicts
      await new Promise(resolve => setTimeout(resolve, 300));

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfile({ ...profile, avatar_url: publicUrl });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setError(error.message || 'Failed to upload image');
      // Reset preview on error
      setPreviewUrl(profile.avatar_url || '');
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError('');
    
    // Show preview and open editor
    const reader = new FileReader();
    reader.onloadend = () => {
      setTempCoverUrl(reader.result as string);
      setEditingCover(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCoverSave = async (croppedBlob: Blob) => {
    setUploadingCover(true);
    setEditingCover(false);

    try {
      // Create a unique file name with timestamp to avoid conflicts
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const fileName = `cover-${userId}-${timestamp}-${random}.jpg`;
      const filePath = `covers/${fileName}`;

      // Delete old cover if exists
      if (profile.cover_url) {
        const oldPath = profile.cover_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`covers/${oldPath}`]);
        }
      }

      // Wait a bit to avoid lock conflicts
      await new Promise(resolve => setTimeout(resolve, 300));

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfile({ ...profile, cover_url: publicUrl });
      setCoverPreviewUrl(publicUrl);
    } catch (error: any) {
      console.error('Error uploading cover:', error);
      setError(error.message || 'Failed to upload cover image');
    } finally {
      setUploadingCover(false);
      setTempCoverUrl('');
    }
  };

  const handleSave = async () => {
    setError('');
    
    // Validate username
    if (!profile.username.trim()) {
      setError('Username cannot be empty');
      return;
    }
    
    setSaving(true);

    try {
      console.log('Saving profile with username:', profile.username);
      console.log('User ID:', userId);
      
      const updateData = {
        username: profile.username.trim(),
        bio: profile.bio.trim(),
        avatar_url: profile.avatar_url,
        cover_url: profile.cover_url,
      };
      
      console.log('Update data:', updateData);
      
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Profile saved successfully, returned data:', data);
      
      if (!data || data.length === 0) {
        console.warn('Update returned no data - might be RLS policy issue');
        setError('Update may have failed due to permissions. Please check Supabase RLS policies.');
        setSaving(false);
        return;
      }
      
      // Wait a moment for database to propagate
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Call onSave to refresh parent
      onSave();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setError(error.message || 'Failed to save profile');
      setSaving(false);
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
        <div className="rounded-xl md:rounded-2xl shadow-2xl max-w-[380px] md:max-w-sm w-full overflow-hidden max-h-[92vh] overflow-y-auto" style={{ backgroundColor: 'white', color: 'black' }}>
        {/* Header with cover photo */}
        <div className="relative h-28 md:h-32 bg-gradient-to-br from-red-800 to-yellow-600 overflow-hidden">
          {coverPreviewUrl && (
            <img
              src={coverPreviewUrl}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Cover upload button */}
          <label className="absolute bottom-2 right-2 md:bottom-4 md:right-4 w-6 h-6 bg-gradient-to-r from-red-800 to-yellow-600 hover:from-red-900 hover:to-yellow-700 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition transform hover:scale-110">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              disabled={uploadingCover}
              className="hidden"
            />
          </label>

          {/* Upload progress overlay for cover */}
          {uploadingCover && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-4 md:px-8 pb-4 md:pb-8" style={{ backgroundColor: 'white' }}>
          {/* Avatar preview with upload button */}
          <div className="relative -mt-12 md:-mt-16 mb-4 md:mb-6 w-24 h-24 md:w-32 md:h-32 mx-auto">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={profile.username}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full  object-cover "
              />
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full  bg-gradient-to-br from-red-800 to-yellow-600 flex items-center justify-center ">
                <span className="text-2xl md:text-4xl font-bold text-white">
                  {getInitials(profile.username || 'U')}
                </span>
              </div>
            )}
            
            {/* Upload button overlay */}
            <label className="absolute bottom-0 right-0 w-6 h-6 bg-gradient-to-r from-red-800 to-yellow-600 hover:from-red-900 hover:to-yellow-700 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition transform hover:scale-110">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>

            {/* Upload progress overlay */}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-6">
            Edit Profile
          </h2>

          {/* Form */}
          <div className="space-y-3 md:space-y-4">
            <div>
              <label className="block text-sm md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
                Username
              </label>
              <input
                type="text"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                className="w-full px-3.5 py-2.5 md:px-4 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900 transition"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
                Bio
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={2}
                maxLength={200}
                className="w-full px-3.5 py-2.5 md:px-4 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900 transition resize-none"
                placeholder="Tell us about yourself..."
              />
              <p className="text-xs md:text-xs text-gray-500 mt-1">
                {profile.bio.length}/200 characters
              </p>
            </div>

            {previewUrl && (
              <div className="flex items-center justify-between p-2.5 md:p-3 bg-gray-100 rounded-lg md:rounded-xl border border-gray-300">
                <span className="text-sm md:text-sm text-gray-700">Profile picture uploaded</span>
                <button
                  type="button"
                  onClick={() => {
                    setProfile({ ...profile, avatar_url: '' });
                    setPreviewUrl('');
                  }}
                  className="text-sm md:text-sm text-red-600 hover:underline font-semibold"
                >
                  Remove
                </button>
              </div>
            )}

            {coverPreviewUrl && (
              <div className="flex items-center justify-between p-2.5 md:p-3 bg-gray-100 rounded-lg md:rounded-xl border border-gray-300">
                <span className="text-sm md:text-sm text-gray-700">Cover photo uploaded</span>
                <button
                  type="button"
                  onClick={() => {
                    setProfile({ ...profile, cover_url: '' });
                    setCoverPreviewUrl('');
                  }}
                  className="text-sm md:text-sm text-red-600 hover:underline font-semibold"
                >
                  Remove
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl text-sm md:text-sm">
                {error}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2.5 md:gap-3 pt-3 md:pt-4">
              <button
                onClick={handleSave}
                disabled={saving || uploading || uploadingCover || !profile.username}
                className="w-full px-4 py-2.5 md:px-4 md:py-3 text-sm md:text-base bg-gradient-to-r from-red-800 to-yellow-600 text-white rounded-lg md:rounded-xl font-semibold hover:from-red-900 hover:to-yellow-700 transition disabled:opacity-50 shadow-lg"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={onClose}
                disabled={saving || uploading || uploadingCover}
                className="w-full px-4 py-2.5 md:px-4 md:py-3 text-sm md:text-base bg-gray-200 text-gray-700 rounded-lg md:rounded-xl font-semibold hover:bg-gray-300 transition disabled:opacity-50 border border-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Cover Photo Editor Modal */}
      {editingCover && tempCoverUrl && (
        <CoverPhotoEditor
          imageUrl={tempCoverUrl}
          onSave={handleCoverSave}
          onCancel={() => {
            setEditingCover(false);
            setTempCoverUrl('');
          }}
        />
      )}
    </>
  );
}
