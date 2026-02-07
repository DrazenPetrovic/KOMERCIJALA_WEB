import * as ArtikliService from '../services/artikli.service.js';

export const getArtikli = async (req, res) => {
  try {
    const artikli = await ArtikliService.getArtikli();
    return res.json({ success: true, data: artikli, count: artikli.length });
  } catch (error) {
    console.error('Pregled artikala error:', error);
    return res.status(500).json({ success: false, error: 'Greška pri učitavanju artikala' });
  }
};