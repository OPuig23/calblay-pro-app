// src/components/DetailView.js
import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';
import Papa from 'papaparse';
import LoginPage from './LoginPage';

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

  const normalize = useCallback(
    s => s?.toString().toLowerCase().trim() || '',
    []
  );
  const isMatch = useCallback(
    (a, b) => normalize(a).slice(0, 10) === normalize(b).slice(0, 10),
    [normalize]
  );

  const formatHours = useCallback(str => {
    const m = (str || '').match(/(\d{1,2}):(\d{2})/);
    if (m) return `${m[1]}:${m[2]}h`;
    const num = parseFloat((str || '').replace(',', '.')) || 0;
    const h = Math.floor(num);
    const mm = Math.round((num - h) * 60);
    return `${h}:${mm.toString().padStart(2, '0')}h`;
  }, []);

  // load CSV when needed
  useEffect(() => {
    if (!event || !['personal', 'incidencies'].includes(tab)) return;
    setLoading(true);
    Promise.all([
      fetch(PERSONAL_CSV_URL)
        .then(r => r.text())
        .then(txt => Papa.parse(txt, { header: true, complete: ({ data }) => setPersonalData(data) })),
      fetch(INCIDENCIES_CSV_URL)
        .then(r => r.text())
        .then(txt => Papa.parse(txt, { header: true, complete: ({ data }) => setIncData(data) })),
    ]).finally(() => setLoading(false));
  }, [tab, event]);

  const tabsDef = [
    { id: 'docs', label: '📜 Full encàrrec', color: '#EF5350' },
    { id: 'personal', label: '🧍 Personal', color: '#AB47BC' },
    { id: 'incidencies', label: '⚠️ Incidències', color: '#5C6BC0' },
    { id: 'fitxes', label: '🗂️ Fitxes tècniques', color: '#29B6F6' },
    { id: 'pressupost', label: '💶 Pressupost', color: '#66BB6A' },
    { id: 'contracte', label: '✍️ Contracte', color: '#FFCA28' },
  ];

  if (!event) return null;

  // if drive needed, handle login...
  if ((tab === 'pressupost' || tab === 'contracte') && !token) {
    return (
      <LoginPage
        onLogin={tok => { localStorage.setItem('token', tok); setToken(tok); }}
        onCancel={() => setTab(null)}
      />
    );
  }

  // render content for a tab (full screen)
  const renderTabContent = () => {
    if (loading) return <p className="text-center py-4">Carregant...</p>;
    switch (tab) {
      case 'docs':
        return event.attachments
          .filter(a => a.title.toLowerCase().startsWith('full enc'))
          .map((a, i) => <a key={i} href={a.fileUrl} className="underline block mb-2">{a.title}</a>);
      case 'personal': {
        const byDept = personalData
          .filter(r => isMatch(r['Nom Esdeveniment'], event.name))
          .reduce((acc, row) => { const d = row.Departament || 'Altres'; (acc[d] = acc[d]||[]).push(row); return acc; }, {});
        const colors = ['bg-red-50','bg-green-50','bg-blue-50','bg-yellow-50','bg-purple-50','bg-pink-50'];
        return Object.entries(byDept).map(([d, members], idx) => (
          <div key={d} className={`${colors[idx%colors.length]} p-4 rounded mb-4`}>
            <h4 className="font-semibold text-lg mb-2">{d} ({members.length})</h4>
            {members.map((p,j)=><div key={j} className="bg-white p-3 rounded shadow mb-2">
              <strong>{p.Nom}{p.Responsable?.toLowerCase().startsWith('s') && ' 🎓'}</strong><br />
              🕒 {p['Hora entrada']?.slice(0,5)||'--'} → {p['Hora de sortida']?.slice(0,5)||'--'} — ⏱️ {formatHours(p['Total hores'])}{p['Carnet de conduir']?.toLowerCase().startsWith('s') && ' 🚚'}
            </div>)}
          </div>
        ));
      }
      case 'incidencies':
        const incs = incData
          .filter(r => isMatch(r['Nom Esdeveniment']||r['Nom esdeveniment'], event.name))
          .map(r => (r['Incidència']||r['Incidencia']||'').trim())
          .filter(Boolean);
        return incs.length
          ? incs.map((i,k)=><p key={k}>⚠️ {i}</p>)
          : <p className="text-center">No hi ha incidències.</p>;
      case 'fitxes':
        return event.attachments
          .filter(a => !a.title.toLowerCase().startsWith('full enc'))
          .map((a,i)=><a key={i} href={a.fileUrl} className="underline block mb-2">{a.title}</a>);
      // case 'pressupost', 'contracte' omitted for brevity
      default:
        return null;
    }
  };

  // Detail screen: header + menu
  if (tab === null) {
    return (
      <div className="min-h-screen bg-green-50 p-4">
        <button onClick={onBack} className="text-blue-600 mb-4"><ArrowLeft /></button>
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-2xl font-bold">{event.name}</h2>
          <div className="mt-2 text-sm flex items-center space-x-4">
            <span>📅 {event.date}</span>
            {event.location && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-indigo-600"
              ><MapPin className="mr-1" />{event.location}</a>
            )}
          </div>
        </div>
        {tabsDef.map(t=> (
          <button
            key={t.id}
            onClick={()=>setTab(t.id)}
            className="w-full py-3 rounded-xl text-white font-semibold shadow mb-3"
            style={{ backgroundColor: t.color }}
          >{t.label}</button>
        ))}
      </div>
    );
  }

  // Content screen for selected tab
  return (
    <div className="min-h-screen bg-green-50 p-4">
      <button onClick={()=>setTab(null)} className="text-blue-600 mb-4 flex items-center"><ArrowLeft /><span className="ml-1">Menú</span></button>
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-2xl font-bold">{event.name}</h2>
        <div className="mt-2 text-sm flex items-center space-x-4">
          <span>📅 {event.date}</span>
          {event.location && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-indigo-600"
            ><MapPin className="mr-1" />{event.location}</a>
          )}
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        {renderTabContent()}
      </div>
    </div>
  );
}
