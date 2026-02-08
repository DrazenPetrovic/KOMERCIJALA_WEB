import * as UplateService from '../services/uplate.service.js';

export const getUplate = async (req,res) => {
  try {
   //const { sifraRadnika } = req.user;
    const data = await UplateService.getUplate();
    return res.json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('Pregled uplata error:', error);
    return res.status(500).json({ success: false, error: 'Greška pri učitavanju uplata' });
  }
};
