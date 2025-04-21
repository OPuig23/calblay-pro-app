// src/services/calendar.js

/**
 * Obté esdeveniments de Google Calendar segons paràmetres.
 * @param {{ start?: string, end?: string, name?: string }} query
 * @returns {Promise<Array>} array d’events normalitzats
 */
export async function fetchEventsFromGoogle(query = {}) {
    const { start, end, name } = query;
  
    const API_KEY     = process.env.REACT_APP_GOOGLE_API_KEY;
    const CALENDAR_ID = process.env.REACT_APP_GOOGLE_CALENDAR_ID;
  
    const params = new URLSearchParams({
      key:           API_KEY,
      singleEvents:  'true',
      orderBy:       'startTime',
      maxResults:    '50',
    });
  
    if (start) params.set('timeMin', new Date(start).toISOString());
    if (end)   params.set('timeMax', new Date(end).toISOString());
    if (name)  params.set('q', name);
  
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      CALENDAR_ID
    )}/events?${params.toString()}`;
  
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Google API error ${res.status}`);
    const { items } = await res.json();
  
    return items.map((item) => ({
      id:          item.id,
      name:        item.summary || 'Sense títol',
      date:        (item.start?.dateTime || item.start?.date || '').split('T')[0],
      attachments: item.attachments || [],
      personal:    [],
      incidencies: [],
      fitxes:      [],
      docs:        {},
    }));
  }
  