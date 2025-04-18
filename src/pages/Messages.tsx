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
  sender_id: string;
  receiver_id: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  receiver?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export default function Messages() {
  const { connectionId } = useParams<{ connectionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [connection, setConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && connectionId) {
      fetchConnection();
      fetchMessages();
      
      // Set up real-time subscription for new messages
      const subscription = supabase
        .channel('messages-channel')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `connection_id=eq.${connectionId}`,
        }, (payload) => {
          // Only add the message if it's not from the current user to avoid duplicates
          // (since we optimistically add the user's own messages)
          if (payload.new.sender_id !== user.id) {
            fetchSenderDetails(payload.new).then(messageWithSender => {
              setMessages(prev => [...prev, messageWithSender]);
            });
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

  const fetchConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!connectionId) {
        throw new Error('Connection ID is missing');
      }
      
      // First, try with sender_id/receiver_id columns
      let { data, error } = await supabase
        .from('connections')
        .select(`
          id,
          status,
          sender_id,
          receiver_id,
          sender:profiles!sender_id(id, full_name, avatar_url),
          receiver:profiles!receiver_id(id, full_name, avatar_url)
        `)
        .eq('id', connectionId)
        .single();
      
      // If there's an error with the column names, try with requester_id/recipient_id
      if (error && (error.code === 'PGRST200' || error.code === '42703')) {
        console.log('Trying alternative column names (requester_id/recipient_id)');
        
        const { data: altData, error: altError } = await supabase
          .from('connections')
          .select(`
            id,
            status,
            requester_id,
            recipient_id,
            requester:profiles!requester_id(id, full_name, avatar_url),
            recipient:profiles!recipient_id(id, full_name, avatar_url)
          `)
          .eq('id', connectionId)
          .single();
        
        if (altError) {
          // If both queries fail, try a simpler query without joins
          console.log('Falling back to simpler query without joins');
          
          // Try with sender_id/receiver_id first
          const { data: simpleData, error: simpleError } = await supabase
            .from('connections')
            .select('*')
            .eq('id', connectionId)
            .single();
          
          if (simpleError && simpleError.code === '42703') {
            // If that fails, try with requester_id/recipient_id
            const { data: altSimpleData, error: altSimpleError } = await supabase
              .from('connections')
              .select('*')
              .eq('id', connectionId)
              .single();
            
            if (altSimpleError) throw altSimpleError;
            
            // Map the data to use sender_id/receiver_id naming
            data = {
              ...altSimpleData,
              sender_id: altSimpleData.requester_id,
              receiver_id: altSimpleData.recipient_id,
              // We'll fetch profiles separately
            };
          } else if (simpleError) {
            throw simpleError;
          } else {
            data = simpleData;
          }
          
          // Fetch the profiles separately
          if (data) {
            const senderId = data.sender_id || data.requester_id;
            const receiverId = data.receiver_id || data.recipient_id;
            
            const { data: senderData } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .eq('id', senderId)
              .single();
            
            const { data: receiverData } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .eq('id', receiverId)
              .single();
            
            // Combine the data
            data = {
              ...data,
              sender_id: senderId,
              receiver_id: receiverId,
              sender: senderData || { id: senderId, full_name: 'Unknown User' },
              receiver: receiverData || { id: receiverId, full_name: 'Unknown User' }
            };
          }
        } else {
          // Map the data to use sender_id/receiver_id naming
          data = {
            ...altData,
            sender_id: altData.requester_id,
            receiver_id: altData.recipient_id,
            sender: altData.requester,
            receiver: altData.recipient
          };
        }
      } else if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error('Connection not found');
      }
      
      // Verify that the current user is part of this connection
      if (user && data.sender_id !== user.id && data.receiver_id !== user.id) {
        throw new Error('You do not have access to this conversation');
      }
      
      setConnection(data);
    } catch (error) {
      console.error('Error fetching connection:', error);
      setError('Failed to load conversation. Please try again later.');
      toast.error('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          sender:profiles!sender_id(full_name, avatar_url)
        `)
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const fetchSenderDetails = async (message: any): Promise<Message> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', message.sender_id)
        .single();
      
      if (error) throw error;
      
      return {
        ...message,
        sender: data
      };
    } catch (error) {
      console.error('Error fetching sender details:', error);
      return message;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !connectionId) return;
    
    // Optimistically add the message to the UI
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      connection_id: connectionId,
      sender_id: user.id,
      content: newMessage,
      created_at: new Date().toISOString(),
      sender: {
        full_name: user.user_metadata?.full_name || 'You',
        avatar_url: user.user_metadata?.avatar_url || null
      }
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            connection_id: connectionId,
            sender_id: user.id,
            content: newMessage
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Replace the optimistic message with the real one if needed
      // This is optional since we have real-time subscription
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setNewMessage(optimisticMessage.content);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getOtherUser = () => {
    if (!user || !connection) return null;
    return connection.sender_id === user.id ? connection.receiver : connection.sender;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          onClick={() => navigate('/connections')}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
        >
          Back to Connections
        </button>
      </div>
    );
  }

  const otherUser = getOtherUser();

  return (
    <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg overflow-hidden shadow-lg flex flex-col h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="bg-gray-900 p-4 flex items-center border-b border-gray-700">
        <Link to="/connections" className="mr-4 text-gray-400 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center mr-3">
            {otherUser?.avatar_url ? (
              <img 
                src={otherUser.avatar_url} 
                alt={otherUser?.full_name} 
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                {otherUser?.full_name?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <div>
            <h2 className="font-semibold">{otherUser?.full_name || 'User'}</h2>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-4 py-2 ${
                  message.sender_id === user?.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-white'
                }`}
              >
                <div className="text-sm">{message.content}</div>
                <div className="text-xs mt-1 opacity-70">{formatTime(message.created_at)}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-gray-800 border-t border-gray-700 flex">
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