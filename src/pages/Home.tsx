import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, Users, MapPin, Clock, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CreateHackathonModal from '../components/CreateHackathonModal';

interface Hackathon {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  format: 'online' | 'in_person' | 'hybrid';
  website_url: string;
  image_url: string;
  created_by: string;
}

export default function Home() {
  const { user } = useAuth();
  const [upcomingHackathons, setUpcomingHackathons] = useState<Hackathon[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingHackathons();
  }, []);

  const fetchUpcomingHackathons = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('hackathons')
        .select('*')
        .gte('end_date', today)
        .order('start_date', { ascending: true })
        .limit(6);
        
      if (error) throw error;
      
      setUpcomingHackathons(data || []);
    } catch (error) {
      console.error('Error fetching hackathons:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 mb-12 text-white shadow-lg">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">Find Your Perfect Hackathon Teammates</h1>
          <p className="text-xl mb-6">
            Connect with developers, designers, and innovators who share your passion for building amazing projects.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link 
              to="/find-teammates" 
              className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Find Teammates
            </Link>
            {user ? (
              <button
                onClick={() => setShowModal(true)}
                className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-400 transition-colors"
              >
                Add Hackathon
              </button>
            ) : (
              <Link 
                to="/auth" 
                className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-400 transition-colors"
              >
                Sign Up / Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Hackathons Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Upcoming Hackathons</h2>
          <Link to="/hackathons" className="text-indigo-600 hover:text-indigo-800">
            View All
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : upcomingHackathons.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No upcoming hackathons found</p>
            {user && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Add a Hackathon
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingHackathons.map((hackathon) => (
              <div 
                key={hackathon.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div 
                  className="h-48 bg-cover bg-center" 
                  style={{ 
                    backgroundImage: hackathon.image_url 
                      ? `url(${hackathon.image_url})` 
                      : 'url(https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80)'
                  }}
                ></div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-gray-900">{hackathon.name}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{hackathon.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-700">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{formatDate(hackathon.start_date)} - {formatDate(hackathon.end_date)}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{hackathon.format === 'online' ? 'Online' : hackathon.location}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Link
                      to={`/hackathons/${hackathon.id}`}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      View Details
                    </Link>
                    {hackathon.website_url && (
                      <a 
                        href={hackathon.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How It Works Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Create Your Profile</h3>
            <p className="text-gray-600">
              Showcase your skills, languages, and hackathon interests to stand out to potential teammates.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Find Hackathons</h3>
            <p className="text-gray-600">
              Discover upcoming hackathons that match your interests, whether online or in-person.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Connect & Collaborate</h3>
            <p className="text-gray-600">
              Message potential teammates, form your dream team, and start building amazing projects together.
            </p>
          </div>
        </div>
      </div>

      {showModal && (
        <CreateHackathonModal 
          onClose={() => setShowModal(false)} 
          onSuccess={() => {
            setShowModal(false);
            fetchUpcomingHackathons();
          }}
        />
      )}
    </div>
  );
}