import React, { useEffect, useState } from 'react';
import { Plus, Calendar, MapPin, Users } from 'lucide-react';
import { supabase, type Hackathon } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import CreateHackathonModal from '../components/CreateHackathonModal';
import { Link } from 'react-router-dom';

interface Hackathon {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  format: 'online' | 'in_person' | 'hybrid';
  website: string | null;
  image_url: string | null;
  created_by: string;
  max_team_size?: number;
}

export default function Hackathons() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadHackathons();
  }, []);

  async function loadHackathons() {
    try {
      const { data, error } = await supabase
        .from('hackathons')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;
      setHackathons(data || []);
    } catch (error) {
      toast.error('Failed to load hackathons');
      console.error('Error loading hackathons:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-600">Loading hackathons...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hackathons</h1>
        {user && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
          >
            Create Hackathon
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hackathons.map((hackathon) => (
          <div
            key={hackathon.id}
            className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {hackathon.image_url && (
              <div className="h-48 overflow-hidden">
                <img 
                  src={hackathon.image_url} 
                  alt={hackathon.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Image failed to load:', hackathon.image_url);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <div className="p-6">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium
                  ${hackathon.format === 'online' ? 'bg-green-900 text-green-300' :
                    hackathon.format === 'in_person' ? 'bg-blue-900 text-blue-300' :
                    'bg-purple-900 text-purple-300'}`}
                >
                  {hackathon.format.replace('_', ' ')}
                </span>
              </div>

              <h3 className="text-xl font-semibold mb-2 text-white">{hackathon.name}</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    {new Date(hackathon.start_date).toLocaleDateString()} - {new Date(hackathon.end_date).toLocaleDateString()}
                  </span>
                </div>
                
                {hackathon.location && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{hackathon.location}</span>
                  </div>
                )}

                {hackathon.max_team_size && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Max team size: {hackathon.max_team_size}</span>
                  </div>
                )}
              </div>

              <p className="text-gray-400 mb-4 line-clamp-2">
                {hackathon.description}
              </p>

              <Link
                to={`/hackathons/${hackathon.id}`}
                className="block w-full bg-purple-700 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-colors text-center"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      {hackathons.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hackathons found</h3>
          <p className="text-gray-600">Check back later for upcoming events!</p>
        </div>
      )}

      {showCreateModal && (
        <CreateHackathonModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadHackathons();
          }}
        />
      )}
    </div>
  );
}