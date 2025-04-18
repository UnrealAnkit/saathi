import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Code, Calendar, UserPlus, MessageCircle, Check, X, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  location: string | null;
  skills: { name: string; proficiency_level: string }[];
  languages: { language: string; proficiency_level: string }[];
  hackathon_interests: string[] | null;
  connection_status: 'none' | 'pending' | 'accepted' | 'rejected' | undefined;
  connection_id?: string | null;
}

// Define an interface for hackathon interests
interface HackathonInterest {
  id: string;
  name: string;
  interest?: string;
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
  const [languageFilter, setLanguageFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('all'); // 'all', 'beginner', 'intermediate', 'expert'
  const [hackathonInterestFilter, setHackathonInterestFilter] = useState('');
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

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
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
        
      if (profilesError) throw profilesError;
      
      // For each profile, fetch their skills, languages, and hackathon interests
      const profilesWithDetails = await Promise.all(
        profilesData
          .filter(profile => profile.id !== user.id) // Skip current user
          .map(async (profile) => {
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
              
            // Fetch hackathon interests - wrap in try/catch to handle missing table
            let hackathonInterests: HackathonInterest[] = [];
            try {
              const { data: interestsData } = await supabase
                .from('profile_hackathon_interests')
                .select('interest')
                .eq('profile_id', profile.id);
                
              hackathonInterests = interestsData?.map(i => ({ 
                id: i.interest, 
                name: i.interest 
              })) || [];
            } catch (error) {
              console.log('Hackathon interests table may not exist yet:', error);
            }
            
            const userData: UserProfile = {
              id: profile.id,
              full_name: profile.full_name || 'Anonymous User',
              avatar_url: profile.avatar_url,
              location: profile.location,
              skills: skillsData || [],
              languages: languagesData || [],
              hackathon_interests: hackathonInterests.map(i => i.name || i.id),
              connection_status: 'none',
              connection_id: null
            };
            
            return userData;
          })
      );
      
      // Now fetch connections separately
      try {
        const { data: connections } = await supabase
          .from('connections')
          .select('id, requester_id, recipient_id, status')
          .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);
        
        if (connections && connections.length > 0) {
          // Update connection status for each profile
          const updatedProfiles = profilesWithDetails.map(profile => {
            const connection = connections.find(c => 
              (c.requester_id === user.id && c.recipient_id === profile.id) || 
              (c.requester_id === profile.id && c.recipient_id === user.id)
            );
            
            if (connection) {
              let status: 'none' | 'pending' | 'accepted' | 'rejected';
              
              if (connection.status === 'pending') {
                status = 'pending';
              } else if (connection.status === 'accepted') {
                status = 'accepted';
              } else if (connection.status === 'rejected') {
                status = 'rejected';
              } else {
                status = 'none';
              }
              
              return {
                ...profile,
                connection_status: status,
                connection_id: connection.id
              };
            }
            
            return profile;
          });
          
          setProfiles(updatedProfiles);
          setFilteredProfiles(updatedProfiles);
        } else {
          setProfiles(profilesWithDetails);
          setFilteredProfiles(profilesWithDetails);
        }
      } catch (error) {
        console.error('Error fetching connections:', error);
        setProfiles(profilesWithDetails);
        setFilteredProfiles(profilesWithDetails);
      }
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
    
    // Apply language filter
    if (languageFilter) {
      const language = languageFilter.toLowerCase();
      filtered = filtered.filter(profile => 
        profile.languages.some(l => l.language.toLowerCase().includes(language))
      );
    }
    
    // Apply experience filter
    if (experienceFilter !== 'all') {
      filtered = filtered.filter(profile => 
        profile.skills.some(s => s.proficiency_level.toLowerCase() === experienceFilter)
      );
    }
    
    // Apply hackathon interest filter
    if (hackathonInterestFilter) {
      const interest = hackathonInterestFilter.toLowerCase();
      filtered = filtered.filter(profile => 
        profile.hackathon_interests?.some(i => i.toLowerCase().includes(interest))
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
      
      // Simple insert without any complex logic
      const { error } = await supabase
        .from('connections')
        .insert({
          requester_id: user.id,
          recipient_id: profileId,
          status: 'pending'
        });
        
      if (error) {
        console.error('Error creating connection:', error);
        
        if (error.code === '23505') {
          toast.error('A connection with this user already exists');
        } else {
          toast.error('Failed to send connection request');
        }
        return;
      }
      
      toast.success('Connection request sent');
      
      // Refresh profiles to get updated connection status
      fetchProfiles();
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
        toast.error(`Failed to ${status} connection`);
        return;
      }
      
      toast.success(`Connection ${status}`);
      
      // Refresh profiles to get updated connection status
      fetchProfiles();
    } catch (error) {
      console.error(`Error ${status} connection:`, error);
      toast.error(`Failed to ${status} connection`);
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Find Teammates</h1>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, skill, or location"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-md hover:bg-gray-700"
          >
            <Filter className="h-5 w-5" />
            Filters
          </button>
        </div>
      </div>
      
      {/* Filters section */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="bg-gray-800 p-6 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skill
                </label>
                <input
                  type="text"
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  placeholder="e.g., React, Python, UI/UX"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
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
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Format
                </label>
                <select
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                  <option value="all">All Formats</option>
                  <option value="online">Online Only</option>
                  <option value="in_person">In-Person Only</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <input
                  type="text"
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  placeholder="e.g., JavaScript, Python, Java"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience Level
                </label>
                <select
                  value={experienceFilter}
                  onChange={(e) => setExperienceFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hackathon Interest
                </label>
                <input
                  type="text"
                  value={hackathonInterestFilter}
                  onChange={(e) => setHackathonInterestFilter(e.target.value)}
                  placeholder="e.g., AI/ML, Web3, Climate"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {filteredProfiles.map((profile) => (
            <motion.div
              key={profile.id}
              className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 hover:border-purple-500 transition-all"
              whileHover={{ y: -5 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.full_name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=7C3AED&color=fff`;
                        }}
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  
                  <div>
                    <Link to={`/profile/${profile.id}`} className="hover:underline">
                      <h3 className="text-xl font-semibold">{profile.full_name}</h3>
                    </Link>
                    
                    {profile.location && (
                      <div className="flex items-center text-gray-400 mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">{profile.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {profile.skills && profile.skills.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center">
                      <Code className="h-4 w-4 mr-1" />
                      Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs"
                        >
                          {skill.name}
                          {skill.proficiency_level && (
                            <span className="ml-1 text-purple-400">• {skill.proficiency_level}</span>
                          )}
                        </span>
                      ))}
                      {profile.skills.length > 3 && (
                        <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs">
                          +{profile.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {profile.hackathon_interests && profile.hackathon_interests.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Hackathon Interests
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.hackathon_interests.slice(0, 2).map((interest, index) => (
                        <span
                          key={index}
                          className="bg-purple-900 text-purple-200 px-2 py-1 rounded-full text-xs"
                        >
                          {interest}
                        </span>
                      ))}
                      {profile.hackathon_interests.length > 2 && (
                        <span className="bg-purple-900 text-purple-200 px-2 py-1 rounded-full text-xs">
                          +{profile.hackathon_interests.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end mt-4">
                  {profile.connection_status === 'none' && (
                    <motion.button
                      onClick={() => sendConnectionRequest(profile.id)}
                      className="flex items-center justify-center bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <UserPlus className="h-5 w-5 mr-2" />
                      Connect
                    </motion.button>
                  )}
                  
                  {profile.connection_status === 'pending' && (
                    <div className="flex items-center gap-2">
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
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Message
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
      
      {!loading && filteredProfiles.length === 0 && (
        <div className="text-center py-16">
          <h3 className="text-xl font-medium mb-2">No teammates found</h3>
          <p className="text-gray-400 mb-6">Try adjusting your filters or search terms</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSkillFilter('');
              setLocationFilter('');
              setFormatFilter('all');
              setLanguageFilter('');
              setExperienceFilter('all');
              setHackathonInterestFilter('');
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
} 