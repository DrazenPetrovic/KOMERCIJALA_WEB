import { withConnection } from './db.service.js';

export const getUplate = async (sifraRadnika) => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute('CALL komercijala.pregled_uplata(?)', [sifraRadnika]);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
  });
};
