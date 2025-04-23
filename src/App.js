// src/App.js
import React, { useState } from 'react';
import Papa from 'papaparse';

/* Components */
import Logo from './components/Logo';
import SearchForm from './components/SearchForm';
import SearchBar from './components/SearchBar';
import ResponsibleSearchForm from './components/ResponsibleSearchForm';
import ResultsList from './components/ResultsList';
import DetailView from './components/DetailView';

// CSV URL for personal data
const PERSONAL_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQcEtnI6uRkch6n6E6tyJij1i6nFkkZp73MCmcqbCN6uXvOo9uzwN5MB39zJVp6Jh0iF2nz8cOx0y9A/pub?gid=798164058&single=true&output=csv';

export default function App() {
  const [step, setStep] = useState('search'); // 'search' | 'list' | 'detail'
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [lastQuery, setLastQuery] = useState({});

  const API_KEY     = process.env.REACT_APP_GOOGLE_API_KEY;
  const CALENDAR_ID = process.env.REACT_APP_GOOGLE_CALENDAR_ID;

  // Search by date/name
  const handleSearch = async ({ mode = 'range', start, end, name } = {}) => {
    if (!start && !end && !name) {
      setEvents([]);
      setStep('search');
      return;
    }
    const params = new URLSearchParams({
      key: API_KEY,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '50',
      timeZone: 'Europe/Madrid',
    });
    if (name) params.set('q', name.trim());
    if (mode === 'day' && start) {
      const d0 = new Date(start);
      d0.setHours(0,0,0,0);
      const d1 = new Date(d0);
      d1.setDate(d1.getDate()+1);
      params.set('timeMin', d0.toISOString());
      params.set('timeMax', d1.toISOString());
    } else {
      if (start) params.set('timeMin', new Date(start).toISOString());
      if (end)   params.set('timeMax', new Date(end).toISOString());
    }
    setLastQuery({ mode, start, end, name });
    setStep('list');

    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
          CALENDAR_ID
        )}/events?${params.toString()}`
      );
      if (!res.ok) throw new Error(`Google API error ${res.status}`);
      const { items } = await res.json();
      setEvents(items.map(item => ({
        id: item.id,
        name: item.summary || 'Sense títol',
        date: (item.start?.dateTime || item.start?.date || '').split('T')[0],
        attachments: item.attachments || [],
        location: item.location || '',
        pax: item.attendees?.length || 0,
      })));
    } catch (err) {
      console.error(err);
      setEvents([]);
    }
  };

  // Search by responsible
  const handleResponsibleSearch = async resp => {
    if (!resp) return;
    try {
      const csvRes = await fetch(PERSONAL_CSV_URL);
      const csvTxt = await csvRes.text();
      const { data } = Papa.parse(csvTxt, { header: true });
      const matches = data.filter(
        r => r.Responsable?.toLowerCase()==='si' && r.Nom?.toLowerCase().startsWith(resp.toLowerCase())
      );
      const evtNames = [...new Set(matches.map(r=>r['Nom Esdeveniment']))];
      if (!evtNames.length) {
        alert('No s’ha trobat cap esdeveniment per aquest responsable');
        return;
      }
      let all=[];
      for(const name of evtNames){
        const p=new URLSearchParams({
          key:API_KEY,
          singleEvents:'true',
          orderBy:'startTime',
          maxResults:'50',
          timeZone:'Europe/Madrid',
          q:name,
        });
        const r=await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?${p.toString()}`
        );
        if(!r.ok) continue;
        const { items }=await r.json();
        all=all.concat(items.map(item=>({
          id:item.id,
          name:item.summary||'Sense títol',
          date:(item.start?.dateTime||item.start?.date||'').split('T')[0],
          attachments:item.attachments||[],
          location:item.location||'',
          pax:item.attendees?.length||0,
        })));
      }
      setLastQuery({responsible:resp});
      setEvents(all);
      setStep('list');
    }catch(e){
      console.error(e);
      alert('Error al cercar per responsable');
    }
  };

  const handleSelect = evt=>{
    setSelectedEvent(evt);
    setStep('detail');
  };
  const handleBack = ()=>{
    if(step==='detail'){
      setStep('list');
      setSelectedEvent(null);
    } else if(step==='list'){
      setStep('search');
      setEvents([]);
    }
  };

  return(
    <div className="min-h-screen bg-green-100 flex flex-col items-center px-4 py-6 gap-6">
      <Logo className="w-48 sm:w-64 h-auto select-none"/>

      {/* Show search bar only on results list */}
      {step==='list' && (
        <div className="w-full max-w-3xl">
          <SearchBar onSearch={handleSearch} initial={lastQuery}/>
        </div>
      )}

      {/* On search screen show both forms */}
      {step==='search' && (
        <>
          <div className="w-full max-w-2xl">
            <SearchForm onSearch={handleSearch} initial={lastQuery}/>
          </div>
          <div className="w-full max-w-2xl">
            <ResponsibleSearchForm onSearch={handleResponsibleSearch}/>
          </div>
        </>
      )}

      {/* Results list */}
      {step==='list' && (
        <ResultsList events={events} onSelect={handleSelect} onBack={handleBack}/>
      )}

      {/* Detail view */}
      {step==='detail' && selectedEvent && (
        <DetailView event={selectedEvent} onBack={handleBack} token={null} setToken={()=>{}}/>
      )}
    </div>
  );
}
