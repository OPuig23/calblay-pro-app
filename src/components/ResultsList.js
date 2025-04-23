// src/components/ResultsList.js
import React from 'react';
import { MapPin } from 'lucide-react';
import BackButton from './BackButton';

/** Agrupa els events per data i calcula el total de pax */
function groupByDate(events) {
  const groups = events.reduce((acc, evt) => {
    const date = evt.date;
    if (!acc[date]) acc[date] = { date, events: [], totalPax: 0 };
    acc[date].events.push(evt);
    const m = evt.name.match(/(\d+)\s*pax/i);
    acc[date].totalPax += m ? parseInt(m[1], 10) : 0;
    return acc;
  }, {});
  return Object.values(groups).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
}

export default function ResultsList({ events, onSelect, onBack }) {
  const grouped = groupByDate(events);

  return (
    <div className="w-full max-w-4xl space-y-8">
      <BackButton onClick={onBack} />

      {grouped.length === 0 && (
        <p className="text-center text-gray-600 mt-12">Cap esdeveniment trobat.</p>
      )}

      {grouped.map(({ date, events: evts, totalPax }) => (
        <div key={date} className="rounded-2xl bg-bgCard p-4 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">{date}</h3>
            <span className="text-2xl font-extrabold text-primary">{totalPax} pax</span>
          </div>

          <div className="grid gap-4">
            {evts.map(evt => (
              <div
                key={evt.id}
                className="bg-white rounded-xl shadow hover:scale-105 active:scale-95 transition-transform"
              >
                <button
                  onClick={() => onSelect(evt)}
                  className="w-full text-left p-4 flex flex-col space-y-1"
                >
                  <h4 className="font-semibold text-lg text-gray-800">{evt.name}</h4>
                  <p className="text-sm text-gray-500">{evt.date}</p>
                </button>

                {evt.location && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evt.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-indigo-600 px-4 pb-4"
                    onClick={e => e.stopPropagation()}
                  >
                    <MapPin className="mr-1" /> {evt.location}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
