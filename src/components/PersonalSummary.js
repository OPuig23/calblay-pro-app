// src/components/PersonalSummary.js
import React from 'react';

export default function PersonalSummary({ personalData }) {
  if (!personalData || personalData.length === 0) {
    return <p className="text-center text-gray-600">No hi ha dades de personal.</p>;
  }

  const grouped = personalData.reduce((acc, item) => {
    if (!acc[item.departament]) acc[item.departament] = [];
    acc[item.departament].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([dept, people]) => (
        <div key={dept}>
          <h3 className="text-lg font-bold">{dept} ({people.length} persona{people.length !== 1 ? 's' : ''})</h3>
          <div className="space-y-2 mt-2">
            {people.map((p, idx) => (
              <div
                key={idx}
                className={`rounded-xl px-4 py-2 shadow bg-white flex justify-between items-center ${
                  p.responsable ? 'bg-yellow-200' : ''
                }`}
              >
                <span>{p.nom}</span>
                <span>{p.entrada}h</span>
                <span>{p.hores}h</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
