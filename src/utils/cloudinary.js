import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) {
            return null;
        }
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        console.log("File is uploaded successfully", response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);     //when upload fails, this will remove that file from server so that nothing gets saved unnecessarily
        return null;
    }
}

export {uploadToCloudinary}
