import { Router } from 'express';
import { getLikedVideos, getLikedComments, getLikedTweets, toggleVideoLike, toggleCommentLike, toggleTweetLike, checkLikes, countofVideoLikes, countofCommentLikes, checkLikesforComment } from "../controllers/like.controllers.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { gzipResponseMiddleware } from "../middlewares/gzip.middleware.js";

const router = Router();
router.use(gzipResponseMiddleware)

router.route("/toggle/v/:videoId").post(verifyJWT, toggleVideoLike);
router.route("/check-likes/:videoId").get(verifyJWT, checkLikes);
router.route("/count/:videoId").get(countofVideoLikes);
router.route("/liked-videos").get(verifyJWT, getLikedVideos);

router.route("/toggle/c/:commentId").post(verifyJWT, toggleCommentLike);
router.route("/check-comment-likes/:commentId").get(verifyJWT, checkLikesforComment);
router.route("/countComment/:commentId").get(countofCommentLikes);
router.route("/liked-comments").get(verifyJWT, getLikedComments);

router.route("/toggle/t/:tweetId").post(verifyJWT, toggleTweetLike);
router.route("/liked-tweets").get(verifyJWT, getLikedTweets);

export default router