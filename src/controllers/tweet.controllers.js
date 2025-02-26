import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js";
import { Tweet } from "../models/tweets.models.js";


//#region Code for creating new tweets
const createTweets = asyncHandler(async (req, res) => {
    //get current user who will be the owner, the content he is tweeting
    const ownerId = req.user?._id
    const ownerName = req.user?.username
    const { content } = req.body

    //check whether user has inputed content for the tweet or not
    if (!content) {
        throw new ApiError(401, "Please enter a tweet")
    }

    //if we get content and username, just store it in Tweet collection
    const tweet = await Tweet.create({ content, ownerId: ownerId, ownerName: ownerName })

    //If tweet document is not created, throw an error
    if (!tweet) {
        throw new ApiError(401, "Something went wrong while creating your tweet")
    }

    //if tweet is created successfully, return a response with tweet details.
    return res.status(201).json(
        new ApiResponse(200, "Tweet is successfully created")
    )
})
//#endregion

//#region Code for getting user's tweets
const getUserTweets = asyncHandler(async (req, res) => {
    //get current user's id which will be the owner of the tweets he/she made
    const ownerId = req.user?._id

    //get tweet document with respect to user's id
    const tweetDetails = await Tweet.find({ ownerId })

    //If we don't get any details, throw an error
    if (!tweetDetails) {
        throw new ApiError(401, "Tweet not found")
    }

    //If we get tweet document, send a successful response
    return res.status(201).json(
        new ApiResponse(200, tweetDetails, "Tweet details fetched successfully")
    )
})
//#endregion

//#region Code for updating tweets
const updateTweet = asyncHandler(async (req, res) => {
    //get tweet id as to update any tweet document, you would need it's id, also get new content 
    const { tweetId } = req.params
    const { content } = req.body

    //check if given tweetId is correct or not
    if(!isValidObjectId(tweetId)){
        throw new ApiError(401, "Specified wrong tweet-id")
    }
    
    //If new content is not obtained, throw an error
    if (!content) {
        throw new ApiError(401, "Please enter content to update")
    }

    //we will find the document and check whether that particular tweet is made by current user or not, as user can only modify his created tweets
    //in same query, if we get current user's id as ownerId, then only we will update the content
    const newTweet = await Tweet.findOneAndUpdate({_id: tweetId, ownerId: req.user._id}, { $set: { content: content } }, { new: true })

    //Check if content is updated
    if (!newTweet) {
        throw new ApiError(401, "Tweet was not updated, either there is no such tweet or you are not the creator of it or there is some technical issue")
    }

    //return a response if tweet is updated
    return res.status(201).json(
        new ApiResponse(200, newTweet, "Tweet updated successfully")
    )
})
//#endregion

//region Code for deleting particular tweet
const deleteTweet = asyncHandler(async (req, res) => {
    //get tweet id as to delete any tweet document, you would need it's id
    const { tweetId } = req.params

    //check if given tweetId is correct or not
    if(!isValidObjectId(tweetId)){
        throw new ApiError(401, "Specified wrong tweet-id")
    }

    //we wil check whether current user who wish to delete a tweet is actually it's creater (owner) in same query
    //now with the help of tweetId, find the document from db and delete it
    const newTweet = await Tweet.findOneAndDelete({_id: tweetId, ownerId: req.user._id})

    //Check if content is deleted
    if (!newTweet) {
        throw new ApiError(401, "Tweet was not deleted, either there is no such tweet or you are not the creator of it or there is some technical issue")
    }

    //return a response if tweet is deleted
    return res.status(201).json(
        new ApiResponse(200, "Tweet deleted successfully")
    )
})
//#endregion

//#region Code for getting all tweets
const getAllTweets = asyncHandler(async (req, res) => {
    const tweets = await Tweet.find({})

    if (!tweets) {
        throw new ApiError(401, "Something went wrong while fetching all the tweets")
    }

    return res.status(201).json(
        new ApiResponse(200, tweets, "Tweets fetched successfully")
    )
})
//#endregion

export { createTweets, getUserTweets, updateTweet, deleteTweet, getAllTweets }