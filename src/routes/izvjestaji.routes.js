import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as IzvjestajiController from '../controllers/izvjestaji.controller.js';

const router = Router();

router.get('/komercijalisti', verifyToken, IzvjestajiController.getListaKomercijalisti);
router.get('/izvjestaj-poslednji', verifyToken, IzvjestajiController.getIzvjestajiPoslednji);
router.post('/save', verifyToken, IzvjestajiController.savePartnerReport);
router.get('/:sifraPartnera', verifyToken, IzvjestajiController.getPartnerReports);





export default router;
