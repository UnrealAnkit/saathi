import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Code, Calendar, UserPlus, MessageCircle, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
            let hackathonInterests = [];
            try {
              const { data: interestsData } = await supabase
                .from('hackathon_interests')
                .select('interest')
                .eq('profile_id', profile.id);
                
              hackathonInterests = interestsData?.map(i => i.interest) || [];
            } catch (error) {
              console.log('Hackathon interests table may not exist yet:', error);
            }
            
            return {
              ...profile,
              skills: skillsData || [],
              languages: languagesData || [],
              hackathon_interests: hackathonInterests,
              connection_status: 'none',
              connection_id: null
            };
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
              return {
                ...profile,
                connection_status: connection.status,
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2">Find Teammates</h1>
        <p className="text-gray-600">
          Search for potential teammates based on skills, location, and hackathon interests.
        </p>
      </motion.div>
      
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <motion.input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or skill..."
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              whileFocus={{ scale: 1.01, boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.2)" }}
            />
          </div>
          
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border rounded-md bg-white hover:bg-gray-50 transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Filter className="h-5 w-5" />
            Filters
          </motion.button>
        </div>
        
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              className="bg-gray-50 p-4 rounded-md mb-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
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
              
              <div className="flex justify-end">
                <motion.button
                  onClick={resetFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Reset Filters
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <motion.div 
            className="rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
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
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredProfiles.map((profile) => (
            <motion.div 
              key={profile.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all"
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-indigo-600 font-medium text-lg">
                        {profile.full_name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{profile.full_name}</h3>
                    {profile.location && (
                      <p className="text-gray-600 text-sm flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
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
                      <motion.span
                        key={index}
                        className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs"
                        whileHover={{ scale: 1.1, backgroundColor: "#e0e7ff" }}
                      >
                        {skill.name} • {skill.proficiency_level}
                      </motion.span>
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
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      to={`/profile/${profile.id}`}
                      className="flex-1 text-center bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      View Profile
                    </Link>
                  </motion.div>
                  
                  {profile.connection_status === 'none' && (
                    <motion.button
                      onClick={() => sendConnectionRequest(profile.id)}
                      className="flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                      title="Connect"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <UserPlus className="h-5 w-5" />
                    </motion.button>
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
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
} 