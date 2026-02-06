import express from 'express';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'karpas-jwt-secret-2024-secure-key-7x9m2p4q8n';

const dbConfig = {
  host: '94.130.111.127',
  port: 3306,
  user: 'komercijala1',
  password: 'TeletabisI!123',
  database: 'komercijala'
};

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const getConnection = async () => {
  return await mysql.createConnection(dbConfig);
};

const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies.authToken;
    if (!token) {
      return res.status(401).json({ error: 'Nedostaje autorizacija' });
    }

    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Nevažeći token' });
  }
};

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Korisničko ime i šifra su obavezni'
      });
    }

    const connection = await getConnection();
    const [rows] = await connection.execute(
      'CALL logovanje_korisnika(?, ?)',
      [username, password]
    );
    await connection.end();

    const result = rows[0];
    let sifraRadnika = null;

    if (Array.isArray(result) && result.length > 0) {
      const firstRow = result[0];
      if (typeof firstRow === 'object' && firstRow !== null) {
        const value = Object.values(firstRow)[0];
        const numValue = typeof value === 'number' ? value : parseInt(value);
        if (!isNaN(numValue) && numValue > 0) {
          sifraRadnika = numValue;
        }
      } else {
        const numValue = typeof firstRow === 'number' ? firstRow : parseInt(firstRow);
        if (!isNaN(numValue) && numValue > 0) {
          sifraRadnika = numValue;
        }
      }
    }

    if (sifraRadnika) {
      const token = jwt.sign(
        { username, sifraRadnika, loginTime: new Date().toISOString() },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000
      });

      return res.json({
        success: true,
        message: 'Uspešno logovanje',
        user: { username, sifraRadnika }
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Pogrešno korisničko ime ili šifra'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Greška pri povezivanju sa bazom'
    });
  }
});

app.get('/api/auth/verify', (req, res) => {
  try {
    const token = req.cookies.authToken;

    if (!token) {
      return res.status(401).json({
        authenticated: false,
        error: 'Not authenticated'
      });
    }

    const verified = jwt.verify(token, JWT_SECRET);
    return res.json({
      authenticated: true,
      username: verified.username,
      sifraRadnika: verified.sifraRadnika
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(401).json({
      authenticated: false,
      error: 'Invalid token'
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('authToken');
  res.json({
    success: true,
    message: 'Logged out'
  });
});

app.get('/api/artikli', verifyToken, async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute('CALL komercijala.pregled_artikli()');
    await connection.end();

    const artikli = Array.isArray(rows) && rows.length > 0 ? rows[0] : [];

    return res.json({
      success: true,
      data: artikli,
      count: artikli.length
    });
  } catch (error) {
    console.error('Pregled artikala error:', error);
    res.status(500).json({
      success: false,
      error: 'Greška pri učitavanju artikala'
    });
  }
});

app.get('/api/dugovanja', verifyToken, async (req, res) => {
  try {
    const { sifraRadnika } = req.user;
    const connection = await getConnection();
    const [results] = await connection.execute(
      'CALL komercijala.dugovanje_partnera_zbirno(?)',
      [sifraRadnika]
    );
    await connection.end();

    const rawDugovanja = Array.isArray(results) && results.length > 0
      ? (Array.isArray(results[0]) ? results[0] : results)
      : [];

    const dugovanja = rawDugovanja
      .filter((d) =>
        d.sifra_kup_z && d.sifra_kup_z > 0 && d.Naziv_partnera && d.Naziv_partnera.trim() !== ''
      )
      .map((d) => ({
        sifra: d.sifra_kup_z || 0,
        naziv_partnera: d.Naziv_partnera || '',
        ukupan_dug: parseFloat(d.Ukupan_dug) || 0,
        dug_preko_24: parseFloat(d.Dug_dvadesetcetiri) || 0,
        dug_preko_30: parseFloat(d.Dug_trideset) || 0,
        dug_preko_60: parseFloat(d.Dug_sezdeset) || 0,
        dug_preko_120: parseFloat(d.Dug_stodvadeset) || 0,
        najstariji_racun: d.Najstariji_racun ? new Date(d.Najstariji_racun).toLocaleDateString('sr-RS') : '-'
      }));

    let ukupanDug = 0, dugPreko24 = 0, dugPreko30 = 0, dugPreko60 = 0, dugPreko120 = 0;

    dugovanja.forEach((d) => {
      ukupanDug += d.ukupan_dug || 0;
      dugPreko24 += d.dug_preko_24 || 0;
      dugPreko30 += d.dug_preko_30 || 0;
      dugPreko60 += d.dug_preko_60 || 0;
      dugPreko120 += d.dug_preko_120 || 0;
    });

    return res.json({
      success: true,
      data: dugovanja,
      stats: { ukupanDug, dugPreko24, dugPreko30, dugPreko60, dugPreko120 },
      count: dugovanja.length
    });
  } catch (error) {
    console.error('Pregled dugovanja error:', error);
    res.status(500).json({
      success: false,
      error: 'Greška pri učitavanju dugovanja'
    });
  }
});

app.get('/api/partneri', verifyToken, async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute('CALL komercijala.pregled_svih_partnera()');
    await connection.end();

    const partneri = Array.isArray(rows) && rows.length > 0 ? rows[0] : [];

    return res.json({
      success: true,
      data: partneri,
      count: partneri.length
    });
  } catch (error) {
    console.error('Pregled partnera error:', error);
    res.status(500).json({
      success: false,
      error: 'Greška pri učitavanju partnera'
    });
  }
});

app.get('/api/teren-grad', verifyToken, async (req, res) => {
  try {
    const { sifraRadnika } = req.user;
    const connection = await getConnection();
    const [rows] = await connection.execute(
      'CALL komercijala.pregled_terena_grad(?)',
      [sifraRadnika]
    );
    await connection.end();

    const data = Array.isArray(rows) && rows.length > 0 ? rows[0] : [];

    return res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    console.error('Pregled terena-grad error:', error);
    res.status(500).json({
      success: false,
      error: 'Greška pri učitavanju terena'
    });
  }
});

app.get('/api/terena-po-danima', verifyToken, async (req, res) => {
  try {
    const { sifraRadnika } = req.user;
    const connection = await getConnection();
    const [rows] = await connection.execute(
      'CALL komercijala.pregled_terena_po_danima(?)',
      [sifraRadnika]
    );
    await connection.end();

    const data = Array.isArray(rows) && rows.length > 0 ? rows[0] : [];

    return res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    console.error('Pregled terena-po-danima error:', error);
    res.status(500).json({
      success: false,
      error: 'Greška pri učitavanju terena'
    });
  }
});

app.get('/api/uplate', verifyToken, async (req, res) => {
  try {
    const { sifraRadnika } = req.user;
    const connection = await getConnection();
    const [rows] = await connection.execute(
      'CALL komercijala.pregled_uplata(?)',
      [sifraRadnika]
    );
    await connection.end();

    const data = Array.isArray(rows) && rows.length > 0 ? rows[0] : [];

    return res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    console.error('Pregled uplata error:', error);
    res.status(500).json({
      success: false,
      error: 'Greška pri učitavanju uplata'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
