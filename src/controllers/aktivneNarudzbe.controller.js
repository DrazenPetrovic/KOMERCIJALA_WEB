import * as NarudzbeService from '../services/aktivneNarudzbe.service.js';

export const getAktivneNarudzbeGrupisano = async (req, res) => {
  try {
    console.log('Sifra terena:', req.sifraTerena); // Dodaj log za sifraTerena


    const narudzbeGrupisane = await NarudzbeService.getAktivneNarudzbeGrupisano(req.sifraTerena); //Moguca greska
    return res.json({ success: true, data: narudzbeGrupisane, count: narudzbeGrupisane.length });
  } catch (error) {
    console.error('Pregled grupisanih narudžbi error:', error);
    return res.status(500).json({ success: false, error: 'Greška pri učitavanju artikala' });
  }
};



export const getAktivneNarudzbe = async (req, res) => {
  try {
    
    const narudzbeGrupisane = await NarudzbeService.getAktivneNarudzbe(req.sifraTerena); //Moguca greska
    return res.json({ success: true, data: narudzbeAktivne, count: narudzbeGrupisane.length });
  } catch (error) {
    console.error('Pregled narudžbi error:', error);
    return res.status(500).json({ success: false, error: 'Greška pri učitavanju artikala' });
  }
};