import mongoose, { isValidObjectId } from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js";


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
})


const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    //getting count of subscribers a channel has
    //first of all we will get the channel name (user's channel name) as input to search and return count of subscribers of that channel
    const { channelName } = req.params
    if (!channelName.trim()) {
        throw new ApiError(401, "Invalid Channel Name")
    }

    const countOfSubscribers = await User.aggregate([
        {
            //We will match the searched or given username with the one in database, if username is present then further work
            $match: {
                username: channelName?.toLowerCase()
            }
        },
        {
            // we will join Users with Subscription by Users._id = Subscription.channelSubscribed
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channelSubscribed",
                as: "subscribers"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                }
            }
        },
        {
            $project: {
                subscribersCount: 1
            }
        }
    ])

    //return the number of subscribers a channel has as a response
    return res.status(201).json(
        new ApiResponse(200, countOfSubscribers, "Successfully fetched count of subscribers")
    )
})


const getSubscribedChannels = asyncHandler(async (req, res) => {
    //getting count of how many channels has user subscribed
    const { username } = req.params
    if (!username.trim()) {
        throw new ApiError(401, "Invalid Username")
    }

    const channelSubscriptionCount = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "Subscription",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                countofChannels: {
                    $size: "$subscribedTo"
                }
            }
        },
        {
            $project: {
                subscribedTo: 1
            }
        }
    ])

    //return the number of channels user has subscribed to
    return res.status(201).json(
        new ApiResponse(200, channelSubscriptionCount, "Successfully fetched count of channels user has subscribed to")
    )
})

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels }