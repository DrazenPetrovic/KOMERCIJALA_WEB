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

// Dodajte novu funkciju:

export const addDodatniPodaci = async (req, res) => {
  try {
    const { sifraRadnika } = req.user;
    const { sifra_partnera, dodatni_podaci_opis, dodatni_podaci } = req.body;

    if (!sifra_partnera || !dodatni_podaci_opis || !dodatni_podaci) {
      return res.status(400).json({ 
        success: false, 
        error: 'Svi podaci su obavezni' 
      });
    }

    const result = await PartneriService.addDodatniPodaci({
      sifra_partnera,
      dodatni_podaci_opis,
      dodatni_podaci,
      sifra_radnika: sifraRadnika,
    });

    return res.json({ 
      success: true, 
      data: result,
      message: 'Podaci su uspješno dodani' 
    });
  } catch (error) {
    console.error('Add dodatni podaci error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Greška pri dodavanju podataka' 
    });
  }
};