import mongoose, { Document, Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// Define the interface for Video document
interface IVideo extends Document {
  videoFile: string;
  thumbnail: string;
  title: string;
  description: string;
  duration: string;
  views: number;
  // isPublished: boolean;
  ownerId: mongoose.Types.ObjectId;
  ownerName: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create the schema
const videoSchema = new Schema<IVideo>(
  {
    videoFile: {
      type: String, //cloudinary url
      required: true,
    },
    
    thumbnail: {
      type: String, //cloudinary url
      required: true,
    },
    
    title: {
      type: String,
      required: true,
    },
    
    description: {
      type: String, //cloudinary url
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
    //   type: Boolean,
    //   default: true,
    // },
    
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    
    ownerName: {
      type: String,
      ref: "User",
    }
  },
  { timestamps: true }
);

// Add the plugin
videoSchema.plugin(mongooseAggregatePaginate);

// Create and export the model
export const Video = mongoose.model<IVideo>("Video", videoSchema);