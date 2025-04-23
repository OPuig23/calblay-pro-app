// avis-server.js
import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import Papa from 'papaparse';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3010;
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQcEtnI6uRkch6n6E6tyJij1i6nFkkZp73MCmcqbCN6uXvOo9uzwN5MB39zJVp6Jh0iF2nz8cOx0y9A/pub?gid=798164058&single=true&output=csv';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

app.post('/api/avis-responsable', async (req, res) => {
  const eventName = req.body.eventName;
  if (!eventName) return res.status(400).send('Falta el nom de l’esdeveniment');

  try {
    const resposta = await fetch(CSV_URL);
    const text = await resposta.text();
    const { data } = Papa.parse(text, { header: true });

    const responsables = data.filter(row =>
      row['Nom Esdeveniment']?.trim().toLowerCase() === eventName.toLowerCase() &&
      row['Responsable']?.toLowerCase() === 'sí' &&
      row['Email']
    );

    if (!responsables.length) {
      return res.status(404).send('No s’ha trobat cap responsable amb correu');
    }

    for (const r of responsables) {
      const mailOptions = {
        from: `Cal Blay WebApp <${process.env.MAIL_USER}>`,
        to: r.Email,
        subject: `📋 Full de personal disponible - ${eventName}`,
        text: `Hola ${r.Nom || ''},\n\nJa tens disponible el full de personal per a l’esdeveniment: ${eventName}.\n\nSalutacions,\nL’equip Cal Blay`
      };
      await transporter.sendMail(mailOptions);
      console.log(`✅ Correu enviat a ${r.Email}`);
    }

    res.send('Correus enviats');
  } catch (err) {
    console.error('❌ Error al servidor:', err.message);
    res.status(500).send('Error del servidor');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor d’avisos actiu a http://localhost:${PORT}`);
});
