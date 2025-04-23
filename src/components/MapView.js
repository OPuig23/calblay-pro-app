// src/components/MapView.js
import React, { useState } from 'react';
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useLoadScript
} from '@react-google-maps/api';
import { ArrowLeft } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '100%'
};

// Center of Catalonia as default
const defaultCenter = { lat: 41.5, lng: 1.9 };

export default function MapView({ events, onSelect, onBack }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY
  });
  const [activeEvent, setActiveEvent] = useState(null);

  if (loadError) return <p>Error carregant mapa</p>;
  if (!isLoaded) return <p>Carregant mapa…</p>;

  return (
    <div className="relative w-full h-full">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-10 p-2 bg-white rounded-full shadow"
      >
        <ArrowLeft size={20} />
      </button>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={events.length ? {
          lat: events[0].lat || defaultCenter.lat,
          lng: events[0].lng || defaultCenter.lng
        } : defaultCenter}
        zoom={8}
      >
        {events.map(evt => (
          <Marker
            key={evt.id}
            position={{ lat: evt.lat, lng: evt.lng }}
            onClick={() => setActiveEvent(evt)}
          />
        ))}

        {activeEvent && (
          <InfoWindow
            position={{ lat: activeEvent.lat, lng: activeEvent.lng }}
            onCloseClick={() => setActiveEvent(null)}
          >
            <div className="p-2">
              <h4 className="font-bold mb-1">{activeEvent.name}</h4>
              <p className="text-sm mb-2">📅 {activeEvent.date}</p>
              <button
                onClick={() => onSelect(activeEvent)}
                className="px-3 py-1 bg-indigo-600 text-white rounded"
              >
                Veure detalls
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
