import { Router } from 'express';
import { getLikedVideos, getLikedComments, getLikedTweets, toggleVideoLike, toggleCommentLike, toggleTweetLike, checkLikes, countofVideoLikes } from "../controllers/like.controllers.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();

router.route("/toggle/v/:videoId").post(verifyJWT, toggleVideoLike);
router.route("/toggle/c/:commentId").post(verifyJWT, toggleCommentLike);
router.route("/toggle/t/:tweetId").post(verifyJWT, toggleTweetLike);
router.route("/liked-videos").get(getLikedVideos);
router.route("/liked-tweets").get(getLikedTweets);
router.route("/liked-comments").get(getLikedComments);
router.route("/check-likes/:videoId").get(verifyJWT, checkLikes);
router.route("/count/:videoId").get(countofVideoLikes);

export default router