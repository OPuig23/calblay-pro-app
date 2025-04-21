// src/components/PersonalDemo.js
import React from 'react';
import PersonalSummary from './PersonalSummary';

const fakeData = [
  {
    esdeveniment: 'Casament Laura & Marc',
    nom: 'Anna',
    departament: 'Cuina',
    horaEntrada: '10:00',
    horesTotals: 2,
    responsable: true,
  },
  {
    esdeveniment: 'Casament Laura & Marc',
    nom: 'Biel',
    departament: 'Cuina',
    horaEntrada: '10:00',
    horesTotals: 2,
    responsable: false,
  },
  {
    esdeveniment: 'Casament Laura & Marc',
    nom: 'Carla',
    departament: 'Sala',
    horaEntrada: '09:00',
    horesTotals: 3,
    responsable: false,
  },
  {
    esdeveniment: 'Casament Laura & Marc',
    nom: 'David',
    departament: 'Logística',
    horaEntrada: '08:30',
    horesTotals: 4,
    responsable: true,
  },
];

export default function PersonalDemo() {
  return (
    <div className="min-h-screen bg-green-50 p-6">
      <h1 className="text-2xl font-bold mb-4">Resum Personal</h1>
      <PersonalSummary personal={fakeData} />
    </div>
  );
}
