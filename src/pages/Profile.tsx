import React, { useState } from 'react';
import { Camera, Github, Linkedin, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const skillLevels = ['Beginner', 'Intermediate', 'Expert'] as const;
type SkillLevel = typeof skillLevels[number];

interface Skill {
  name: string;
  level: SkillLevel;
}

export default function Profile() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('Beginner');

  const addSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, { name: newSkill.trim(), level: newSkillLevel }]);
      setNewSkill('');
      setNewSkillLevel('Beginner');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-32 relative">
          <div className="absolute -bottom-16 left-8">
            <div className="relative">
              <img
                src={user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=120&h=120&fit=crop'}
                alt="Profile"
                className="w-32 h-32 rounded-full border-4 border-white object-cover"
              />
              <button className="absolute bottom-0 right-0 bg-gray-100 p-2 rounded-full hover:bg-gray-200">
                <Camera className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-20 px-8 pb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user?.user_metadata?.full_name || 'Your Name'}
              </h1>
              <p className="text-gray-600">New Delhi, India • GMT+5:30</p>
            </div>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
              Edit Profile
            </button>
          </div>

          <div className="flex space-x-4 mb-8">
            <a href="#" className="text-gray-600 hover:text-gray-900">
              <Github className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900">
              <Globe className="h-5 w-5" />
            </a>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                  >
                    {skill.name} • {skill.level}
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
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                  English • Fluent
                </span>
                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                  Hindi • Native
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Hackathon Experience</h2>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium">Global Innovation Challenge 2023</h3>
                  <p className="text-gray-600 text-sm">1st Place • AI/ML Track</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium">HackForGood 2023</h3>
                  <p className="text-gray-600 text-sm">2nd Place • Web3 Track</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}