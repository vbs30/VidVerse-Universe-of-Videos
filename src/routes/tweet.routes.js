import { Router } from "express";
import { createTweets } from "../controllers/tweet.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()
router.use(verifyJWT)

router.route("/create-tweets").post(createTweets)

export default router