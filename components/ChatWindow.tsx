'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase, type User, type Message, type TypingIndicator } from '@/lib/supabase';
import { useTypingIndicator } from '@/lib/hooks/useTypingIndicator';
import EmojiPicker from './EmojiPicker';

interface ChatWindowProps {
  currentUser: User;
  selectedUser: User | null;
  onViewProfile: (userId: string) => void;
  onBack?: () => void;
}

export default function ChatWindow({ currentUser, selectedUser, onViewProfile, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [swipedMessageId, setSwipedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { handleTyping } = useTypingIndicator(currentUser.id, selectedUser?.id || null);

  useEffect(() => {
    if (selectedUser) {
      loadMessages();
      markMessagesAsRead();
      
      // Subscribe to new messages - listen to all messages and filter client-side
      const messagesChannel = supabase
        .channel(`messages:${currentUser.id}:${selectedUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          (payload) => {
            const newMessage = payload.new as Message;
            // Only add message if it's between current user and selected user
            if (
              (newMessage.sender_id === selectedUser.id && newMessage.receiver_id === currentUser.id) ||
              (newMessage.sender_id === currentUser.id && newMessage.receiver_id === selectedUser.id)
            ) {
              setMessages((prev) => {
                // Prevent duplicates
                if (prev.some(m => m.id === newMessage.id)) {
                  return prev;
                }
                return [...prev, newMessage];
              });
              if (newMessage.sender_id === selectedUser.id) {
                markMessagesAsRead();
              }
            }
          }
        )
        .subscribe();

      // Subscribe to typing indicators
      const typingChannel = supabase
        .channel(`typing:${currentUser.id}:${selectedUser.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'typing_indicators'
          },
          (payload) => {
            const indicator = payload.new as TypingIndicator;
            // Only update if it's from the selected user typing to current user
            if (indicator.user_id === selectedUser.id && indicator.chat_with_id === currentUser.id) {
              setIsTyping(indicator.is_typing);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(typingChannel);
      };
    }
  }, [selectedUser, currentUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!selectedUser) return;

    const { data } = await supabase
      .from('messages')
      .select('*, sender:users!sender_id(*)')
      .or(
        `and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id})`
      )
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  };

  const markMessagesAsRead = async () => {
    if (!selectedUser) return;

    await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', selectedUser.id)
      .eq('receiver_id', currentUser.id)
      .eq('read', false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || loading) return;

    setLoading(true);
    try {
      const messageData: any = {
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        text: newMessage.trim(),
        read: false
      };

      // Add reply information if replying to a message
      if (replyingTo) {
        messageData.reply_to_id = replyingTo.id;
        messageData.reply_to_text = replyingTo.image_url ? '📷 Image' : replyingTo.text;
        messageData.reply_to_sender = replyingTo.sender_id;
        if (replyingTo.image_url) {
          messageData.reply_to_image_url = replyingTo.image_url;
        }
      }

      const { error } = await supabase
        .from('messages')
        .insert([messageData]);

      if (error) throw error;
      
      // Don't manually add to messages - let real-time subscription handle it
      setNewMessage('');
      setReplyingTo(null); // Clear reply state after sending
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }

    setUploadingImage(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(uploadError.message || 'Failed to upload image to storage');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath);

      // Send message with image
      const messageData: any = {
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        text: '📷 Image',
        image_url: publicUrl,
        read: false
      };

      // Add reply information if replying to a message
      if (replyingTo) {
        messageData.reply_to_id = replyingTo.id;
        messageData.reply_to_text = replyingTo.image_url ? '📷 Image' : replyingTo.text;
        messageData.reply_to_sender = replyingTo.sender_id;
        if (replyingTo.image_url) {
          messageData.reply_to_image_url = replyingTo.image_url;
        }
      }

      const { error } = await supabase
        .from('messages')
        .insert([messageData]);

      if (error) {
        console.error('Message insert error:', error);
        throw new Error(error.message || 'Failed to send image message');
      }
      
      // Clear reply state after sending
      setReplyingTo(null);
      
      // Don't manually add to messages - let real-time subscription handle it
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(error.message || 'Failed to upload image. Please check if the storage bucket is configured.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
  };

  const handleSwipeStart = (e: React.TouchEvent, messageId: string) => {
    const touch = e.touches[0];
    const messageElement = e.currentTarget as HTMLElement;
    const messageContent = messageElement.querySelector('.message-swipe') as HTMLElement;
    if (messageContent) {
      messageContent.dataset.startX = touch.clientX.toString();
      messageContent.dataset.startY = touch.clientY.toString();
      messageContent.style.transition = 'none';
    }
  };

  const handleSwipeMove = (e: React.TouchEvent, messageId: string) => {
    const touch = e.touches[0];
    const messageElement = e.currentTarget as HTMLElement;
    const messageContent = messageElement.querySelector('.message-swipe') as HTMLElement;
    if (!messageContent) return;
    
    const startX = parseFloat(messageContent.dataset.startX || '0');
    const startY = parseFloat(messageContent.dataset.startY || '0');
    const deltaX = touch.clientX - startX;
    const deltaY = Math.abs(touch.clientY - startY);
    
    // Only allow swipe if horizontal movement is greater than vertical (not scrolling)
    // and swipe is to the right (positive deltaX) up to 100px
    if (deltaX > 0 && deltaX < 100 && deltaY < Math.abs(deltaX) * 0.5) {
      messageContent.style.transform = `translateX(${deltaX}px)`;
      messageContent.style.opacity = `${1 - Math.abs(deltaX) / 200}`;
    }
  };

  const handleSwipeEnd = (e: React.TouchEvent, message: Message) => {
    const messageElement = e.currentTarget as HTMLElement;
    const messageContent = messageElement.querySelector('.message-swipe') as HTMLElement;
    if (!messageContent) return;
    
    const startX = parseFloat(messageContent.dataset.startX || '0');
    const startY = parseFloat(messageContent.dataset.startY || '0');
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - startX;
    const deltaY = Math.abs(endY - startY);
    
    // Re-enable transition for smooth return
    messageContent.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
    
    // Only trigger reply if:
    // 1. Swiped more than 80px to the right (increased from 60px)
    // 2. Horizontal movement is at least 2x the vertical movement (not scrolling)
    if (deltaX > 80 && deltaX > deltaY * 2) {
      setReplyingTo(message);
      setSwipedMessageId(message.id);
      setTimeout(() => setSwipedMessageId(null), 300);
    }
    
    // Reset position and opacity
    messageContent.style.transform = 'translateX(0)';
    messageContent.style.opacity = '1';
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const groupMessagesByDate = () => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach(msg => {
      const date = formatDate(msg.created_at);
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-amber-50 via-red-50 to-yellow-50 dark:from-gray-900 dark:via-red-950 dark:to-gray-900 p-4">
        <div className="text-center max-w-sm">
          <div className="inline-block p-6 bg-gradient-to-br from-red-800 to-yellow-600 rounded-full mb-4 shadow-2xl">
            <svg className="w-12 h-12 md:w-16 md:h-16 text-yellow-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-lg md:text-xl font-semibold text-red-900 dark:text-yellow-400">Select a user to start chatting</p>
          <p className="text-sm text-red-700 dark:text-yellow-600 mt-2">Choose someone from the list to begin your conversation</p>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate();

  return (
    <div className="flex-1 flex flex-col overflow-hidden max-w-full">
      {/* Chat Header */}
      <div className="px-0 py-3 md:py-4 border-b border-amber-200 dark:border-red-900 bg-gradient-to-r from-amber-50 to-red-50 dark:from-gray-900 dark:to-red-950 shadow-lg">
        <div className="flex items-center gap-2 md:gap-3 px-2 md:px-4">
          {/* Back button for mobile */}
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-2 hover:bg-amber-100 dark:hover:bg-red-950 rounded-full transition"
            >
              <svg className="w-5 h-5 text-red-900 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          <div 
            className="relative cursor-pointer hover:opacity-80 transition"
            onClick={() => onViewProfile(selectedUser.id)}
          >
            {selectedUser.avatar_url ? (
              <img
                src={selectedUser.avatar_url}
                alt={selectedUser.username}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover "
              />
            ) : (
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-red-800 to-yellow-600 flex items-center justify-center text-white font-semibold ">
                {selectedUser.username.charAt(0).toUpperCase()}
              </div>
            )}
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border-2 border-white dark:border-gray-900 ${
                selectedUser.online ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
          </div>
          <div 
            className="flex-1 cursor-pointer hover:opacity-80 transition min-w-0"
            onClick={() => onViewProfile(selectedUser.id)}
          >
            <h3 className="font-semibold text-black dark:text-white truncate text-sm md:text-base">
              {selectedUser.username}
            </h3>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
              {selectedUser.online ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-0 py-3 md:py-4 space-y-4 bg-gradient-to-br from-amber-50 via-red-50 to-yellow-50 dark:from-gray-900 dark:via-red-950 dark:to-gray-900 scrollbar-hide smooth-scroll max-w-full">
        {Object.entries(messageGroups).map(([date, msgs]) => (
          <div key={date}>
            <div className="flex justify-center my-4">
              <span className="px-3 md:px-4 py-1 md:py-1.5 text-xs font-semibold text-red-800 dark:text-yellow-400 bg-gradient-to-r from-amber-100 to-red-100 dark:from-red-950 dark:to-yellow-950/50 rounded-full shadow-md border border-amber-300 dark:border-red-800">
                {date}
              </span>
            </div>
            {msgs.map((message) => {
              const isOwn = message.sender_id === currentUser.id;
              return (
                <div
                  key={message.id}
                  className={`flex gap-2 md:gap-3 mb-3 md:mb-4 min-w-0 px-2 md:px-4 ${isOwn ? 'flex-row-reverse' : ''} group relative`}
                  onTouchStart={!isOwn ? (e) => handleSwipeStart(e, message.id) : undefined}
                  onTouchMove={!isOwn ? (e) => handleSwipeMove(e, message.id) : undefined}
                  onTouchEnd={!isOwn ? (e) => handleSwipeEnd(e, message) : undefined}
                >
                  <div className="flex-shrink-0">
                    {isOwn ? (
                      currentUser.avatar_url ? (
                        <img
                          src={currentUser.avatar_url}
                          alt={currentUser.username}
                          className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover "
                        />
                      ) : (
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-red-800 to-yellow-600 flex items-center justify-center text-white text-sm md:text-base font-semibold ">
                          {currentUser.username.charAt(0).toUpperCase()}
                        </div>
                      )
                    ) : (
                      selectedUser.avatar_url ? (
                        <img
                          src={selectedUser.avatar_url}
                          alt={selectedUser.username}
                          className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover "
                        />
                      ) : (
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-red-800 to-yellow-600 flex items-center justify-center text-white text-sm md:text-base font-semibold ">
                          {selectedUser.username.charAt(0).toUpperCase()}
                        </div>
                      )
                    )}
                  </div>
                  <div className={`max-w-[75%] md:max-w-[60%] min-w-0 ${isOwn ? 'items-end' : 'items-start'} flex flex-col relative message-swipe`} style={{ maxWidth: '75%' }}>
                    {/* Reply button for desktop - shows on hover - only for other user's messages */}
                    {!isOwn && (
                      <button
                        onClick={() => setReplyingTo(message)}
                        className={`hidden md:block absolute top-0 right-0 translate-x-8 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-amber-200 dark:bg-red-900 rounded-full hover:bg-amber-300 dark:hover:bg-red-800`}
                        title="Reply"
                      >
                        <svg className="w-4 h-4 text-red-900 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                    )}
                    {message.image_url ? (
                      <div className="space-y-2 max-w-full">
                        {/* Show replied message if exists */}
                        {(message.reply_to_text || message.reply_to_image_url) && (
                          <div className="px-2 py-1 bg-black/10 dark:bg-white/10 rounded border-l-2 border-yellow-400 mb-1 max-w-full" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            <p className="text-[10px] opacity-75 truncate">
                              {message.reply_to_sender === currentUser.id ? 'You' : selectedUser?.username}
                            </p>
                            {message.reply_to_image_url ? (
                              <div className="flex items-center gap-1">
                                <img src={message.reply_to_image_url} alt="Reply" className="w-8 h-8 rounded object-cover" />
                                <p className="text-[10px] opacity-90 truncate">📷 Image</p>
                              </div>
                            ) : (
                              <p className="text-[10px] opacity-90 truncate">
                                {message.reply_to_text}
                              </p>
                            )}
                          </div>
                        )}
                        <img
                          src={message.image_url}
                          alt="Shared image"
                          className="rounded-lg cursor-pointer hover:opacity-90 transition max-w-full h-auto max-h-80 object-contain"
                          onClick={() => setViewingImage(message.image_url || null)}
                        />
                        {message.text !== '📷 Image' && (
                          <div
                            className={`px-3 md:px-4 py-2 rounded-2xl shadow-md text-sm md:text-base max-w-full ${
                              isOwn
                                ? 'bg-gradient-to-r from-red-800 to-yellow-600 text-white'
                                : 'bg-gradient-to-r from-red-900 to-amber-800 text-white border-2 border-yellow-600'
                            }`}
                            style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                          >
                            <p className="break-words break-all overflow-wrap-anywhere">{message.text}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`px-3 md:px-4 py-2 rounded-2xl shadow-md text-sm md:text-base max-w-full ${
                          isOwn
                            ? 'bg-gradient-to-r from-red-800 to-yellow-600 text-white'
                            : 'bg-gradient-to-r from-red-900 to-amber-800 text-white border-2 border-yellow-600'
                        }`}
                        style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                      >
                        {/* Show replied message if exists */}
                        {(message.reply_to_text || message.reply_to_image_url) && (
                          <div className="px-2 py-1 bg-black/20 dark:bg-white/10 rounded border-l-2 border-yellow-400 mb-2 max-w-full" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            <p className="text-[10px] opacity-75 truncate">
                              {message.reply_to_sender === currentUser.id ? 'You' : selectedUser?.username}
                            </p>
                            {message.reply_to_image_url ? (
                              <div className="flex items-center gap-1">
                                <img src={message.reply_to_image_url} alt="Reply" className="w-8 h-8 rounded object-cover" />
                                <p className="text-[10px] opacity-90 truncate">📷 Image</p>
                              </div>
                            ) : (
                              <p className="text-[10px] opacity-90 truncate">
                                {message.reply_to_text}
                              </p>
                            )}
                          </div>
                        )}
                        <p className="break-words break-all overflow-wrap-anywhere">{message.text}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-red-700 dark:text-yellow-600 font-medium">
                        {formatTime(message.created_at)}
                      </span>
                      {isOwn && (
                        <span className="text-xs text-yellow-600 dark:text-yellow-400">
                          {message.read ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3 items-center">
            {selectedUser.avatar_url ? (
              <img
                src={selectedUser.avatar_url}
                alt={selectedUser.username}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-yellow-500"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold ring-2 ring-yellow-500">
                {selectedUser.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        
        {isTyping && (
          <div className="flex gap-3 items-center">
            {selectedUser.avatar_url ? (
              <img
                src={selectedUser.avatar_url}
                alt={selectedUser.username}
                className="w-10 h-10 rounded-full object-cover "
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-800 to-yellow-600 flex items-center justify-center text-white font-semibold ">
                {selectedUser.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl shadow-md border-2 border-amber-200 dark:border-red-900">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-yellow-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-red-700 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-yellow-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="border-t border-amber-200 dark:border-red-900 bg-gradient-to-r from-amber-50 to-red-50 dark:from-gray-900 dark:to-red-950 shadow-lg overflow-visible relative z-10">
        {/* Reply Preview - Compact but readable */}
        {replyingTo && (
          <div className="px-1 py-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-100 dark:bg-red-950 rounded-md border-l-2 border-yellow-600 max-w-[85%]">
              <svg className="w-3 h-3 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-red-900 dark:text-yellow-400 truncate leading-tight">
                  {replyingTo.sender_id === currentUser.id ? 'You' : selectedUser?.username}
                </p>
                {replyingTo.image_url ? (
                  <div className="flex items-center gap-1">
                    <img src={replyingTo.image_url} alt="Reply" className="w-6 h-6 rounded object-cover" />
                    <p className="text-[11px] text-red-700 dark:text-yellow-600 truncate leading-tight">📷 Image</p>
                  </div>
                ) : (
                  <p className="text-[11px] text-red-700 dark:text-yellow-600 truncate leading-tight break-all overflow-wrap-anywhere">
                    {replyingTo.text}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={cancelReply}
                className="flex-shrink-0 p-0.5 hover:bg-amber-200 dark:hover:bg-red-900 rounded-full transition"
              >
                <svg className="w-3 h-3 text-red-900 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-2 px-2 py-2">
          {/* Image upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="p-2 bg-gradient-to-br from-red-800 to-yellow-600 hover:from-red-900 hover:to-yellow-700 rounded-full transition disabled:opacity-50 shadow-md flex-shrink-0"
            title="Send image"
          >
            {uploadingImage ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-200"></div>
            ) : (
              <svg className="w-5 h-5 text-yellow-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </button>

          {/* Emoji picker button */}
          <div className="relative flex-shrink-0 z-[9999]">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 bg-gradient-to-br from-red-800 to-yellow-600 hover:from-red-900 hover:to-yellow-700 rounded-full transition shadow-md"
              title="Add emoji"
            >
              <svg className="w-5 h-5 text-yellow-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {showEmojiPicker && (
              <EmojiPicker
                onSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>

          {/* Message input */}
          <textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
              // Auto-resize textarea
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
                // Reset height after sending
                e.currentTarget.style.height = 'auto';
              }
            }}
            placeholder="Type..."
            disabled={loading}
            rows={1}
            className="flex-1 min-w-0 max-w-[65%] px-3 py-2 text-sm border-2 border-amber-300 dark:border-red-800 rounded-2xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 placeholder-red-400 dark:placeholder-yellow-600 mx-2 resize-none overflow-y-hidden scrollbar-hide"
            style={{ wordBreak: 'break-all', overflowWrap: 'anywhere', minHeight: '40px' }}
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={loading || (!newMessage.trim() && !uploadingImage)}
            className="p-1.5 bg-gradient-to-r from-red-800 to-yellow-600 text-white rounded-full font-semibold hover:from-red-900 hover:to-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <button
            onClick={() => setViewingImage(null)}
            className="absolute top-4 left-4 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition z-10"
            aria-label="Close image"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <img
            src={viewingImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain p-4"
            onClick={() => setViewingImage(null)}
          />
        </div>
      )}
    </div>
  );
}
