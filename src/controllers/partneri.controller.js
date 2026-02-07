import * as PartneriService from '../services/partneri.service.js';

export const getPartneri = async (req, res) => {
  try {
    const partneri = await PartneriService.getPartneri();
    return res.json({ success: true, data: partneri, count: partneri.length });
  } catch (error) {
    console.error('Pregled partnera error:', error);
    return res.status(500).json({ success: false, error: 'Greška pri učitavanju partnera' });
  }
};
