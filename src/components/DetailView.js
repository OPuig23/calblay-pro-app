// src/components/DetailView.js
import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  FileText,
  Users,
  Euro,
  AlertTriangle,
  File,
  Edit3
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function DetailView({ event, onBack }) {
  // -------- State --------
  const [tab, setTab] = useState(null);
  const [personalData, setPersonalData] = useState([]);
  const [incidenciesData, setIncidenciesData] = useState([]);
  const [contractFiles, setContractFiles] = useState([]);
  const [contractError, setContractError] = useState(null);
  const [budgetFiles, setBudgetFiles]     = useState([]);
  const [budgetError, setBudgetError]     = useState(null);

  // -------- Config --------
  const API_KEY  = process.env.REACT_APP_GOOGLE_API_KEY;
  const rawContracts = process.env.REACT_APP_GOOGLE_DRIVE_CONTRACTS_FOLDER_ID || '';
  const rawBudgets   = process.env.REACT_APP_GOOGLE_DRIVE_BUDGETS_FOLDER_ID  || '';
  const DRIVE_CONTRACTS_FOLDER = rawContracts.match(/[-\w]{25,}/)?.[0] || rawContracts;
  const DRIVE_BUDGETS_FOLDER   = rawBudgets.match(/[-\w]{25,}/)?.[0]   || rawBudgets;

  const PERSONAL_CSV_URL =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQcEtnI6uRkch6n6E6tyJij1i6nFkkZp73MCmcqbCN6uXvOo9uzwN5MB39zJVp6Jh0iF2nz8cOx0y9A/pub?gid=798164058&single=true&output=csv';
  const INCIDENCIES_CSV_URL =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRB7sx4Vf9sVTSUreFJJKrHxAEY7pIxeKZA5X2drgPASOzehXLSxIjoqng-SaJ5rg/pub?gid=2008639616&single=true&output=csv';

  // -------- Effects --------
  useEffect(() => {
    if (!event) return;
    // load personal
    fetch(PERSONAL_CSV_URL)
      .then(res => res.text())
      .then(text => {
        const wb = XLSX.read(text, { type: 'string' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        setPersonalData(XLSX.utils.sheet_to_json(ws));
      })
      .catch(err => console.error('Error carregant personal:', err));
    // load incidencies
    fetch(INCIDENCIES_CSV_URL)
      .then(res => res.text())
      .then(text => {
        const wb = XLSX.read(text, { type: 'string' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        setIncidenciesData(XLSX.utils.sheet_to_json(ws));
      })
      .catch(err => console.error('Error carregant incidències:', err));
  }, [event]);

  // contract files
  useEffect(() => {
    if (tab !== 'contracte' || !event) return;
    const query = `'${DRIVE_CONTRACTS_FOLDER}' in parents and name contains '${event.name}' and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)&key=${API_KEY}`;
    fetch(url)
      .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
      .then(data => { setContractFiles(data.files||[]); setContractError(null); })
      .catch(err => { console.error(err); setContractError(err.message); });
  }, [tab, event, DRIVE_CONTRACTS_FOLDER, API_KEY]);

  // budget files
  useEffect(() => {
    if (tab !== 'pressupost' || !event) return;
    const query = `'${DRIVE_BUDGETS_FOLDER}' in parents and name contains '${event.name}' and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)&key=${API_KEY}`;
    fetch(url)
      .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
      .then(data => { setBudgetFiles(data.files||[]); setBudgetError(null); })
      .catch(err => { console.error(err); setBudgetError(err.message); });
  }, [tab, event, DRIVE_BUDGETS_FOLDER, API_KEY]);

  if (!event) return null;

  // -------- Helpers --------
  const normalize = s => s?.toString().toLowerCase().trim().replace(/\s+/g,' ')||'';
  const formatHour = t => t? t.slice(0,5):'';
  const renderList = items => (
    items?.length ? <ul className="space-y-2">{items.map((x,i)=><li key={i} className="bg-gray-100 rounded-xl shadow px-4 py-2">{x}</li>)}</ul>
    : <p className="text-gray-500 italic">No hi ha informació per a aquesta secció.</p>
  );

  // -------- Display --------
  const paxMatch = event.name.match(/(\d+)\s*pax/i);
  const paxCount = paxMatch? paxMatch[1]:'–';
  const nameParts = event.name.split(' - ');
  const location = nameParts[2]||'—';

  // personal grouping
  const groupedByDept = personalData
    .filter(r => normalize(r['Nom Esdeveniment']||r['Nom esdeveniment']).includes(normalize(event.name)))
    .reduce((acc,row)=>{ const dept=row.Departament||'Altres'; (acc[dept]=acc[dept]||[]).push(row); return acc; },{});

  // incidències filter
  const filteredIncidencies = incidenciesData
    .filter(r => normalize(r['Nom Esdeveniment']||r['Nom esdeveniment']).includes(normalize(event.name)))
    .map(r=>r['Incidència']?.toString().trim()).filter(Boolean);

  // attachments
  const fullEncs = event.attachments.filter(a=>a.title.toLowerCase().startsWith('full enc'));
  const personalAtts = event.attachments.filter(a=>a.title.toLowerCase().startsWith('personal'));
  const otherAtts = event.attachments.filter(a=>{
    const t=a.title.toLowerCase(); return !t.startsWith('full enc') && !t.startsWith('personal');
  });

  const menuItems = [
    {id:'docs',       title:'Full encàrrec',    icon:FileText,      bg:'bg-pink-500'},
    {id:'personal',   title:'Personal',         icon:Users,         bg:'bg-blue-500'},
    {id:'pressupost', title:'Pressupost',       icon:Euro,          bg:'bg-green-500'},
    {id:'incidencies',title:'Incidències',      icon:AlertTriangle, bg:'bg-orange-500'},
    {id:'fitxes',     title:'Fitxes tècniques', icon:File,          bg:'bg-purple-500'},
    {id:'contracte',  title:'Contracte',        icon:Edit3,         bg:'bg-teal-500'},
  ];

  const handleBack = () => tab? setTab(null): onBack();

  return (
    <div className="w-full max-w-4xl flex flex-col gap-6">
      <button onClick={handleBack} className="inline-flex items-center text-blue-600 hover:bg-blue-100 rounded-lg px-3 py-1">
        <ArrowLeft className="w-5 h-5 mr-2"/> Tornar
      </button>
      <div className="bg-white rounded-3xl shadow p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-2xl font-bold mb-1">{event.name}</h2>
          <p className="text-gray-600">{location} — {event.date}</p>
        </div>
        <span className="text-pink-500 font-bold text-xl mt-4 sm:mt-0">{paxCount} pax</span>
      </div>

      {tab===null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {menuItems.map(({id,title,icon:Icon,bg})=>(
            <button key={id} onClick={()=>setTab(id)} className={`${bg} text-white rounded-3xl p-6 flex flex-col items-center justify-center hover:opacity-90 active:scale-95 transition`}>
              <Icon className="w-8 h-8 mb-2"/>
              <span className="font-medium">{title}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow p-6 space-y-6">

          {tab==='personal' && (
            Object.entries(groupedByDept).length===0 ?
              <p className="text-gray-500 italic">No hi ha dades de personal.</p> :
              Object.entries(groupedByDept).map(([dept,members])=>(
                <div key={dept}>
                  <h3 className="font-bold text-lg mb-2">{dept} ({members.length} persona{members.length>1?'es':''})</h3>
                  <ul className="space-y-2 pl-4">
                    {members.map((p,i)=>(
                      <li key={i} className={`px-4 py-2 rounded-xl flex justify-between items-center ${p['Responsable']?.toLowerCase().startsWith('s')?'bg-yellow-100 border-l-4 border-yellow-400':'bg-gray-100'}`}>
                        <span>{p.Nom} — {formatHour(p['Hora entrada'])} — {p['Total hores']}h</span>
                        {p['Responsable']?.toLowerCase().startsWith('s') && <span className="text-yellow-600 font-semibold">RESPONSABLE</span>}
                      </li>
                    ))}
                  </ul>
                </div>
            ))
          )}

          {tab==='docs' && (
            fullEncs.length?
            <ul className="space-y-2">
              {fullEncs.map((a,i)=>(<li key={i} className="bg-gray-100 rounded-xl shadow px-4 py-2"><a href={a.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{a.title}</a></li>))}
            </ul> : <p className="text-gray-500 italic">No hi ha documents “Full encàrrec”.</p>
          )}

          {tab==='incidencies' && (
            filteredIncidencies.length ?
            <ul className="space-y-2">{filteredIncidencies.map((inc,i)=>(<li key={i} className="bg-gray-100 rounded-xl shadow px-4 py-2">• {inc}</li>))}</ul>
            : <p className="text-gray-500 italic">No hi ha incidències registrades.</p>
          )}

          {tab==='pressupost' && (
            budgetError ? <p className="text-red-600">Error: {budgetError}</p> :
            budgetFiles.length?
            <ul className="space-y-2">{budgetFiles.map((f,i)=>(<li key={i} className="bg-gray-100 rounded-xl shadow px-4 py-2 flex justify-between"><span>{f.name}</span><a href={f.webViewLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Obrir</a></li>))}</ul>
            : <p className="text-gray-500 italic">No s’han trobat pressupostos.</p>
          )}

          {tab==='fitxes' && (
            otherAtts.length?
            <ul className="space-y-2">{otherAtts.map((a,i)=>(<li key={i} className="bg-gray-100 rounded-xl shadow px-4 py-2"><a href={a.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{a.title}</a></li>))}</ul>
            : <p className="text-gray-500 italic">No hi ha fitxes tècniques.</p>
          )}

          {tab==='contracte' && (
            contractError ? <p className="text-red-600">Error: {contractError}</p> :
            contractFiles.length?
            <ul className="space-y-2">{contractFiles.map((f,i)=>(<li key={i} className="bg-gray-100 rounded-xl shadow px-4 py-2 flex justify-between"><span>{f.name}</span><a href={f.webViewLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Obrir</a></li>))}</ul>
            : <p className="text-gray-500 italic">No s’han trobat contractes.</p>
          )}

        </div>
      )}
    </div>
  );
}
