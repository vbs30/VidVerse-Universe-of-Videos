import Router from "express"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createPlaylist, getPlaylistById, getUserPlaylist, updatePlaylistById, deletePlaylistById, addVideosToPlaylist, removeVideosFromPlaylist } from "../controllers/playlist.controllers.js";

const router = Router()
router.use(verifyJWT)

router.route("/create-playlist").post(createPlaylist)
router.route("/get-user-playlist").get(getUserPlaylist)
router.route("/p/:playlistId").get(getPlaylistById).delete(deletePlaylistById).patch(updatePlaylistById)

router.route("/add/:videoId/:playlistId").patch(addVideosToPlaylist)
router.route("/remove/:videoId/:playlistId").patch(removeVideosFromPlaylist)

export default router