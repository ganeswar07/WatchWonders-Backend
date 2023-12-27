import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFileOnCloud = async (localPath, fileType = "auto") => {
  try {
    if (!localPath) return null;
    const response = await cloudinary.uploader.upload(localPath, {
      resource_type: fileType,
      folder: `WatchWonders/${fileType}`,
    });
    fs.unlinkSync(localPath);
    return response;
  } catch (error) {
    fs.unlinkSync(localPath);
    return null;
  }
};

const deleteFileOnCloud = async (url, fileType) => {
  try {
    if (!url) return null;
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    const folderName = parts.slice(-3, -1).join("/");
    const public_id = `${folderName}/${filename.split(".")[0]}`;
    const response = await cloudinary.uploader.destroy(public_id, {
      resource_type: fileType,
    });
    return response;
  } catch (error) {
    return null;
  }
};

export { uploadFileOnCloud, deleteFileOnCloud };
