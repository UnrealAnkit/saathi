import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, UserCheck, UserX, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Connection {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: string;
  updated_at: string;
  other_user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  unread_count: number;
}

export default function Connections() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  
  useEffect(() => {
    if (user) {
      fetchConnections();
      
      // Set up real-time subscription for new messages
      const subscription = supabase
        .channel('new_messages')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages'
        }, () => {
          // Refresh connections to update unread counts
          fetchConnections();
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [user]);
  
  const fetchConnections = async () => {
    setLoading(true);
    try {
      // Fetch connections where the user is either requester or recipient
      const { data, error } = await supabase
        .from('connections')
        .select(`
          id,
          requester_id,
          recipient_id,
          status,
          updated_at,
          profiles!connections_requester_id_fkey (id, full_name, avatar_url),
          profiles!connections_recipient_id_fkey (id, full_name, avatar_url)
        `)
        .or(`requester_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .order('updated_at', { ascending: false });
        
      if (error) throw error;
      
      // Process the connections to determine the other user
      const processedConnections = await Promise.all(data.map(async (conn) => {
        const otherUserId = conn.requester_id === user?.id ? conn.recipient_id : conn.requester_id;
        const otherUserProfile = conn.requester_id === user?.id 
          ? conn.profiles.connections_recipient_id_fkey 
          : conn.profiles.connections_requester_id_fkey;
          
        // Count unread messages
        const { count, error: countError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('connection_id', conn.id)
          .eq('sender_id', otherUserId)
          .eq('read', false);
          
        if (countError) throw countError;
        
        return {
          id: conn.id,
          requester_id: conn.requester_id,
          recipient_id: conn.recipient_id,
          status: conn.status,
          updated_at: conn.updated_at,
          other_user: {
            id: otherUserId,
            full_name: otherUserProfile.full_name,
            avatar_url: otherUserProfile.avatar_url
          },
          unread_count: count || 0
        };
      }));
      
      setConnections(processedConnections);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };
  
  const updateConnectionStatus = async (connectionId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status })
        .eq('id', connectionId);
        
      if (error) throw error;
      
      // Update the local state
      setConnections(prev => 
        prev.map(conn => 
          conn.id === connectionId 
            ? { ...conn, status } 
            : conn
        )
      );
      
      toast.success(`Connection ${status}`);
    } catch (error) {
      console.error(`Error ${status} connection:`, error);
      toast.error(`Failed to ${status} connection`);
    }
  };
  
  const filteredConnections = activeTab === 'all'
    ? connections
    : connections.filter(conn => conn.status === 'pending');
  
  if (loading) {
    return <div className="flex justify-center p-8">Loading connections...</div>;
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Your Connections</h1>
          
          <div className="flex border-b mb-6">
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'all'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('all')}
            >
              All Connections
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'pending'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('pending')}
            >
              Pending Requests
              {connections.filter(c => c.status === 'pending').length > 0 && (
                <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {connections.filter(c => c.status === 'pending').length}
                </span>
              )}
            </button>
          </div>
          
          {filteredConnections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                {activeTab === 'all'
                  ? "You don't have any connections yet."
                  : "You don't have any pending connection requests."}
              </p>
              <Link
                to="/find-teammates"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Find Teammates
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredConnections.map(connection => (
                <div
                  key={connection.id}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <img
                      src={connection.other_user.avatar_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=120&h=120&fit=crop'}
                      alt={connection.other_user.full_name}
                      className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                    <div>
                      <h3 className="font-semibold">{connection.other_user.full_name}</h3>
                      <div className="flex items-center text-sm text-gray-500">
                        {connection.status === 'accepted' ? (
                          <>
                            <UserCheck className="h-4 w-4 mr-1" />
                            <span>Connected</span>
                          </>
                        ) : connection.status === 'rejected' ? (
                          <>
                            <UserX className="h-4 w-4 mr-1" />
                            <span>Rejected</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 mr-1" />
                            <span>
                              {connection.requester_id === user?.id
                                ? 'Request Sent'
                                : 'Request Received'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {connection.status === 'accepted' ? (
                      <Link
                        to={`/messages/${connection.id}`}
                        className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                      >
                        <MessageCircle className="h-5 w-5 mr-2" />
                        Message
                        {connection.unread_count > 0 && (
                          <span className="ml-2 bg-white text-indigo-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                            {connection.unread_count}
                          </span>
                        )}
                      </Link>
                    ) : connection.status === 'pending' && connection.recipient_id === user?.id ? (
                      <>
                        <button
                          onClick={() => updateConnectionStatus(connection.id, 'accepted')}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => updateConnectionStatus(connection.id, 'rejected')}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
