import { withConnection } from './db.service.js';

export const getAktivneNarudzbeGrupisano = async (sifraTerena) => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      'CALL komercijala.dostava_tereni_proizvodi_grupisano(?)',
      [sifraTerena]);
   
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
} );
};  


export const getAktivneNarudzbe = async (sifraTerena) => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      'CALL komercijala.dostava_tereni_proizvodi(?)',
      [sifraTerena]);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
} );
};  