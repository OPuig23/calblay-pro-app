// src/components/SearchForm.js
import React, { useState } from 'react';
import { Search, CalendarDays } from 'lucide-react';

export default function SearchForm({ onSearch, initial = {} }) {
  const [mode, setMode]   = useState(initial.mode || 'range');  // 'range' o 'day'
  const [start, setStart] = useState(initial.start || '');
  const [end,   setEnd]   = useState(initial.end   || '');
  const [name,  setName]  = useState(initial.name  || '');
  const [error, setError] = useState('');

  // Retorna cadena YYYY‑MM‑DD del dia següent
  const getNextDate = (dateStr) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = name.trim();

    // 1) Cerca només per nom (parcial)
    if (q) {
      setError('');
      onSearch({ mode: 'range', start: '', end: '', name: q });
      return;
    }

    // 2) Mode “Dia concret”
    if (mode === 'day') {
      if (!start) {
        setError('Cal seleccionar una data.');
        return;
      }
      const next = getNextDate(start);
      setError('');
      onSearch({ mode, start, end: next, name: '' });
      return;
    }

    // 3) Mode “Rang”
    if (!start || !end) {
      setError('Cal seleccionar data inicial i final.');
      return;
    }
    if (new Date(end) < new Date(start)) {
      setError('La data final ha de ser igual o posterior a la inicial.');
      return;
    }

    setError('');
    onSearch({ mode, start, end, name: '' });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-4xl bg-white rounded-3xl shadow p-6 flex flex-col gap-4"
    >
      {/* Selector de mode */}
      <div className="flex justify-center gap-4">
        {['range', 'day'].map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-full font-medium transition ${
              mode === m
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {m === 'range' ? 'Rang de dates' : 'Dia concret'}
          </button>
        ))}
      </div>

      {/* Inputs de data */}
      <div className="flex gap-4">
        <label className="relative flex-1">
          <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
          <input
            type="date"
            value={start}
            onChange={e => setStart(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-300"
          />
        </label>
        <label className={`relative flex-1 ${mode === 'day' ? 'opacity-50' : ''}`}>
          <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
          <input
            type="date"
            value={mode === 'day' ? start : end}
            onChange={e => setEnd(e.target.value)}
            disabled={mode === 'day'}
            className="w-full pl-10 pr-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-300"
          />
        </label>
      </div>

      {/* Cerca per nom i botó */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Nom (opcional)"
          value={name}
          onChange={e => setName(e.target.value)}
          className="flex-1 bg-gray-100 rounded-xl p-3 border focus:ring-2 focus:ring-blue-300"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 flex items-center transition-shadow shadow-md"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Missatge d’error */}
      {error && (
        <p className="text-red-600 text-center font-medium mt-2">
          {error}
        </p>
      )}
    </form>
  );
}
