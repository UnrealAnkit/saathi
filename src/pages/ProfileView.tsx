import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, MapPin, Github, Linkedin, Globe, Code, MessageSquare, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  location: string | null;
  timezone: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  availability_status: string | null;
}

interface Skill {
  id: string;
  name: string;
  proficiency_level: string;
}

interface Language {
  id: string;
  language: string;
  proficiency_level: string;
}

interface HackathonInterest {
  id: string;
  interest: string;
  format_preference: string;
  location_preference: string | null;
}

export default function ProfileView() {
  const { profileId } = useParams<{ profileId: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [hackathonInterests, setHackathonInterests] = useState<HackathonInterest[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>('none');
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    if (profileId) {
      fetchProfileData();
    }
  }, [profileId]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();
        
      if (profileError) throw profileError;
      setProfile(profileData);
      
      // Fetch skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('*')
        .eq('profile_id', profileId);
        
      if (skillsError) throw skillsError;
      setSkills(skillsData || []);
      
      // Fetch languages
      const { data: languagesData, error: languagesError } = await supabase
        .from('languages')
        .select('*')
        .eq('profile_id', profileId);
        
      if (languagesError) throw languagesError;
      setLanguages(languagesData || []);
      
      // Fetch hackathon interests
      const { data: interestsData, error: interestsError } = await supabase
        .from('hackathon_interests')
        .select('*')
        .eq('profile_id', profileId);
        
      if (interestsError) throw interestsError;
      setHackathonInterests(interestsData || []);
      
      // Check connection status if user is logged in
      if (user) {
        const { data: connectionData, error: connectionError } = await supabase
          .from('connections')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`);
          
        if (connectionError) throw connectionError;
        
        if (connectionData && connectionData.length > 0) {
          const connection = connectionData[0];
          setConnectionStatus(connection.status);
          setConnectionId(connection.id);
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const sendConnectionRequest = async () => {
    if (!user) {
      toast.error('Please sign in to connect with other users');
      return;
    }
    
    try {
      setSendingRequest(true);
      
      const { data, error } = await supabase
        .from('connections')
        .insert({
          sender_id: user.id,
          receiver_id: profileId,
          status: 'pending'
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setConnectionStatus('pending');
      setConnectionId(data.id);
      toast.success('Connection request sent!');
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error('Failed to send connection request');
    } finally {
      setSendingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-10">
        <div className="text-red-500 mb-4">Profile not found</div>
        <Link 
          to="/find-teammates"
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
        >
          Back to Find Teammates
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg overflow-hidden shadow-xl">
      <div className="p-6 bg-gray-800 border-b border-gray-700">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.full_name} 
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <User className="h-12 w-12 text-gray-400" />
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{profile.full_name}</h1>
            
            <div className="flex flex-wrap gap-4 text-gray-300">
              {profile.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{profile.location}</span>
                </div>
              )}
              
              {profile.timezone && (
                <div className="flex items-center">
                  <span className="text-gray-400">Timezone:</span>
                  <span className="ml-1">{profile.timezone}</span>
                </div>
              )}
              
              {profile.availability_status && (
                <div className="flex items-center">
                  <span className="text-gray-400">Status:</span>
                  <span className={`ml-1 ${
                    profile.availability_status === 'actively_looking' 
                      ? 'text-green-500' 
                      : profile.availability_status === 'open' 
                      ? 'text-yellow-500' 
                      : 'text-red-500'
                  }`}>
                    {profile.availability_status.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            {user && user.id !== profileId && (
              <>
                {connectionStatus === 'none' && (
                  <motion.button
                    onClick={sendConnectionRequest}
                    disabled={sendingRequest}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <UserPlus className="h-5 w-5 mr-2" />
                    Connect
                  </motion.button>
                )}
                
                {connectionStatus === 'pending' && (
                  <button
                    disabled
                    className="bg-gray-600 text-white px-4 py-2 rounded-md flex items-center cursor-not-allowed"
                  >
                    <span className="h-2 w-2 bg-yellow-500 rounded-full mr-2"></span>
                    Request Pending
                  </button>
                )}
                
                {connectionStatus === 'accepted' && (
                  <Link
                    to={`/messages/${connectionId}`}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
                  >
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Message
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 mt-6">
          {profile.github_url && (
            <a 
              href={profile.github_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white flex items-center"
            >
              <Github className="h-5 w-5 mr-2" />
              GitHub
            </a>
          )}
          
          {profile.linkedin_url && (
            <a 
              href={profile.linkedin_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white flex items-center"
            >
              <Linkedin className="h-5 w-5 mr-2" />
              LinkedIn
            </a>
          )}
          
          {profile.website_url && (
            <a 
              href={profile.website_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white flex items-center"
            >
              <Globe className="h-5 w-5 mr-2" />
              Website
            </a>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-800">
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Code className="h-5 w-5 mr-2 text-purple-400" />
            Skills
          </h2>
          
          {skills.length === 0 ? (
            <p className="text-gray-500 italic">No skills listed yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill.id}
                  className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-sm"
                >
                  {skill.name} • {skill.proficiency_level}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-4">Languages</h2>
          
          {languages.length === 0 ? (
            <p className="text-gray-500 italic">No languages listed yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {languages.map((lang) => (
                <span
                  key={lang.id}
                  className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-sm"
                >
                  {lang.language} • {lang.proficiency_level}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Hackathon Interests</h2>
          
          {hackathonInterests.length === 0 ? (
            <p className="text-gray-500 italic">No hackathon interests listed yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {hackathonInterests.map((interest) => (
                <div 
                  key={interest.id} 
                  className="bg-purple-900 text-purple-100 px-3 py-2 rounded-md text-sm flex items-center"
                >
                  <span>{interest.interest}</span>
                  <span className="mx-1">•</span>
                  <span className="text-purple-300">{interest.format_preference}</span>
                  {interest.location_preference && (
                    <>
                      <span className="mx-1">•</span>
                      <span className="text-purple-300">{interest.location_preference}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 