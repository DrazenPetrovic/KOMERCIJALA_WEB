import * as PartneriService from '../services/partneri.service.js';

export const getPartneri = async (req, res) => {
  try {
        const { sifraRadnika } = req.user;
    const partneri = await PartneriService.getPartneri(sifraRadnika);
    return res.json({ success: true, data: partneri, count: partneri.length });
  } catch (error) {
    console.error('Pregled partnera error:', error);
    return res.status(500).json({ success: false, error: 'Greška pri učitavanju partnera' });
  }
};


export const getPartneriDodatniPodaci = async (req, res) => {
  try {
    const partneri = await PartneriService.getPartneriSaADodacima();
    return res.json({ 
      success: true, 
      data: partneri, 
      count: partneri.length 
    });
    console.log('Partneri sa dodatnim podacima:', partneri);
  } catch (error) {
    console.error('Pregled partnera dodatni podaci error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Greška pri učitavanju partnera dodatni podaci' 
    });
  }
};