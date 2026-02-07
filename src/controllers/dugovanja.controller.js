import * as DugovanjaService from '../services/dugovovanja.service.js';

export const getDugovanja = async (req, res) => {
  try {
    const { sifraRadnika } = req.user;
    const { dugovanja, stats } = await DugovanjaService.getDugovanja(sifraRadnika);

    return res.json({
      success: true,
      data: dugovanja,
      stats,
      count: dugovanja.length,
    });
  } catch (error) {
    console.error('Pregled dugovanja error:', error);
    return res.status(500).json({ success: false, error: 'Greška pri učitavanju dugovanja' });
  }
};
