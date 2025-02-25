import mongoose, { isValidObjectId } from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js";

//#region Code for Toggling Subscribe to Unsubscribe and vice versa
const toggleSubscription = asyncHandler(async (req, res) => {
    //We want the user to subscribe or unsubscribe a channel, to toggle between subscribe and unsubscribe
    //Get subscriberId as a person who will subscribe to the channel and channelId
    const { channelId } = req.params
    const subscriberId = req.user._id


    //check if channel id is valid or not, meaning there is a channel by this id or not
    if (!isValidObjectId(channelId)) {
        throw new ApiError(401, "Invalid channel, check it's ID")
    }

    //if channel present, then compare both ids as user cannot subscribe his own channel
    if (subscriberId.toString() === channelId.toString()) {
        throw new ApiError(401, "User cannot subscribe to himself or his own channel")
    }

    //now, once we know that subscriber and channel have different ids, we can check whether they have already subscribed or not
    //we will do this by finding whether a document exists with subscriberId and channelId that we have
    const doSubscriptionExist = await Subscription.findOne({ subscriber: subscriberId, channelSubscribed: channelId })

    //if Document exists, then just delete this document, this will indicate that subscription is deleted, user has unsubscribed to the channel
    if (doSubscriptionExist) {
        await Subscription.findByIdAndDelete(doSubscriptionExist._id)
        return res.status(201).json(
            new ApiResponse(200, "Unsubscribed Successfully")
        )
    }

    //if Document does not exist, then create a document with this subscriberId and channelId, this will indicate that user has subscribed to the channel
    await Subscription.create({ subscriber: subscriberId, channelSubscribed: channelId })
    return res.status(201).json(
        new ApiResponse(200, "Subscribed Successfully")
    )

})
//#endregion

//#region Code to get count of subscribers of a channel
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
            //now we will make a new variable or add a field which will count the subscribers and store the value in this new field
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                }
            }
        },
        {
            //we will project or return the fields which we want to display or see as results
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
//#endregion

//#region Code for getting how many channels and which channels has user subscribed to
const getSubscribedChannels = asyncHandler(async (req, res) => {
    //getting count of how many channels has user subscribed
    const { username } = req.params
    if (!username.trim()) {
        throw new ApiError(401, "Invalid Username")
    }

    const channelSubscriptionCount = await User.aggregate([
        {
            // Match the searched or given username with the one in the database
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            // Join Users with Subscription by Users._id = Subscription.subscriber
            $lookup: {
                from: "subscriptions", // Collection name
                localField: "_id", // User's _id
                foreignField: "subscriber", // Field in Subscription collection referring to user's _id
                as: "subscribedTo" // Alias for joined data
            }
        },
        {
            // Flatten the array to access channelSubscribed field directly
            $unwind: "$subscribedTo"
        },
        {
            // Join Subscription.channelSubscribed with Users collection to get channel details
            $lookup: {
                from: "users", // Collection of channels/users
                localField: "subscribedTo.channelSubscribed", // Channel's _id from Subscription
                foreignField: "_id", // Matching field in Users collection
                as: "channelDetails" // Alias for joined data
            }
        },
        {
            // Flatten the array to access channelDetails directly
            $unwind: "$channelDetails"
        },
        {
            // Group the results by user to get count and list of channel usernames
            $group: {
                _id: "$_id", // Grouping by user's _id
                username: { $first: "$username" }, // Keep the user's username
                countofChannels: { $sum: 1 }, // Count the number of channels subscribed
                channels: { $push: "$channelDetails.username" } // Collect channel usernames
            }
        },
        {
            // Project only the required fields in the output
            $project: {
                username: 1,
                countofChannels: 1,
                channels: 1 // List of channels user has subscribed to
            }
        }
    ])

    //return the number of channels user has subscribed to
    return res.status(201).json(
        new ApiResponse(200, channelSubscriptionCount, "Successfully fetched count of channels user has subscribed to")
    )
})
//#endregion

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels }