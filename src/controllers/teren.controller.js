import * as TerenService from '../services/teren.service.js';

export const getTerenGrad = async (req, res) => {
  try {
    //const { sifraRadnika } = req.user;
    const data = await TerenService.getTerenGrad();
    return res.json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('Pregled teren-grad error:', error);
    return res.status(500).json({ success: false, error: 'Greška pri učitavanju terena' });
  }
};

export const getTerenPoDanima = async (req, res) => {
  try {
    //const { sifraRadnika } = req.user;
    const data = await TerenService.getTerenPoDanima();
    return res.json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('Pregled terena-po-danima error:', error);
    return res.status(500).json({ success: false, error: 'Greška pri učitavanju terena' });
  }
};
