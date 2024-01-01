import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFileOnCloud = async (
  localPath,
  resourceType = "auto",
  fileType
) => {
  if (!localPath) throw new ApiError(400, "File not found");
  try {
    const uploadedFile = await cloudinary.uploader.upload(localPath, {
      resource_type: resourceType,
      folder: `WatchWonders/${resourceType}`,
    });

    if (!uploadedFile || !uploadedFile.secure_url) {
      throw new ApiError(
        500,
        `Error uploading ${fileType} ${resourceType} , please try again`
      );
    }

    fs.unlinkSync(localPath);

    return uploadedFile;
  } catch (error) {
    fs.unlinkSync(localPath);

    throw new ApiError(
      error.statusCode || 500,
      `${
        error.message ||
        `unable to upload ${fileType} ${resourceType}, Please try again`
      }`
    );
  }
};

const deleteFileOnCloud = async (url, resourceType, fileType) => {
  if (!url) throw new ApiError(400, "URL not found");

  const parts = url.split("/");
  const filename = parts[parts.length - 1];
  const folderName = parts.slice(-3, -1).join("/");
  const public_id = `${folderName}/${filename.split(".")[0]}`;

  try {
    const resourceInfo = await cloudinary.api.resource(public_id);

    if (!resourceInfo || !resourceInfo.public_id) {
      console.log(
        `Resource with public ID '${public_id}' not found. Skipping deletion.`
      );
      return false;
    }

    const response = await cloudinary.uploader.destroy(public_id, {
      resource_type: resourceType,
    });

    if (!response || response.result !== "ok") {
      throw new ApiError(500, `Error while deleting ${fileType}`);
    }

    return true;
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      `${error.message || `Unable to delete ${fileType}. Please try again`}`
    );
  }
};

export { uploadFileOnCloud, deleteFileOnCloud };
