import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js"
import { uploadToCloudinary, deletefromCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

//#region Code for Registering Users
const registerUser = asyncHandler(async (req, res) => {
    //get user details
    const { username, fullName, email, password } = req.body;

    //all validations when details are obtained ( not empty )
    if ([fullName, email, username, password].some((field) => { field?.trim() === "" })) {
        return res.status(400).json(new ApiResponse(401, [], "Please enter all the fields"))
    }

    //check whether user is already registers ( username, email )
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        return res.status(400).json(new ApiResponse(401, [], "User already exists"))
    }

    /*check avtar and cover-image ( it is required )
        i. if avtar and cover-iamge present, then upload it to cloudinary
        ii. check whether cloudinary has got these things or not
    */
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if (!avatarLocalPath) {
        return res.status(400).json(new ApiResponse(401, [], "Avatar file is required"))
    }
    const avatar = await uploadToCloudinary(avatarLocalPath);
    const coverImage = await uploadToCloudinary(coverImageLocalPath);
    if (!avatar) {
        return res.status(400).json(new ApiResponse(401, [], "Please upload an avatar file"))
    }

    //create user object that will be stored in DB ( creating entry in db )
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    /*remove pwd and refresh token from response ( not to be visible by users )
        i. check if user is created, if yes then return response.
    */
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if (!createdUser) {
        return res.status(400).json(new ApiResponse(401, [], "Something went wrong while registering user"))
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User successfully resgitered")
    )
})
//#endregion

//#region Code for UserLogin 
const loginUser = asyncHandler(async (req, res) => {

    //get user details
    const { email, username, password } = req.body

    //check if username or password is empty, if not then throw an error
    if (!email && !username) {
        return res.status(400).json(new ApiResponse(401, [], "Please enter all the fields"))
    }

    //check if given username or email matches the ones in db or not, if not then throw error
    const user = await User.findOne({ $or: [{ username }, { email }] })
    if (!user) {
        return res.status(400).json(new ApiResponse(401, [], "User not found"))
    }

    //if username or email matches, check the obtained password with isPasswordCorrect function (will compare password from database and entered at login, return true or false)
    const pwdValidation = await user.isPasswordCorrect(password)
    //if false is returned, then we can say that password does not match and throw an error based on it
    if (!pwdValidation) {
        return res.status(400).json(new ApiResponse(401, [], "Invalid Password"))
    }

    //If everything matches, then generate an access token and refresh token so that once login is done, with the help of cookie we can skip regular logins and jwt token will make us login directly 
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    //set options to be passed in cookies, combination is typically used to enhance cookie security in web applications.
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "Lax"
    }
    //send response as user is logged in with passing cookies(Access Token, Refresh Token) to cookieStorage
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )
})
//#endregion

//#region Code for User logout
const logoutUser = asyncHandler(async (req, res) => {
    //To logout, we need to clear (delete) the existing refresh token in db, so that next time, without actual login, you should not access pages directly
    User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } }, { new: true })
    const options = {
        httpOnly: true,
        secure: true
    }

    //when returning, if cookies are cleared as well as db refresh token is cleared, then we can say that logged out is successful
    return res.status(201).clearCookie("accessToken", options).clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, "User Logged Out successfully")
        )
})
//#endregion

//#region Code for Refreshing Tokens
const refreshAccessToken = asyncHandler(async (req, res) => {
    //get refresh token either from cookie storage or body, if token is not obtained throw an error
    const incomingToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingToken)
        return res.status(400).json(new ApiResponse(401, [], "Unauthorized request"))

    try {
        //decode the token meaning check the token where it's refresh_token_secret matches, if yes then we can get the user based on this refresh token
        const decodedToken = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET)
        //if refresh token is correct, as it is also saved in every user's info (DB), we can get details of user
        const user = await User.findById(decodedToken?._id)
        //if user not present or both refresh tokens do not match, then just throw errors preventing use of stolen or reused refresh tokens
        if (!user)
            return res.status(400).json(new ApiResponse(401, [], "Invalid refresh token"))
        if (incomingToken !== user.refreshToken)
            return res.status(400).json(new ApiResponse(401, [], "Refresh token is either expired or is in use"))

        //if tokens match, generate new tokens and send it as a response
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
        const options = {
            httpOnly: true,
            secure: true
        }
        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(200, { accessToken, refreshToken: refreshToken }, "Access token refreshed sucessfully")
            )
    } catch (error) {
        return res.status(400).json(new ApiResponse(401, [], error?.message || "Invalid refresh token"))
    }
})
//#endregion

//#region Code for Changing passwords
const changingPassword = asyncHandler(async (req, res) => {
    //Get passwords from user
    const { oldPassword, newPassword, confirmPassword } = req.body;

    //Get user details, if user is logged in, by req.user we will get current user with it's id
    const user = await User.findById(req.user?._id)

    //check if your current or old password is correct by using isPasswordCorerect() which will compare password with stored password in db, return true or false
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    //if password does not match, throw error
    if (!isPasswordCorrect) {
        return res.status(400).json(new ApiResponse(401, [], "Wrong password, try again"))
    }

    //also check if user is confirmed that he wants that password
    if (!(newPassword === confirmPassword)) {
        return res.status(400).json(new ApiResponse(401, [], "Please enter new password correctly to confirm"))
    }

    //once you get new password, save it in db and return a response
    user.password = confirmPassword
    await user.save({ validateBeforeSave: false })
    return res.status(200).json(
        new ApiResponse(200, "Password changed sucessfully")
    )
})
//#endregion

//#region Code for Getting current User
const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(201).json(
        new ApiResponse(200, req.user, "Successfully obtained current user")
    )
})
//#endregion

//#region Code for updating Avatar set by users
const updateUserAvatar = asyncHandler(async (req, res) => {
    // //get user details with avatar url from db and delete it from cloudinary, so that cloudinary will only hold new or current images not history
    const user = await User.findById(req.user._id)
    if (!user) {
        return res.status(400).json(new ApiResponse(401, [], "User hasn't logged in or not found"))
    }

    if (user.avatar) {
        const publicId = user.avatar.split("/").pop().split(".")[0]; // Extract Cloudinary public_id
        const isOldFileDeleted = await deletefromCloudinary(publicId) // Delete old avatar from Cloudinary
    }

    //get new avatar file path given by user and check if file is fetched or not
    const avatarPath = req.file?.path
    if (!avatarPath) {
        return res.status(400).json(new ApiResponse(401, [], "Avatar file not found"))
    }

    //if avatar file is obtained, upload to cloudinary and get it's url, if url is not obtained, throw an error
    const avatar = await uploadToCloudinary(avatarPath)
    if (!avatar.url) {
        return res.status(400).json(new ApiResponse(401, [], "Error while uploading avatar file to cloudinary"))
    }

    //if avatar url is obtained by coudinary, update the avatar url in db with this url and send response of successful updation
    const userAvatarDoc = await User.findByIdAndUpdate(req.user?._id, { $set: { avatar: avatar.url } }, { new: true }).select("-password")
    return res.status(201).json(
        new ApiResponse(200, userAvatarDoc, "Avatar updated Successfully")
    )
})
//#endregion

//region Code for updating cover image set by users
const updateUserCoverImage = asyncHandler(async (req, res) => {
    //get coverImage url from db and delete it from cloudinary, so that cloudinary will only hold new or current images not history
    const user = await User.findById(req.user._id)
    if (!user) {
        return res.status(400).json(new ApiResponse(401, [], "User hasn't logged in or not found"))
    }

    if (user.coverImage) {
        const publicId = user.coverImage.split("/").pop().split(".")[0]; // Extract Cloudinary public_id
        const isOldFileDeleted = await deletefromCloudinary(publicId) // Delete old avatar from Cloudinary
    }

    //get new cover image file path given by user and check if file is fetched or not
    const coverImagePath = req.file?.path
    if (!coverImagePath) {
        return res.status(400).json(new ApiResponse(401, [], "Cover image not found"))
    }

    //if cover image file is obtained, upload to cloudinary and get it's url, if url is not obtained, throw an error
    const coverImage = await uploadToCloudinary(coverImagePath)
    if (!coverImage.url) {
        return res.status(400).json(new ApiResponse(401, [], "Error while uploading cover image to cloudinary"))
    }

    //if cover image url is obtained by coudinary, update the cover image url in db with this url and send response of successful updation
    const userCoverImageDoc = await User.findByIdAndUpdate(req.user?._id, { $set: { coverImage: coverImage.url } }, { new: true }).select("-password")
    return res.status(201).json(
        new ApiResponse(200, userCoverImageDoc, "Cover Image updated Successfully")
    )
})
//#endregion

//#region Code for getting count of Subscribers to channel and count of channels which user has subscribed ( Many to Many collection )
const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username?.trim()) {
        return res.status(400).json(new ApiResponse(401, [], "Username is missing"))
    }

    //Basically we will write a aggregate pipeline ( a query ) to get channel details with projected fields.
    const channel = await User.aggregate([
        {
            //Filtered one document out of many, basically matched the current username with db username
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            //we now basically join users with subscription to get subscribers (joining _id in users with channelSubscribed in subscription)
            //result is stored in the subscribers array. This array contains all users subscribed to this channel.
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channelSubscribed",
                as: "subscribers"
            }
        },
        {
            //also we are joining users with subscription to get channels that the user has subscribed to. (joining _id in users with subscriber in subscription)
            //result is stored in the subscribedTo array. This array contains all channels that particular user has subscribed to.
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            //Adding custom fields like count of subscribers, channels and checking whether user has subscribed to channel or not
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscriptionCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            //We choose the final shape of the result — only keeping the fields we care about
            $project: {
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                fullName: 1,
                createdAt: 1,
                subscribersCount: 1,
                channelSubscriptionCount: 1,
                isSubscribed: 1
            }
        }
    ])

    if (!channel?.length) {
        return res.status(400).json(new ApiResponse(401, [], "Channel not found"))
    }

    //if channel exists, you will get user details, subscribersCount, channelSubscriptionCount, where user has subscribed or not (boolean), just send this response
    return res.status(201).json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})
//#endregion

//#region Get Watch History for user
const getWatchHistory = asyncHandler(async (req, res) => {
    //Basically we will write a aggregate pipeline ( a query ) to get watch history.
    /*
    basically we are getting what user has watched, how it will work is once user watches a video, in watch history the video details must be saved as an array
    when video details are saved, it comes with a Owner field where owner of the video also is saved, this owner comes from users model only,
    so in sub pipeline we are getting the details of that user who has published this video, and in main pipeline, when we get video information with it's owner,
    it gets saved in array of watch history, basically array of videos user has watched.
    */
   const user = await User.aggregate([
       {
           //First step is we will match the id with current user (re.user?._id actually gives a string value, so to convert and get id we have taken the id in the form of ObjectID)
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            //Second step now is to find watch history, we have written a sub pipeline to get the results
            //Main lookup where we are getting video details which will be saved in array of watchHistory
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        //sub lookup or sub pipeline where we are getting details of the owner of that video which is going to be saved in that array of watchHistory
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                //we are just getting owner's name and his avatar to be saved with video information
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, user[0].watchHistory, "Watch History has been obtained")
    )
})
//#endregion

//#region HELPER FUNCTIONS
const generateAccessAndRefreshToken = async (userId) => {

    //Generating an access and refresh token so that when user is successfully logged in, both tokens will be stored in cookies and from next time, user is automatically skipping login and based on tokens, he is directly getting logged in
    //Also, once login is done, new refresh token is saved in db as well, so if cookie storage gets cleared due to some issue, this db refresh token will also help to automatically logging in the website

    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        return res.status(500).json(new ApiResponse(401, [], "Something went wrong while generating Access and Refresh Token"))
    }
}
//#endregion

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changingPassword,
    getCurrentUser,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}