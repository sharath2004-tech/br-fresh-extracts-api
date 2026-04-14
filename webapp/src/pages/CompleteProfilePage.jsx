// src/pages/CompleteProfilePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-hot-toast';

// Icons
const LocationIcon = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

const CompleteProfilePage = () => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const navigate = useNavigate();

  // --- 1. GET LIVE LOCATION ---
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setLocationLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        
        // --- 2. REVERSE GEOCODE (COORDS -> ADDRESS) ---
        try {
          // Using OpenStreetMap (Free)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          if (data && data.display_name) {
            setAddress(data.display_name); // Auto-fill the text box
            toast.success("Location detected!");
          }
        } catch (error) {
          console.error("Geocoding error:", error);
          toast.error("Got location, but couldn't find address name. Please type it.");
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error(error);
        toast.error("Unable to retrieve your location.");
        setLocationLoading(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // --- 3. SEND EVERYTHING TO BACKEND ---
      await api.put('/auth/profile/', {
        name: name,
        address: address,
        latitude: coords.lat,
        longitude: coords.lng
      });
      
      toast.success('Profile updated!');
      navigate('/');
    } catch (err) {
      toast.error('Failed to update profile. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">Complete Your Profile</h2>
        <p className="text-center text-sm text-gray-600 mb-6">We need your location for fast delivery.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Address Section */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Delivery Address</label>
            
            {/* Detect Location Button */}
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={locationLoading}
              className="mt-2 mb-3 w-full flex items-center justify-center px-4 py-2 border border-green-600 text-green-600 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors"
            >
              {locationLoading ? 'Detecting...' : (
                <>
                  <LocationIcon /> Use Current Location
                </>
              )}
            </button>

            {/* Address Text Area */}
            <textarea
              id="address"
              rows="3"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              placeholder="Or type your address manually..."
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
            {coords.lat && (
              <p className="text-xs text-gray-500 mt-1">
                GPS: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3.5 rounded-xl text-lg font-semibold shadow-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-gray-400"
          >
            {loading ? 'Saving...' : 'Save and Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfilePage;