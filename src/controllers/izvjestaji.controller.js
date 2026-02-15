import * as IzvjestajiService from '../services/izvjestaji.service.js';

export const getIzvjestajiIstorija = async (req, res) => {
  try {
    const { sifraRadnika } = req.user;
    const izvjestaji = await IzvjestajiService.getIzvjestajiIstorija(sifraRadnika);
    return res.json({ success: true, data: izvjestaji, count: izvjestaji.length });
  } catch (error) {
    console.error('Pregled izvještaja error:', error);
    return res.status(500).json({ success: false, error: 'Greška pri učitavanju izvještaja' });
  }
};
