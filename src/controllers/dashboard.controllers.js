import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//#region Code to get all videos that are present in Videos collection made by multiple users
const getAllVideos = asyncHandler(async (req, res) => {
    // Get page and limit from query parameters, defaulting to page 1 and limit 10 if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 2;

    // Options for pagination: current page, limit of documents per page, and sorting by title in ascending order
    const options = {
        page: page,
        limit: limit,
        sort: { createdAt: -1 },
    };

    // Create an empty aggregate pipeline to fetch all videos without filtering
    const aggregate = Video.aggregate([]);

    // Fetch paginated videos using the aggregate pipeline and options
    const videos = await Video.aggregatePaginate(aggregate, options);

    // Check if videos were found, if not, throw an error
    if (!videos.docs || videos.docs.length === 0) {
        throw new ApiError(404, "No videos found or an error occurred while fetching.");
    }

    // Return successful response with the fetched videos
    return res.status(200).json(
        new ApiResponse(200, videos, "All videos fetched successfully")
    );
});
//#endregion

export { getAllVideos }