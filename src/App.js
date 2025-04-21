// src/App.js
import React, { useState } from 'react';

/* Components */
import Logo        from './components/Logo';
import SearchForm  from './components/SearchForm';
import SearchBar   from './components/SearchBar';
import ResultsList from './components/ResultsList';
import DetailView  from './components/DetailView';

export default function App() {
  const [events,        setEvents]        = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [step,          setStep]          = useState('search');  // 'search' | 'list' | 'detail'
  const [lastQuery,     setLastQuery]     = useState({});

  const API_KEY     = process.env.REACT_APP_GOOGLE_API_KEY;
  const CALENDAR_ID = process.env.REACT_APP_GOOGLE_CALENDAR_ID;

  const handleSearch = async ({ mode = 'range', start, end, name } = {}) => {
    const trimmedName = name?.trim() || '';
    if (!trimmedName && !start && !end && step !== 'search') {
      setEvents([]);
      setStep('search');
      return;
    }

    // Calcula timeMin/timeMax per a "day" o "range"
    let timeMin, timeMax;
    if (mode === 'day' && start) {
      const d = new Date(start);
      d.setHours(0, 0, 0, 0);
      timeMin = d.toISOString();
      d.setDate(d.getDate() + 1);
      timeMax = d.toISOString();
    } else {
      if (start) timeMin = new Date(start).toISOString();
      if (end)   timeMax = new Date(end).toISOString();
    }

    setLastQuery({ mode, start, end, name: trimmedName });
    setSelectedEvent(null);

    const params = new URLSearchParams({
      key: API_KEY,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '50',
      timeZone: 'Europe/Madrid'
    });
    if (trimmedName) params.set('q', trimmedName);
    if (timeMin)     params.set('timeMin', timeMin);
    if (timeMax)     params.set('timeMax', timeMax);

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?${params.toString()}`;
    console.log('Fetching events:', url);

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Google API error ${res.status}`);
      const { items } = await res.json();

      let normalized = items.map(item => ({
        id:          item.id,
        name:        item.summary || 'Sense títol',
        date:        (item.start?.dateTime || item.start?.date || '').split('T')[0],
        attachments: item.attachments || [],
        personal:    [],
        incidencies: [],
        fitxes:      [],
        docs:        {}
      }));

      if (mode === 'day' && start) {
        normalized = normalized.filter(evt => evt.date === start);
      }

      setEvents(normalized);
      setStep('list');
    } catch (err) {
      console.error('Error fetching events:', err);
      setEvents([]);
      setStep('list');
    }
  };

  const handleSelect = evt => {
    setSelectedEvent(evt);
    setStep('detail');
  };
  const handleBack = () => {
    setStep(step === 'detail' ? 'list' : 'search');
  };

  return (
    <div className="min-h-screen bg-green-100 flex flex-col items-center px-4 sm:px-6 py-6 gap-6">

      {/* Logo: més gran a landing, més petit després */}
      <Logo
        className={`fixed top-4 left-4 select-none transition-all
          ${step === 'search'
            ? 'w-32 sm:w-48 md:w-64 h-auto'
            : 'w-8 sm:w-16 md:w-24 h-auto'
          }`}
      />

      {/* Landing → SearchForm; Llista/Detail → SearchBar */}
      {step === 'search' ? (
        <div className="w-full max-w-4xl">
          <SearchForm onSearch={handleSearch} initial={lastQuery} />
        </div>
      ) : (
        <div className="w-full max-w-4xl flex justify-center">
          <SearchBar onSearch={handleSearch} initial={lastQuery} />
        </div>
      )}

      {/* Resultats o Detall */}
      {step === 'list' && (
        <ResultsList
          events={events}
          onSelect={handleSelect}
          onBack={handleBack}
        />
      )}
      {step === 'detail' && (
        <DetailView
          event={selectedEvent}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
