// src/components/IncidentForm.js
import React, { useState } from 'react';

export default function IncidentForm({ onSubmit, onCancel }) {
  const [department, setDepartment] = useState('');
  const [importance, setImportance] = useState(0);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    if (!department) {
      setError('Cal seleccionar un departament.');
      return;
    }
    if (!description.trim()) {
      setError('Cal descriure la incidència.');
      return;
    }
    setError('');
    onSubmit({ department, importance, description });
    // Opcional: netejar el formulari després d'enviar
    setDepartment('');
    setImportance(0);
    setDescription('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-white p-4 rounded-2xl shadow-md"
    >
      <h3 className="text-xl font-bold">➕ Nova Incidència</h3>

      <div>
        <label className="block mb-1 font-medium">Departament</label>
        <select
          value={department}
          onChange={e => setDepartment(e.target.value)}
          className="w-full p-2 border rounded-lg"
        >
          <option value="">Selecciona...</option>
          <option value="Sala">Sala</option>
          <option value="Logistica">Logística</option>
          <option value="Cuina">Cuina</option>
          <option value="Client">Client</option>
          <option value="Comercial">Comercial</option>
        </select>
      </div>

      <div>
        <label className="block mb-1 font-medium">Importància (0 = molt baix, 5 = molt alt)</label>
        <select
          value={importance}
          onChange={e => setImportance(Number(e.target.value))}
          className="w-full p-2 border rounded-lg"
        >
          {[0,1,2,3,4,5].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block mb-1 font-medium">Descripció</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={4}
          className="w-full p-2 border rounded-lg"
          placeholder="Detalla la incidència..."
        />
      </div>

      {error && <p className="text-red-600 font-medium">{error}</p>}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 rounded-lg"
        >
          Cancel·lar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
        >
          Enviar
        </button>
      </div>
    </form>
  );
}
