import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ExternalLink, Download, Loader } from 'lucide-react';

interface DevfolioHackathon {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  format: 'online' | 'in_person' | 'hybrid';
  website_url: string;
  image_url: string;
}

export default function DevfolioImport({ onImportComplete }: { onImportComplete: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hackathons, setHackathons] = useState<DevfolioHackathon[]>([]);
  const [selectedHackathons, setSelectedHackathons] = useState<string[]>([]);

  const fetchDevfolioHackathons = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would be an API call to your backend
      // which would then fetch data from Devfolio's API
      
      // For demo purposes, we'll simulate the API response
      const mockResponse = [
        {
          id: 'dev-1',
          name: 'Hack the Future 2023',
          description: 'A hackathon focused on AI and machine learning solutions for climate change.',
          start_date: '2023-11-15T00:00:00Z',
          end_date: '2023-11-17T00:00:00Z',
          location: 'San Francisco, CA',
          format: 'in_person',
          website_url: 'https://example.com/hackthefuture',
          image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80'
        },
        {
          id: 'dev-2',
          name: 'CodeJam 2023',
          description: 'Build innovative solutions for healthcare challenges in just 48 hours.',
          start_date: '2023-12-01T00:00:00Z',
          end_date: '2023-12-03T00:00:00Z',
          location: 'Online',
          format: 'online',
          website_url: 'https://example.com/codejam',
          image_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80'
        },
        {
          id: 'dev-3',
          name: 'Blockchain Build 2023',
          description: 'Create decentralized applications that solve real-world problems.',
          start_date: '2024-01-15T00:00:00Z',
          end_date: '2024-01-17T00:00:00Z',
          location: 'New York, NY',
          format: 'hybrid',
          website_url: 'https://example.com/blockchainbuild',
          image_url: 'https://images.unsplash.com/photo-1526378800651-c1a63d2b0ca1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80'
        }
      ] as DevfolioHackathon[];
      
      setHackathons(mockResponse);
    } catch (error) {
      console.error('Error fetching Devfolio hackathons:', error);
      toast.error('Failed to fetch hackathons from Devfolio');
    } finally {
      setLoading(false);
    }
  };

  const toggleHackathonSelection = (id: string) => {
    if (selectedHackathons.includes(id)) {
      setSelectedHackathons(selectedHackathons.filter(hackId => hackId !== id));
    } else {
      setSelectedHackathons([...selectedHackathons, id]);
    }
  };

  const importSelectedHackathons = async () => {
    if (!user) {
      toast.error('You must be logged in to import hackathons');
      return;
    }
    
    if (selectedHackathons.length === 0) {
      toast.error('Please select at least one hackathon to import');
      return;
    }
    
    setLoading(true);
    
    try {
      const hackathonsToImport = hackathons
        .filter(h => selectedHackathons.includes(h.id))
        .map(h => ({
          name: h.name,
          description: h.description,
          start_date: h.start_date,
          end_date: h.end_date,
          location: h.location,
          format: h.format,
          website_url: h.website_url,
          image_url: h.image_url,
          created_by: user.id
        }));
      
      const { data, error } = await supabase
        .from('hackathons')
        .insert(hackathonsToImport)
        .select();
      
      if (error) throw error;
      
      toast.success(`Successfully imported ${data.length} hackathons`);
      onImportComplete();
    } catch (error) {
      console.error('Error importing hackathons:', error);
      toast.error('Failed to import hackathons');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-white">Import from Devfolio</h2>
      
      {hackathons.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">Fetch hackathons from Devfolio to import them into your platform</p>
          <button
            onClick={fetchDevfolioHackathons}
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center mx-auto"
          >
            {loading ? (
              <Loader className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <ExternalLink className="h-5 w-5 mr-2" />
            )}
            Fetch Hackathons
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 mb-6">
            {hackathons.map(hackathon => (
              <motion.div
                key={hackathon.id}
                className={`border rounded-lg p-4 cursor-pointer ${
                  selectedHackathons.includes(hackathon.id)
                    ? 'border-purple-500 bg-purple-900 bg-opacity-20'
                    : 'border-gray-700 hover:border-purple-400'
                }`}
                onClick={() => toggleHackathonSelection(hackathon.id)}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={hackathon.image_url}
                      alt={hackathon.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/150?text=Hackathon';
                      }}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{hackathon.name}</h3>
                    <p className="text-sm text-gray-400 mb-1">
                      {new Date(hackathon.start_date).toLocaleDateString()} - {new Date(hackathon.end_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-400">{hackathon.location}</p>
                  </div>
                  
                  <div className="flex items-center h-full">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedHackathons.includes(hackathon.id)
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-500'
                    }`}>
                      {selectedHackathons.includes(hackathon.id) && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={() => setHackathons([])}
              className="text-gray-400 hover:text-gray-300"
            >
              Cancel
            </button>
            
            <button
              onClick={importSelectedHackathons}
              disabled={loading || selectedHackathons.length === 0}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <Loader className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Download className="h-5 w-5 mr-2" />
              )}
              Import {selectedHackathons.length} Hackathon{selectedHackathons.length !== 1 ? 's' : ''}
            </button>
          </div>
        </>
      )}
    </div>
  );
} 