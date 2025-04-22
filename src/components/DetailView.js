// src/components/DetailView.js
import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';
import LoginPage from './LoginPage';

export default function DetailView({ event, onBack, token, setToken }) {
  const [tab, setTab] = useState('docs');
  const [personalData, setPersonalData] = useState([]);
  const [incidenciesData, setIncidenciesData] = useState([]);
  const [contractFiles, setContractFiles] = useState([]);
  const [budgetFiles, setBudgetFiles] = useState([]);

  const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
  const CONTRACTS_FOLDER_ID = (process.env.REACT_APP_GOOGLE_DRIVE_CONTRACTS_FOLDER_ID || '').match(/[-\w]{25,}/)?.[0] || '';
  const BUDGETS_FOLDER_ID   = (process.env.REACT_APP_GOOGLE_DRIVE_BUDGETS_FOLDER_ID   || '').match(/[-\w]{25,}/)?.[0] || '';

  const PERSONAL_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQcEtnI6uRkch6n6E6tyJij1i6nFkkZp73MCmcqbCN6uXvOo9uzwN5MB39zJVp6Jh0iF2nz8cOx0y9A/pub?gid=798164058&single=true&output=csv';
  const INCIDENCIES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRB7sx4Vf9sVTSUreFJJKrHxAEY7pIxeKZA5X2drgPASOzehXLSxIjoqng-SaJ5rg/pub?gid=2008639616&single=true&output=csv';

  const normalize = str => str?.toString().toLowerCase().trim().replace(/\s+/g, ' ') || '';
  const isMatch = (a, b) => normalize(a).slice(0, 10) === normalize(b).slice(0, 10);

  useEffect(() => {
    if (!event) return;

    fetch(PERSONAL_CSV_URL)
      .then(res => res.text())
      .then(text => {
        const wb = XLSX.read(text, { type: 'string' });
        setPersonalData(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
      })
      .catch(console.error);

    fetch(INCIDENCIES_CSV_URL)
      .then(res => res.text())
      .then(text => {
        const wb = XLSX.read(text, { type: 'string' });
        setIncidenciesData(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
      })
      .catch(console.error);
  }, [event]);

  useEffect(() => {
    if (tab === 'contracte' && token && event?.name && API_KEY && CONTRACTS_FOLDER_ID) {
      const q = `'${CONTRACTS_FOLDER_ID}' in parents and trashed = false`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink)&key=${API_KEY}`;
      fetch(url)
        .then(r => r.json())
        .then(data => setContractFiles(data.files?.filter(f => isMatch(f.name, event.name)) || []))
        .catch(() => setContractFiles([]));
    }
  }, [tab, event, token, API_KEY, CONTRACTS_FOLDER_ID]);

  useEffect(() => {
    if (tab === 'pressupost' && token && event?.name && API_KEY && BUDGETS_FOLDER_ID) {
      const q = `'${BUDGETS_FOLDER_ID}' in parents and trashed = false`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink)&key=${API_KEY}`;
      fetch(url)
        .then(r => r.json())
        .then(data => setBudgetFiles(data.files?.filter(f => isMatch(f.name, event.name)) || []))
        .catch(() => setBudgetFiles([]));
    }
  }, [tab, event, token, API_KEY, BUDGETS_FOLDER_ID]);

  if (!event) return null;

  if ((tab === 'contracte' || tab === 'pressupost') && !token) {
    return (
      <LoginPage
        onLogin={tok => { localStorage.setItem('token', tok); setToken(tok); }}
        onCancel={() => setTab('docs')}
      />
    );
  }

  const colors = ['bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-purple-100', 'bg-pink-100', 'bg-red-100'];
  const matchedPersonal = personalData
    .filter(r => isMatch(r['Nom Esdeveniment'], event.name))
    .reduce((acc, row) => {
      const dept = row.Departament || 'Altres';
      acc[dept] = acc[dept] || [];
      acc[dept].push(row);
      return acc;
    }, {});

  const matchedIncidencies = incidenciesData
    .filter(r => isMatch(r['Nom Esdeveniment'] || r['Nom esdeveniment'], event.name))
    .map(r => (r['Incidència'] || r['Incidencia'] || '').toString().trim())
    .filter(Boolean);

  const fullEncs = event.attachments.filter(a => a.title.toLowerCase().startsWith('full enc'));
  const otherAtts = event.attachments.filter(a => !a.title.toLowerCase().startsWith('full enc'));

  const tabs = [
    { id: 'docs',     label: '📄 Full encàrrec',   items: fullEncs.map(a => ({ text: a.title, link: a.fileUrl })) },
    { id: 'personal', label: '🧍 Personal',        items: Object.entries(matchedPersonal).flatMap(([dept, members], i) => [
      { header: true, text: `${dept} (${members.length})`, color: colors[i % colors.length] },
      ...members.map(p => {
        const entrada = p['Hora entrada']?.slice(0, 5) || '--';
        const sortida = p['Hora de sortida']?.slice(0, 5) || '--';
        const total = p['Total hores']?.replace('m.h', '').trim();
        return {
          text: `${p.Nom}${p.Responsable?.toLowerCase().startsWith('s') ? ' 🎓' : ''} — 🕒 ${entrada} → 🕔 ${sortida} — ⏱️ ${total}h${p['Carnet de conduir']?.toLowerCase().startsWith('s') ? ' 🚚' : ''}`,
          isResponsible: p.Responsable?.toLowerCase().startsWith('s')
        };
      })
    ]) },
    { id: 'incidencies',label:'⚠️ Incidències',     items: matchedIncidencies.map(txt => ({ text: txt })) },
    { id: 'fitxes',    label: '🗂️ Fitxes tècniques', items: otherAtts.map(a => ({ text: a.title, link: a.fileUrl })) },
    { id: 'pressupost',label: '💶 Pressupost',      items: budgetFiles.map(f => ({ text: f.name, link: f.webViewLink })) },
    { id: 'contracte', label: '✍️ Contracte',       items: contractFiles.map(f => ({ text: f.name, link: f.webViewLink })) }
  ];

  return (
    <div className="space-y-6 max-w-md mx-auto p-4">
      <button onClick={onBack} className="flex items-center text-sm text-blue-700">
        <ArrowLeft className="w-5 h-5 mr-2" /> Tornar
      </button>

      <div className="bg-yellow-50 rounded-2xl p-4 text-center">
        <h2 className="text-xl font-bold">{event.name}</h2>
        <p>📅 {event.date}</p>
        {event.location && <p>📍 {event.location}</p>}
        {event.pax > 0 && <p>👥 {event.pax} pax</p>}
      </div>

      <div className="flex flex-col space-y-3">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              `flex items-center justify-center gap-2 py-3 rounded-2xl text-lg font-bold transform transition ` +
              (tab === t.id
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white scale-105 shadow-lg'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
        {(tabs.find(x => x.id === tab)?.items || []).length ? (
          tabs.find(x => x.id === tab).items.map((it, i) => (
            <div key={i} className={`p-2 rounded-lg ${it.header ? it.color : 'bg-white shadow'}`}> 
              {it.link ? (
                <a href={it.link} target="_blank" rel="noreferrer" className="underline">
                  {it.text}
                </a>
              ) : (
                <span>{it.text}</span>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 italic">Selecciona una pestanya</p>
        )}
      </div>
    </div>
  );
}
