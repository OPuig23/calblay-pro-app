// src/utils/getPersonalSummary.js
export function getPersonalSummary(eventName, data) {
    const personals = data.filter(row => row.Espeveniment === eventName);
    
    const grouped = {};
    for (const p of personals) {
      const dept = p.Departament || 'Altres';
      if (!grouped[dept]) grouped[dept] = [];
      grouped[dept].push({
        nom: p.Nom,
        entrada: p['Hora entrada'],
        hores: p['Total hores'],
        responsable: p.Responsable?.toLowerCase() === 'si',
      });
    }
  
    return grouped;
  }
  