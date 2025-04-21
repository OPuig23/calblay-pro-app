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

    // Determine timeMin/timeMax
    let timeMin, timeMax;
    if (mode === 'day' && start) {
      const d0 = new Date(start);
      d0.setHours(0,0,0,0);
      const d1 = new Date(d0);
      d1.setDate(d1.getDate()+1);
      timeMin = d0.toISOString();
      timeMax = d1.toISOString();
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

    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?${params.toString()}`
      );
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

      {/* ———————————————————————————————————————————————— */}
      {/* 1) Landing (pas de cerca): logo gran i centrat */}
      {/* ———————————————————————————————————————————————— */}
      {step === 'search' && (
        <div className="w-full max-w-4xl flex flex-col items-center gap-6">
          <Logo className="w-48 sm:w-64 md:w-72 h-auto select-none" />
          <SearchForm onSearch={handleSearch} initial={lastQuery} />
        </div>
      )}

      {/* ———————————————————————————————————————————————— */}
      {/* 2) Llista / Detall: logo petit fixat + SearchBar compacte */}
      {/* ———————————————————————————————————————————————— */}
      {step !== 'search' && (
        <>
          <Logo
            className="fixed top-4 left-4 w-8 sm:w-12 md:w-16 h-auto select-none"
          />
          <div className="w-full max-w-4xl flex justify-center">
            <SearchBar onSearch={handleSearch} initial={lastQuery} />
          </div>
        </>
      )}

      {/* ———————————————————————————————————————————————— */}
      {/* 3) Resultats o Detall */}
      {/* ———————————————————————————————————————————————— */}
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
