import { Router } from "express";
import { createTweets, deleteTweet, getUserTweets, updateTweet, getAllTweets } from "../controllers/tweet.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()
router.use(verifyJWT)

router.route("/").get(getAllTweets)
router.route("/create-tweets").post(createTweets)
router.route("/get-tweets").get(getUserTweets)
router.route("/u/:tweetId").post(updateTweet)
router.route("/d/:tweetId").delete(deleteTweet)

export default router