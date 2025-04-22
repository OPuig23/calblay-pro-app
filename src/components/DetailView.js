// src/components/DetailView.js
import React, { useEffect, useState } from 'react';
import { ArrowLeft, LogOut, Clock4, LogIn, Truck, GraduationCap } from 'lucide-react';
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
    if (tab === 'personal') {
      fetch(PERSONAL_CSV_URL)
        .then(res => res.text())
        .then(text => {
          const wb = XLSX.read(text, { type: 'string' });
          setPersonalData(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
        })
        .catch(console.error);
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 'contracte' && token && event?.name && API_KEY && CONTRACTS_FOLDER_ID) {
      const q = `'${CONTRACTS_FOLDER_ID}' in parents and trashed = false`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink)&key=${API_KEY}`;
      fetch(url)
        .then(r => r.json())
        .then(data => setContractFiles(data.files?.filter(f => isMatch(f.name, event.name)) || []))
        .catch(() => setContractFiles([]));
    }
  }, [tab, event, API_KEY, CONTRACTS_FOLDER_ID, token]);

  useEffect(() => {
    if (tab === 'pressupost' && token && event?.name && API_KEY && BUDGETS_FOLDER_ID) {
      const q = `'${BUDGETS_FOLDER_ID}' in parents and trashed = false`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink)&key=${API_KEY}`;
      fetch(url)
        .then(r => r.json())
        .then(data => setBudgetFiles(data.files?.filter(f => isMatch(f.name, event.name)) || []))
        .catch(() => setBudgetFiles([]));
    }
  }, [tab, event, API_KEY, BUDGETS_FOLDER_ID, token]);

  if (!event) return null;

  if ((tab === 'contracte' || tab === 'pressupost') && !token) {
    return <LoginPage onLogin={(tok) => {
      localStorage.setItem('token', tok);
      setToken(tok);
    }} onCancel={() => setTab('docs')} />;
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
  const otherAtts = event.attachments.filter(a => !a.title.toLowerCase().startsWith('full enc') && !a.title.toLowerCase().startsWith('personal'));

  const tabs = [
    { id: 'docs',       label: '📄 Full encàrrec',   items: fullEncs.map(a => ({ text: a.title, link: a.fileUrl })) },
    { id: 'personal',   label: '🧍 Personal',        items: Object.keys(matchedPersonal).length === 0 ? [{ text: 'No hi ha dades de personal per aquest esdeveniment.' }] : Object.entries(matchedPersonal).flatMap(([dept, members], i) => [
      { text: `${dept} (${members.length})`, color: colors[i % colors.length] },
      ...members.map(p => {
        const entrada = p['Hora entrada']?.slice(0, 5);
        const sortida = p['Hora de sortida']?.slice(0, 5);
        const horesTotals = p['Total hores']?.replace('m.h', '').trim();
        const formatted = horesTotals?.match(/(\d+):(\d+)/);
        const hores = formatted ? `${formatted[1]}:${formatted[2]}h` : horesTotals + 'h';
        const carnet = (p['Carnet de conduir'] || '').toLowerCase().startsWith('s');
        const isResponsible = p.Responsable?.toLowerCase().startsWith('s');
        const capIcon = isResponsible ? ' 🎓' : '';
        return {
          text: `${p.Nom}${capIcon} — 🕐 ${entrada || '—'} → 🕔 ${sortida || '—'} — ⏱️ ${hores}${carnet ? ' 🚚' : ''}`,
          isResponsible
        };
      })
    ]) },
    { id: 'pressupost', label: '💶 Pressupost',      items: budgetFiles.map(f => ({ text: f.name, link: f.webViewLink })) },
    { id: 'incidencies',label: '⚠️ Incidències',     items: matchedIncidencies.map(i => ({ text: `⚠️ ${i}` })) },
    { id: 'fitxes',     label: '🗂️ Fitxes tècniques', items: otherAtts.map(a => ({ text: a.title, link: a.fileUrl })) },
    { id: 'contracte',  label: '✍️ Contracte',       items: contractFiles.map(f => ({ text: f.name, link: f.webViewLink })) },
  ];

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-blue-600 flex items-center hover:underline">
        <ArrowLeft className="w-4 h-4 mr-1" /> Tornar
      </button>

      <div className="p-4 bg-yellow-50 rounded-lg space-y-1">
        <h2 className="text-2xl font-bold text-pink-600">{event.name}</h2>
        <p className="text-gray-700">📅 {event.date}</p>
        {event.pax && <p className="text-pink-500 font-semibold">👥 {event.pax} pax</p>}
        {event.location && <p className="text-gray-700">📍 {event.location}</p>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg font-semibold ${tab === t.id ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-800'}`}
          >{t.label}</button>
        ))}
      </div>

      <div className="p-4 bg-gray-50 rounded-lg space-y-2">
        {tabs.find(t => t.id === tab)?.items.length
          ? tabs.find(t => t.id === tab).items.map((node, idx) => (
            <div
              key={idx}
              className={`py-1 px-3 rounded ${node.isResponsible ? 'font-bold text-yellow-800' : ''} ${node.color || ''}`}
            >
              {node.link ? (
                <a href={node.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  {node.text}
                </a>
              ) : (
                <span>{node.text}</span>
              )}
            </div>
          ))
          : <p className="italic text-gray-500">No hi ha dades...</p>
        }
      </div>
    </div>
  );
}

