import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface CreateHackathonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateHackathonModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateHackathonModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    format: 'online',
    location: '',
    theme: '',
    max_team_size: 4,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to create a hackathon');
      }
      
      // Add the owner_id to the form data
      const hackathonData = {
        ...formData,
        owner_id: user.id
      };

      const { error } = await supabase.from('hackathons').insert([hackathonData]);
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      toast.success('Hackathon created successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Full error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create hackathon');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  function showCreateHackathonForm() {
    const form = document.getElementById('create-hackathon-form');
    if (form) {
      form.style.display = 'block';
    }
  }

  async function submitHackathon() {
    const titleElement = document.getElementById('title') as HTMLInputElement;
    const descriptionElement = document.getElementById('description') as HTMLTextAreaElement;
    const startDateElement = document.getElementById('start_date') as HTMLInputElement;
    const endDateElement = document.getElementById('end_date') as HTMLInputElement;
    const formatElement = document.getElementById('format') as HTMLSelectElement;
    const locationElement = document.getElementById('location') as HTMLInputElement;
    const themeElement = document.getElementById('theme') as HTMLInputElement;
    
    if (!titleElement || !descriptionElement || !startDateElement || 
        !endDateElement || !formatElement || !locationElement || !themeElement) {
      console.error('One or more form elements not found');
      return;
    }
    
    const hackathon = {
      title: titleElement.value,
      description: descriptionElement.value,
      start_date: startDateElement.value,
      end_date: endDateElement.value,
      format: formatElement.value,
      location: locationElement.value,
      theme: themeElement.value,
    };

    console.log('Submitting hackathon:', hackathon);

    try {
      const response = await fetch('/api/hackathons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hackathon),
      });

      if (response.ok) {
        alert('Hackathon created successfully!');
        location.reload();
      } else {
        const errorText = await response.text();
        console.error('Failed to create hackathon:', errorText);
        alert('Failed to create hackathon.');
      }
    } catch (error) {
      console.error('Error during submission:', error);
      alert('Failed to create hackathon.');
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Create Hackathon</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="datetime-local"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="datetime-local"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                required
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
                Format *
              </label>
              <select
                id="format"
                name="format"
                value={formData.format}
                onChange={handleChange}
                required
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="online">Online</option>
                <option value="in_person">In Person</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label htmlFor="max_team_size" className="block text-sm font-medium text-gray-700 mb-1">
                Max Team Size *
              </label>
              <input
                type="number"
                id="max_team_size"
                name="max_team_size"
                value={formData.max_team_size}
                onChange={handleChange}
                min="1"
                max="10"
                required
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder={formData.format === 'online' ? 'Virtual' : 'City, Country'}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">
              Theme
            </label>
            <input
              type="text"
              id="theme"
              name="theme"
              value={formData.theme}
              onChange={handleChange}
              placeholder="e.g., AI/ML, Web3, Climate Tech"
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Hackathon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}