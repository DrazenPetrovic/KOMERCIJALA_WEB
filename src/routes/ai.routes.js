import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import * as AiController from "../controllers/ai.controller.js";

const router = Router();
// router.get('/', verifyToken, AiController.getArtikli);
router.post("/kupac-analiza", verifyToken, AiController.kupacAnaliza);
router.post("/proizvod-analiza", verifyToken, AiController.proizvodAnaliza);
router.post("/proizvod-pitanje", verifyToken, AiController.proizvodPitanje);

export default router;
