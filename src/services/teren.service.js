import { withConnection } from './db.service.js';

export const getTerenGrad = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute('CALL komercijala.pregled_dostava_teren_grad');
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
  });
};

export const getTerenPoDanima = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute('CALL komercijala.pregled_aktivnih_terena_po_danima()');
    // console.log('getTerenPoDanima rows:', rows);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
  });
};


export const getTerenKupci = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute('CALL komercijala.dostava_partneri()');
    if (Array.isArray(rows) && rows.length > 0) {
      // MAPIRA PODATKE
      const kupci = rows[0].map(k => ({
        sifra_kupca: k.sifra_kup,
        naziv_kupca: k.Naziv_partnera,
        sifra_grada: k.sifra_grada,
        naziv_grada: k.Naziv_grada,
        vrsta_kupca: k.vrsta
      }));
      // console.log('✅ MAPANI KUPCI:', kupci);
      return kupci;
    }
    return [];
 });
};






// export const getTerenGrad = async (sifraRadnika) => {
//   return withConnection(async (connection) => {
//     const [rows] = await connection.execute('CALL komercijala.pregled_terena_grad(?)', [sifraRadnika]);
//     return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
//   });
// };

// export const getTerenPoDanima = async (sifraRadnika) => {
//   return withConnection(async (connection) => {
//     const [rows] = await connection.execute('CALL komercijala.pregled_terena_po_danima(?)', [sifraRadnika]);
//     return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
//   });
// };
