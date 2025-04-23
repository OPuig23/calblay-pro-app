// src/components/DetailView.js
import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import Papa from 'papaparse';
import LoginPage from './LoginPage';

// URLs for CSV data
const PERSONAL_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQcEtnI6uRkch6n6E6tyJij1i6nFkkZp73MCmcqbCN6uXvOo9uzwN5MB39zJVp6Jh0iF2nz8cOx0y9A/pub?gid=798164058&single=true&output=csv';
const INCIDENCIES_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRB7sx4Vf9sVTSUreFJJKrHxAEY7pIxeKZA5X2drgPASOzehXLSxIjoqng-SaJ5rg/pub?gid=2008639616&single=true&output=csv';

// Fetch Drive files
function useDriveFiles(folderId, apiKey, token, eventName, active) {
  const [files, setFiles] = useState([]);
  const normalize = useCallback(
    str => str?.toLowerCase().trim().replace(/\s+/g, ' ') || '',
    []
  );
  const isMatch = useCallback(
    (a, b) => normalize(a).slice(0, 10) === normalize(b).slice(0, 10),
    [normalize]
  );

  useEffect(() => {
    if (!active || !token) return setFiles([]);
    const q = `'${folderId}' in parents and trashed=false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      q
    )}&fields=files(id,name,webViewLink)&key=${apiKey}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setFiles((d.files || []).filter(f => isMatch(f.name, eventName))))
      .catch(() => setFiles([]));
  }, [folderId, apiKey, token, eventName, isMatch, active]);

  return files;
}

// Header with back arrow and event info
function EventHeader({ event, onBack }) {
  return (
    <div className="relative bg-white p-4 rounded-lg shadow w-full max-w-md mb-4">
      <button
        onClick={onBack}
        className="absolute top-2 left-2 p-2 rounded-full bg-gray-100 shadow"
      >
        <ArrowLeft size={20} />
      </button>
      <h2 className="pl-10 text-xl font-bold mb-1">{event.name}</h2>
      <p className="pl-10 text-sm">
        📅 {event.date}{event.location && ` — 📍 ${event.location}`}
      </p>
      {event.pax > 0 && <p className="pl-10 text-sm">👥 {event.pax} pax</p>}
    </div>
  );
}

export default function DetailView({ event, onBack, token, setToken }) {
  const [tab, setTab] = useState(null);
  const [personalData, setPersonalData] = useState([]);
  const [incData, setIncData] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
  const CONTRACTS_ID = process.env.REACT_APP_GOOGLE_DRIVE_CONTRACTS_FOLDER_ID;
  const BUDGETS_ID = process.env.REACT_APP_GOOGLE_DRIVE_BUDGETS_FOLDER_ID;

  const formatHours = useCallback(
    s => {
      const m = (s || '').match(/(\d{1,2}):(\d{2})/);
      if (m) return `${m[1]}:${m[2]}h`;
      const num = parseFloat((s || '').replace(',', '.')) || 0;
      const h = Math.floor(num);
      const mm = Math.round((num - h) * 60);
      return `${h}:${mm.toString().padStart(2, '0')}h`;
    },
    []
  );

  const normalize = useCallback(x => (x || '').toLowerCase().trim(), []);
  const matchName = useCallback((a, b) => normalize(a).slice(0, 10) === normalize(b).slice(0, 10), [normalize]);

  // Load CSVs on personal/incidencies select
  useEffect(() => {
    if (!['personal', 'incidencies'].includes(tab)) return;
    setLoading(true);
    Promise.all([
      fetch(PERSONAL_CSV_URL).then(r => r.text()).then(txt =>
        Papa.parse(txt, { header: true, complete: ({ data }) => setPersonalData(data) })
      ),
      fetch(INCIDENCIES_CSV_URL).then(r => r.text()).then(txt =>
        Papa.parse(txt, { header: true, complete: ({ data }) => setIncData(data) })
      ),
    ]).finally(() => setLoading(false));
  }, [tab]);

  const contractFiles = useDriveFiles(CONTRACTS_ID, API_KEY, token, event.name, tab === 'contracte');
  const budgetFiles = useDriveFiles(BUDGETS_ID, API_KEY, token, event.name, tab === 'pressupost');

  const tabs = [
    { id: 'docs', label: '📜 Full encàrrec' },
    { id: 'personal', label: '🧍 Personal' },
    { id: 'incidencies', label: '⚠️ Incidències' },
    { id: 'fitxes', label: '🗂️ Fitxes tècniques' },
    { id: 'pressupost', label: '💶 Pressupost' },
    { id: 'contracte', label: '✍️ Contracte' },
  ];

  if ((tab === 'contracte' || tab === 'pressupost') && !token) {
    return <LoginPage onLogin={tok => setToken(tok)} onCancel={() => setTab(null)} />;
  }

  // Menu screen
  if (tab === null) {
    return (
      <div className="flex flex-col items-center bg-purple-200 p-4 min-h-screen w-full">
        <EventHeader event={event} onBack={onBack} />
        <div className="w-full max-w-md">
          {tabs.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="w-full py-3 mb-2 text-white font-bold rounded-xl shadow"
              style={{ backgroundColor: ['#EF5350','#AB47BC','#5C6BC0','#29B6F6','#66BB6A','#FFCA28'][i] }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Tab content screen
  const content = () => {
    if (loading) return <p>Carregant…</p>;
    switch (tab) {
      case 'docs':
        return event.attachments.filter(a => a.title.toLowerCase().startsWith('full enc')).map((a,i) => <a key={i} href={a.fileUrl}>{a.title}</a>);
      case 'personal': {
        const grp = personalData.filter(r => matchName(r['Nom Esdeveniment'], event.name))
          .reduce((a,r) => ((a[r.Departament||'Altres']||=[]).push(r), a), {});
        const cols = ['bg-red-50','bg-green-50','bg-blue-50','bg-yellow-50','bg-purple-50','bg-pink-50'];
        return Object.entries(grp).map(([d,ms], idx) => (
          <div key={d} className={`${cols[idx%cols.length]} p-4 rounded mb-4`}>
            <h4 className="font-semibold text-lg mb-2">{d} ({ms.length})</h4>
            {ms.map((p,j)=>(
              <div key={j} className="bg-white p-2 rounded mb-2">
                <strong>{p.Nom}{p.Responsable?.toLowerCase().startsWith('s') && ' 🎓'}</strong>
                <div>🕒 {p['Hora entrada']?.slice(0,5)} → {p['Hora de sortida']?.slice(0,5)} — ⏱️ {formatHours(p['Total hores'])}{p['Carnet de conduir']?.toLowerCase().startsWith('s') && ' 🚚'}</div>
              </div>
            ))}
          </div>
        ));
      }
      case 'incidencies':
        return incData.filter(r => matchName(r['Nom Esdeveniment']||r['Nom esdeveniment'], event.name)).map((r,i)=><p key={i}>⚠️ {(r['Incidència']||r['Incidencia'])}</p>);
      case 'fitxes':
        return event.attachments.filter(a=>!a.title.toLowerCase().startsWith('full enc')).map((a,i)=><a key={i} href={a.fileUrl}>{a.title}</a>);
      case 'pressupost':
        return budgetFiles.map((f,i)=><a key={i} href={f.webViewLink}>{f.name}</a>);
      case 'contracte':
        return contractFiles.map((f,i)=><a key={i} href={f.webViewLink}>{f.name}</a>);
      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-4 min-h-screen w-full flex flex-col items-center">
      <EventHeader event={event} onBack={()=>setTab(null)} />
      <div className="w-full max-w-md space-y-2">{content()}</div>
    </div>
  );
}
