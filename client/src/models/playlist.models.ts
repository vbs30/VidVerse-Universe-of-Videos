import mongoose, { Document, Schema } from "mongoose";

// Define the interface for Playlist document
interface IPlaylist extends Document {
  name: string;
  description: string;
  videos: mongoose.Types.ObjectId[];
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Create the schema
const playlistSchema = new Schema<IPlaylist>(
  {
    name: {
      type: String,
      required: true
    },
    
    description: {
      type: String,
      required: true
    },
    
    videos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video"
      }
    ],
    
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

// Create and export the model
export const Playlist = mongoose.model<IPlaylist>("Playlist", playlistSchema);