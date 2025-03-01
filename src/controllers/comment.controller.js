import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comments.models.js";
import { User } from "../models/user.models.js";

//#region Code to get all comments that are present below a video from Comment collection
const getVideoComments = asyncHandler(async (req, res) => {
    // Get page and limit from query parameters, defaulting to page 1 and limit 10 if not provided
    const { videoId } = req.params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 2;

    // Options for pagination: current page, limit of documents per page, and sorting by title in ascending order
    const options = {
        page: page,
        limit: limit,
        sort: { title: 1 },
    };

    // Create an empty aggregate pipeline to fetch all comments for a video
    const aggregate = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        }
    ]);

    // Fetch paginated videos using the aggregate pipeline and options
    const comments = await Comment.aggregatePaginate(aggregate, options);

    // Check if videos were found, if not, throw an error
    if (!comments.docs || comments.docs.length === 0) {
        throw new ApiError(404, "No comments found or an error occurred while fetching.");
    }

    // Return successful response with the fetched videos
    return res.status(200).json(
        new ApiResponse(200, comments, "All comments fetched successfully")
    );
});
//#endregion

//#region Code for Adding new Comment
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
//#endregion

//#region Code for updating a comment
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
//#endregion

//#region Code for deleting a comment
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
//#endregion

export { getVideoComments, addComment, updateComment, deleteComment }