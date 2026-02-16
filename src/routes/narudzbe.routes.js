import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as NarudzbeController from '../controllers/aktivneNarudzbe.controller.js';

const router = Router();



router.get('/narudzbe-grupisane', verifyToken, NarudzbeController.getAktivneNarudzbeGrupisano);
router.get('/narudzbe-aktivne', verifyToken, NarudzbeController.getAktivneNarudzbe);

// ✅ POST ruta - NOVA
router.post('/create', verifyToken, NarudzbeController.createNarudzba);

export default router;