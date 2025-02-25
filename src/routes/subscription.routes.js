import { Router } from "express"
import { getUserChannelSubscribers, getSubscribedChannels, toggleSubscription } from "../controllers/subscription.controllers.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/c/:channelName").get(getUserChannelSubscribers)
router.route("/u/:username").get(getSubscribedChannels)
router.route("/c/:channelId").post(verifyJWT, toggleSubscription)

export default router;