import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Calendar, Users, MapPin, Clock, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CreateHackathonModal from '../components/CreateHackathonModal';
import BackgroundEffect from '../components/BackgroundEffect';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import NeonText from '../components/NeonText';
import CyberCard from '../components/CyberCard';

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
        className="relative bg-gray-900 rounded-xl p-8 mb-12 text-white shadow-lg overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Static background gradient instead of animated div */}
        <div 
          className="absolute top-0 right-0 w-96 h-96 bg-purple-500 opacity-10 rounded-full"
          style={{ filter: "blur(40px)" }}
        />
        
        <div className="max-w-3xl relative z-10">
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl font-bold text-purple-500 mb-4">
              Find Your Perfect Hackathon Teammates
            </h1>
          </motion.div>
          
          <motion.p 
            className="text-xl mb-6 text-gray-300"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Connect with skilled developers, designers, and innovators to build amazing projects together.
          </motion.p>
          
          <motion.div 
            className="flex flex-wrap gap-4"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {user ? (
              <>
                <GradientButton 
                  to="/find-teammates" 
                  size="lg"
                >
                  Find Teammates
                </GradientButton>
                <GradientButton 
                  variant="blue" 
                  onClick={() => setShowModal(true)} 
                  size="lg"
                >
                  Create Hackathon
                </GradientButton>
              </>
            ) : (
              <GradientButton 
                to="/auth" 
                size="lg"
              >
                Get Started
              </GradientButton>
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
            {upcomingHackathons.map((hackathon) => (
              <motion.div 
                key={hackathon.id} 
                variants={itemVariants}
                whileHover={{ y: -5 }}
              >
                <CyberCard glitch>
                  <div 
                    className="h-48 bg-cover bg-center rounded-t-md" 
                    style={{ 
                      backgroundImage: hackathon.image_url 
                        ? `url(${hackathon.image_url})` 
                        : 'url(https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80)'
                    }}
                  ></div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 text-white">{hackathon.name}</h3>
                    <p className="text-gray-400 mb-4 line-clamp-2">{hackathon.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-300">
                        <Calendar className="h-4 w-4 mr-2 text-purple-400" />
                        <span>{formatDate(hackathon.start_date)} - {formatDate(hackathon.end_date)}</span>
                      </div>
                      <div className="flex items-center text-gray-300">
                        <MapPin className="h-4 w-4 mr-2 text-purple-400" />
                        <span>{hackathon.format === 'online' ? 'Online' : hackathon.location}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <GradientButton
                        to={`/hackathons/${hackathon.id}`}
                        size="sm"
                        variant="purple"
                      >
                        View Details
                      </GradientButton>
                      
                      {hackathon.website_url && (
                        <motion.a 
                          href={hackathon.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-purple-400 transition-colors"
                          whileHover={{ rotate: 15 }}
                        >
                          <ExternalLink className="h-5 w-5" />
                        </motion.a>
                      )}
                    </div>
                  </div>
                </CyberCard>
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
        <h2 className="text-2xl font-bold mb-6 text-center text-purple-500">
          How It Works
        </h2>
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