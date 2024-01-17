import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";

import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js";

/// Common function to handle toggling of likes for different entities
const handleLikeToggle = async (model, entityId, likedBy, type) => {
  const entity = await model.findById(entityId);

  ///   Check if the entity is already liked by the user

  if (!entity) {
    throw new ApiError(404, `${type} not found`);
  }

  const isLiked = await Like.exists({
    [type]: entity._id,
    likedBy,
  });

  if (!isLiked) {
    const newLike = await Like.create({
      [type]: entity._id,
      likedBy,
    });

    if (!newLike) {
      throw new ApiError(500, `Error while liking ${type}`);
    }
  } else {
    const removeLike = await Like.findOneAndDelete({
      [type]: entity._id,
      likedBy,
    });

    if (!removeLike) {
      throw new ApiError(500, `Error while removing like in ${type}`);
    }
  }

  return { entity, isLiked };
};

/// Controller to handle like toggling for videos
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const { entity, isLiked } = await handleLikeToggle(
    Video,
    videoId,
    req.user._id,
    "video"
  );

  return res.status(200).json(
    isLiked
      ? new ApiResponse(
          200,
          {
            likedBy: req.user.UserName,
            video: entity._id,
          },
          "Like to the Video successfully"
        )
      : new ApiResponse(
          200,
          {
            removeLikedBy: req.user.UserName,
            video: entity._id,
          },
          "Remove Like from the Video successfully"
        )
  );
});

/// Controller to handle like toggling for comments

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }

  const { entity, isLiked } = await handleLikeToggle(
    Comment,
    commentId,
    req.user._id,
    "comment"
  );

  return res.status(200).json(
    isLiked
      ? new ApiResponse(
          200,
          {
            likedBy: req.user.UserName,
            comment: entity._id,
          },
          "Like to the comment successfully"
        )
      : new ApiResponse(
          200,
          {
            removeLikedBy: req.user.UserName,
            comment: entity._id,
          },
          "Remove Like from the Comment successfully"
        )
  );
});

/// Controller to handle like toggling for tweets
const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet Id");
  }

  const { entity, isLiked } = await handleLikeToggle(
    Tweet,
    tweetId,
    req.user._id,
    "tweet"
  );

  return res.status(200).json(
    isLiked
      ? new ApiResponse(
          200,
          {
            likedBy: req.user.UserName,
            tweet: entity._id,
          },
          "Like to the tweet successfully"
        )
      : new ApiResponse(
          200,
          {
            removeLikedBy: req.user.UserName,
            tweet: entity._id,
          },
          "Remove Like from the Tweet successfully"
        )
  );
});

/// Controller to fetch liked videos
const getLikedVideos = asyncHandler(async (req, res) => {
  /// Aggregate to fetch liked videos for the user
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "video",
        localField: "video",
        foreignField: "_id",
        as: "videoDetail",
      },
    },
    {
      $unwind: "$videoDetail",
    },
    {
      $project: {
        likedBy: 1,
        video: {
          _id: "$videoDetail._id",
          title: "$videoDetail.title",
          thumbnail: "$videoDetail.thumbnail",
          videoFile: "$videoDetail.videoFile",
        },
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videosList: likedVideos[0],
      },
      "Liked videos are fetched successfully "
    )
  );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
