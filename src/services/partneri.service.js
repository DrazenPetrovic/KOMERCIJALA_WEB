import { withConnection } from './db.service.js';

export const getPartneri = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute('CALL komercijala.pregled_svih_partnera()');
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
  });
};
