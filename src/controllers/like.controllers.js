import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/likes.models.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { Tweet } from "../models/tweets.models.js";
import { Comment } from "../models/comments.models.js";

//#region Code for toggling video likes
const toggleVideoLike = asyncHandler(async (req, res) => {
    //get video by id which user wants to like or unlike
    const { videoId } = req.params;
    const userId = req.user?._id;

    //check whether video id is valid or not
    if (!isValidObjectId(videoId)) {
        return res.status(400).json(new ApiResponse(401, [], "Invalid video id"))
    }

    //if video id is valid, check whether this video really exists or not
    const isVideoExisting = await Video.findById(videoId)
    if (!isVideoExisting) {
        return res.status(400).json(new ApiResponse(401, [], "You cannot like this video"))
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

//#region Code to check whether current user has liked a particular video or not, for persisting data in frontend
const checkLikes = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id;

    // Check if video id is valid
    if (!isValidObjectId(videoId)) {
        return res.status(400).json(
            new ApiResponse(400, { isLiked: false }, "Invalid video id")
        );
    }

    //if video id is valid, check whether this video really exists or not
    const isVideoExisting = await Video.findById(videoId)
    if (!isVideoExisting) {
        return res.status(400).json(new ApiResponse(401, [], "You cannot like this video"))
    }

    // Check if like exists for the video
    const existingLike = await Like.find({ video: videoId, likedBy: userId });

    return res.status(200).json(
        new ApiResponse(200, { isLiked: !!existingLike, existingLike }, "Like status fetched")
    );
});
//#endregion


//#region Code for getting videos that are liked by user
const getLikedVideos = asyncHandler(async (req, res) => {
    //Get user by id
    const userId = req.user?._id;
    //get documents where user id is present, this will indicate that user has liked that video
    const likedVideos = await Like.find({ likedBy: userId });
    //return response as all videos that are liked
    res.status(200).json(new ApiResponse(200, likedVideos, "Liked videos retrieved"));
});
//#endregion

//#region Code for getting count of likes for a video
const countofVideoLikes = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Check if video id is valid
    if (!isValidObjectId(videoId)) {
        return res.status(400).json(
            new ApiResponse(400, { isLiked: false }, "Invalid video id")
        );
    }

    //if video id is valid, check whether this video really exists or not
    const isVideoExisting = await Video.findById(videoId)
    if (!isVideoExisting) {
        return res.status(400).json(new ApiResponse(401, [], "You cannot like this video"))
    }

    //if video exists, then by finding the video id in likes collection, we can get the count of likes
    const count = await Like.countDocuments({ video: videoId });

    //if count is not obtained or is null, return a response with 0 likes
    if (!count) {
        return res.status(200).json(new ApiResponse(200, { count: 0 }, "No likes found"));
    }

    //if count is obtained, return a response with count of likes
    res.status(200).json(new ApiResponse(200, { count }, "Likes count retrieved"));
})
//#endregion

//#region Code for toggling comment likes
const toggleCommentLike = asyncHandler(async (req, res) => {
    //get comment by id which user wants to like or unlike
    const { commentId } = req.params;
    const userId = req.user?._id;
    
    //check whether comment id is valid or not
    if (!isValidObjectId(commentId)) {
        return res.status(400).json(new ApiResponse(401, [], "Invalid comment id"))
    }

    //if comment id is valid, check whether this comment really exists or not
    const isCommentExisting = await Comment.findById(commentId)
    if (!isCommentExisting) {
        return res.status(400).json(new ApiResponse(401, [], "You cannot like this comment"))
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
    const userId = req.user?._id;

    //check whether tweet id is valid or not
    if (!isValidObjectId(tweetId)) {
        return res.status(400).json(new ApiResponse(401, [], "Invalid tweet id"))
    }
    
    //if tweet id is valid, check whether this tweet really exists or not
    const isTweetExisting = await Tweet.findById(tweetId)
    if (!isTweetExisting) {
        return res.status(400).json(new ApiResponse(401, [], "You cannot like this tweet"))
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

//#region Code for getting tweets that are liked by user
const getLikedTweets = asyncHandler(async (req, res) => {
    //get user by id
    const userId = req.user?._id;
    //get documents where user id is present, this will indicate that user has liked that tweet
    const likedTweets = await Like.find({ likedBy: userId }).populate("tweet");
    //return response as all tweets that are liked
    res.status(200).json(new ApiResponse(200, "Liked tweets retrieved", likedTweets));
});
//#endregion

//#region Code for getting comments that are liked by user
const getLikedComments = asyncHandler(async (req, res) => {
    //get user by id
    const userId = req.user?._id;
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
    getLikedComments,
    checkLikes,
    countofVideoLikes
};
