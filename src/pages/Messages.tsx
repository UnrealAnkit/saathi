import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, User } from 'lucide-react';
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
    id: string;
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
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [connection, setConnection] = useState<Connection | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
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
          // Add the new message to the list
          const newMsg = payload.new as Message;
          setMessages(prevMessages => [...prevMessages, newMsg]);
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
      if (!connectionId || !user) return;
      
      // First try with sender_id/receiver_id
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
        
        if (altError) throw altError;
        
        // Map the data to use sender_id/receiver_id naming
        data = {
          ...altData,
          sender_id: altData.requester_id,
          receiver_id: altData.recipient_id,
          sender: altData.requester,
          receiver: altData.recipient
        };
      } else if (error) {
        throw error;
      }
      
      setConnection(data);
      
      // Determine which user is the other person in the conversation
      const otherPerson = data.sender_id === user.id ? data.receiver : data.sender;
      setOtherUser(otherPerson);
      
    } catch (error) {
      console.error('Error fetching connection:', error);
      toast.error('Failed to load conversation');
    }
  };
  
  const fetchMessages = async () => {
    try {
      if (!connectionId || !user) return;
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          connection_id,
          sender_id,
          content,
          created_at,
          sender:profiles!sender_id(id, full_name, avatar_url)
        `)
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !connectionId) return;
    
    setSending(true);
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          connection_id: connectionId,
          sender_id: user.id,
          content: newMessage.trim()
        });
      
      if (error) throw error;
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  if (!connection || !otherUser) {
    return (
      <div className="text-center py-10">
        <div className="text-red-500 mb-4">Conversation not found or you don't have access.</div>
        <Link 
          to="/connections"
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
        >
          Back to Connections
        </Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-64px)] flex flex-col">
      <div className="flex items-center mb-4">
        <Link to="/connections" className="mr-4">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center mr-3">
            {otherUser.avatar_url ? (
              <img 
                src={otherUser.avatar_url} 
                alt={otherUser.full_name} 
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div>
            <h2 className="font-semibold">{otherUser.full_name}</h2>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto mb-4 bg-gray-800 rounded-lg p-4">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isCurrentUser = message.sender_id === user?.id;
              
              return (
                <div 
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isCurrentUser 
                        ? 'bg-purple-600 text-white rounded-br-none' 
                        : 'bg-gray-700 rounded-bl-none'
                    }`}
                  >
                    <div className="text-sm mb-1">{message.content}</div>
                    <div className="text-xs opacity-70 text-right">
                      {formatTime(message.created_at)}
                    </div>
                  </motion.div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <form onSubmit={handleSendMessage} className="flex items-center">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-gray-700 border border-gray-600 rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-r-md disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
} 