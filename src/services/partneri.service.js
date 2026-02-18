import { withConnection } from './db.service.js';

export const getPartneri = async (sifraRadnika) => {
  // Provjera da li je parametar prosleđen
  if (sifraRadnika === undefined || sifraRadnika === null) {
    throw new Error('sifraRadnika parametar je obavezan');
  }

  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      'CALL komercijala.pregled_partnera(?)', 
      [sifraRadnika]
    );
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
  });
};


// ✅ ISPRAVLJENA FUNKCIJA
export const getPartneriSaADodacima = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      'CALL komercijala.partneri_dodatni_podaci()'
    );
    
    console.log('Rows from procedure:', rows);
    console.log('Rows length:', rows?.length);
    
    // Procedura vraća 2 result seta
    if (!Array.isArray(rows) || rows.length === 0) {
      return [];
    }

    // Prvi result set su partneri
    const partneriSet = rows[0];
    
    // Drugi result set su dodatni podaci
    const dodatniPodaciSet = rows[1] || [];

    console.log('Partneri:', partneriSet);
    console.log('Dodatni podaci:', dodatniPodaciSet);

    // Provjeri da li su arraji
    if (!Array.isArray(partneriSet) || !Array.isArray(dodatniPodaciSet)) {
      console.error('Partneri ili dodatni podaci nisu arraji');
      return Array.isArray(partneriSet) ? partneriSet : [];
    }

    // Kombinuj podatke
    return partneriSet.map(partner => ({
      ...partner,
      dodatniPodaci: dodatniPodaciSet.filter(
        p => p.sifra_partnera === partner.sifra_partnera
      )
    }));
  });
};

export const getPartneriDodatniPodaci = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      'CALL komercijala.partneri_dodatni_podaci()'
    );
    
    console.log('Dodatni podaci rows:', rows);
    
    return Array.isArray(rows) ? rows : [];
  });
};


// Dodajte:

export const addDodatniPodaci = async (data) => {
  return withConnection(async (connection) => {
    const today = new Date().toISOString().split('T')[0];
    
    const [result] = await connection.execute(
      `CALL komercijala.partneri_dodatni_podaci_unosi(
        ?, ?, ?, ?, 0, ?
      )`,
      [
        data.sifra_partnera,
        data.dodatni_podaci_opis,
        data.dodatni_podaci, // TELEFON
        data.sifra_radnika,
        today
      ]
    );

    return {
      sifra_partnera: data.sifra_partnera,
      dodatni_podaci_opis: data.dodatni_podaci_opis,
      dodatni_podaci: data.dodatni_podaci,
      naziv_radnika: data.sifra_radnika,
      datum_unosa: today
    };
  });
};

