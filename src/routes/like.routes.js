import { Router } from 'express';
import { getLikedVideos, getLikedComments, getLikedTweets, toggleVideoLike, toggleCommentLike, toggleTweetLike } from "../controllers/like.controllers.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT);

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/liked-videos").get(getLikedVideos);
router.route("/liked-tweets").get(getLikedTweets);
router.route("/liked-comments").get(getLikedComments);

export default router