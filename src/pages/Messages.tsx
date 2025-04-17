import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

interface Connection {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: string;
  other_user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export default function Messages() {
  const { connectionId } = useParams<{ connectionId: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (user && connectionId) {
      fetchConnection();
      fetchMessages();
      
      // Set up real-time subscription for new messages
      const subscription = supabase
        .channel('messages')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `connection_id=eq.${connectionId}`
        }, (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          scrollToBottom();
          
          // Mark message as read if it's from the other user
          if (newMessage.sender_id !== user.id) {
            markMessageAsRead(newMessage.id);
          }
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [user, connectionId]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const fetchConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('connections')
        .select(`
          id,
          requester_id,
          recipient_id,
          status,
          profiles!connections_requester_id_fkey (id, full_name, avatar_url),
          profiles!connections_recipient_id_fkey (id, full_name, avatar_url)
        `)
        .eq('id', connectionId)
        .single();
        
      if (error) throw error;
      
      // Determine which user is the other person in the conversation
      const otherUserId = data.requester_id === user?.id ? data.recipient_id : data.requester_id;
      const otherUserProfile = data.requester_id === user?.id 
        ? data.profiles.connections_recipient_id_fkey 
        : data.profiles.connections_requester_id_fkey;
        
      setConnection({
        id: data.id,
        requester_id: data.requester_id,
        recipient_id: data.recipient_id,
        status: data.status,
        other_user: {
          id: otherUserId,
          full_name: otherUserProfile.full_name,
          avatar_url: otherUserProfile.avatar_url
        }
      });
    } catch (error) {
      console.error('Error fetching connection:', error);
      toast.error('Failed to load conversation');
    }
  };
  
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      setMessages(data || []);
      
      // Mark unread messages as read
      const unreadMessages = data
        .filter(msg => !msg.read && msg.sender_id !== user?.id)
        .map(msg => msg.id);
        
      if (unreadMessages.length > 0) {
        markMessagesAsRead(unreadMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };
  
  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };
  
  const markMessagesAsRead = async (messageIds: string[]) => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .in('id', messageIds);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };
  
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          connection_id: connectionId,
          sender_id: user.id,
          content: newMessage.trim()
        }]);
        
      if (error) throw error;
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };
  
  if (loading) {
    return <div className="flex justify-center p-8">Loading conversation...</div>;
  }
  
  if (!connection) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Conversation Not Found</h2>
          <p className="mb-4">We couldn't find this conversation. It may have been deleted or you don't have permission to view it.</p>
          <Link
            to="/connections"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Connections
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
        <div className="border-b p-4 flex items-center">
          <Link to="/connections" className="mr-4">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <img
            src={connection.other_user.avatar_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=120&h=120&fit=crop'}
            alt={connection.other_user.full_name}
            className="w-10 h-10 rounded-full object-cover mr-3"
          />
          <div>
            <h2 className="font-semibold">{connection.other_user.full_name}</h2>
            <p className="text-sm text-gray-500">
              {connection.status === 'accepted' ? 'Connected' : 'Connection Pending'}
            </p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <p className="text-center text-gray-500 my-8">
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.sender_id === user?.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p>{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender_id === user?.id ? 'text-indigo-200' : 'text-gray-500'
                  }`}>
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={sendMessage} className="border-t p-4 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border rounded-md px-3 py-2"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
} 