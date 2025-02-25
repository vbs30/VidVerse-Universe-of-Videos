import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js";
import { Tweet } from "../models/tweets.models.js";


//#region Create new tweets
const createTweets = asyncHandler(async (req, res) => {
    //get current user who will be the owner, the content he is tweeting
    const owner = req.user?.username
    const { content } = req.body

    //check whether user has inputed content for the tweet or not
    if (!content) {
        throw new ApiError(401, "Please enter a tweet")
    }

    //if we get content and username, just store it in Tweet collection
    const tweet = await Tweet.create({ content, owner: owner })

    //If tweet document is not created, throw an error
    if (!tweet) {
        throw new ApiError(401, "Something went wrong while creating your tweet")
    }

    //if tweet is created successfully, return a response with tweet details.
    return res.status(201).json(
        new ApiResponse(200, tweet, "Tweet is successfully created")
    )
})
//#endregion



export { createTweets }