import { withConnection } from './db.service.js';

export const getIzvjestajiIstorija = async (sifraPartnera) => {
  // Provjera da li je parametar prosleđen
  if (sifraPartnera === undefined || sifraPartnera === null) {
    throw new Error('sifraRadnika parametar je obavezan');
  }


  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      'CALL komercijala.pregled_izvjestaja_ranijih(?)', 
      [sifraPartnera]
    );
 
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
   
  });
};
