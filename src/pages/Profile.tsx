import React, { useState, useEffect } from 'react';
import { Camera, Github, Linkedin, Globe, User, MapPin, Clock, Calendar, Code, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const skillLevels = ['Beginner', 'Intermediate', 'Expert'] as const;
type SkillLevel = typeof skillLevels[number];

const languageLevels = ['Basic', 'Conversational', 'Fluent', 'Native'] as const;
type LanguageLevel = typeof languageLevels[number];

interface Skill {
  id?: string;
  name: string;
  proficiency_level: SkillLevel;
}

interface Language {
  id?: string;
  language: string;
  proficiency_level: LanguageLevel;
}

interface HackathonInterest {
  id?: string;
  interest: string;
  format_preference: 'online' | 'in_person' | 'hybrid';
  location_preference?: string;
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  location: string | null;
  timezone: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  bio?: string;
  availability_status?: string;
}

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [hackathonInterests, setHackathonInterests] = useState<HackathonInterest[]>([]);
  
  const [newSkill, setNewSkill] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('Beginner');
  const [newLanguage, setNewLanguage] = useState('');
  const [newLanguageLevel, setNewLanguageLevel] = useState<LanguageLevel>('Fluent');
  const [newInterest, setNewInterest] = useState('');
  const [newFormatPreference, setNewFormatPreference] = useState<'online' | 'in_person' | 'hybrid'>('online');
  const [newLocationPreference, setNewLocationPreference] = useState('');
  
  // Form data for editing profile
  const [formData, setFormData] = useState({
    full_name: '',
    location: '',
    timezone: '',
    github_url: '',
    linkedin_url: '',
    website_url: '',
  });

  const [showInterestModal, setShowInterestModal] = useState(false);

  // Add state for skill and language modals
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.user) {
        console.log('User is authenticated:', session.user);
        checkAvatarsBucket();
        fetchProfileData();
        fetchSkills();
        fetchLanguages();
        fetchHackathonInterests();
      } else {
        console.log('No authenticated session found');
        setLoading(false);
      }
    };
    
    checkUser();
  }, []);

  const checkAvatarsBucket = async () => {
    try {
      console.log('Checking for avatars bucket...');
      // Skip bucket creation for now since it's failing
      // We'll use a workaround for avatar uploads
    } catch (error) {
      console.error('Error checking avatars bucket:', error);
    }
  };

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      console.log('Fetching profile for user ID:', user?.id);
      
      if (!user?.id) {
        console.error('No user ID available');
        throw new Error('User ID is required');
      }
      
      // First check if profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id);
      
      console.log('Profile query response:', profileData);
      
      if (profileError) {
        console.error('Profile fetch error details:', profileError);
        throw profileError;
      }
      
      // If profile doesn't exist or is empty, create one
      if (!profileData || profileData.length === 0) {
        console.log('No profile found, creating new profile');
        
        const newProfile = {
          id: user.id,
          full_name: user?.user_metadata?.full_name || '',
          avatar_url: user?.user_metadata?.avatar_url || null,
        };
        
        console.log('Creating profile with data:', newProfile);
        
        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select();
          
        if (createError) {
          console.error('Profile creation error:', createError);
          throw createError;
        }
        
        console.log('Created profile:', createdProfile);
        
        if (createdProfile && createdProfile.length > 0) {
          setProfile(createdProfile[0]);
          setFormData({
            full_name: createdProfile[0].full_name || '',
            location: createdProfile[0].location || '',
            timezone: createdProfile[0].timezone || '',
            github_url: createdProfile[0].github_url || '',
            linkedin_url: createdProfile[0].linkedin_url || '',
            website_url: createdProfile[0].website_url || '',
          });
        }
      } else {
        // Profile exists
        console.log('Profile found:', profileData[0]);
        setProfile(profileData[0]);
        setFormData({
          full_name: profileData[0].full_name || '',
          location: profileData[0].location || '',
          timezone: profileData[0].timezone || '',
          github_url: profileData[0].github_url || '',
          linkedin_url: profileData[0].linkedin_url || '',
          website_url: profileData[0].website_url || '',
        });
      }
      
      // Fetch skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('*')
        .eq('profile_id', user.id);
        
      if (skillsError) {
        console.error('Skills fetch error:', skillsError);
      } else {
        console.log('Skills data:', skillsData);
        setSkills(skillsData || []);
      }
      
      // Fetch languages
      const { data: languagesData, error: languagesError } = await supabase
        .from('languages')
        .select('*')
        .eq('profile_id', user.id);
        
      if (languagesError) {
        console.error('Languages fetch error:', languagesError);
      } else {
        console.log('Languages data:', languagesData);
        setLanguages(languagesData || []);
      }
      
      // Fetch hackathon interests
      const { data: interestsData, error: interestsError } = await supabase
        .from('hackathon_interests')
        .select('*')
        .eq('profile_id', user.id);
        
      if (interestsError) {
        console.error('Interests fetch error:', interestsError);
      } else {
        console.log('Interests data:', interestsData);
        setHackathonInterests(interestsData || []);
      }
      
    } catch (error) {
      console.error('Full error object:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user?.id);
        
      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, ...formData } : null);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const addSkill = async () => {
    if (!newSkill.trim()) return;
    
    try {
      const newSkillData = {
        profile_id: user?.id,
        name: newSkill.trim(),
        proficiency_level: newSkillLevel
      };
      
      const { data, error } = await supabase
        .from('skills')
        .insert([newSkillData])
        .select();
        
      if (error) throw error;
      
      setSkills(prev => [...prev, data[0]]);
      setNewSkill('');
      setNewSkillLevel('Beginner');
      toast.success('Skill added');
    } catch (error) {
      console.error('Error adding skill:', error);
      toast.error('Failed to add skill');
    }
  };

  const addLanguage = async () => {
    if (!newLanguage.trim()) return;
    
    try {
      const newLanguageData = {
        profile_id: user?.id,
        language: newLanguage.trim(),
        proficiency_level: newLanguageLevel
      };
      
      const { data, error } = await supabase
        .from('languages')
        .insert([newLanguageData])
        .select();
        
      if (error) throw error;
      
      setLanguages(prev => [...prev, data[0]]);
      setNewLanguage('');
      setNewLanguageLevel('Fluent');
      toast.success('Language added');
    } catch (error) {
      console.error('Error adding language:', error);
      toast.error('Failed to add language');
    }
  };

  const addHackathonInterest = async () => {
    if (!newInterest.trim()) return;
    
    try {
      const newInterestData = {
        profile_id: user?.id,
        interest: newInterest.trim(),
        format_preference: newFormatPreference,
        location_preference: newLocationPreference.trim() || null
      };
      
      const { data, error } = await supabase
        .from('hackathon_interests')
        .insert([newInterestData])
        .select();
        
      if (error) throw error;
      
      setHackathonInterests(prev => [...prev, data[0]]);
      setNewInterest('');
      setNewFormatPreference('online');
      setNewLocationPreference('');
      toast.success('Hackathon interest added');
    } catch (error) {
      console.error('Error adding hackathon interest:', error);
      toast.error('Failed to add hackathon interest');
    }
  };

  const removeHackathonInterest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('hackathon_interests')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setHackathonInterests(prev => prev.filter(interest => interest.id !== id));
      toast.success('Hackathon interest removed');
    } catch (error) {
      console.error('Error removing hackathon interest:', error);
      toast.error('Failed to remove hackathon interest');
    }
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    try {
      // Instead of using storage, let's convert the image to a data URL
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (!event.target || typeof event.target.result !== 'string') {
          toast.error('Failed to process image');
          return;
        }
        
        const dataUrl = event.target.result;
        
        // Update the profile with the data URL
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: dataUrl })
          .eq('id', user?.id);
          
        if (error) {
          console.error('Profile update error:', error);
          toast.error('Failed to update avatar');
          return;
        }
        
        setProfile(prev => prev ? { ...prev, avatar_url: dataUrl } : null);
        toast.success('Avatar updated');
      };
      
      reader.onerror = () => {
        toast.error('Failed to read image file');
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload avatar');
    }
  };

  const fetchHackathonInterests = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('hackathon_interests')
        .select('*')
        .eq('profile_id', user.id);
        
      if (error) throw error;
      setHackathonInterests(data || []);
    } catch (error) {
      console.error('Error fetching hackathon interests:', error);
      toast.error('Failed to load hackathon interests');
    }
  };

  const handleAddHackathonInterest = async () => {
    if (!newInterest) {
      toast.error('Please enter a hackathon interest');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('hackathon_interests')
        .insert({
          profile_id: user?.id,
          interest: newInterest,
          format_preference: newFormatPreference,
          location_preference: newLocationPreference || null
        })
        .select();
        
      if (error) throw error;
      
      setHackathonInterests([...hackathonInterests, data[0]]);
      setNewInterest('');
      setNewFormatPreference('online');
      setNewLocationPreference('');
      setShowInterestModal(false);
      toast.success('Hackathon interest added');
    } catch (error) {
      console.error('Error adding hackathon interest:', error);
      toast.error('Failed to add hackathon interest');
    }
  };

  const handleDeleteInterest = async (interestId: string) => {
    try {
      const { error } = await supabase
        .from('hackathon_interests')
        .delete()
        .eq('id', interestId);
        
      if (error) throw error;
      
      setHackathonInterests(hackathonInterests.filter(interest => interest.id !== interestId));
      toast.success('Hackathon interest removed');
    } catch (error) {
      console.error('Error deleting hackathon interest:', error);
      toast.error('Failed to remove hackathon interest');
    }
  };

  const fetchSkills = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('profile_id', user.id);
        
      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error('Error fetching skills:', error);
      toast.error('Failed to load skills');
    }
  };

  const fetchLanguages = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .eq('profile_id', user.id);
        
      if (error) throw error;
      setLanguages(data || []);
    } catch (error) {
      console.error('Error fetching languages:', error);
      toast.error('Failed to load languages');
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    try {
      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', skillId);
        
      if (error) throw error;
      
      setSkills(skills.filter(skill => skill.id !== skillId));
      toast.success('Skill removed');
    } catch (error) {
      console.error('Error deleting skill:', error);
      toast.error('Failed to remove skill');
    }
  };

  const handleDeleteLanguage = async (languageId: string) => {
    try {
      const { error } = await supabase
        .from('languages')
        .delete()
        .eq('id', languageId);
        
      if (error) throw error;
      
      setLanguages(languages.filter(language => language.id !== languageId));
      toast.success('Language removed');
    } catch (error) {
      console.error('Error deleting language:', error);
      toast.error('Failed to remove language');
    }
  };

  // Add functions to handle adding skills and languages
  const handleAddSkill = async () => {
    if (!newSkill) {
      toast.error('Please enter a skill');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('skills')
        .insert({
          profile_id: user?.id,
          name: newSkill,
          proficiency_level: newSkillLevel
        })
        .select();
        
      if (error) throw error;
      
      setSkills([...skills, data[0]]);
      setNewSkill('');
      setNewSkillLevel('Beginner');
      setShowSkillModal(false);
      toast.success('Skill added');
    } catch (error) {
      console.error('Error adding skill:', error);
      toast.error('Failed to add skill');
    }
  };

  const handleAddLanguage = async () => {
    if (!newLanguage) {
      toast.error('Please enter a language');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('languages')
        .insert({
          profile_id: user?.id,
          language: newLanguage,
          proficiency_level: newLanguageLevel
        })
        .select();
        
      if (error) throw error;
      
      setLanguages([...languages, data[0]]);
      setNewLanguage('');
      setNewLanguageLevel('Fluent');
      setShowLanguageModal(false);
      toast.success('Language added');
    } catch (error) {
      console.error('Error adding language:', error);
      toast.error('Failed to add language');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading profile...</div>;
  }

  if (!profile && !loading) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error Loading Profile</h2>
          <p className="mb-4">We encountered an issue loading your profile data. This could be due to:</p>
          <ul className="list-disc pl-5 mb-4">
            <li>Connection issues with the database</li>
            <li>Missing permissions</li>
            <li>Your profile hasn't been created yet</li>
          </ul>
          <button 
            onClick={fetchProfileData}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Profile header with cover image and avatar */}
        <div className="h-48 bg-gradient-to-r from-purple-600 to-indigo-700 relative">
          {/* Avatar */}
          <div className="absolute -bottom-16 left-6">
            <div className="w-32 h-32 rounded-full border-4 border-gray-800 overflow-hidden bg-gray-700 flex items-center justify-center">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name || 'Profile'} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || '')}&background=7C3AED&color=fff`;
                  }}
                />
              ) : (
                <User className="h-12 w-12 text-gray-400" />
              )}
            </div>
          </div>
          
          {/* Edit profile button */}
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-gray-900 bg-opacity-50 hover:bg-opacity-70 text-white px-4 py-2 rounded-md flex items-center"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>
        
        {/* Profile info */}
        <div className="pt-20 px-6 pb-6">
          <h1 className="text-2xl font-bold text-white">{profile.full_name || 'Add your name'}</h1>
          
          <div className="mt-2 flex flex-wrap gap-4 text-gray-300">
            {profile.location && (
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-1 text-purple-400" />
                <span>{profile.location}</span>
              </div>
            )}
            
            {profile.timezone && (
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-1 text-purple-400" />
                <span>{profile.timezone}</span>
              </div>
            )}
            
            {profile.availability_status && (
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-1 text-purple-400" />
                <span>{profile.availability_status}</span>
              </div>
            )}
          </div>
          
          {/* Social links */}
          <div className="mt-4 flex gap-4">
            {profile.github_url && (
              <a 
                href={profile.github_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white flex items-center"
              >
                <Github className="h-5 w-5 mr-1" />
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
                <Linkedin className="h-5 w-5 mr-1" />
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
                <Globe className="h-5 w-5 mr-1" />
                Website
              </a>
            )}
          </div>
          
          {profile.bio && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2 text-white">About</h2>
              <p className="text-gray-300">{profile.bio}</p>
            </div>
          )}
        </div>
        
        {/* Skills, languages, and interests */}
        <div className="border-t border-gray-700 px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Skills section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <Code className="h-5 w-5 mr-2 text-purple-400" />
                  Skills
                </h2>
                {isEditing && (
                  <button
                    onClick={() => setShowSkillModal(true)}
                    className="text-purple-400 hover:text-purple-300 text-sm"
                  >
                    + Add Skill
                  </button>
                )}
              </div>
              
              {skills.length === 0 ? (
                <p className="text-gray-500 italic">No skills added yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <div 
                      key={skill.id} 
                      className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-sm flex items-center"
                    >
                      <span>{skill.name}</span>
                      <span className="mx-1">•</span>
                      <span className="text-purple-300">{skill.proficiency_level}</span>
                      {isEditing && (
                        <button
                          onClick={() => handleDeleteSkill(skill.id)}
                          className="ml-2 text-gray-400 hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Languages section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Languages</h2>
                {isEditing && (
                  <button
                    onClick={() => setShowLanguageModal(true)}
                    className="text-purple-400 hover:text-purple-300 text-sm"
                  >
                    + Add Language
                  </button>
                )}
              </div>
              
              {languages.length === 0 ? (
                <p className="text-gray-500 italic">No languages added yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {languages.map((language) => (
                    <div 
                      key={language.id} 
                      className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-sm flex items-center"
                    >
                      <span>{language.language}</span>
                      <span className="mx-1">•</span>
                      <span className="text-purple-300">{language.proficiency_level}</span>
                      {isEditing && (
                        <button
                          onClick={() => handleDeleteLanguage(language.id)}
                          className="ml-2 text-gray-400 hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Hackathon interests section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-400" />
                Hackathon Interests
              </h2>
              {isEditing && (
                <button
                  onClick={() => setShowInterestModal(true)}
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  + Add Interest
                </button>
              )}
            </div>
            
            {hackathonInterests.length === 0 ? (
              <p className="text-gray-500 italic">No hackathon interests added yet.</p>
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
                    {isEditing && (
                      <button
                        onClick={() => handleDeleteInterest(interest.id)}
                        className="ml-2 text-purple-200 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Skill Modal */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-white">Add Skill</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="skill" className="block text-sm font-medium mb-1 text-gray-300">
                  Skill Name
                </label>
                <input
                  id="skill"
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="e.g., React, Python, UI Design"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                />
              </div>
              
              <div>
                <label htmlFor="skillLevel" className="block text-sm font-medium mb-1 text-gray-300">
                  Proficiency Level
                </label>
                <select
                  id="skillLevel"
                  value={newSkillLevel}
                  onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                >
                  {skillLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end mt-6 gap-3">
              <button
                onClick={() => setShowSkillModal(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSkill}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Add Skill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-white">Add Language</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="language" className="block text-sm font-medium mb-1 text-gray-300">
                  Language
                </label>
                <input
                  id="language"
                  type="text"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  placeholder="e.g., English, Spanish, French"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                />
              </div>
              
              <div>
                <label htmlFor="languageLevel" className="block text-sm font-medium mb-1 text-gray-300">
                  Proficiency Level
                </label>
                <select
                  id="languageLevel"
                  value={newLanguageLevel}
                  onChange={(e) => setNewLanguageLevel(e.target.value as LanguageLevel)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                >
                  {languageLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end mt-6 gap-3">
              <button
                onClick={() => setShowLanguageModal(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLanguage}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Add Language
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}