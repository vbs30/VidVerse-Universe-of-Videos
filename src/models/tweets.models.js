import mongoose from "mongoose";

const tweetsSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },

    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    ownerName: {
        type: mongoose.Schema.Types.String,
        ref: "User",
    },
}, { timestamps: true })

export const Tweet = mongoose.model("Tweet", tweetsSchema)