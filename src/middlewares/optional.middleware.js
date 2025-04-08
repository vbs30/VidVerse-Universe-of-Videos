import { User } from "../models/user.models.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken";

// Create a new middleware that doesn't throw errors if token is missing
export const optionalJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            // Instead of throwing an error, just continue without setting req.user
            return next();
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if (user) {
            req.user = user;
        }

        next()
    } catch (error) {
        // If token verification fails, just continue without setting req.user
        next();
    }
})