import * as NarudzbeService from '../services/aktivneNarudzbe.service.js';

export const getAktivneNarudzbeGrupisano = async (req, res) => {
  try {
    console.log('Sifra terena:', req.sifraTerena); // Dodaj log za sifraTerena


    const narudzbeGrupisane = await NarudzbeService.getAktivneNarudzbeGrupisano(req.sifraTerena); //Moguca greska
    return res.json({ success: true, data: narudzbeGrupisane, count: narudzbeGrupisane.length });
  } catch (error) {
    console.error('Pregled artikala error:', error);
    return res.status(500).json({ success: false, error: 'Greška pri učitavanju artikala' });
  }
};