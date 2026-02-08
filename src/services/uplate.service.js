import { withConnection } from './db.service.js';

export const getUplate = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute('CALL komercijala.dostava_provjera_uplata()');
    //console.log('🔍 RAW UPLATE PODACI:', rows); // ← DODAJ OVO ZA DEBU G  
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
  });
};


// export const getUplate = async (sifraRadnika) => {
//   return withConnection(async (connection) => {
//     const [rows] = await connection.execute('CALL komercijala.pregled_uplata(?)', [sifraRadnika]);
//     return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
//   });
// };