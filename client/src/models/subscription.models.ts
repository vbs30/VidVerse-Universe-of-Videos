import mongoose, { Document, Schema } from "mongoose";

// Define the interface for Subscription document
interface ISubscription extends Document {
  subscriber: mongoose.Types.ObjectId;
  channelSubscribed: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Create the schema
const subscriptionSchema = new Schema<ISubscription>(
  {
    subscriber: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    
    channelSubscribed: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

// Create and export the model
export const Subscription = mongoose.model<ISubscription>("Subscription", subscriptionSchema);