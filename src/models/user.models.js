import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
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
        type: String,     //will be encrypted when stored in database
        required: [true, "Password is required"],
    },

    fullName: {
        type: String,
        required: true,
        trim: true,
        inedx: true,
    },

    avatar: {
        type: String,   //cloudinary url will be used for this avatar
        required: true,
    },

    coverImage: {
        type: String,
    },

    watchHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
        }
    ],

    refreshToken: {
        type: String,
    },
}, { timestamps: true })


//will use pre hook: just before saving pwd, we will encrypt it and then save, fraction of seconds work.
userSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
})

//will compare password from database and entered at login, return true or false
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}


userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

/*
The async keyword was causing the return values to be wrapped in Promises unnecessarily.
After making these changes, the tokens should be returned as strings directly and will be properly stored in cookies
*/
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model('User', userSchema)