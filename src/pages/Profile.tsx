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
  
  const [newSkill, setNewSkill] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('Beginner');
  const [newLanguage, setNewLanguage] = useState('');
  const [newLanguageLevel, setNewLanguageLevel] = useState<LanguageLevel>('Fluent');
  
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
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (profileError) throw profileError;
      
      // If profile doesn't exist, create one
      if (!profileData) {
        const newProfile = {
          id: user?.id,
          full_name: user?.user_metadata?.full_name || '',
          avatar_url: user?.user_metadata?.avatar_url || null,
        };
        
        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();
          
        if (createError) throw createError;
        setProfile(createdProfile);
        setFormData({
          full_name: createdProfile.full_name || '',
          location: createdProfile.location || '',
          timezone: createdProfile.timezone || '',
          github_url: createdProfile.github_url || '',
          linkedin_url: createdProfile.linkedin_url || '',
          website_url: createdProfile.website_url || '',
        });
      } else {
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || '',
          location: profileData.location || '',
          timezone: profileData.timezone || '',
          github_url: profileData.github_url || '',
          linkedin_url: profileData.linkedin_url || '',
          website_url: profileData.website_url || '',
        });
      }
      
      // Fetch skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('*')
        .eq('profile_id', user?.id);
        
      if (skillsError) throw skillsError;
      setSkills(skillsData || []);
      
      // Fetch languages
      const { data: languagesData, error: languagesError } = await supabase
        .from('languages')
        .select('*')
        .eq('profile_id', user?.id);
        
      if (languagesError) throw languagesError;
      setLanguages(languagesData || []);
      
    } catch (error) {
      console.error('Error fetching profile data:', error);
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

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${user?.id}.${fileExt}`;
    
    try {
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      // Update the profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user?.id);
        
      if (updateError) throw updateError;
      
      setProfile(prev => prev ? { ...prev, avatar_url: data.publicUrl } : null);
      toast.success('Avatar updated');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading profile...</div>;
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

        <div className="pt-20 px-8 pb-8">
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
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile?.full_name || 'Your Name'}
                </h1>
                <p className="text-gray-600">
                  {profile?.location || 'Add your location'} • {profile?.timezone || 'Add your timezone'}
                </p>
              </div>
              <button 
                onClick={() => setIsEditing(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
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
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill..."
                  className="flex-1 border rounded-md px-3 py-2"
                />
                <select
                  value={newSkillLevel}
                  onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
                  className="border rounded-md px-3 py-2"
                >
                  {skillLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                <button
                  onClick={addSkill}
                  className="bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200"
                >
                  Add
                </button>
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
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  placeholder="Add a language..."
                  className="flex-1 border rounded-md px-3 py-2"
                />
                <select
                  value={newLanguageLevel}
                  onChange={(e) => setNewLanguageLevel(e.target.value as LanguageLevel)}
                  className="border rounded-md px-3 py-2"
                >
                  {languageLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                <button
                  onClick={addLanguage}
                  className="bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200"
                >
                  Add
                </button>
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