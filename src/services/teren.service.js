import { withConnection } from './db.service.js';

export const getTerenGrad = async (sifraRadnika) => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute('CALL komercijala.pregled_terena_grad(?)', [sifraRadnika]);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
  });
};

export const getTerenPoDanima = async (sifraRadnika) => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute('CALL komercijala.pregled_terena_po_danima(?)', [sifraRadnika]);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
  });
};
