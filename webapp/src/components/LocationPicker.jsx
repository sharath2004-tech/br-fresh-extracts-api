// src/components/LocationPicker.jsx
import React, { useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

// Fix for missing default icon in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import L from 'leaflet';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// This component handles the click event on the map
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
}

const LocationPicker = ({ onConfirm }) => {
  // Default to center of India (or your city)
  const [position, setPosition] = useState({ lat: 20.5937, lng: 78.9629 }); 

  const handleLocationSelect = (latlng) => {
    setPosition(latlng);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="h-64 w-full mb-4 rounded-lg overflow-hidden border border-gray-300 relative z-0">
        <MapContainer 
          center={[position.lat, position.lng]} 
          zoom={5} 
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <Marker position={position} />
          <MapClickHandler onLocationSelect={handleLocationSelect} />
        </MapContainer>
      </div>
      
      <div className="text-xs text-gray-500 mb-2">
        Selected: {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
      </div>

      <button 
        onClick={() => onConfirm(position.lat, position.lng)}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
      >
        Confirm this Location
      </button>
    </div>
  );
};

export default LocationPicker;