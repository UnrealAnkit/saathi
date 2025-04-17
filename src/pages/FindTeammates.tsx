import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Code, Calendar } from 'lucide-react';
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
      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
        
      if (profilesError) throw profilesError;
      
      // For each profile, fetch their skills and languages
      const profilesWithDetails = await Promise.all(
        profilesData.map(async (profile) => {
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
            
          // Fetch hackathon interests (this would need to be added to your schema)
          // For now, we'll just use a placeholder
          
          return {
            ...profile,
            skills: skillsData || [],
            languages: languagesData || [],
            hackathon_interests: ['AI/ML', 'Web3', 'Climate Tech'] // Placeholder
          };
        })
      );
      
      setProfiles(profilesWithDetails);
      setFilteredProfiles(profilesWithDetails);
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
                
                <Link
                  to={`/profile/${profile.id}`}
                  className="block w-full text-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 mt-4"
                >
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 