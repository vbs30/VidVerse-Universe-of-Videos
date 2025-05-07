import mongoose, { Document, Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// Define the interface for Comment document
interface IComment extends Document {
  content: string;
  video: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Create the schema
const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: true
    },
    
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video"
    },
    
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

// Add the plugin
commentSchema.plugin(mongooseAggregatePaginate);

// Create and export the model
export const Comment = mongoose.model<IComment>("Comment", commentSchema);