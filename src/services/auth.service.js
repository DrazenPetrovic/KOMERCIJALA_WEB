import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { withConnection } from './db.service.js';

const extractSifraRadnika = (rows) => {
  const result = rows?.[0];
  let sifraRadnika = null;

  if (Array.isArray(result) && result.length > 0) {
    const firstRow = result[0];

    if (typeof firstRow === 'object' && firstRow !== null) {
      const value = Object.values(firstRow)[0];
      const numValue = typeof value === 'number' ? value : parseInt(value);
      if (!isNaN(numValue) && numValue > 0) sifraRadnika = numValue;
    } else {
      const numValue = typeof firstRow === 'number' ? firstRow : parseInt(firstRow);
      if (!isNaN(numValue) && numValue > 0) sifraRadnika = numValue;
    }
  }

  return sifraRadnika;
};

export const login = async (username, password) => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute('CALL logovanje_korisnika(?, ?)', [
      username,
      password,
    ]);

    // const sifraRadnika = extractSifraRadnika(rows);
    // const vrstaRadnika = rows?.[0]?.[1]?.vrsta || null;

    const row = rows?.[0]?.[0] || null;

    const sifraRadnika = row?.povratna ?? null;
    const vrstaRadnika = row?.vrsta ?? null;

    //console.log('Login result:', { rows, row, sifraRadnika, vrstaRadnika });
    console.log('Login result:', { rows, sifraRadnika, vrstaRadnika });

    if (sifraRadnika == null) return { success: false };

    const token = jwt.sign(
      { username, sifraRadnika, vrstaRadnika, loginTime: new Date().toISOString() },
      env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return { success: true, token, user: { username, sifraRadnika, vrstaRadnika } };
  });
};
