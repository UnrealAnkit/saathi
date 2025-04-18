import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface Message {
  id: string;
  connection_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface Connection {
  id: string;
  status: string;
  created_at: string;
  user1: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  user2: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export default function Messages() {
  const { connectionId } = useParams<{ connectionId: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (connectionId && user) {
      fetchConnection();
    }
  }, [connectionId, user]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);
  
  const fetchConnection = async () => {
    try {
      if (!connectionId || !user) return;
      
      setLoading(true);
      
      // First, fetch the connection details
      const { data: connectionData, error: connectionError } = await supabase
        .from('connections')
        .select(`
          id,
          status,
          created_at,
          user1:profiles!connections_user1_id_fkey(id, full_name, avatar_url),
          user2:profiles!connections_user2_id_fkey(id, full_name, avatar_url)
        `)
        .eq('id', connectionId)
        .single();
      
      if (connectionError) {
        console.error('Error fetching connection:', connectionError);
        
        if (connectionError.code === 'PGRST116') {
          // Resource not found
          toast.error('Conversation not found');
          navigate('/connections');
        } else {
          toast.error('Failed to load conversation');
        }
        
        setLoading(false);
        return;
      }
      
      if (!connectionData) {
        toast.error('Conversation not found');
        setLoading(false);
        return;
      }
      
      // Check if the current user is part of this connection
      if (connectionData.user1.id !== user.id && connectionData.user2.id !== user.id) {
        toast.error('You do not have permission to view this conversation');
        setLoading(false);
        return;
      }
      
      if (connectionData.status !== 'accepted') {
        toast.error('You can only message connections that have been accepted');
        setLoading(false);
        return;
      }
      
      setConnection(connectionData);
      
      // Now fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          connection_id,
          sender_id,
          content,
          created_at,
          sender:profiles(full_name, avatar_url)
        `)
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: true });
      
      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        toast.error('Failed to load messages');
      } else {
        setMessages(messagesData || []);
        
        // Mark unread messages as read
        const unreadMessages = messagesData?.filter(
          msg => msg.sender_id !== user.id && !msg.read
        ) || [];
        
        if (unreadMessages.length > 0) {
          for (const msg of unreadMessages) {
            await supabase
              .from('messages')
              .update({ read: true })
              .eq('id', msg.id);
          }
        }
      }
      
      // Set up real-time subscription for new messages
      const channel = supabase
        .channel(`messages:connection_id=eq.${connectionId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `connection_id=eq.${connectionId}`
        }, (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          
          // Mark message as read if it's not from the current user
          if (newMessage.sender_id !== user.id) {
            markMessageAsRead(newMessage.id);
          }
        })
        .subscribe((status) => {
          console.log('Subscription status:', status);
        });
      
      return () => {
        console.log('Cleaning up subscription');
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error in fetchConnection:', error);
      toast.error('An error occurred while loading the conversation');
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
  
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !connectionId || !user) return;
    
    setSending(true);
    
    try {
      console.log('Sending message using RPC function:', {
        connection_id_param: connectionId,
        sender_id_param: user.id,
        content_param: newMessage.trim()
      });
      
      // Use the RPC function instead of direct insert
      const { data, error } = await supabase
        .rpc('insert_message', {
          connection_id_param: connectionId,
          sender_id_param: user.id,
          content_param: newMessage.trim()
        });
      
      console.log('RPC result:', { data, error });
      
      if (error) {
        console.error('Error sending message:', error);
        toast.error(`Failed to send message: ${error.message}`);
        return;
      }
      
      toast.success('Message sent!');
      setNewMessage('');
      
      // Manually add the message to the UI
      if (data && data.length > 0) {
        setMessages(prev => [...prev, data[0]]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Get the other user in the connection
  const otherUser = connection ? 
    (connection.user1.id === user?.id ? connection.user2 : connection.user1) : 
    null;
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div 
          className="rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }
  
  if (!connection || !otherUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Conversation Not Found</h2>
        <p className="text-gray-600 mb-6">
          We couldn't find this conversation. It may have been deleted or you don't have
          permission to view it.
        </p>
        <Link
          to="/connections"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Connections
        </Link>
      </div>
    );
  }
  
  if (connection && connection.status !== 'accepted') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Connection Not Accepted</h2>
        <p className="text-gray-600 mb-6">
          You can only message connections that have been accepted.
          {connection.user1.id === user?.id 
            ? " The recipient hasn't accepted your connection request yet."
            : " Please accept the connection request to start messaging."}
        </p>
        <Link
          to="/connections"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Connections
        </Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gray-800 p-4 rounded-t-lg shadow-md flex items-center">
        <motion.button 
          onClick={() => navigate('/connections')}
          className="mr-4 text-gray-300 hover:text-white"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowLeft className="h-5 w-5" />
        </motion.button>
        
        {otherUser && (
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center text-white mr-3">
              {otherUser.avatar_url ? (
                <img 
                  src={otherUser.avatar_url} 
                  alt={otherUser.full_name} 
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                otherUser.full_name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="font-semibold text-white">{otherUser.full_name}</h2>
              <p className="text-xs text-gray-400">
                {connection?.status === 'accepted' ? 'Connected' : 'Pending'}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Messages */}
      <div className="bg-gray-900 p-4 h-[60vh] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-400 text-center">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div 
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.sender_id === user?.id 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-800 text-white'
                  }`}
                >
                  <p>{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message Input */}
      <form onSubmit={sendMessage} className="bg-gray-800 p-4 rounded-b-lg shadow-md flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-gray-700 text-white border border-gray-600 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <motion.button
          type="submit"
          className="bg-purple-600 text-white px-4 py-2 rounded-r-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!newMessage.trim()}
        >
          <Send className="h-5 w-5" />
        </motion.button>
      </form>
    </div>
  );
} 