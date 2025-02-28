import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comments.models.js";
import { User } from "../models/user.models.js";

//TODO: get all comments and use pagination like page: 1, limit: 20 comments

const addComment = asyncHandler(async (req, res) => {
    //get video by id
    const { videoId } = req.params
    const { content } = req.body
    const userId = req.user?._id

    //check whether id is valid or not
    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid Video id")
    }

    //check whether content is available or is empty
    if (!content) {
        throw new ApiError(401, "Please enter comment, don't keep it blank")
    }

    //once content is available, store it in Comment collection
    const newComment = await Comment.create({
        content,
        video: videoId,
        owner: userId
    })

    //check if comment is stored in db
    if (!newComment) {
        throw new ApiError(401, "Something went wrong while creating this comment")
    }

    //return response if comment is stored successfully
    return res.status(201).json(
        new ApiResponse(200, newComment, "Comment created successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body
    const userId = req.user?._id

    //check whether comment id is valid or not
    if (!isValidObjectId(commentId)) {
        throw new ApiError(401, "Invalid comment id")
    }

    //check whether it is present in Comment collection or not
    const commentDetails = await Comment.findById(commentId)
    if (!commentDetails) {
        throw new ApiError(401, "Comment you are seeking does not exist")
    }

    //if comment exist, then update it with db, need to update the content only
    const updatedComment = await Comment.findOneAndUpdate({ _id: commentId, owner: userId }, {
        content: content
    }, { new: true })

    //check if comment is updated, if updated then send successful response, if not then send an error
    if (!updatedComment) {
        throw new ApiError(401, "Comment not updated, either you are not the creator or something went wrong while updating it")
    }

    return res.status(201).json(
        new ApiResponse(200, updateComment, "Comment updated successfully")
    )
})


const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const userId = req.user?._id

    //check whether comment id is valid or not
    if (!isValidObjectId(commentId)) {
        throw new ApiError(401, "Invalid comment id")
    }

    //check whether it is present in Comment collection or not
    const commentDetails = await Comment.findById(commentId)
    if (!commentDetails) {
        throw new ApiError(401, "Comment you are seeking does not exist")
    }

    //if comment exist, then update it with db, need to update the content only
    const deletedComment = await Comment.findOneAndDelete({ _id: commentId, owner: userId })

    //check if comment is updated, if updated then send successful response, if not then send an error
    if (!deletedComment) {
        throw new ApiError(401, "Comment not deleted, either you are not the creator or something went wrong while deleting it")
    }

    return res.status(201).json(
        new ApiResponse(200, deletedComment, "Comment deleted successfully")
    )
})

export { addComment, updateComment, deleteComment }