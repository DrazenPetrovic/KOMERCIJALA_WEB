import * as IzvjestajiService from '../services/izvjestaji.services.js';

export const getIzvjestajiIstorija = async (req, res) => {
  try {
    const { sifraPartnera } = req.query;
    
    if (!sifraPartnera) {
      return res.status(400).json({ success: false, error: 'sifraPartnera parametar je obavezan' });
    }
    
    const IzvjestajiIstorija = await IzvjestajiService.getIzvjestajiIstorija(sifraPartnera);
    return res.json({ success: true, data: IzvjestajiIstorija, count: IzvjestajiIstorija.length });
  } catch (error) {
    console.error('Pregled izvještaja error:', error);
    return res.status(500).json({ success: false, error: 'Greška pri učitavanju izvještaja' });
  }
};
