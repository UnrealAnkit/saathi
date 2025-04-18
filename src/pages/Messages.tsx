import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft } from 'lucide-react';
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
  requester: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  recipient: {
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
          requester_id,
          recipient_id,
          status,
          requester:profiles!requester_id(id, full_name, avatar_url),
          recipient:profiles!recipient_id(id, full_name, avatar_url)
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
      if (connectionData.requester_id !== user.id && connectionData.recipient_id !== user.id) {
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
        .select('id, sender_id, content, created_at, read')
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
        .channel(`messages_${connectionId}`)
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
        channel.unsubscribe();
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
    (connection.requester_id === user?.id ? connection.recipient : connection.requester) : 
    null;
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
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
          {connection.requester_id === user?.id 
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center">
        <Link
          to="/connections"
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
            {otherUser.avatar_url ? (
              <img
                src={otherUser.avatar_url}
                alt={otherUser.full_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-indigo-600 font-medium">
                {otherUser.full_name.charAt(0)}
              </span>
            )}
          </div>
          <h2 className="text-xl font-semibold">{otherUser.full_name}</h2>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${
                    message.sender_id === user?.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p>{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender_id === user?.id ? 'text-indigo-200' : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={sendMessage} className="p-4 border-t">
          <div className="flex">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={sending}
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              disabled={!newMessage.trim() || sending}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 