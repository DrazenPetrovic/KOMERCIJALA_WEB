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
    console.log('getTerenPoDanima rows:', rows);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
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
