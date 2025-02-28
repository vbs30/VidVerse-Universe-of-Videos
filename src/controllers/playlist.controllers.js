import mongoose, { isValidObjectId } from "mongoose"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Playlist } from "../models/playlist.models.js"
import { Video } from "../models/video.models.js"

//#region Code to create new playlist
const createPlaylist = asyncHandler(async (req, res) => {
    //get name of playlist, it's description and current user who will be the owner of the playlist (creater of the playlist)
    const { name, description } = req.body
    const userId = req.user?._id
    const videoId = []

    //check whether name and description are obtained or not
    if (!name && !description) {
        throw new ApiError(401, "Please enter both name and description to create the playlist");
    }

    //if data is obtained, store this in Playlist collection and get the details to show at response
    const playlistDetails = await Playlist.create({
        name,
        description,
        videos: videoId,
        owner: userId
    })

    //if playlist is not created, send an error
    if (!playlistDetails) {
        throw new ApiError(401, "Something went wrong while creating playlist")
    }

    //if we get playlist details, then send a successful response
    return res.status(201).json(
        new ApiResponse(200, playlistDetails, "Playlist created successfully")
    )
})
//#endregion

//#region Code for fetching particular User's playlists
const getUserPlaylist = asyncHandler(async (req, res) => {
    //get current user's id
    const { userId } = req.user?._id

    //get document where owner is this current user, can be multiple documents too
    const playlistDetails = await Playlist.find(userId)

    if (!playlistDetails) {
        throw new ApiError(401, "Playlist not found, either User hasn't created any playlist or something went wrong while fetching it")
    }

    return res.status(201).json(
        new ApiResponse(200, playlistDetails, "Playlist fetched successfully")
    )

})
//#endregion

//#region Code to get playlist by id
const getPlaylistById = asyncHandler(async (req, res) => {
    //get playlist id by url parameter
    const { playlistId } = req.params

    //check whether the id is valid Object id or not
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(401, "Invalid Playlist Id")
    }

    //if playlistId is valid, find it in Playlist collection and get playlist details with entire video details
    const playlistDetails = await Playlist.aggregate([
        {
            //first we will match the Playlist collection's id with playlistid what we got in url parameter
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            //once match is done, we now join Video collection with Playlist collection where Playlist.videos = Videos._id
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "video_details"
            }
        },
        {
            //we will add a field where we will count videos in that playlist
            $addFields: {
                videoCount: {
                    $size: "$video_details"
                }
            }
        },
        {
            //we will just display or project playlist and video details
            $project: {
                name: 1,
                description: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1,
                videoCount: 1,
                video_details: 1
            }
        }
    ]);

    //check if playlist details are fetched or not
    if (!playlistDetails) {
        throw new ApiError(401, "Playlist not found")
    }

    //return a response if playlist details are found
    return res.status(201).json(
        new ApiResponse(200, playlistDetails, "Playlist details fetched successfully")
    )
})
//#endregion

//#region Code to update playlist by id
const updatePlaylistById = asyncHandler(async (req, res) => {
    //get playlist-id from url parameters,new name and new description which you want to update
    const { playlistId } = req.params
    const { name, description } = req.body
    const userId = req.user?._id

    //check whether the id is valid Object id or not
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(401, "Invalid Playlist Id")
    }

    //need this as user can either update name or description or both
    const updatePlaylistDetails = {}
    if (name) {
        updatePlaylistDetails.name = name
    }

    if (description) {
        updatePlaylistDetails.description = description
    }

    //check whether updated values are fetched or they are empty, if empty then no need to call db unecessarily
    if (Object.keys(updatePlaylistDetails).length === 0) {
        throw new ApiError(401, "Nothing to update, please enter name or description to update the playlist")
    }

    //once you get values which are going to update, just call db and update by playlist id, make sure you also check whether current user is owner of playlist or not
    const newPlaylistDetails = await Playlist.findOneAndUpdate({ _id: playlistId, owner: userId }, {
        $set: updatePlaylistDetails
    }, { new: true })

    //check if updation is sucessful by fetching the new details
    if (!newPlaylistDetails) {
        throw new ApiError(401, "Playlist cannot be updated, either you are not the owner of it or something went wrong while updating it")
    }

    //return a response if playlist details are updated
    return res.status(201).json(
        new ApiResponse(200, newPlaylistDetails, "Playlist details updated successfully")
    )
})
//#endregion

//#region Code for deleting playlist by Id
const deletePlaylistById = asyncHandler(async (req, res) => {
    //get playlist id by url parameter
    const { playlistId } = req.params
    const userId = req.user?._id

    //check whether the id is valid Object id or not
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(401, "Invalid Playlist Id")
    }

    //if playlistId is valid, find it in Playlist collection, with correct owner id as owner must delete the playlist no one else
    const playlistDetails = await Playlist.findOneAndDelete({ _id: playlistId, owner: userId })

    //check if playlist details are fetched or not
    if (!playlistDetails) {
        throw new ApiError(401, "Playlist not found, Either you have not created it or something went wrong while deleting it")
    }

    //return a response if playlist details are found
    return res.status(201).json(
        new ApiResponse(200, playlistDetails.name, "Playlist deleted successfully")
    )

})
//#endregion


//#region Code for adding Videos to playlist
const addVideosToPlaylist = asyncHandler(async (req, res) => {
    //get videoId and playlistId by url parameters
    const { videoId, playlistId } = req.params
    const userId = req.user?._id

    //check whether you have got valid videoID and playlistId 
    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid Video ID")
    }
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(401, "Invalid playlist ID")
    }

    //also we need to check if video and playlist both really exist or not, if not then it will be a bug as just ids are getting used
    //bug1: saw that videoid for video (not existing) was also getting saved, so need to check first whether playlist or video really exist
    const isVideoExisting = await Video.findById(videoId)
    if (!isVideoExisting) {
        throw new ApiError(401, "Video does not exist anywhere")
    }

    const isPlaylistExisting = await Playlist.findById(playlistId)
    if (!isPlaylistExisting) {
        throw new ApiError(401, "Playlist does not exist anywhere")
    }

    //bug3: same video was getting stored, so need to check if video is stored already or not
    // Check if video already exists in the playlist
    if (isPlaylistExisting.videos.includes(videoId)) {
        throw new ApiError(400, "Video already exists in the playlist");
    }

    //if you got both valid ids, then just update the videos array of Playlist collection and add video id to it
    //bug2: video id was just getting updated, it was not adding up, so used $push instead of $set, it just pushes ids instead of updating one id
    const playlistDetails = await Playlist.findOneAndUpdate({ _id: playlistId, owner: userId }, {
        $push: {
            videos: videoId
        }
    }, { new: true })

    //check if addition of videoId is sucessful or not
    if (!playlistDetails) {
        throw new ApiError(401, "Video was not added in the playlist, something went wrong")
    }

    //if successful, return a response
    return res.status(201).json(
        new ApiResponse(200, playlistDetails.videos, "Video added successfully")
    )
})
//#endregion

//#region Code for removing videos from playlist
const removeVideosFromPlaylist = asyncHandler(async (req, res) => {
    //get videoId and playlistId by url parameters
    const { videoId, playlistId } = req.params
    const userId = req.user?._id

    //check whether you have got valid videoID and playlistId 
    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid Video ID")
    }
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(401, "Invalid playlist ID")
    }

    //check if playlist exist or not    
    const isPlaylistExisting = await Playlist.findById(playlistId)
    if (!isPlaylistExisting) {
        throw new ApiError(401, "Playlist does not exist anywhere")
    }

    // Check if video does not exist in the playlist
    if (!isPlaylistExisting.videos.includes(videoId)) {
        throw new ApiError(400, "Video does not exist in this playlist, you cannot delete what is not present");
    }

    // if video present in playlist, delete it and return response if successfully deleted or return error
    const deletedVideo = await Playlist.findOneAndUpdate({ _id: playlistId, owner: userId }, {
        $pull: {
            videos: videoId
        }
    })

    if (!deletedVideo) {
        throw new ApiError(401, "Video was not removed from the playlist")
    }

    return res.status(201).json(
        new ApiResponse(200, deletedVideo.videos[0], "Video deleted Successfully")
    )

})
//#endregion

export { createPlaylist, getUserPlaylist, getPlaylistById, updatePlaylistById, deletePlaylistById, addVideosToPlaylist, removeVideosFromPlaylist }