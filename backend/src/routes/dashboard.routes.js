import { Router } from "express";
import { getAllVideos } from "../controllers/dashboard.controllers.js";
import { gzipResponseMiddleware } from "../middlewares/gzip.middleware.js";

const router = Router()
router.use(gzipResponseMiddleware)

router.route("/all-videos").get(getAllVideos)

export default router;