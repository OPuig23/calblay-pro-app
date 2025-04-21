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
    // Si buits i ja no som a landing, tornem a landing
    if (!trimmedName && !start && !end && step !== 'search') {
      setEvents([]);
      setStep('search');
      return;
    }

    // Definir timeMin/timeMax segons mode
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

      {/* Landing view: logo + form centered */}
      {step === 'search' && (
        <header className="flex flex-col items-center gap-8 w-full max-w-4xl">
          <Logo className="w-64 h-auto select-none" />
          <SearchForm onSearch={handleSearch} initial={lastQuery} />
        </header>
      )}

      {/* List/detail view: fixed small logo + compact bar */}
      {step !== 'search' && (
        <>
          <Logo className="fixed top-4 left-4 select-none w-8 h-auto transition-all" />
          <div className="w-full max-w-4xl flex justify-center">
            <SearchBar onSearch={handleSearch} initial={lastQuery} />
          </div>
        </>
      )}

      {/* Results list or detail */}
      {step === 'list' && (
        <ResultsList events={events} onSelect={handleSelect} onBack={handleBack} />
      )}
      {step === 'detail' && (
        <DetailView event={selectedEvent} onBack={handleBack} />
      )}

    </div>
  );
}
