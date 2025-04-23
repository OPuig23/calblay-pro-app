// src/components/DetailView.js
import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';
import Papa from 'papaparse';
import LoginPage from './LoginPage';
import IncidentForm from './IncidentForm';
import PersonalTab from './PersonalTab';

// CSV URLs
const PERSONAL_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQcEtnI6uRkch6n6E6tyJij1i6nFkkZp73MCmcqbCN6uXvOo9uzwN5MB39zJVp6Jh0iF2nz8cOx0y9A/pub?gid=798164058&single=true&output=csv';
const INCIDENCIES_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRB7sx4Vf9sVTSUreFJJKrHxAEY7pIxeKZA5X2drgPASOzehXLSxIjoqng-SaJ5rg/pub?gid=2008639616&single=true&output=csv';

export default function DetailView({ event, onBack, token, setToken }) {
  const [tab, setTab] = useState(null);
  const [personalData, setPersonalData] = useState([]);
  const [incData, setIncData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddingIncident, setIsAddingIncident] = useState(false);
  const [newIncidents, setNewIncidents] = useState([]);

  // Helpers
  const normalize = useCallback(s => s?.toString().toLowerCase().trim() || '', []);
  const isMatch = useCallback((a,b) => normalize(a).slice(0,10) === normalize(b).slice(0,10), [normalize]);
  const formatHours = useCallback(str => {
    const m = (str||'').match(/(\d{1,2}):(\d{2})/);
    if (m) return `${m[1]}:${m[2]}h`;
    const num = parseFloat((str||'').replace(',', '.')) || 0;
    const h = Math.floor(num);
    const mm = Math.round((num - h) * 60);
    return `${h}:${mm.toString().padStart(2,'0')}h`;
  }, []);

  // Load CSV data on relevant tab
  useEffect(() => {
    if (!event || !['personal','incidencies'].includes(tab)) return;
    setLoading(true);
    Promise.all([
      fetch(PERSONAL_CSV_URL).then(r=>r.text()).then(txt=>Papa.parse(txt,{header:true,complete:({data})=>setPersonalData(data)})),
      fetch(INCIDENCIES_CSV_URL).then(r=>r.text()).then(txt=>Papa.parse(txt,{header:true,complete:({data})=>setIncData(data)}))
    ]).finally(()=>setLoading(false));
  }, [tab, event]);

  // Incident handlers
  const handleAddIncident = inc => setNewIncidents(prev=>[...prev,inc]);
  const handleSendEmail = () => {
    if (!newIncidents.length) return;
    const subject = `Incidències - ${event.name}`;
    let body = `Incidències per a l'esdeveniment: ${event.name}%0D%0A` +
               `Data: ${event.date}%0D%0A` +
               `Finca: ${event.finca || ''}%0D%0A%0D%0A`;
    newIncidents.forEach((inc,idx)=>{
      body += `${idx+1}. Dept: ${inc.department}, Imp: ${inc.importance}, Desc: ${inc.description}%0D%0A`;
    });
    window.location.href =
      `mailto:sonia@calblay.com?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;
  };

  const tabsDef = [
    {id:'docs', label:'📜 Full encàrrec', color:'#EF5350'},
    {id:'personal', label:'🧍 Personal', color:'#AB47BC'},
    {id:'incidencies', label:'⚠️ Incidències', color:'#5C6BC0'},
    {id:'fitxes', label:'🗂️ Fitxes tècniques', color:'#29B6F6'},
    {id:'pressupost', label:'💶 Pressupost', color:'#66BB6A'},
    {id:'contracte', label:'✍️ Contracte', color:'#FFCA28'}
  ];

  if (!event) return null;

  // New Incident Screen
  if (isAddingIncident) {
    return (
      <div className="min-h-screen bg-green-50 p-4">
        <button onClick={()=>setIsAddingIncident(false)} className="flex items-center text-blue-600 mb-4">
          <ArrowLeft className="mr-1"/>Tornar
        </button>
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-2xl font-bold">Nova Incidència</h2>
          <p className="mt-2 text-sm">Esdeveniment: <strong>{event.name}</strong></p>
          <p className="text-sm">Data: {event.date}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <IncidentForm onSubmit={handleAddIncident} onCancel={()=>setIsAddingIncident(false)}/>
          {newIncidents.length>0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Incidències afegides</h3>
              {newIncidents.map((inc,i)=>(
                <div key={i} className="border rounded p-3 mb-3">
                  <p><strong>Dept:</strong> {inc.department}</p>
                  <p><strong>Imp:</strong> {inc.importance}</p>
                  <p><strong>Desc:</strong> {inc.description}</p>
                </div>
              ))}
              <button onClick={handleSendEmail} className="w-full py-3 bg-indigo-600 text-white rounded-lg">
                Enviar incidències per mail
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Budget/Contract guard
  if ((tab==='pressupost'||tab==='contracte') && !token) {
    return <LoginPage onLogin={tok=>{localStorage.setItem('token',tok);setToken(tok);}} onCancel={()=>setTab(null)}/>;
  }

  // Tab content renderer
  const renderTabContent = () => {
    if (loading) return <p className="text-center py-4">Carregant...</p>;
    switch(tab) {
      case 'docs':
        return event.attachments.filter(a=>a.title.toLowerCase().startsWith('full enc')).map((a,i)=><a key={i} href={a.fileUrl} className="underline block mb-2">{a.title}</a>);
      case 'personal':
        return <PersonalTab eventName={event.name} personalData={personalData}/>;
      case 'incidencies': {
        const incs = incData.filter(r=>isMatch(r['Nom Esdeveniment']||r['Nom esdeveniment'],event.name)).map(r=>(r['Incidència']||r['Incidencia']||'').trim()).filter(Boolean);
        return incs.length?incs.map((i,k)=><p key={k}>⚠️ {i}</p>):<p className="text-center">No hi ha incidències.</p>;
      }
      case 'fitxes':
        return event.attachments.filter(a=>!a.title.toLowerCase().startsWith('full enc')).map((a,i)=><a key={i} href={a.fileUrl} className="underline block mb-2">{a.title}</a>);
      default:
        return null;
    }
  };

  // Main menu
  if (tab===null) {
    return (
      <div className="min-h-screen bg-green-50 p-4">
        <button onClick={onBack} className="text-blue-600 mb-4"><ArrowLeft/></button>
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-2xl font-bold">{event.name}</h2>
          <div className="mt-2 text-sm flex items-center space-x-4">
            <span>📅 {event.date}</span>
            {event.location && (<a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-indigo-600"><MapPin className="mr-1"/>{event.location}</a>)}
          </div>
        </div>
        <button onClick={()=>setIsAddingIncident(true)} className="w-full py-3 mb-4 bg-orange-500 text-white font-semibold rounded-xl shadow">+ Incidència</button>
        {tabsDef.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} className="w-full py-3 mb-3 rounded-xl text-white font-semibold shadow" style={{backgroundColor:t.color}}>{t.label}</button>))}
      </div>
    );
  }

  // Selected tab content
  return (
    <div className="min-h-screen bg-green-50 p-4">
      <button onClick={()=>setTab(null)} className="text-blue-600 mb-4 flex items-center"><ArrowLeft className="mr-1"/>Menú</button>
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-2xl font-bold">{event.name}</h2>
        <div className="mt-2 text-sm flex items-center space-x-4">
          <span>📅 {event.date}</span>
          {event.location && (<a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-indigo-600"><MapPin className="mr-1"/>{event.location}</a>)}
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">{renderTabContent()}</div>
    </div>
  );
}
