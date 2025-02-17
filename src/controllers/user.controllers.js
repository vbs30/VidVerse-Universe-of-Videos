import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js"
import { uploadToCloudinary } from "../utils/cloudinary.js"

/*
Steps to work on resgitering users

3. 
4. 
5. 
6. 

*/

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

export { registerUser }