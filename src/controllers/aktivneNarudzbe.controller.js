import * as NarudzbeService from '../services/aktivneNarudzbe.service.js';

export const getAktivneNarudzbeGrupisano = async (req, res) => {
  try {
    const sifraTerena = req.query.sifraTerena || req.params.sifraTerena;


    if (!sifraTerena) {
      return res.status(400).json({ success: false, error: 'Sifra terena je obavezna' });
    }

    const narudzbeGrupisane = await NarudzbeService.getAktivneNarudzbeGrupisano(sifraTerena);
    return res.json({ success: true, data: narudzbeGrupisane, count: narudzbeGrupisane.length });
  } catch (error) {
    console.error('Pregled grupisanih narudžbi error:', error);
    return res.status(500).json({ success: false, error: 'Greška pri učitavanju narudžbi' });
  }
};



export const getAktivneNarudzbe = async (req, res) => {
  try {
    const sifraTerena = req.query.sifraTerena || req.params.sifraTerena;
  

    if (!sifraTerena) {
      return res.status(400).json({ success: false, error: 'Sifra terena je obavezna' });
    }
    
    const narudzbeAktivne = await NarudzbeService.getAktivneNarudzbe(sifraTerena);
    return res.json({ success: true, data: narudzbeAktivne, count: narudzbeAktivne.length });
  } catch (error) {
    console.error('Pregled narudžbi error:', error);
    return res.status(500).json({ success: false, error: 'Greška pri učitavanju narudžbi' });
  }
};