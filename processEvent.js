// processEvent.js
import fetch from 'node-fetch';
import Papa from 'papaparse';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const PERSONAL_CSV_URL = process.env.PERSONAL_CSV_URL;
const twClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

export async function processEvent(ev) {
  const title = ev.summary || '(Sense títol)';
  const date = ev.start?.dateTime || ev.start?.date || 'Data desconeguda';

  try {
    const csvRes = await fetch(PERSONAL_CSV_URL);
    const text = await csvRes.text();
    const { data } = Papa.parse(text, { header: true });

    const responsables = data.filter(row =>
      row['Nom Esdeveniment']?.trim() === title &&
      row.Responsable?.toLowerCase() === 'si' &&
      row.Telefono
    );

    for (const r of responsables) {
      const message = `📅 Nou esdeveniment: "${title}"\nData: ${date}`;
      await twClient.messages.create({
        body: message,
        from: process.env.TWILIO_NUMBER,
        to: r.Telefono
      });
      console.log(`📲 SMS enviat a ${r.Telefono} per ${title}`);
    }
  } catch (err) {
    console.error('❌ Error processant event:', err);
  }
}
