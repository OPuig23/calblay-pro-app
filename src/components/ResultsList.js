import React from 'react'
import BackButton from './BackButton'

/**
 * Agrupa els events per data i calcula el total de pax
 */
function groupByDate(events) {
  const groups = events.reduce((acc, evt) => {
    const date = evt.date
    if (!acc[date]) acc[date] = { date, events: [], totalPax: 0 }
    acc[date].events.push(evt)
    // extreu pax del nom: busca "123 pax"
    const m = evt.name.match(/(\d+)\s*pax/i)
    acc[date].totalPax += m ? parseInt(m[1], 10) : 0
    return acc
  }, {})
  return Object.values(groups).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  )
}

export default function ResultsList({ events, onSelect, onBack }) {
  const grouped = groupByDate(events)

  return (
    <div className="w-full max-w-4xl space-y-8">
      {/* botó fix de tornar */}
      <BackButton onClick={onBack} />

      {grouped.length === 0 && (
        <p className="text-center text-gray-600 mt-12">
          Cap esdeveniment trobat.
        </p>
      )}

      {grouped.map(({ date, events, totalPax }) => (
        <div
          key={date}
          className="rounded-2xl bg-bgCard p-4 shadow-lg"
        >
          {/* capçalera de data + total */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              {date}
            </h3>
            <span className="text-2xl font-extrabold text-primary">
              {totalPax} pax
            </span>
          </div>

          {/* llista d’esdeveniments d’aquella data */}
          <div className="grid gap-4">
            {events.map(evt => (
              <button
                key={evt.id}
                onClick={() => onSelect(evt)}
                className="w-full text-left p-4 rounded-xl bg-white shadow hover:scale-105 active:scale-95 transition-transform"
              >
                <h4 className="font-semibold text-lg text-gray-800">
                  {evt.name}
                </h4>
                <p className="text-sm text-gray-500">
                  {evt.date}
                </p>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
