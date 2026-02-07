import { withConnection } from './db.service.js';

export const getArtikli = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute('CALL komercijala.pregled_artikli()');
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
  });
};
