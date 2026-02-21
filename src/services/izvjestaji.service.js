import { withConnection } from './db.service.js';

export const savePartnerReport = async (sifraRadnika, sifraPartnera, podaci) => {
  return withConnection(async (connection) => {
    const datumRazgovora = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    
    const query = `
      INSERT INTO komercijala.podaci_o_partneru_teren_novi 
      (sifra_radnika, sifra_partnera, datum_razgovora, podaci, poslano_emailom)
      VALUES (?, ?, ?, ?, 0)
    `;
    
    const [result] = await connection.execute(query, [
      sifraRadnika,
      sifraPartnera,
      datumRazgovora,
      podaci
    ]);
    
    return {
      success: true,
      insertId: result.insertId,
      message: 'Izvještaj uspješno sačuvan'
    };
  });
};

export const getIzvjestajiIstorija = async (sifraPartnera) => {
  // Provjera da li je parametar prosleđen
  if (sifraPartnera === undefined || sifraPartnera === null) {
    throw new Error('sifraPartnera parametar je obavezan');
  }


  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      'CALL komercijala.pregled_izvjestaja_ranijih(?)', 
      [sifraPartnera]
    );
 
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
   
  });
};

export const getListaKomercijalisti = async () => {

  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      'CALL komercijala.radnici_pregled_komercijalista()'
    );
 
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
   
  });
};

export const getIzvjestajiPoslednji= async () => {

  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      'CALL komercijala.pregled_izvjestaja_skraceno()'
    );
 
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
   
  });
};

export const getIzvjestajipoDatumu = async (pocetniDatum, krajnjiDatum) => {
  // Provjera da li su parametri prosleđeni
  if (pocetniDatum === undefined || pocetniDatum === null) {
    throw new Error('pocetniDatum parametar je obavezan');
  }
  if (krajnjiDatum === undefined || krajnjiDatum === null) {
    throw new Error('krajnjiDatum parametar je obavezan');
  }

  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      'CALL komercijala.pregled_izvjestaja_po_datumu(?, ?)', 
      [pocetniDatum, krajnjiDatum]
    );
 
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
   
  });
};