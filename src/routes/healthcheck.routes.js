import { Router } from "express";
import { healthChecker } from "../controllers/healthcheck.controllers.js";

const router = Router();

router.route("/").get(healthChecker);

export default router;