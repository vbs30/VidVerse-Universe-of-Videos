import { Router } from "express"
import { getSubscribedChannels, toggleSubscription, checkSubscription, getAllChannels } from "../controllers/subscription.controllers.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { gzipResponseMiddleware } from "../middlewares/gzip.middleware.js";

const router = Router()
router.use(gzipResponseMiddleware)

router.route("/u/:username").get(getSubscribedChannels)
router.route("/c/:channelId").post(verifyJWT, toggleSubscription)
router.route("/check/:channelId").get(verifyJWT, checkSubscription)
router.route("/all-channels").get(getAllChannels)

export default router;