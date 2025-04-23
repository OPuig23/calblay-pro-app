// src/components/ResponsibleSearchForm.js
import React, { useState } from 'react';

export default function ResponsibleSearchForm({ onSearch }) {
  const [name, setName] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    if (name.trim()) onSearch(name.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md flex items-center gap-2"
    >
      <input
        type="text"
        placeholder="Buscar per responsable…"
        value={name}
        onChange={e => setName(e.target.value)}
        className="flex-1 p-2 border rounded"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Cerca
      </button>
    </form>
  );
}
