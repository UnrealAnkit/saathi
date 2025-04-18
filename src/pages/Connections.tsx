import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, UserPlus, Check, X, Clock, User, UserCheck, UserX, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface Connection {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
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

export default function Connections() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'accepted'>('all');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user]);
  
  const fetchConnections = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // First, try with sender_id/receiver_id columns
      let { data, error } = await supabase
        .from('connections')
        .select(`
          id,
          status,
          created_at,
          sender_id,
          receiver_id,
          sender:profiles!sender_id(id, full_name, avatar_url),
          receiver:profiles!receiver_id(id, full_name, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      
      // If there's an error with the column names, try with requester_id/recipient_id
      if (error && (error.code === 'PGRST200' || error.code === '42703')) {
        console.log('Trying alternative column names (requester_id/recipient_id)');
        
        const { data: altData, error: altError } = await supabase
          .from('connections')
          .select(`
            id,
            status,
            created_at,
            requester_id,
            recipient_id,
            requester:profiles!requester_id(id, full_name, avatar_url),
            recipient:profiles!recipient_id(id, full_name, avatar_url)
          `)
          .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: false });
        
        if (altError) {
          // If both queries fail, try a simpler query without joins
          console.log('Falling back to simpler query without joins');
          
          // Try with sender_id/receiver_id first
          const { data: simpleData, error: simpleError } = await supabase
            .from('connections')
            .select('*')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order('created_at', { ascending: false });
          
          if (simpleError && simpleError.code === '42703') {
            // If that fails, try with requester_id/recipient_id
            const { data: altSimpleData, error: altSimpleError } = await supabase
              .from('connections')
              .select('*')
              .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
              .order('created_at', { ascending: false });
            
            if (altSimpleError) throw altSimpleError;
            
            // Map the data to use sender_id/receiver_id naming
            data = (altSimpleData || []).map(conn => ({
              ...conn,
              sender_id: conn.requester_id,
              receiver_id: conn.recipient_id,
              // We'll fetch profiles separately
            }));
          } else if (simpleError) {
            throw simpleError;
          } else {
            data = simpleData;
          }
          
          // If we got connections, fetch the profiles separately
          if (data && data.length > 0) {
            // Get all user IDs we need to fetch
            const userIds = new Set<string>();
            data.forEach((conn: any) => {
              userIds.add(conn.sender_id || conn.requester_id);
              userIds.add(conn.receiver_id || conn.recipient_id);
            });
            
            // Fetch all profiles in one query
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .in('id', Array.from(userIds));
            
            if (profilesError) throw profilesError;
            
            // Create a map of profiles by ID for easy lookup
            const profilesMap = (profilesData || []).reduce((map, profile) => {
              map[profile.id] = profile;
              return map;
            }, {} as Record<string, any>);
            
            // Combine the data
            data = data.map((conn: any) => ({
              ...conn,
              sender_id: conn.sender_id || conn.requester_id,
              receiver_id: conn.receiver_id || conn.recipient_id,
              sender: profilesMap[conn.sender_id || conn.requester_id] || { id: conn.sender_id || conn.requester_id, full_name: 'Unknown User' },
              receiver: profilesMap[conn.receiver_id || conn.recipient_id] || { id: conn.receiver_id || conn.recipient_id, full_name: 'Unknown User' }
            }));
          }
        } else {
          // Map the data to use sender_id/receiver_id naming
          data = (altData || []).map(conn => ({
            ...conn,
            sender_id: conn.requester_id,
            receiver_id: conn.recipient_id,
            sender: conn.requester,
            receiver: conn.recipient
          }));
        }
      } else if (error) {
        throw error;
      }
      
      console.log('Connections data:', data);
      setConnections(data || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
      setError('Failed to load connections. Please try again later.');
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAcceptConnection = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId);
      
      if (error) throw error;
      
      // Update local state
      setConnections(connections.map(conn => 
        conn.id === connectionId ? { ...conn, status: 'accepted' } : conn
      ));
      
      toast.success('Connection accepted');
    } catch (error) {
      console.error('Error accepting connection:', error);
      toast.error('Failed to accept connection');
    }
  };
  
  const handleRejectConnection = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'rejected' })
        .eq('id', connectionId);
      
      if (error) throw error;
      
      // Update local state
      setConnections(connections.map(conn => 
        conn.id === connectionId ? { ...conn, status: 'rejected' } : conn
      ));
      
      toast.success('Connection rejected');
    } catch (error) {
      console.error('Error rejecting connection:', error);
      toast.error('Failed to reject connection');
    }
  };
  
  const getFilteredConnections = () => {
    if (activeTab === 'all') {
      return connections;
    } else {
      return connections.filter(conn => conn.status === activeTab);
    }
  };
  
  const getOtherUser = (connection: Connection) => {
    if (!user) return null;
    return connection.sender_id === user.id ? connection.receiver : connection.sender;
  };
  
  const renderConnectionStatus = (connection: Connection) => {
    if (connection.status === 'pending') {
      if (connection.receiver_id === user?.id) {
        return (
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-green-600 text-white px-3 py-1 rounded-md text-sm"
              onClick={() => handleAcceptConnection(connection.id)}
            >
              <UserCheck className="h-4 w-4 inline mr-1" />
              Accept
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-red-600 text-white px-3 py-1 rounded-md text-sm"
              onClick={() => handleRejectConnection(connection.id)}
            >
              <UserX className="h-4 w-4 inline mr-1" />
              Decline
            </motion.button>
          </div>
        );
      } else {
        return (
          <span className="text-yellow-500 flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Pending
          </span>
        );
      }
    } else if (connection.status === 'accepted') {
      return (
        <Link
          to={`/messages/${connection.id}`}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm inline-flex items-center"
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          Message
        </Link>
      );
    } else {
      return (
        <span className="text-red-500 flex items-center">
          <UserX className="h-4 w-4 mr-1" />
          Declined
        </span>
      );
    }
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
          onClick={fetchConnections}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Connections</h1>
        <p className="text-gray-600">
          Manage your connections and messages with other hackathon teammates.
        </p>
      </div>
      
      <div className="mb-6">
        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'all'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'pending'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('pending')}
          >
            Pending
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'accepted'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('accepted')}
          >
            Connected
          </button>
        </div>
      </div>
      
      {getFilteredConnections().length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No connections found</h3>
          <p className="text-gray-500 mb-6">
            {activeTab === 'all'
              ? "You don't have any connections yet."
              : activeTab === 'pending'
              ? "You don't have any pending connection requests."
              : "You don't have any accepted connections."}
          </p>
          <Link
            to="/find-teammates"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Find Teammates
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {getFilteredConnections().map((connection) => {
            const otherUser = getOtherUser(connection);
            if (!otherUser) return null;
            
            return (
              <motion.div
                key={connection.id}
                className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center mr-4">
                    {otherUser.avatar_url ? (
                      <img 
                        src={otherUser.avatar_url} 
                        alt={otherUser.full_name} 
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{otherUser.full_name}</h3>
                    <p className="text-sm text-gray-400">
                      {connection.sender_id === user?.id ? 'You sent a request' : 'Sent you a request'}
                    </p>
                  </div>
                </div>
                <div>
                  {renderConnectionStatus(connection)}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
