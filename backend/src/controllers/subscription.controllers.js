import mongoose, { isValidObjectId } from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js";
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
        return res.status(400).json(new ApiResponse(401, [], "Invalid channel id"))
    }

    //bug1: When entering channel Id which does not exist, user was able to subscribe or unsubscribe it
    //fix: Need to check whether channel Id (channel) is present in USER db or not as channel is nothing but a user only
    const isChannelExisting = await User.findById(channelId)
    if(!isChannelExisting){
        return res.status(400).json(new ApiResponse(401, [], "Channel does not exist"))
    }

    //if channel present, then compare both ids as user cannot subscribe his own channel
    if (subscriberId.toString() === channelId.toString()) {
        return res.status(400).json(new ApiResponse(401, [], "User cannot subscribe to his own channel"))
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

//#region Code for getting how many channels and which channels has user subscribed to
const getSubscribedChannels = asyncHandler(async (req, res) => {
    //getting count of how many channels has user subscribed
    const { username } = req.params
    if (!username.trim()) {
        return res.status(400).json(new ApiResponse(401, [], "Invalid Username"))
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
                channels: { $push: "$channelDetails" } // Collect channel usernames
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

    if(channelSubscriptionCount.length === 0){
        return res.status(400).json(new ApiResponse(401, [], "User has not subscribed to any channel"))
    }

    //return the number of channels user has subscribed to
    return res.status(201).json(
        new ApiResponse(200, channelSubscriptionCount, "Successfully fetched count of channels user has subscribed to")
    )
})
//#endregion

//#region Code to check whether current user has subscribed to particular channel or not, for persisting data in frontend
const checkSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscriberId = req.user?._id;
    
    // If user is not logged in, they are not subscribed
    if (!subscriberId) {
        return res.status(200).json(
            new ApiResponse(200, { isSubscribed: false }, "User not logged in")
        );
    }
    
    // Check if channel id is valid
    if (!isValidObjectId(channelId)) {
        return res.status(400).json(
            new ApiResponse(400, { isSubscribed: false }, "Invalid channel id")
        );
    }
    
    // Check if subscription exists
    const subscription = await Subscription.findOne({ 
        subscriber: subscriberId, 
        channelSubscribed: channelId 
    });
    
    return res.status(200).json(
        new ApiResponse(200, { isSubscribed: !!subscription }, "Subscription status fetched")
    );
});
//#endregion

//#region Code to get all channels for search optimization
const getAllChannels = asyncHandler(async (req, res) => {
    // Get all channels (username and their id) from the database
    const allChannels = await User.find({})

    //If channels not found by db, just send an error
    if(!allChannels){
        return res.status(400).json(new ApiResponse(401, [], "No channels found, Something went wrong"))
    }

    //If channels found, then send the channels as response
    return res.status(201).json(new ApiResponse(200, allChannels, "Successfully fetched all channels"))
})
//#endregion

export { toggleSubscription, getSubscribedChannels, checkSubscription, getAllChannels }