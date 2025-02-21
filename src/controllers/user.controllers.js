import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js"
import { uploadToCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"

//#region Code for Registering Users
const registerUser = asyncHandler(async (req, res) => {
    //get user details
    const { username, fullName, email, password } = req.body;

    //all validations when details are obtained ( not empty )
    if ([fullName, email, username, password].some((field) => { field?.trim() === "" })) {
        throw new ApiError(400, "Please enter all the fields")
    }

    //check whether user is already registers ( username, email )
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(400, "User already exists")
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
        throw new ApiError(400, "Avatar file is required")
    }
    const avatar = await uploadToCloudinary(avatarLocalPath);
    const coverImage = await uploadToCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiError(400, "Please upload an avatar file")
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
        throw new ApiError(500, "Something went wrong while user creation (registering)")
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
        throw new ApiError(400, "Please enter all the fields")
    }

    //check if given username or email matches the ones in db or not, if not then throw error
    const user = await User.findOne({ $or: [{ username }, { email }] })
    if (!user) {
        throw new ApiError(404, "User Does not exist")
    }

    //if username or email matches, check the obtained password with isPasswordCorrect function (will compare password from database and entered at login, return true or false)
    const pwdValidation = await user.isPasswordCorrect(password)
    //if false is returned, then we can say that password does not match and throw an error based on it
    if (!pwdValidation) {
        throw new ApiError(404, "Invalid password")
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
            new ApiResponse(200, {}, "User Logged Out successfully")
        )
})
//#endregion

//#region Code for Refreshing Tokens
const refreshAccessToken = asyncHandler(async (req, res) => {
    //get refresh token either from cookie storage or body, if token is not obtained throw an error
    const incomingToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingToken)
        throw new ApiError(401, "Unauthorized request")

    try {
        //decode the token meaning check the token where it's refresh_token_secret matches, if yes then we can get the user based on this refresh token
        const decodedToken = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET)
        //if refresh token is correct, as it is also saved in every user's info (DB), we can get details of user
        const user = await User.findById(decodedToken?._id)
        //if user not present or both refresh tokens do not match, then just throw errors preventing use of stolen or reused refresh tokens
        if (!user)
            throw new ApiError(401, "Invalid refresh token")
        if (incomingToken !== user.refreshToken)
            throw new ApiError(401, "Refresh token is either expired or used")

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
        throw new ApiError(401, error?.message || "Invalid refresh token")
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
        throw new ApiError(401, "Password does not match")
    }

    //also check if user is confirmed that he wants that password
    if (!(newPassword === confirmPassword)) {
        throw new ApiError(401, "Password does not match")
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
    //get new avatar file path given by user and check if file is fetched or not
    const avatarPath = req.file?.path
    if (!avatarPath) {
        throw new ApiError(401, "Avatar file not found")
    }

    //if avatar file is obtained, upload to cloudinary and get it's url, if url is not obtained, throw an error
    const avatar = await uploadToCloudinary(avatarPath)
    if (!avatar.url) {
        throw new ApiError(401, "Error while uploading avatar to cloudinary")
    }

    //if avatar url is obtained by coudinary, update the avatar url in db with this url and send response of successful updation
    const user = User.findByIdAndUpdate(req.user?._id, { $set: { avatar: avatar.url } }, { new: true }).select("-password")
    return res.status(201).json(
        new ApiResponse(200, user, "Avatar updated Successfully")
    )
})
//#endregion

//region Code for updating cover image set by users
const updateUserCoverImage = asyncHandler(async (req, res) => {
    //get new cover image file path given by user and check if file is fetched or not
    const coverImagePath = req.file?.path
    if (!coverImagePath) {
        throw new ApiError(401, "Cover Image file file not found")
    }

    //if cover image file is obtained, upload to cloudinary and get it's url, if url is not obtained, throw an error
    const coverImage = await uploadToCloudinary(coverImagePath)
    if (!coverImage.url) {
        throw new ApiError(401, "Error while uploading cover image to cloudinary")
    }

    //if cover image url is obtained by coudinary, update the cover image url in db with this url and send response of successful updation
    const user = User.findByIdAndUpdate(req.user?._id, { $set: { coverImage: coverImage.url } }, { new: true }).select("-password")
    return res.status(201).json(
        new ApiResponse(200, user, "Cover Image updated Successfully")
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
        throw new ApiError(500, "Something went wrong while generating Access and Refresh Token")
    }
}
//#endregion

export { registerUser, loginUser, logoutUser, refreshAccessToken, changingPassword, getCurrentUser, updateUserAvatar, updateUserCoverImage }