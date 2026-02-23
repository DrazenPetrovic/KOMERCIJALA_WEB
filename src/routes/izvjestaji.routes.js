import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as IzvjestajiController from '../controllers/izvjestaji.controller.js';

const router = Router();

router.get('/komercijalisti', verifyToken, IzvjestajiController.getListaKomercijalisti);
router.get('/izvjestaj-poslednji', verifyToken, IzvjestajiController.getIzvjestajiPoslednji);
router.get('/izvjestaj-datum/:p_start_date/:p_end_date', verifyToken, IzvjestajiController.getIzvjestajiDatum);
router.post('/save', verifyToken, IzvjestajiController.savePartnerReport);
router.get('/:sifraPartnera', verifyToken, IzvjestajiController.getPartnerReports);





export default router;
