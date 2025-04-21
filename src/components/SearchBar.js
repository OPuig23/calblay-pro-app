// src/components/SearchBar.js
import React, { useState } from 'react';
import { Search, CalendarDays } from 'lucide-react';

export default function SearchBar({ onSearch, initial = {} }) {
  const [mode, setMode]   = useState(initial.mode || 'range');
  const [start, setStart] = useState(initial.start || '');
  const [end,   setEnd]   = useState(initial.end   || '');
  const [name,  setName]  = useState(initial.name  || '');
  const [error, setError] = useState('');

  // Retorna YYYY‑MM‑DD del dia següent
  const getNextDate = (dateStr) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const submit = e => {
    e.preventDefault();
    const q = name.trim();

    // 1) Cerca per nom (parcial) si hi ha text
    if (q) {
      setError('');
      onSearch({ mode: 'range', start: '', end: '', name: q });
      return;
    }

    // 2) Dia concret
    if (mode === 'day') {
      if (!start) {
        setError('Cal seleccionar una data.');
        return;
      }
      setError('');
      onSearch({ mode, start, end: getNextDate(start), name: '' });
      return;
    }

    // 3) Rang de dates
    if (!start || !end) {
      setError('Cal seleccionar data inicial i final.');
      return;
    }
    if (new Date(end) < new Date(start)) {
      setError('La data final ha de ser igual o posterior.');
      return;
    }

    setError('');
    onSearch({ mode: 'range', start, end, name: '' });
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-wrap items-center gap-2 bg-white/70 backdrop-blur rounded-3xl shadow px-4 py-2"
    >
      {/* Mode selector */}
      <select
        value={mode}
        onChange={e => setMode(e.target.value)}
        className="bg-white border rounded-full px-3 py-1"
      >
        <option value="range">Rang</option>
        <option value="day">Dia</option>
      </select>

      {/* Start date */}
      <label className="relative flex-1 min-w-[100px]">
        <CalendarDays className="absolute left-2 top-1/2 -translate-y-1/2 text-blue-400" />
        <input
          type="date"
          value={start}
          onChange={e => setStart(e.target.value)}
          className="w-full pl-8 pr-2 py-1 rounded-lg border"
        />
      </label>

      {/* End date (només en rang) */}
      {mode === 'range' && (
        <label className="relative flex-1 min-w-[100px]">
          <CalendarDays className="absolute left-2 top-1/2 -translate-y-1/2 text-blue-400" />
          <input
            type="date"
            value={end}
            onChange={e => setEnd(e.target.value)}
            className="w-full pl-8 pr-2 py-1 rounded-lg border"
          />
        </label>
      )}

      {/* Input nom */}
      <input
        type="text"
        placeholder="Nom (opcional)"
        value={name}
        onChange={e => setName(e.target.value)}
        className="rounded-lg border px-2 py-1 flex-1 min-w-[120px]"
      />

      {/* Botó de cerca */}
      <button
        type="submit"
        className="bg-blue-600 text-white rounded-full p-2 flex items-center hover:bg-blue-700 transition-shadow shadow-md"
      >
        <Search className="w-4 h-4" />
      </button>

      {/* Missatge d’error */}
      {error && (
        <p className="w-full text-red-600 text-sm mt-1">{error}</p>
      )}
    </form>
  );
}
