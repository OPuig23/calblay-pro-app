// src/components/DetailView.js
import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';
import LoginPage from './LoginPage';

export default function DetailView({ event, onBack, token, setToken }) {
  const [tab, setTab] = useState(null);
  const [personalData, setPersonalData] = useState([]);
  const [incidenciesData, setIncidenciesData] = useState([]);
  const [contractFiles, setContractFiles] = useState([]);
  const [budgetFiles, setBudgetFiles] = useState([]);

  const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
  const CONTRACTS_FOLDER_ID = (process.env.REACT_APP_GOOGLE_DRIVE_CONTRACTS_FOLDER_ID || '')
    .match(/[-\w]{25,}/)?.[0] || '';
  const BUDGETS_FOLDER_ID = (process.env.REACT_APP_GOOGLE_DRIVE_BUDGETS_FOLDER_ID || '')
    .match(/[-\w]{25,}/)?.[0] || '';

  const PERSONAL_CSV_URL =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQcEtnI6uRkch6n6E6tyJij1i6nFkkZp73MCmcqbCN6uXvOo9uzwN5MB39zJVp6Jh0iF2nz8cOx0y9A/pub?gid=798164058&single=true&output=csv';
  const INCIDENCIES_CSV_URL =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRB7sx4Vf9sVTSUreFJJKrHxAEY7pIxeKZA5X2drgPASOzehXLSxIjoqng-SaJ5rg/pub?gid=2008639616&single=true&output=csv';

  const normalize = str =>
    str?.toString().toLowerCase().trim().replace(/\s+/g, ' ') || '';
  const isMatch = (a, b) =>
    normalize(a).slice(0, 10) === normalize(b).slice(0, 10);

  // Load CSVs on event change
  useEffect(() => {
    if (!event) return;

    fetch(PERSONAL_CSV_URL)
      .then(res => res.text())
      .then(txt => {
        // parse Personal CSV via read
        const wb = XLSX.read(txt, { type: 'string' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        setPersonalData(XLSX.utils.sheet_to_json(ws));
      })
      .catch(console.error);

    fetch(INCIDENCIES_CSV_URL)
      .then(res => res.text())
      .then(txt => {
        // parse Incidencies CSV via read
        const wb = XLSX.read(txt, { type: 'string' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        setIncidenciesData(XLSX.utils.sheet_to_json(ws));
      })
      .catch(console.error);
  }, [event]);

  // Fetch protected files
  useEffect(() => {
    if (tab === 'contracte' && token) {
      const q = `'${CONTRACTS_FOLDER_ID}' in parents and trashed = false`;
      const url =
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
          q
        )}&fields=files(id,name,webViewLink)&key=${API_KEY}`;
      fetch(url)
        .then(r => r.json())
        .then(d =>
          setContractFiles(
            (d.files || []).filter(f => isMatch(f.name, event.name))
          )
        )
        .catch(() => setContractFiles([]));
    }
  }, [tab, token, event.name, API_KEY, CONTRACTS_FOLDER_ID]);

  useEffect(() => {
    if (tab === 'pressupost' && token) {
      const q = `'${BUDGETS_FOLDER_ID}' in parents and trashed = false`;
      const url =
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
          q
        )}&fields=files(id,name,webViewLink)&key=${API_KEY}`;
      fetch(url)
        .then(r => r.json())
        .then(d =>
          setBudgetFiles(
            (d.files || []).filter(f => isMatch(f.name, event.name))
          )
        )
        .catch(() => setBudgetFiles([]));
    }
  }, [tab, token, event.name, API_KEY, BUDGETS_FOLDER_ID]);

  if (!event) return null;

  if ((tab === 'contracte' || tab === 'pressupost') && !token) {
    return (
      <LoginPage
        onLogin={tok => {
          localStorage.setItem('token', tok);
          setToken(tok);
        }}
        onCancel={() => setTab(null)}
      />
    );
  }

  const tabs = [
    { id: 'docs', label: '📜 Full encàrrec' },
    { id: 'personal', label: '🧍 Personal' },
    { id: 'incidencies', label: '⚠️ Incidències' },
    { id: 'fitxes', label: '🗂️ Fitxes tècniques' },
    { id: 'pressupost', label: '💶 Pressupost' },
    { id: 'contracte', label: '✍️ Contracte' }
  ];

  const renderContent = () => {
    if (tab === 'docs') {
      return event.attachments
        .filter(a => a.title.toLowerCase().startsWith('full enc'))
        .map((a, i) => (
          <a key={i} href={a.fileUrl} className="block my-2 underline">
            {a.title}
          </a>
        ));
    }
    if (tab === 'personal') {
      const matched = personalData.filter(r =>
        isMatch(r['Nom Esdeveniment'], event.name)
      );
      if (!matched.length) return <p>No hi ha personal assignat.</p>;
      const grouped = matched.reduce((acc, r) => {
        const dept = r.Departament || 'Altres';
        acc[dept] = acc[dept] || [];
        acc[dept].push(r);
        return acc;
      }, {});
      return Object.entries(grouped).map(([dept, mem], gi) => (
        <div key={gi} className="mb-4">
          <h3 className="px-3 py-2 bg-indigo-100 rounded-lg text-indigo-700 font-semibold">
            {dept} ({mem.length})
          </h3>
          {mem.map((p, i) => {
            const [h, m] = p['Total hores']
              ?.replace('m.h', '')
              .trim()
              .split(':') || ['0', '0'];
            return (
              <div key={i} className="p-3 bg-white rounded-lg shadow my-2">
                <strong>
                  {p.Nom}{' '}
                  {p.Responsable?.toLowerCase().startsWith('s') ? '🎓' : ''}
                </strong>
                <br />
                ⏰ {p['Hora entrada']?.slice(0, 5) || '--'} →{' '}
                {p['Hora de sortida']?.slice(0, 5) || '--'} — ⏱️ {`${h}:${m}h`}{' '}
                {p['Carnet de conduir']?.toLowerCase().startsWith('s')
                  ? '🚚'
                  : ''}
              </div>
            );
          })}
        </div>
      ));
    }
    if (tab === 'incidencies') {
      const matched = incidenciesData
        .filter(
          r =>
            isMatch(r['Nom Esdeveniment'] || r['Nom esdeveniment'], event.name)
        )
        .map(r => (r['Incidència'] || r['Incidencia'] || '').trim())
        .filter(Boolean);
      return matched.length 
        ? matched.map((txt, i) => <p key={i}>⚠️ {txt}</p>)
        : <p>No hi ha incidències.</p>;
    }
    if (tab === 'fitxes') {
      return event.attachments
        .filter(a => !a.title.toLowerCase().startsWith('full enc'))
        .map((a, i) => (
          <a key={i} href={a.fileUrl} className="block my-2 underline">
            {a.title}
          </a>
        ));
    }
    if (tab === 'pressupost') {
      return budgetFiles.map((f, i) => (
        <a key={i} href={f.webViewLink} className="block my-2 underline">
          {f.name}
        </a>
      ));
    }
    if (tab === 'contracte') {
      return contractFiles.map((f, i) => (
        <a key={i} href={f.webViewLink} className="block my-2 underline">
          {f.name}
        </a>
      ));
    }
    return <p className="italic">Selecciona una pestanya.</p>;
  };

  // Menu screen
  if (tab === null) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-purple-200 to-pink-200 flex flex-col items-center space-y-6">
        <button
          onClick={onBack}
          className="self-start flex items-center text-blue-700 font-bold hover:underline"
        >
          <ArrowLeft className="w-5 h-5 mr-1" /> Tornar
        </button>
        <div className="text-center bg-white p-4 rounded-lg shadow w-full max-w-md">
          <h1 className="text-3xl font-extrabold text-indigo-700 mb-2">
            {event.name}
          </h1>
          <p>
            📅 {event.date}{' '}
            {event.location ? `— 📍 ${event.location}` : ''}
          </p>
          {event.pax > 0 && <p className="mt-1">👥 {event.pax} pax</p>}
        </div>
        <div className="w-full max-w-md space-y-4">
          {tabs.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="w-full py-4 rounded-2xl text-xl font-bold text-white shadow transform transition"
              style={{
                background: ['#EF5350', '#AB47BC', '#5C6BC0', '#29B6F6', '#66BB6A', '#FFCA28'][idx]
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Content screen
  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-green-100 to-teal-200">
      <button
        onClick={() => setTab(null)}
        className="mb-4 flex items-center text-blue-700 font-bold hover:underline"
      >
        <ArrowLeft className="w-5 h-5 mr-1" /> Menú
      </button>
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-2xl font-bold text-indigo-600 mb-1">
          {tabs.find(x => x.id === tab)?.label}
        </h2>
        <p className="text-lg font-semibold">{event.name}</p>
        <p className="text-sm">
          📅 {event.date}{' '}
          {event.location ? `— 📍 ${event.location}` : ''}
        </p>
        {event.pax > 0 && <p className="mt-1">👥 {event.pax} pax</p>}
      </div>
      <div className="bg-white p-6 rounded-lg shadow max-w-3xl mx-auto">
        {renderContent()}
      </div>
    </div>
  );
}
