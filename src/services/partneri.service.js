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
// export const getPartneri = async () => {
//   return withConnection(async (connection) => {
//     const [rows] = await connection.execute('CALL komercijala.pregled_svih_partnera()');
//     return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
//   });
// };