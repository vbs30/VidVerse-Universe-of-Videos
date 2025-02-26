import mongoose, { isValidObjectId } from "mongoose"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"
import { Video } from "../models/video.models.js"
import { uploadToCloudinary, deletefromCloudinary, deleteVideoFromCloudinary } from "../utils/cloudinary.js"

//#region Code to create video and upload it to cloudinary and db
const createVideo = asyncHandler(async (req, res) => {
    //get title, description and duration for the video
    const { title, description, duration } = req.body
    //all validations when details are obtained ( not empty )
    if ([title, description, duration].some((field) => { field?.trim() === "" })) {
        throw new ApiError(400, "Please enter all the fields")
    }

    //get current user
    const ownerId = req.user?._id
    const ownerName = req.user?.username

    //get the video file path from video, thumbnail path from thumbnail image
    const videoFilePath = req.files?.videoFile[0].path
    const thumbnailPath = req.files?.thumbnail[0].path

    if (!videoFilePath) {
        throw new ApiError(401, "Something went wrong, Please check if you have uploaded the video")
    }

    if (!thumbnailPath) {
        throw new ApiError(401, "Something went wrong, Please check if you have uploaded the thumbnail image")
    }

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
        throw new ApiError(401, "Something went wrong while storing the video")
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
        throw new ApiError(401, "Please enter correct video Id")
    }

    //if videoId is valid, obtain the video details from db
    const video = await Video.findById(videoId)

    //check whether video details are correctly fetched or not, if not then send an error
    if (!video) {
        throw new ApiError(401, "Video not found, enter correct video id")
    }

    //if video details are obtained, send a success response with video file (video url)
    return res.status(201).json(
        new ApiResponse(200, video.videoFile, "Video fetched successfully")
    )
})
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
        throw new ApiError(401, "Please enter correct video Id")
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
            throw new ApiError(401, "Thumbnail has not been uploaded to cloudinary")
        }

        updateFields.thumbnail = updatedThumbnailToCloudinary.url
    }

    //if video is given by user, then first delete the video from cloudinary, upload new one and get it's url to be saved in db
    if (videoFile) {
        let publicId = videoDetails.videoFile.split("/").pop().split(".")[0]; // Extract Cloudinary public_id
        const isOldFileDeleted = await deleteVideoFromCloudinary(publicId) // Delete that url file from cloudinary

        const updatedVideoToCloudinary = await uploadToCloudinary(videoFile)
        if (!updatedVideoToCloudinary) {
            throw new ApiError(401, "Video has not been uploaded to cloudinary")
        }

        updateFields.videoFile = updatedVideoToCloudinary.url
    }

    // If no fields provided, throw an error
    if (Object.keys(updateFields).length === 0) {
        throw new ApiError(400, "Please provide at least one field to update");
    }

    const newVideoDetails = await Video.findOneAndUpdate({ _id: videoId, ownerId: req.user._id }, { $set: updateFields }, { new: true })

    if (!newVideoDetails) {
        throw new ApiError(404, "Video not found or could not be updated");
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

    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "Please enter correct video Id")
    }

    //for deleting a video, you need to delete the db document as well as the video file in cloudinary
    const videoDetails = await Video.findOneAndDelete({ _id: videoId, ownerId: req.user?._id })
    console.log(videoDetails);


    //if we don't get any video details, send an error
    if (!videoDetails) {
        throw new ApiError(401, "Either the video was not created by you or something went wrong while deleting it")
    }

    //if Video details are fetched, delete operation is sucessful, so send a response
    return res.status(201).json(
        new ApiResponse(200, videoDetails.videoFile, "Video deleted successfully")
    )

})
//#endregion


export { createVideo, getVideoById, deleteVideo, updateVideoDetails }