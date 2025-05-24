import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { gzipResponseMiddleware } from "../middlewares/gzip.middleware.js";
import { getVideoComments, addComment, deleteComment, updateComment } from "../controllers/comment.controller.js";

const router = Router()
router.use(gzipResponseMiddleware)

router.route("/c/:videoId").post(verifyJWT, addComment).get(getVideoComments)
router.route("/u/:commentId").patch(verifyJWT, updateComment).delete(verifyJWT, deleteComment)

export default router