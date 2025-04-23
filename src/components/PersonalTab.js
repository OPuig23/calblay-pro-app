// src/components/PersonalTab.js
import React, { useCallback } from 'react';
import { Phone } from 'lucide-react';

export default function PersonalTab({ eventName, personalData }) {
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

  // Agrupar per departament
  const byDept = personalData
    .filter(r => isMatch(r['Nom Esdeveniment'], eventName))
    .reduce((acc, row) => {
      const d = row.Departament || 'Altres';
      (acc[d] = acc[d] || []).push(row);
      return acc;
    }, {});

  const colors = ['bg-red-50','bg-green-50','bg-blue-50','bg-yellow-50','bg-purple-50','bg-pink-50'];

  return (
    <>
      {Object.entries(byDept).map(([dept, list], idx) => (
        <div key={dept} className={`${colors[idx % colors.length]} p-4 rounded mb-4`}>
          <h4 className="font-semibold text-lg mb-2">
            {dept} ({list.length})
          </h4>
          {list.map((p, j) => (
            <div key={j} className="bg-white p-3 rounded shadow mb-2">
              <strong>{p.Nom}</strong>
              {p.Responsable?.toLowerCase() === 'si' && p.Telefono && (
                <a href={`tel:${p.Telefono}`} className="inline-flex items-center ml-2 text-indigo-600">
                  <Phone size={16} className="mr-1" />{p.Telefono}
                </a>
              )}
              <br />
              🕒 {p['Hora entrada']?.slice(0,5) || '--'} → {p['Hora de sortida']?.slice(0,5) || '--'} — ⏱️ {formatHours(p['Total hores'])}
              {p['Carnet de conduir']?.toLowerCase().startsWith('s') && ' 🚚'}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
