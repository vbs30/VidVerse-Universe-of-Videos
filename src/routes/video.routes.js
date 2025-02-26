import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createVideo, deleteVideo, getVideoById, updateVideoDetails } from "../controllers/video.controllers.js";

const router = Router()
router.use(verifyJWT)

router.route("/create-video").post(upload.fields([
    {
        name: "videoFile",
        maxCount: 1,
    },
    {
        name: "thumbnail",
        maxCount: 1,
    }
]) ,createVideo)

router.route("/v/:videoId").get(getVideoById).delete(deleteVideo)
router.route("/v/:videoId").patch(upload.fields([
    {
        name: "thumbnail",
        maxCount: 1
    },
    {
        name: "videoFile",
        maxCount: 1
    }
]), updateVideoDetails)


export default router