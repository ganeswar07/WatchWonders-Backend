import { User } from "../models/user.model.js";
import { asyncHandler, ApiError, ApiResponse } from "../utils/index.js";
import { Subscription } from "../models/subscription.model.js";

const getChannelProfile = asyncHandler(async (req, res) => {
  const { channelName } = req.params;
  console.log(req.params);
  if (!channelName?.trim()) {
    throw new ApiError(400, "Channel Id  is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        userName: channelName.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribed",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedCount: {
          $size: "$subscribed",
        },
        subscriptionStatus: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: "Subscribed",
            else: "Not Subscribe",
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        subscribersCount: 1,
        channelsSubscribedCount: 1,
        subscriptionStatus: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel not found");
  }
  if (req.user.userName === req.params.channelName.toLowerCase()) {
    channel[0].subscriptionStatus = "Same User";
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});

const subscribeToChannel = asyncHandler(async (req, res) => {
  const { channelName } = req.params;

  if (!channelName?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  const channel = await User.findOne({
    userName: channelName.trim().toLowerCase(),
  }).select("-password -refreshToken");

  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  const isSubscribed = await Subscription.exists({
    subscriber: req.user._id,
    channel: channel._id,
  });

  if (isSubscribed) {
    throw new ApiError(400, "Channel already subscribed");
  }

  const newSubscription = await Subscription.create({
    subscriber: req.user._id,
    channel: channel._id,
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        subscription: newSubscription,
      },
      "Subscribed to channel successfully"
    )
  );
});

const unsubscribeToChannel = asyncHandler(async (req, res) => {
  const { channelName } = req.params;

  if (!channelName) {
    throw new ApiError(400, "Username is missing");
  }

  const channel = await User.findOne({
    userName: channelName.trim().toLowerCase(),
  }).select("-password -refreshToken");

  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  const response = await Subscription.findOneAndDelete({
    subscriber: req.user._id,
    channel: channel._id,
  });

  if (!response) {
    throw new ApiError(404, "Subscription not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        response,
      },
      "Channel unsubscribed successfully"
    )
  );
});

const subscriberList = asyncHandler(async (req, res) => {});

export { getChannelProfile, subscribeToChannel, unsubscribeToChannel };
