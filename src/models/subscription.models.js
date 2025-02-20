import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscriber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    channelSubscribed: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
})

export const Subscription = mongoose.model("Subscription", subscriptionSchema);