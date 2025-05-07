import mongoose, { Document, Schema } from "mongoose";

// Define the interface for Like document
interface ILike extends Document {
  comment?: mongoose.Types.ObjectId;
  video?: mongoose.Types.ObjectId;
  likedBy: mongoose.Types.ObjectId;
  tweet?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Create the schema
const likeSchema = new Schema<ILike>(
  {
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment"
    },
    
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video"
    },
    
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet"
    }
  },
  { timestamps: true }
);

// Create and export the model
export const Like = mongoose.model<ILike>("Like", likeSchema);