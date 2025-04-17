import React, { useEffect, useState } from 'react';
import { Plus, Calendar, MapPin, Users } from 'lucide-react';
import { supabase, type Hackathon } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import CreateHackathonModal from '../components/CreateHackathonModal';

export default function Hackathons() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Create Hackathon
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hackathons.map((hackathon) => (
          <div
            key={hackathon.id}
            className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium
                  ${hackathon.format === 'online' ? 'bg-green-100 text-green-800' :
                    hackathon.format === 'in_person' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'}`}
                >
                  {hackathon.format.replace('_', ' ')}
                </span>
              </div>

              <h3 className="text-xl font-semibold mb-2">{hackathon.title}</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    {new Date(hackathon.start_date).toLocaleDateString()} - {new Date(hackathon.end_date).toLocaleDateString()}
                  </span>
                </div>
                
                {hackathon.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{hackathon.location}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Max team size: {hackathon.max_team_size}</span>
                </div>
              </div>

              {hackathon.theme && (
                <div className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Theme:</span> {hackathon.theme}
                </div>
              )}

              <button
                onClick={() => {/* TODO: Implement join hackathon */}}
                className="w-full bg-indigo-50 text-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-100 transition-colors"
              >
                View Details
              </button>
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

      <CreateHackathonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadHackathons}
      />
    </div>
  );
}