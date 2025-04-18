import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Calendar, Users, MapPin, Clock, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CreateHackathonModal from '../components/CreateHackathonModal';
import BackgroundEffect from '../components/BackgroundEffect';

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <BackgroundEffect />
      {/* Hero Section with Animation */}
      <motion.div 
        className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 mb-12 text-white shadow-lg overflow-hidden relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Background animation */}
        <motion.div 
          className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full"
          animate={{ 
            x: [0, 10, 0], 
            y: [0, 15, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 8,
            ease: "easeInOut" 
          }}
          style={{ filter: "blur(40px)" }}
        />
        
        <div className="max-w-3xl relative z-10">
          <motion.h1 
            className="text-4xl font-bold mb-4"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Find Your Perfect Hackathon Teammates
          </motion.h1>
          <motion.p 
            className="text-xl mb-6"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Connect with developers, designers, and innovators who share your passion for building amazing projects.
          </motion.p>
          <motion.div 
            className="flex flex-wrap gap-4"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Link 
              to="/find-teammates" 
              className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors transform hover:scale-105 transition duration-200"
            >
              Find Teammates
            </Link>
            {user ? (
              <motion.button
                onClick={() => setShowModal(true)}
                className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-400 transition-colors transform hover:scale-105 transition duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Add Hackathon
              </motion.button>
            ) : (
              <Link 
                to="/auth" 
                className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-400 transition-colors transform hover:scale-105 transition duration-200"
              >
                Sign Up / Login
              </Link>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Upcoming Hackathons Section */}
      <div className="mb-12">
        <motion.div 
          className="flex justify-between items-center mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold">Upcoming Hackathons</h2>
          <Link to="/hackathons" className="text-indigo-600 hover:text-indigo-800">
            View All
          </Link>
        </motion.div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <motion.div 
              className="rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        ) : upcomingHackathons.length === 0 ? (
          <motion.div 
            className="text-center py-12 bg-gray-50 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-gray-600 mb-4">No upcoming hackathons found</p>
            {user && (
              <motion.button
                onClick={() => setShowModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Add a Hackathon
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {upcomingHackathons.map((hackathon, index) => (
              <motion.div 
                key={hackathon.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                variants={itemVariants}
                whileHover={{ y: -5 }}
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
                      <motion.a 
                        href={hackathon.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-gray-700"
                        whileHover={{ rotate: 15 }}
                      >
                        <ExternalLink className="h-5 w-5" />
                      </motion.a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* How It Works Section */}
      <motion.div 
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
            className="bg-white p-6 rounded-lg shadow-md text-center"
            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          >
            <motion.div 
              className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              whileHover={{ scale: 1.1, backgroundColor: "#c7d2fe" }}
            >
              <Users className="h-8 w-8 text-indigo-600" />
            </motion.div>
            <h3 className="text-xl font-semibold mb-2">Create Your Profile</h3>
            <p className="text-gray-600">
              Showcase your skills, languages, and hackathon interests to stand out to potential teammates.
            </p>
          </motion.div>
          
          <motion.div 
            className="bg-white p-6 rounded-lg shadow-md text-center"
            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          >
            <motion.div 
              className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              whileHover={{ scale: 1.1, backgroundColor: "#c7d2fe" }}
            >
              <Calendar className="h-8 w-8 text-indigo-600" />
            </motion.div>
            <h3 className="text-xl font-semibold mb-2">Find Hackathons</h3>
            <p className="text-gray-600">
              Discover upcoming hackathons that match your interests, whether online or in-person.
            </p>
          </motion.div>
          
          <motion.div 
            className="bg-white p-6 rounded-lg shadow-md text-center"
            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          >
            <motion.div 
              className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              whileHover={{ scale: 1.1, backgroundColor: "#c7d2fe" }}
            >
              <Clock className="h-8 w-8 text-indigo-600" />
            </motion.div>
            <h3 className="text-xl font-semibold mb-2">Connect & Collaborate</h3>
            <p className="text-gray-600">
              Message potential teammates, form your dream team, and start building amazing projects together.
            </p>
          </motion.div>
        </div>
      </motion.div>

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