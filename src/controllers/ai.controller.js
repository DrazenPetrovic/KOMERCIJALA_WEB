import * as aiService from "../services/ai.service.js";

// export const getAktivneNarudzbeGrupisano = async (req, res) => {
//   try {
//     const sifraTerena = r‚
// žćeq.query.sifraTerena || req.params.sifraTerena;

//     if (!sifraTerena) {
//       return res.status(400).json({ success: false, error: 'Sifra terena je obavezna' });
//     }

//     const narudzbeGrupisane = await NarudzbeService.getAktivneNarudzbeGrupisano(sifraTerena);
//     return res.json({ success: true, data: narudzbeGrupisane, count: narudzbeGrupisane.length });
//   } catch (error) {
//     console.error('Pregled grupisanih narudžbi error:', error);
//     return res.status(500).json({ success: false, error: 'Greška pri učitavanju narudžbi' });
//   }
// };
