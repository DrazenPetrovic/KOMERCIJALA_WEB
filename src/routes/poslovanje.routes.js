import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import * as PoslovanjeController from "../controllers/poslovanje.controller.js";

const router = Router();
router.get(
  "/izdani-racuni",
  verifyToken,
  PoslovanjeController.getPoslovanjeIzdaniRacuni,
);
router.get(
  "/izdani-racuni-admin",
  verifyToken,
  PoslovanjeController.getPoslovanjeIzdaniRacuniAdmin,
);
router.get(
  "/naplata-racuna",
  verifyToken,
  PoslovanjeController.getPoslovanjeNaplataRacuna,
);

router.get(
  "/naplata-racuna-admin",
  verifyToken,
  PoslovanjeController.getPoslovanjeNaplataRacunaAdmin,
);

export default router;
