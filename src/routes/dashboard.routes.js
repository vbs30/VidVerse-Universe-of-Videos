import { Router } from "express";
import { getAllVideos } from "../controllers/dashboard.controllers.js";

const router = Router()

router.route("/all-videos").get(getAllVideos)

export default router;