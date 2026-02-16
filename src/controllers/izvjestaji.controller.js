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


// export const getPartnerReports = async (req, res) => {
//   try {
//     const { sifraPartnera } = req.params;

//     if (!sifraPartnera) {
//       return res.status(400).json({ 
//         success: false, 
//         error: 'Nedostaje šifra partnera' 
//       });
//     }

//     const data = await IzvjestajiService.getPartnerReports(sifraPartnera);
//     return res.json({ success: true, data, count: data.length });
//   } catch (error) {
//     console.error('Greška pri učitavanju izvještaja:', error);
//     return res.status(500).json({ 
//       success: false, 
//       error: 'Greška pri učitavanju izvještaja' 
//     });
//   }
// };



