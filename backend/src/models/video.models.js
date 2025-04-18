import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema({
    videoFile: {
        type: String,    //cloudinary url
        requrired: true,
    },

    thumbnail: {
        type: String,  //cloudinary url
        required: true,
    },

    title: {
        type: String,
        required: true,
    },

    description: {
        type: String,  //cloudinary url
        required: true,
    },

    duration: {
        type: String,
        required: true,
    },

    views: {
        type: Number,
        default: 0,
    },

    // isPublished: {
    //     type: Boolean,
    //     default: true,
    // },

    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    ownerName: {
        type: mongoose.Schema.Types.String,
        ref: "User",
    }
}, { timestamps: true });

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema);