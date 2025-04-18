import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT, optionalJWT } from "../middlewares/auth.middleware.js";
import { createVideo, deleteVideo, getVideoById, updateVideoDetails, getVideoByUserId, getAllVideos, getVideoByUsername, updateView } from "../controllers/video.controllers.js";

const router = Router()

router.route("/create-video").post(verifyJWT, upload.fields([
    {
        name: "videoFile",
        maxCount: 1,
    },
    {
        name: "thumbnail",
        maxCount: 1,
    }
]), createVideo)

router.route("/v/:videoId").get(getVideoById).delete(verifyJWT, deleteVideo)
router.route("/v/:videoId").patch(verifyJWT, upload.fields([
    {
        name: "thumbnail",
        maxCount: 1
    },
    {
        name: "videoFile",
        maxCount: 1
    }
]), updateVideoDetails)

router.route("/user-videos").get(verifyJWT, getVideoByUserId)

router.route("/all-videos").get(getAllVideos)
router.route("/cv/:channelName").get(getVideoByUsername)

router.route("/view/:videoId").get(optionalJWT, updateView);


export default router