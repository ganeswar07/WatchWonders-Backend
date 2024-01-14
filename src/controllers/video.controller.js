import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";

import {
  ApiError,
  ApiResponse,
  asyncHandler,
  deleteFileOnCloud,
  removeLocalFiles,
  uploadFileOnCloud,
} from "../utils/index.js";

const getAllVideos = asyncHandler(async (req, res) => {
  //TODO: need more optimizations in the code
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "_id",
    sortType,
    userId,
  } = req.query;

  const baseQuery = {};

  // Add conditions based on query parameters
  if (query) {
    baseQuery.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  if (userId) {
    baseQuery.owner = userId;
  }

  const sortOptions = {};
  if (sortBy) {
    sortOptions[sortBy] = sortType === "desc" ? -1 : 1;
  }

  const aggregate = await Video.aggregate([
    { $match: baseQuery },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: "$owner",
    },
    { $sort: sortOptions },
    { $skip: (page - 1) * parseInt(limit) },
    { $limit: parseInt(limit) },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        views: 1,
        owner: {
          _id: "$owner._id",
          userName: "$owner.userName",
          fullName: "$owner.fullName",
          avatar: "$owner.avatar",
        },
      },
    },
  ]);

  const paginateOption = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const result = await Video.aggregatePaginate(aggregate, paginateOption);

  result.docs = result.docs.map((doc, index) => {
    doc.owner = aggregate[index].owner;
    return doc;
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos: result.docs,
        totalDocs: result.totalDocs,
        currentPage: result.page,
        previousPage: result.prevPage,
        nextPage: result.nextPage,
        totalPages: result.totalPages,
      },
      "Videos are fetched successfully"
    )
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!(title && description)) {
    throw new ApiError(400, "Video title and description are required");
  }

  let videoFile, thumbnail;

  try {
    const videoLocalFile = req?.files?.videoFile;
    if (!(videoLocalFile && videoLocalFile[0].path)) {
      throw new ApiError(400, "Video file is required");
    }
    const thumbnailLocalFile = req?.files?.thumbnail;
    if (!(thumbnailLocalFile && thumbnailLocalFile[0].path)) {
      throw new ApiError(400, "Video thumbnail is required");
    }

    videoFile = await uploadFileOnCloud(
      videoLocalFile[0].path,
      "video",
      "videoFile"
    );
    thumbnail = await uploadFileOnCloud(
      thumbnailLocalFile[0].path,
      "image",
      "thumbnail"
    );

    const createdVideo = await Video.create({
      videoFile: videoFile.secure_url,
      thumbnail: thumbnail.secure_url,
      title,
      description,
      duration: (videoFile.duration / 60).toFixed(2),
      owner: req.user,
    });

    if (!createdVideo) {
      throw new ApiError(500, "Something went wrong while Uploading video");
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          createdVideo,
        },
        "Video uploaded successfully"
      )
    );
  } catch (error) {
    removeLocalFiles(req);
    videoFile ? await deleteFileOnCloud(videoFile.secure_url) : null;
    thumbnail ? await deleteFileOnCloud(thumbnail.secure_url) : null;
    throw new ApiError(error?.statusCode || 400, error?.message);
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const existingVideo = await Video.findById(videoId).populate(
    "owner",
    "userName fullName avatar"
  );

  if (!existingVideo) {
    throw new ApiError(404, "Video not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videoDetail: existingVideo,
      },
      "videos are fetched successfully"
    )
  );
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnailLocalFile = req?.file?.path;

  const existingVideo = await Video.findById(videoId);
  if (!existingVideo) {
    throw new ApiError(404, "Video is not available");
  }

  title ? (existingVideo.title = title) : null;
  description ? (existingVideo.description = description) : null;

  try {
    if (thumbnailLocalFile) {
      const thumbnail = await uploadFileOnCloud(
        thumbnailLocalFile,
        "image",
        "thumbnail"
      );
      await deleteFileOnCloud(existingVideo.thumbnail, "image", "thumbnail");

      thumbnail ? (existingVideo.thumbnail = thumbnail.secure_url) : null;
    }

    await existingVideo.save();

    const updatedVideo = await Video.findById(videoId).populate(
      "owner",
      "userName fullName avatar"
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          updatedVideoDetail: updatedVideo,
        },
        "video updated successfully"
      )
    );
  } catch (error) {
    removeLocalFiles(req);
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const existingVideo = await Video.findById(videoId);

  if (!existingVideo) {
    throw new ApiError(404, "Video not found");
  }

  deleteFileOnCloud(existingVideo.videoFile, "video", "videoFile");
  deleteFileOnCloud(existingVideo.thumbnail, "image", "thumbnail");

  Video.deleteOne({ _id: existingVideo._id });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video delete successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const existingVideo = await Video.findById(videoId);

  if (!existingVideo) {
    throw new ApiError(404, "Video not found");
  }

  existingVideo.status = !existingVideo.status;
  await existingVideo.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videoStatus: existingVideo.status,
      },
      existingVideo.status
        ? "Video is published successfully"
        : "Video is unpublished successfully"
    )
  );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
