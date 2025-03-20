import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//#region Code for health check
const healthChecker = asyncHandler(async (req, res) => {
    res.status(200).json(new ApiResponse(200, null, "Server is running"));
})
//#endregion

export { healthChecker }