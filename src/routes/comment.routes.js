import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getVideoComments, addComment, deleteComment, updateComment } from "../controllers/comment.controller.js";

const router = Router()
router.use(verifyJWT)

router.route("/c/:videoId").post(addComment).get(getVideoComments)
router.route("/u/:commentId").patch(updateComment).delete(deleteComment)

export default router