import { Router } from "express"
import { getUserChannelSubscribers, getSubscribedChannels } from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/c/:channelName").get(getUserChannelSubscribers)
router.route("/u/:username").get(getSubscribedChannels)

export default router;