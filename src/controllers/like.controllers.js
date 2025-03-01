import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/likes.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { Tweet } from "../models/tweets.models.js";
import { Comment } from "../models/comments.models.js";

//#region Code for toggling video likes
const toggleVideoLike = asyncHandler(async (req, res) => {
    //get video by id which user wants to like or unlike
    const { videoId } = req.params;
    const userId = req.user.id;

    //check whether video id is valid or not
    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid video ID");
    }

    //if video id is valid, check whether this video really exists or not
    const isVideoExisting = await Video.findById(videoId)
    if (!isVideoExisting) {
        throw new ApiError(401, "The video you want to like does not exist")
    }

    //check if video already is liked by that user, if liked then delete that document (this will automatically unlike the video)
    const existingLike = await Like.findOne({ video: videoId, likedBy: userId });

    if (existingLike) {
        const unlike = await existingLike.deleteOne();
        //return status if video is unliked
        return res.status(201).json(
            new ApiResponse(200, unlike, "Video unliked successfully")
        );
    }

    //if video hasn't been liked by user, create a document with video and liked by a user id, this will indicate that user has liked the video
    const like = await Like.create({ video: videoId, likedBy: userId });

    //return status if video is liked
    res.status(201).json(new ApiResponse(201, like, "Video liked successfully"));
});
//#endregion

//#region Code for toggling comment likes
const toggleCommentLike = asyncHandler(async (req, res) => {
    //get comment by id which user wants to like or unlike
    const { commentId } = req.params;
    const userId = req.user.id;

    //check whether comment id is valid or not
    if (!isValidObjectId(commentId)) {
        throw new ApiError(401, "Invalid comment ID");
    }

    //if comment id is valid, check whether this comment really exists or not
    const isCommentExisting = await Comment.findById(commentId)
    if (!isCommentExisting) {
        throw new ApiError(401, "The comment you want to like does not exist")
    }

    //check if comment is already liked or not, this can be done by getting the document where userid and commentid is stored
    //if docoment is obtained, delete it
    const existingLike = await Like.findOne({ comment: commentId, likedBy: userId });

    if (existingLike) {
        const unlike = await existingLike.deleteOne();
        //return a response about comment is unliked
        return res.status(200).json(new ApiResponse(200, unlike, "Comment unliked"));
    }

    //if document is not obtained, create a new document, this will indicate that user has liked the comment
    const like = await Like.create({ comment: commentId, likedBy: userId });

    //return a response about comment is liked
    res.status(201).json(new ApiResponse(201, like, "Comment liked"));
});
//#endregion

//#region Code for toggling tweet likes
const toggleTweetLike = asyncHandler(async (req, res) => {
    //get tweet by id which user wants to like
    const { tweetId } = req.params;
    const userId = req.user.id;

    //check whether tweet id is valid or not
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    //if tweet id is valid, check whether this tweet really exists or not
    const isTweetExisting = await Tweet.findById(tweetId)
    if (!isTweetExisting) {
        throw new ApiError(401, "The tweet you want to like does not exist")
    }

    //check if tweet is already liked or not, this can be done by getting the document where userid and tweetid is stored
    //if docoment is obtained, delete it
    const existingLike = await Like.findOne({ tweet: tweetId, likedBy: userId });

    if (existingLike) {
        const unlike = await existingLike.deleteOne();
        //return a response about tweet is unliked
        return res.status(200).json(new ApiResponse(200, unlike, "Tweet unliked"));
    }

    //if document is not obtained, create a new document, this will indicate that user has liked the tweet
    const like = await Like.create({ tweet: tweetId, likedBy: userId });

    //return a response about user liked the tweet
    res.status(201).json(new ApiResponse(201, like, "Tweet liked"));
});
//#endregion

//#region Code for getting videos that are liked by user
const getLikedVideos = asyncHandler(async (req, res) => {
    //Get user by id
    const userId = req.user.id;
    //get documents where user id is present, this will indicate that user has liked that video
    const likedVideos = await Like.find({ likedBy: userId }).populate("video");
    //return response as all videos that are liked
    res.status(200).json(new ApiResponse(200, "Liked videos retrieved", likedVideos));
});
//#endregion

//#region Code for getting tweets that are liked by user
const getLikedTweets = asyncHandler(async (req, res) => {
    //get user by id
    const userId = req.user.id;
    //get documents where user id is present, this will indicate that user has liked that tweet
    const likedTweets = await Like.find({ likedBy: userId }).populate("tweet");
    //return response as all tweets that are liked
    res.status(200).json(new ApiResponse(200, "Liked tweets retrieved", likedTweets));
});
//#endregion

//#region Code for getting comments that are liked by user
const getLikedComments = asyncHandler(async (req, res) => {
    //get user by id
    const userId = req.user.id;
    //get documents where user id is present, this will indicate that user has liked that comment
    const likedComments = await Like.find({ likedBy: userId }).populate("comment");
    //return response as all comments that are liked
    res.status(200).json(new ApiResponse(200, "Liked comments retrieved", likedComments));
});
//#endregion

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getLikedTweets,
    getLikedComments
};
