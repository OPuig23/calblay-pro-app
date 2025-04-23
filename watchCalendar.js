// watchCalendar.js
import express from 'express';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import fs from 'fs';
import { processEvent } from './processEvent.js';

dotenv.config();

const app = express();
app.use(express.json());

const SERVICE_ACCOUNT_FILE = process.env.GOOGLE_SERVICE_ACCOUNT_FILE;
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
const CHANNEL_ID = 'calblay-channel-1'; // Únic
const PORT = process.env.PORT || 3001;

// Auth Google API
const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_FILE,
  scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
});
const calendar = google.calendar({ version: 'v3', auth });

app.post('/notifications', async (req, res) => {
  const state = req.header('X-Goog-Resource-State');
  if (state !== 'exists') return res.sendStatus(200);
  console.log('📬 Nova notificació rebuda de Google Calendar');
  try {
    const now = new Date();
    const oneMinAgo = new Date(now.getTime() - 60 * 1000);
    const resCal = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: oneMinAgo.toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: 'startTime',
    });
    const events = resCal.data.items || [];
    for (const event of events) {
      await processEvent(event);
    }
  } catch (err) {
    console.error('❌ Error processant notificació:', err);
  }
  res.sendStatus(200);
});

async function startWatch() {
  const watchRes = await calendar.events.watch({
    calendarId: CALENDAR_ID,
    requestBody: {
      id: CHANNEL_ID,
      type: 'web_hook',
      address: `${process.env.PUBLIC_URL}/notifications`,
    },
  });
  console.log('✅ Vigilància activada. Resource ID:', watchRes.data.resourceId);
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor notificacions actiu a http://localhost:${PORT}`);
  startWatch().catch(console.error);
});