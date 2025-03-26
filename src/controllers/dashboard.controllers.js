import { Video } from "../models/video.models.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//#region Code to get all videos that are present in Videos collection made by multiple users
const getAllVideos = asyncHandler(async (req, res) => {
    // Get videos from Video collection
    const videos = await Video.find({});

    if(!videos){
        return res.status(400).json(new ApiResponse(401, [], "No videos exist in database"))
    }

    // Return successful response with the fetched videos
    return res.status(200).json(
        new ApiResponse(200, videos, "All videos fetched successfully")
    );
});
//#endregion

export { getAllVideos }