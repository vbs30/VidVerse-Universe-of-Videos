import mongoose, { Document, Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Define interface for User methods
interface IUserMethods {
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

// Define the interface for User document
interface IUser extends Document, IUserMethods {
  username: string;
  email: string;
  password: string;
  fullName: string;
  avatar: string;
  coverImage?: string;
  watchHistory: mongoose.Types.ObjectId[];
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create the schema
const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    
    password: {
      type: String, //will be encrypted when stored in database
      required: [true, "Password is required"],
    },
    
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true, // Fixed typo from 'inedx' to 'index'
    },
    
    avatar: {
      type: String, //cloudinary url will be used for this avatar
      required: true,
    },
    
    coverImage: {
      type: String,
    },
    
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      }
    ],
    
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// Will use pre hook: just before saving pwd, we will encrypt it and then save, fraction of seconds work.
userSchema.pre("save", async function(this: IUser, next) {
  if (!this.isModified("password"))
    return next();
    
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Will compare password with stored password in db, return true or false
userSchema.methods.isPasswordCorrect = async function(this: IUser, password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function(this: IUser): string {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET as string,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  );
};

/* The async keyword was causing the return values to be wrapped in Promises unnecessarily.
After making these changes, the tokens should be returned as strings directly and will be properly stored in cookies */
userSchema.methods.generateRefreshToken = function(this: IUser): string {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET as string,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  );
};

// Create and export the model
export const User = mongoose.model<IUser>('User', userSchema);