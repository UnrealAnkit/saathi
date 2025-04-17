import React, { useState, useEffect } from 'react';
import { Camera, Github, Linkedin, Globe } from 'lucide-react';
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

  useEffect(() => {
    const checkUser = async () => {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.user) {
        console.log('User is authenticated:', session.user);
        checkAvatarsBucket();
        fetchProfileData();
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
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-32 relative">
          <div className="absolute -bottom-16 left-8">
            <div className="relative">
              <img
                src={profile?.avatar_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=120&h=120&fit=crop'}
                alt="Profile"
                className="w-32 h-32 rounded-full border-4 border-white object-cover"
              />
              <label className="absolute bottom-0 right-0 bg-gray-100 p-2 rounded-full hover:bg-gray-200 cursor-pointer">
                <Camera className="h-5 w-5 text-gray-600" />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={uploadAvatar}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="pt-20 px-4 sm:px-8 pb-8">
          {isEditing ? (
            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location || ''}
                  onChange={handleInputChange}
                  placeholder="City, Country"
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                <input
                  type="text"
                  name="timezone"
                  value={formData.timezone || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., GMT+5:30"
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub URL
                </label>
                <input
                  type="url"
                  name="github_url"
                  value={formData.github_url || ''}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  name="linkedin_url"
                  value={formData.linkedin_url || ''}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  name="website_url"
                  value={formData.website_url || ''}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProfile}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile?.full_name || 'Your Name'}
                </h1>
                <p className="text-gray-600">
                  {profile?.location || 'Add your location'} • {profile?.timezone || 'Add your timezone'}
                </p>
              </div>
              <button 
                onClick={() => setIsEditing(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 w-full sm:w-auto"
              >
                Edit Profile
              </button>
            </div>
          )}

          <div className="flex space-x-4 mb-8">
            {profile?.github_url && (
              <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
                <Github className="h-5 w-5" />
              </a>
            )}
            {profile?.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
                <Linkedin className="h-5 w-5" />
              </a>
            )}
            {profile?.website_url && (
              <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
                <Globe className="h-5 w-5" />
              </a>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                  >
                    {skill.name} • {skill.proficiency_level}
                  </span>
                ))}
              </div>
              
              <div className="space-y-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill..."
                  className="w-full border rounded-md px-3 py-2"
                />
                <div className="flex gap-2">
                  <select
                    value={newSkillLevel}
                    onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
                    className="flex-1 border rounded-md px-3 py-2"
                  >
                    {skillLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                  <button
                    onClick={addSkill}
                    className="bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200 whitespace-nowrap"
                  >
                    Add Skill
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Languages</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {languages.map((lang) => (
                  <span
                    key={lang.id}
                    className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                  >
                    {lang.language} • {lang.proficiency_level}
                  </span>
                ))}
              </div>
              
              <div className="space-y-2">
                <input
                  type="text"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  placeholder="Add a language..."
                  className="w-full border rounded-md px-3 py-2"
                />
                <div className="flex gap-2">
                  <select
                    value={newLanguageLevel}
                    onChange={(e) => setNewLanguageLevel(e.target.value as LanguageLevel)}
                    className="flex-1 border rounded-md px-3 py-2"
                  >
                    {languageLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                  <button
                    onClick={addLanguage}
                    className="bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200 whitespace-nowrap"
                  >
                    Add Language
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Hackathon Interests</h2>
              <div className="space-y-2 mb-4">
                {hackathonInterests.length === 0 ? (
                  <p className="text-gray-500 italic">You haven't added any hackathon interests yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {hackathonInterests.map((interest) => (
                      <div 
                        key={interest.id} 
                        className="bg-indigo-50 text-indigo-800 px-3 py-2 rounded-md text-sm flex items-center group"
                      >
                        <span>{interest.interest}</span>
                        <span className="mx-1">•</span>
                        <span className="text-indigo-600">{interest.format_preference}</span>
                        {interest.location_preference && (
                          <>
                            <span className="mx-1">•</span>
                            <span className="text-indigo-600">{interest.location_preference}</span>
                          </>
                        )}
                        <button
                          onClick={() => removeHackathonInterest(interest.id as string)}
                          className="ml-2 text-indigo-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <input
                  type="text"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Add a hackathon interest (e.g., AI/ML, Web3, Climate Tech)"
                  className="w-full border rounded-md px-3 py-2"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={newFormatPreference}
                    onChange={(e) => setNewFormatPreference(e.target.value as 'online' | 'in_person' | 'hybrid')}
                    className="flex-1 border rounded-md px-3 py-2"
                  >
                    <option value="online">Online</option>
                    <option value="in_person">In Person</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                  <input
                    type="text"
                    value={newLocationPreference}
                    onChange={(e) => setNewLocationPreference(e.target.value)}
                    placeholder="Location preference (if applicable)"
                    className="flex-1 border rounded-md px-3 py-2"
                  />
                  <button
                    onClick={addHackathonInterest}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 whitespace-nowrap"
                  >
                    Add Interest
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Hackathon Experience</h2>
              <div className="space-y-4">
                {/* This section could be enhanced to fetch and display hackathon participation */}
                <p className="text-gray-500 italic">You haven't participated in any hackathons yet.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}