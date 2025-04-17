import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Code, Calendar, UserPlus, MessageCircle, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  location: string | null;
  skills: { name: string; proficiency_level: string }[];
  languages: { language: string; proficiency_level: string }[];
  hackathon_interests: string[] | null;
  connection_status?: 'none' | 'pending' | 'accepted' | 'rejected';
  connection_id?: string;
}

export default function FindTeammates() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [skillFilter, setSkillFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('all'); // 'all', 'online', 'in_person'
  
  useEffect(() => {
    fetchProfiles();
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [searchTerm, skillFilter, locationFilter, formatFilter, profiles]);
  
  const fetchProfiles = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
        
      if (profilesError) throw profilesError;
      
      // Fetch connections for the current user
      let connections = [];
      if (user) {
        const { data: connectionsData } = await supabase
          .from('connections')
          .select('*')
          .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);
          
        connections = connectionsData || [];
      }
      
      // For each profile, fetch their skills, languages, and determine connection status
      const profilesWithDetails = await Promise.all(
        profilesData.map(async (profile) => {
          // Skip the current user's profile
          if (user && profile.id === user.id) return null;
          
          // Fetch skills
          const { data: skillsData } = await supabase
            .from('skills')
            .select('name, proficiency_level')
            .eq('profile_id', profile.id);
            
          // Fetch languages
          const { data: languagesData } = await supabase
            .from('languages')
            .select('language, proficiency_level')
            .eq('profile_id', profile.id);
            
          // Fetch hackathon interests
          const { data: interestsData } = await supabase
            .from('hackathon_interests')
            .select('interest, format_preference, location_preference')
            .eq('profile_id', profile.id);
          
          // Determine connection status
          let connection_status = 'none';
          let connection_id = null;
          
          if (user) {
            const connection = connections.find(c => 
              (c.requester_id === user.id && c.recipient_id === profile.id) || 
              (c.requester_id === profile.id && c.recipient_id === user.id)
            );
            
            if (connection) {
              connection_status = connection.status;
              connection_id = connection.id;
            }
          }
          
          return {
            ...profile,
            skills: skillsData || [],
            languages: languagesData || [],
            hackathon_interests: interestsData?.map(i => i.interest) || [],
            connection_status,
            connection_id
          };
        })
      );
      
      // Filter out null values (current user's profile)
      const filteredProfiles = profilesWithDetails.filter(Boolean);
      
      setProfiles(filteredProfiles);
      setFilteredProfiles(filteredProfiles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...profiles];
    
    // Apply search term filter (name or skills)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(profile => 
        profile.full_name.toLowerCase().includes(term) || 
        profile.skills.some(skill => skill.name.toLowerCase().includes(term))
      );
    }
    
    // Apply skill filter
    if (skillFilter) {
      const skill = skillFilter.toLowerCase();
      filtered = filtered.filter(profile => 
        profile.skills.some(s => s.name.toLowerCase().includes(skill))
      );
    }
    
    // Apply location filter
    if (locationFilter) {
      const location = locationFilter.toLowerCase();
      filtered = filtered.filter(profile => 
        profile.location && profile.location.toLowerCase().includes(location)
      );
    }
    
    // Apply format filter
    if (formatFilter !== 'all') {
      if (formatFilter === 'online') {
        // This is a simplification - you might want to add a "preferred_format" field to profiles
        filtered = filtered.filter(profile => 
          !profile.location || profile.location.toLowerCase().includes('remote')
        );
      } else if (formatFilter === 'in_person') {
        filtered = filtered.filter(profile => 
          profile.location && !profile.location.toLowerCase().includes('remote')
        );
      }
    }
    
    setFilteredProfiles(filtered);
  };
  
  const resetFilters = () => {
    setSearchTerm('');
    setSkillFilter('');
    setLocationFilter('');
    setFormatFilter('all');
    setFilteredProfiles(profiles);
  };
  
  const sendConnectionRequest = async (profileId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to connect with teammates');
        return;
      }
      
      console.log('Sending connection request from', user.id, 'to', profileId);
      
      // Create the connection directly without checking first
      const { data, error } = await supabase
        .from('connections')
        .insert({
          requester_id: user.id,
          recipient_id: profileId,
          status: 'pending'
        })
        .select();
        
      if (error) {
        console.error('Error creating connection:', error);
        
        // If it's a unique violation, it means the connection already exists
        if (error.code === '23505') {
          toast.error('A connection with this user already exists');
        } else {
          toast.error('Failed to send connection request');
        }
        return;
      }
      
      // Update the local state
      setProfiles(prev => 
        prev.map(profile => 
          profile.id === profileId 
            ? { ...profile, connection_status: 'pending', connection_id: data[0].id } 
            : profile
        )
      );
      
      setFilteredProfiles(prev => 
        prev.map(profile => 
          profile.id === profileId 
            ? { ...profile, connection_status: 'pending', connection_id: data[0].id } 
            : profile
        )
      );
      
      toast.success('Connection request sent');
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error('Failed to send connection request');
    }
  };
  
  const updateConnectionStatus = async (connectionId: string, status: 'accepted' | 'rejected', profileId: string) => {
    try {
      if (!connectionId) {
        toast.error('Connection ID is missing');
        return;
      }
      
      const { error } = await supabase
        .from('connections')
        .update({ status })
        .eq('id', connectionId);
        
      if (error) {
        console.error(`Error updating connection status:`, error);
        throw error;
      }
      
      // Update the local state
      setProfiles(prev => 
        prev.map(profile => 
          profile.id === profileId 
            ? { ...profile, connection_status: status } 
            : profile
        )
      );
      
      setFilteredProfiles(prev => 
        prev.map(profile => 
          profile.id === profileId 
            ? { ...profile, connection_status: status } 
            : profile
        )
      );
      
      toast.success(`Connection ${status}`);
    } catch (error) {
      console.error(`Error ${status} connection:`, error);
      toast.error(`Failed to ${status} connection`);
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Find Teammates</h1>
        <p className="text-gray-600">
          Search for potential teammates based on skills, location, and hackathon interests.
        </p>
      </div>
      
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or skill..."
              className="w-full pl-10 pr-4 py-2 border rounded-md"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border rounded-md bg-white"
          >
            <Filter className="h-5 w-5" />
            Filters
          </button>
        </div>
        
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skill
                </label>
                <input
                  type="text"
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  placeholder="e.g., React, Python, UI/UX"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="City, Country, or Remote"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Format Preference
                </label>
                <select
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="all">All Formats</option>
                  <option value="online">Online/Remote</option>
                  <option value="in_person">In-Person</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <p>Loading profiles...</p>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-md">
          <p className="text-gray-600 mb-2">No profiles match your search criteria.</p>
          <button
            onClick={resetFilters}
            className="text-indigo-600 hover:text-indigo-800"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => (
            <div key={profile.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <img
                    src={profile.avatar_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=120&h=120&fit=crop'}
                    alt={profile.full_name}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h3 className="text-lg font-semibold">{profile.full_name}</h3>
                    {profile.location && (
                      <p className="text-gray-600 flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-1" />
                        {profile.location}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Code className="h-4 w-4 mr-1" /> Skills
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {profile.skills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs"
                      >
                        {skill.name}
                      </span>
                    ))}
                    {profile.skills.length > 3 && (
                      <span className="text-gray-500 text-xs px-2 py-1">
                        +{profile.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" /> Hackathon Interests
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {profile.hackathon_interests?.slice(0, 2).map((interest, index) => (
                      <span
                        key={index}
                        className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full text-xs"
                      >
                        {interest}
                      </span>
                    ))}
                    {profile.hackathon_interests && profile.hackathon_interests.length > 2 && (
                      <span className="text-gray-500 text-xs px-2 py-1">
                        +{profile.hackathon_interests.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  {profile.connection_status === 'none' && (
                    <button
                      onClick={() => sendConnectionRequest(profile.id)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      Connect
                    </button>
                  )}
                  {profile.connection_status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateConnectionStatus(profile.connection_id!, 'accepted', profile.id!)}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => updateConnectionStatus(profile.connection_id!, 'rejected', profile.id!)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {profile.connection_status === 'accepted' && (
                    <span className="text-green-600">Connected</span>
                  )}
                  {profile.connection_status === 'rejected' && (
                    <span className="text-red-600">Rejected</span>
                  )}
                </div>
                
                <div className="mt-4 flex gap-2">
                  <Link
                    to={`/profile/${profile.id}`}
                    className="flex-1 text-center bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200"
                  >
                    View Profile
                  </Link>
                  
                  {profile.connection_status === 'none' && (
                    <button
                      onClick={() => sendConnectionRequest(profile.id)}
                      className="flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                      title="Connect"
                    >
                      <UserPlus className="h-5 w-5" />
                    </button>
                  )}
                  
                  {profile.connection_status === 'pending' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateConnectionStatus(profile.connection_id!, 'accepted', profile.id)}
                        className="flex items-center justify-center bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700"
                        title="Accept"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => updateConnectionStatus(profile.connection_id!, 'rejected', profile.id)}
                        className="flex items-center justify-center bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700"
                        title="Reject"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                  
                  {profile.connection_status === 'accepted' && (
                    <Link
                      to={`/messages/${profile.connection_id}`}
                      className="flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                      title="Message"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 