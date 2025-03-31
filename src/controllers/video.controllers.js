import mongoose, { isValidObjectId } from "mongoose"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"
import { uploadToCloudinary, deletefromCloudinary, deleteVideoFromCloudinary } from "../utils/cloudinary.js"
import { getVideoDuration } from "../utils/videoDuration.js"

//#region Code to create video and upload it to cloudinary and db
const createVideo = asyncHandler(async (req, res) => {
    //get title, description and duration for the video
    const { title, description } = req.body
    //all validations when details are obtained ( not empty )
    if ([title, description].some((field) => { field?.trim() === "" })) {
        return res.status(400).json(new ApiResponse(401, [], "Please enter all fields"))
    }

    //get current user
    const ownerId = req.user?._id
    const ownerName = req.user?.username

    //get the video file path from video, thumbnail path from thumbnail image
    const videoFilePath = req.files?.videoFile[0].path
    const thumbnailPath = req.files?.thumbnail[0].path

    if (!videoFilePath) {
        return res.status(400).json(new ApiResponse(401, [], "Something went wrong, Please check if you have uploaded the video"))
    }

    if (!thumbnailPath) {
        return res.status(400).json(new ApiResponse(401, [], "Something went wrong, Please check if you have uploaded the thumbnail image"))
    }

    //get duration for the video, once you upload it to cloudinary
    const duration = await getVideoDuration(videoFilePath)

    //upload video and thumbnail in cloudinary, check for successful upload, if uploaded then you will get the url
    const video = await uploadToCloudinary(videoFilePath);
    const thumbnail = await uploadToCloudinary(thumbnailPath);


    //save all the details in a document in db
    const videoDetails = await Video.create({
        videoFile: video.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration,
        views: 0,
        ownerId,
        ownerName
    })

    //check if video is stored in db
    if (!videoDetails) {
        return res.status(400).json(new ApiResponse(401, [], "Something went wrong while saving the video"))
    }

    //if video is stored successfully, return a response
    return res.status(201).json(
        new ApiResponse(200, videoDetails, "Video uploaded successfully")
    )
})
//#endregion

//#region Code for getting particular video
const getVideoById = asyncHandler(async (req, res) => {
    //get video id by url parameter
    const { videoId } = req.params

    //check whether the videoId is valid or not
    if (!isValidObjectId(videoId)) {
        return res.status(400).json(new ApiResponse(401, [], "Please enter correct video id"))
    }

    //if videoId is valid, obtain the video details from db
    const video = await Video.findById(videoId)

    //check whether video details are correctly fetched or not, if not then send an error
    if (!video) {
        return res.status(400).json(new ApiResponse(401, [], "Please enter correct video id as video not found"))
    }

    //if video details are obtained, send a success response with video file (video url)
    return res.status(201).json(
        new ApiResponse(200, video.videoFile, "Video fetched successfully")
    )
})
//#endregion

//#region Code for getting videos based on user (all videos created by user)
const getVideoByUserId = asyncHandler(async (req, res) => {
    try {
        // Get current user's id
        const userId = new mongoose.Types.ObjectId(req.user?._id);

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get videos by userId with pagination and sorting
        const videos = await Video.find({ ownerId: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Check if videos exist
        if (!videos.length) {
            return res.status(400).json(new ApiResponse(401, [], "No videos created by this user"))
        }

        // Get total video count for pagination info
        const totalVideos = await Video.countDocuments({ ownerId: userId });

        // Return successful response
        return res.status(200).json(
            new ApiResponse(200, { videos, totalVideos }, `Videos for userId: ${userId} fetched successfully`)
        );
    } catch (error) {
        console.error("Error fetching videos:", error);
        res.status(500).json(new ApiError(500, "An error occurred while fetching videos"));
    }
});
//#endregion

//#region Code for getting videos based on user (all videos created by user)
const getVideoByUsername = asyncHandler(async (req, res) => {
    try {
        //first of all we will get the channel name (user's channel name)
        const { channelName } = req.params
        if (!channelName.trim()) {
            return res.status(400).json(new ApiResponse(401, [], "Invalid channel name"))
        }

        // Get videos by username with pagination and sorting
        const videos = await Video.find({ ownerName: channelName })

        // Check if videos exist
        //bug1: If video length is zero meaning user hasn't created any video, giving 400 or 401 error was not handled by frontend as it is an error
        //meaning 401 is an error code and user can have his channel without any videos
        //fix: Changing 400 and 401 to status code 200, 201, so that videos not created by user wil not be an error, and will be handled at frontend very well.
        if (!videos.length) {
            return res.status(200).json(new ApiResponse(200, [], "No videos created by this user"))
        }

        // Get total video count for pagination info
        const totalVideos = await Video.countDocuments({ ownerName: channelName });

        // Return successful response
        return res.status(200).json(
            new ApiResponse(200, { videos, totalVideos }, `Videos fetched successfully`)
        );
    } catch (error) {
        console.error("Error fetching videos:", error);
        res.status(500).json(new ApiError(500, "An error occurred while fetching videos"));
    }
});
//#endregion

//#region Code for updating particular video file
const updateVideoDetails = asyncHandler(async (req, res) => {
    //need to update title, description, thumbnail, video file
    const { videoId } = req.params
    const { title, description } = req.body
    const thumbnail = req.files?.thumbnail?.[0]?.path;
    const videoFile = req.files?.videoFile?.[0]?.path;

    //get existing video document based on provided VideoId which is to be validated before use
    if (!isValidObjectId(videoId)) {
        return res.status(400).json(new ApiResponse(401, [], "Please enter correct video id"))
    }
    const videoDetails = await Video.findById(videoId)

    //check and maintain a object where values which should be updated can be saved and later sent to db or cloudinary
    const updateFields = {}

    if (title) {
        updateFields.title = title;
    }

    if (description) {
        updateFields.description = description;
    }

    //if thumbnail is given by user, then first delete the thumbnail from cloudinary, upload new one and get it's url to be saved in db
    if (thumbnail) {
        let publicId = videoDetails.thumbnail.split("/").pop().split(".")[0]; // Extract Cloudinary public_id
        const isOldFileDeleted = await deletefromCloudinary(publicId) // Delete that url file from cloudinary

        const updatedThumbnailToCloudinary = await uploadToCloudinary(thumbnail)
        if (!updatedThumbnailToCloudinary) {
            return res.status(400).json(new ApiResponse(401, [], "Thumbnail was not uploaded to cloudinary"))
        }

        updateFields.thumbnail = updatedThumbnailToCloudinary.url
    }

    //if video is given by user, then first delete the video from cloudinary, upload new one and get it's url to be saved in db
    if (videoFile) {
        let publicId = videoDetails.videoFile.split("/").pop().split(".")[0]; // Extract Cloudinary public_id
        const isOldFileDeleted = await deleteVideoFromCloudinary(publicId) // Delete that url file from cloudinary

        const updatedVideoToCloudinary = await uploadToCloudinary(videoFile)
        if (!updatedVideoToCloudinary) {
            return res.status(400).json(new ApiResponse(401, [], "Video was not uploaded to cloudinary"))
        }

        updateFields.videoFile = updatedVideoToCloudinary.url
    }

    // If no fields provided, throw an error
    if (Object.keys(updateFields).length === 0) {
        return res.status(400).json(new ApiResponse(401, [], "Please provide atleast one field to update"))
    }

    const newVideoDetails = await Video.findOneAndUpdate({ _id: videoId, ownerId: req.user._id }, { $set: updateFields }, { new: true })

    if (!newVideoDetails) {
        return res.status(400).json(new ApiResponse(401, [], "Something went wrong while updating the video"))
    }

    return res.status(200).json(
        new ApiResponse(200, newVideoDetails, "Video updated successfully")
    );

})
//#endregion

//#region Code for deleting particular video file
const deleteVideo = asyncHandler(async (req, res) => {
    //get video id by url parameter
    const { videoId } = req.params
    const videoDetails = await Video.findById(videoId)

    if (!isValidObjectId(videoId)) {
        return res.status(400).json(new ApiResponse(401, [], "Please enter correct video id"))
    }

    //delete the video from cloudinary also
    let publicId = videoDetails.videoFile.split("/").pop().split(".")[0]; // Extract Cloudinary public_id
    const isOldFileDeleted = await deleteVideoFromCloudinary(publicId) // Delete that url file from cloudinary

    //for deleting a video, you need to delete the db document as well as the video file in cloudinary
    const deletedVideo = await Video.findOneAndDelete({ _id: videoId, ownerId: req.user?._id })


    //if we don't get any video details, send an error
    if (!deletedVideo) {
        return res.status(400).json(new ApiResponse(401, [], "Either the video was not created by you or something went wrong while deleting it"))
    }

    //if Video details are fetched, delete operation is sucessful, so send a response
    return res.status(201).json(
        new ApiResponse(200, deletedVideo.videoFile, "Video deleted successfully")
    )

})
//#endregion

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
        return res.status(400).json(new ApiResponse(401, [], "No videos found or an error occurred while fetching."))
    }

    // Return successful response with the fetched videos
    return res.status(200).json(
        new ApiResponse(200, videos, "All videos fetched successfully")
    );
});
//#endregion


export { createVideo, getVideoById, getVideoByUserId, deleteVideo, updateVideoDetails, getAllVideos, getVideoByUsername }