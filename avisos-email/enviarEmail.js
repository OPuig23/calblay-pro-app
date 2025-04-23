import dotenv from 'dotenv';
import fetch from 'node-fetch';
import Papa from 'papaparse';
import nodemailer from 'nodemailer';

dotenv.config();

const PERSONAL_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/XXXXX/pub?output=csv'; // <-- canvia això!
const NOM_ESDEVENIMENT = 'event prova 1200pax'; // <-- pots passar-ho com a paràmetre més endavant

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

async function enviarCorreus() {
  try {
    // 1. Descarregar el CSV
    const resposta = await fetch(PERSONAL_CSV_URL);
    const text = await resposta.text();
    const { data } = Papa.parse(text, { header: true });

    // 2. Filtrar responsables de l’esdeveniment concret
    const responsables = data.filter(row =>
      row['Nom Esdeveniment']?.trim().toLowerCase() === NOM_ESDEVENIMENT.toLowerCase() &&
      row['Responsable']?.toLowerCase() === 'sí' &&
      row['Email'] // <- important que el CSV tingui columna "Email"
    );

    // 3. Enviar el correu a cada responsable
    for (const r of responsables) {
      const mailOptions = {
        from: `"Cal Blay WebApp" <${process.env.MAIL_USER}>`,
        to: r.Email,
        subject: `📋 Full de personal disponible - ${NOM_ESDEVENIMENT}`,
        text: `Hola ${r.Nom || ''},\n\nJa tens disponible el full de personal per a l’esdeveniment: ${NOM_ESDEVENIMENT}.\n\nSalutacions,\nL’equip Cal Blay`
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Correu enviat a ${r.Email}`);
    }

    if (responsables.length === 0) {
      console.log('⚠️ Cap responsable trobat per aquest esdeveniment.');
    }

  } catch (err) {
    console.error('❌ Error general:', err.message);
  }
}

enviarCorreus();
