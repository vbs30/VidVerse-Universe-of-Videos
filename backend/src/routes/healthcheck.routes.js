import { Router } from "express";
import { healthChecker } from "../controllers/healthcheck.controllers.js";
import { gzipResponseMiddleware } from "../middlewares/gzip.middleware.js";

const router = Router();
router.use(gzipResponseMiddleware)

router.route("/").get(healthChecker);

export default router;