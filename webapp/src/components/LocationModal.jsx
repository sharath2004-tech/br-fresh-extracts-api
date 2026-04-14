// src/components/LocationModal.jsx
import React, { useState } from 'react';
import LocationPicker from './LocationPicker'; // Import

const LocationModal = ({ isOpen, onClose, onDetectLocation, onManualSubmit, loading }) => {
  const [showMap, setShowMap] = useState(false); // Toggle state

  // Wrapper to handle map confirmation
  const handleMapConfirm = (lat, lng) => {
    // Call the manual submit function, but we might need to update logic
    // to accept coords. For now, let's just detect address from coords.
    // The parent logic needs to handle "coords only" updates.
    // For simplicity in this step, we will pass coords to a new prop or existing one.
    // See Step 5 below for the logic update.
    onDetectLocation({ coords: { latitude: lat, longitude: lng } }); 
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Select Location</h2>
            <button onClick={onClose}>✕</button>
        </div>

        {!showMap ? (
            <div className="space-y-4">
                <button onClick={onDetectLocation} className="w-full bg-green-600 text-white py-3 rounded-xl">
                    {loading ? 'Detecting...' : 'Use Current Location (GPS)'}
                </button>
                <div className="text-center text-gray-400">- OR -</div>
                <button onClick={() => setShowMap(true)} className="w-full border border-gray-300 py-3 rounded-xl hover:bg-gray-50">
                    Pick on Map
                </button>
            </div>
        ) : (
            // Show the Map
            <div>
                <LocationPicker onConfirm={(lat, lng) => {
                    // Create a fake "position" object to reuse your existing logic
                    const fakePosition = { coords: { latitude: lat, longitude: lng } };
                    // We need to pass this to a handler in StorePage
                    // For now, let's assume onDetectLocation can handle an argument
                    onDetectLocation(fakePosition); 
                }} />
                <button onClick={() => setShowMap(false)} className="mt-2 text-sm text-gray-500 w-full">Back</button>
            </div>
        )}
      </div>
    </div>
  );
};
export default LocationModal;