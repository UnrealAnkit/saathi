import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, Globe, Users, ExternalLink, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Hackathon {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  format: 'online' | 'in_person' | 'hybrid';
  website_url: string;
  image_url: string;
  created_by: string;
  creator?: {
    full_name: string;
  };
}

interface Participant {
  id: string;
  profile_id: string;
  hackathon_id: string;
  status: 'interested' | 'participating' | 'completed';
  profile: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export default function HackathonDetail() {
  const { hackathonId } = useParams<{ hackathonId: string }>();
  const { user } = useAuth();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [participating, setParticipating] = useState(false);
  const [participationStatus, setParticipationStatus] = useState<'interested' | 'participating' | 'completed' | null>(null);

  useEffect(() => {
    if (hackathonId) {
      fetchHackathonDetails();
    }
  }, [hackathonId]);

  const fetchHackathonDetails = async () => {
    setLoading(true);
    try {
      // Fetch hackathon details
      const { data: hackathonData, error: hackathonError } = await supabase
        .from('hackathons')
        .select(`
          *,
          creator:profiles!created_by(full_name)
        `)
        .eq('id', hackathonId)
        .single();

      if (hackathonError) throw hackathonError;
      setHackathon(hackathonData);

      // Fetch participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('hackathon_participants')
        .select(`
          *,
          profile:profiles(id, full_name, avatar_url)
        `)
        .eq('hackathon_id', hackathonId);

      if (participantsError) throw participantsError;
      setParticipants(participantsData || []);

      // Check if current user is participating
      if (user) {
        const userParticipation = participantsData?.find(p => p.profile_id === user.id);
        setParticipating(!!userParticipation);
        setParticipationStatus(userParticipation?.status || null);
      }
    } catch (error) {
      console.error('Error fetching hackathon details:', error);
      toast.error('Failed to load hackathon details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const joinHackathon = async (status: 'interested' | 'participating') => {
    if (!user) {
      toast.error('Please sign in to join this hackathon');
      return;
    }

    try {
      if (participating) {
        // Update status
        const { error } = await supabase
          .from('hackathon_participants')
          .update({ status })
          .eq('hackathon_id', hackathonId)
          .eq('profile_id', user.id);

        if (error) throw error;
      } else {
        // Insert new participation
        const { error } = await supabase
          .from('hackathon_participants')
          .insert({
            hackathon_id: hackathonId,
            profile_id: user.id,
            status
          });

        if (error) throw error;
      }

      toast.success(status === 'interested' 
        ? 'You are now marked as interested in this hackathon' 
        : 'You are now participating in this hackathon');
      
      setParticipating(true);
      setParticipationStatus(status);
      fetchHackathonDetails(); // Refresh data
    } catch (error) {
      console.error('Error joining hackathon:', error);
      toast.error('Failed to join hackathon');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Hackathon Not Found</h2>
        <p className="text-gray-600 mb-6">
          We couldn't find the hackathon you're looking for. It may have been removed.
        </p>
        <Link
          to="/hackathons"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Hackathons
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to="/hackathons"
        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
      >
        <ArrowLeft className="h-5 w-5 mr-1" />
        Back to Hackathons
      </Link>

      {/* Hackathon Header */}
      <div className="relative mb-8">
        <div 
          className="h-64 w-full bg-cover bg-center rounded-xl"
          style={{ 
            backgroundImage: hackathon.image_url 
              ? `url(${hackathon.image_url})` 
              : 'url(https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80)',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-xl"></div>
        </div>
        
        <div className="absolute bottom-0 left-0 p-6 text-white">
          <div className="flex items-center mb-2">
            <span className={`
              px-3 py-1 rounded-full text-sm font-medium mr-2
              ${hackathon.format === 'online' ? 'bg-green-500/80' : 
                hackathon.format === 'in_person' ? 'bg-blue-500/80' : 'bg-purple-500/80'}
            `}>
              {hackathon.format === 'online' ? 'Online' : 
               hackathon.format === 'in_person' ? 'In Person' : 'Hybrid'}
            </span>
          </div>
          <h1 className="text-3xl font-bold">{hackathon.name}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">About this Hackathon</h2>
            <p className="text-gray-700 whitespace-pre-line mb-6">{hackathon.description}</p>
            
            <div className="space-y-3">
              <div className="flex items-center text-gray-700">
                <Calendar className="h-5 w-5 mr-3 text-indigo-600" />
                <span>{formatDate(hackathon.start_date)} - {formatDate(hackathon.end_date)}</span>
              </div>
              
              <div className="flex items-center text-gray-700">
                <MapPin className="h-5 w-5 mr-3 text-indigo-600" />
                <span>{hackathon.format === 'online' ? 'Online Event' : hackathon.location}</span>
              </div>
              
              {hackathon.website_url && (
                <div className="flex items-center text-gray-700">
                  <Globe className="h-5 w-5 mr-3 text-indigo-600" />
                  <a 
                    href={hackathon.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 flex items-center"
                  >
                    Official Website
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                </div>
              )}
              
              {hackathon.creator && (
                <div className="flex items-center text-gray-700">
                  <Users className="h-5 w-5 mr-3 text-indigo-600" />
                  <span>Organized by {hackathon.creator.full_name}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Participants Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Participants</h2>
              <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-sm">
                {participants.length} {participants.length === 1 ? 'person' : 'people'}
              </span>
            </div>
            
            {participants.length === 0 ? (
              <p className="text-gray-500 italic">No participants yet. Be the first to join!</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {participants.map((participant) => (
                  <Link 
                    key={participant.id}
                    to={`/profile/${participant.profile.id}`}
                    className="flex items-center p-2 hover:bg-gray-50 rounded-md"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                      {participant.profile.avatar_url ? (
                        <img
                          src={participant.profile.avatar_url}
                          alt={participant.profile.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-indigo-600 font-medium">
                          {participant.profile.full_name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-medium text-gray-900 truncate">{participant.profile.full_name}</p>
                      <p className="text-xs text-gray-500 capitalize">{participant.status}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h3 className="text-lg font-bold mb-4">Join this Hackathon</h3>
            
            {!user ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">Sign in to join this hackathon</p>
                <Link
                  to="/auth"
                  className="block w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-center"
                >
                  Sign In / Sign Up
                </Link>
              </div>
            ) : participating ? (
              <div>
                <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                  <p className="text-green-800 text-sm">
                    You are {participationStatus === 'interested' ? 'interested in' : 'participating in'} this hackathon
                  </p>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => joinHackathon('interested')}
                    className={`w-full px-4 py-2 rounded-md border text-center
                      ${participationStatus === 'interested' 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    I'm Interested
                  </button>
                  
                  <button
                    onClick={() => joinHackathon('participating')}
                    className={`w-full px-4 py-2 rounded-md border text-center
                      ${participationStatus === 'participating' 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    I'm Participating
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => joinHackathon('interested')}
                  className="w-full bg-white border border-indigo-600 text-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-50"
                >
                  I'm Interested
                </button>
                
                <button
                  onClick={() => joinHackathon('participating')}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  I'm Participating
                </button>
              </div>
            )}
            
            <div className="mt-6">
              <h4 className="font-medium mb-2">Looking for teammates?</h4>
              <Link
                to="/find-teammates"
                className="text-indigo-600 hover:text-indigo-800 flex items-center"
              >
                Browse potential teammates
                <ArrowLeft className="h-4 w-4 ml-1 rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 