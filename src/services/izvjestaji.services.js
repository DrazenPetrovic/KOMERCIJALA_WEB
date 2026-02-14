import { withConnection } from './db.service.js';

export const getIzvjestajiIstorija = async (sifraRadnika) => {
  // Provjera da li je parametar prosleđen
  if (sifraRadnika === undefined || sifraRadnika === null) {
    throw new Error('sifraRadnika parametar je obavezan');
  }

  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      'CALL komercijala.pregled_izvjestaja_ranijih(?)', 
      [sifraRadnika]
    );
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
  });
};