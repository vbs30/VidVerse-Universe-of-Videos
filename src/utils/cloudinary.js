import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return null;
        }
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);     //when upload fails, this will remove that file from server so that nothing gets saved unnecessarily
        return null;
    }
}

const deletefromCloudinary = async (publicId) => {
    try {
        if (!publicId) {
            return null;
        }
        const response = await cloudinary.uploader.destroy(publicId)
            .then(({ result }) => {
                if (result === 'ok') {
                    return true;
                }
                else {
                    return false;
                }
            })
        return response;
    } catch (error) {
        return null;
    }
}

//made this method, to only lock the resource_type as video
const deleteVideoFromCloudinary = async (publicId) => {
    try {
        if (!publicId) {
            return null;
        }
        const response = await cloudinary.uploader.destroy(publicId, { resource_type: "video" })
            .then(({ result }) => {
                if (result === 'ok') {
                    return true;
                }
                else {
                    return false;
                }
            })
        return response;
    } catch (error) {
        return null;
    }
}
export { uploadToCloudinary, deletefromCloudinary, deleteVideoFromCloudinary }
