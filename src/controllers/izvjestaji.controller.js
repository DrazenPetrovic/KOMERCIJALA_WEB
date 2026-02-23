import * as IzvjestajiService from '../services/izvjestaji.service.js';

export const savePartnerReport = async (req, res) => {
  try {
    const { sifraPartnera, podaci } = req.body;
    const { sifraRadnika } = req.user;

    if (!sifraPartnera || !podaci) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nedostaju obavezni podaci (sifraPartnera, podaci)' 
      });
    }

    const result = await IzvjestajiService.savePartnerReport(
      sifraRadnika,
      sifraPartnera,
      podaci
    );

    return res.json(result);
  } catch (error) {
    console.error('Greška pri spremanju izvještaja:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Greška pri spremanju izvještaja' 
    });
  }
};

export const getPartnerReports = async (req, res) => {
  try {
    const { sifraPartnera } = req.params;

    if (!sifraPartnera) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nedostaje šifra partnera' 
      });
    }

    const data = await IzvjestajiService.getIzvjestajiIstorija(sifraPartnera);
    return res.json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('Greška pri učitavanju izvještaja:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Greška pri učitavanju izvještaja' 
    });
  }
};

export const getListaKomercijalisti = async (req, res) => {
  try {
    const data = await IzvjestajiService.getListaKomercijalisti();
    // console.log('Lista komercijalista:', data);
    return res.json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('Greška pri učitavanju liste komercijalista:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Greška pri učitavanju liste komercijalista' 
    });
  }
};

export const getIzvjestajiPoslednji = async (req, res) => {
  try {
    const data = await IzvjestajiService.getIzvjestajiPoslednji();
    console.log('Poslednji izvještaji:', data);
    return res.json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('Greška pri učitavanju posljednjih izvještaja:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Greška pri učitavanju posljednjih izvještaja' 
    });
  }
};

export const getIzvjestajiDatum = async (req, res) => {
  try {
    const { p_start_date, p_end_date } = req.params;

    if (!p_start_date || !p_end_date) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nedostaju datumi' 
      });
    }

    const data = await IzvjestajiService.getIzvjestajipoDatumu(p_start_date, p_end_date);
    return res.json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('Greška pri učitavanju izvještaja:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Greška pri učitavanju izvještaja' 
    });
  }
};
