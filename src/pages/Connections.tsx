import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, UserPlus, Check, X, Clock, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Connection {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  requester?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  recipient?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  unread_count?: number;
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
}

export default function Connections() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'accepted'>('all');
  
  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user]);
  
  const fetchConnections = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Fetch all connections where the current user is either the requester or recipient
      const { data, error } = await supabase
        .from('connections')
        .select(`
          id,
          requester_id,
          recipient_id,
          status,
          created_at,
          updated_at,
          requester:profiles!requester_id(id, full_name, avatar_url),
          recipient:profiles!recipient_id(id, full_name, avatar_url)
        `)
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching connections:', error);
        toast.error('Failed to load connections');
        setLoading(false);
        return;
      }
      
      setConnections(data || []);
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
      
      if (error) {
        console.error(`Error updating connection status:`, error);
        toast.error(`Failed to ${status} connection`);
        return;
      }
      
      toast.success(`Connection ${status}`);
      
      // Update local state
      setConnections(prev => 
        prev.map(conn => 
          conn.id === connectionId ? { ...conn, status } : conn
        )
      );
    } catch (error) {
      console.error(`Error ${status} connection:`, error);
      toast.error(`Failed to ${status} connection`);
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
    return connection.requester_id === user?.id ? connection.recipient : connection.requester;
  };
  
  if (loading && connections.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {getFilteredConnections().map((connection) => {
              const otherUser = getOtherUser(connection);
              const isPending = connection.status === 'pending';
              const isRequester = connection.requester_id === user?.id;
              const pendingIncoming = isPending && !isRequester;
              
              return (
                <li key={connection.id} className="hover:bg-gray-50">
                  {isPending ? (
                    <div className="px-6 py-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                            {otherUser?.avatar_url ? (
                              <img
                                src={otherUser.avatar_url}
                                alt={otherUser?.full_name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-indigo-600 font-medium text-lg">
                                {otherUser?.full_name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {otherUser?.full_name}
                            </h3>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>
                                {pendingIncoming
                                  ? 'Wants to connect with you'
                                  : 'Connection request sent'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {pendingIncoming ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => updateConnectionStatus(connection.id, 'accepted')}
                              className="flex items-center justify-center bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700"
                              title="Accept"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => updateConnectionStatus(connection.id, 'rejected')}
                              className="flex items-center justify-center bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700"
                              title="Reject"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">
                            {new Date(connection.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Link to={`/messages/${connection.id}`} className="block px-6 py-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                            {otherUser?.avatar_url ? (
                              <img
                                src={otherUser.avatar_url}
                                alt={otherUser?.full_name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-indigo-600 font-medium text-lg">
                                {otherUser?.full_name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {otherUser?.full_name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Click to view conversation
                            </p>
                          </div>
                        </div>
                        <MessageCircle className="h-5 w-5 text-indigo-600" />
                      </div>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
