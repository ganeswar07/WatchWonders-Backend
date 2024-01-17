import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js";

/// controller to handle subscriptions
const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId?.trim()) {
    throw new ApiError(400, "channelId is required");
  }

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel Id");
  }

  //* Check if the user is already subscribed to the channel
  const isSubscribed = await Subscription.exists({
    subscriber: req.user._id,
    channel: channelId,
  });

  let populatedSubscription, removeSubscription;

  //* Toggle subscription based on the current subscription status
  if (!isSubscribed) {
    // Subscribe the user to the channel
    const newSubscription = await Subscription.create({
      subscriber: req.user,
      channel: channelId,
    });

    if (!newSubscription) {
      throw new ApiError(500, "Error creating subscription");
    }

    // Populate subscription details for response
    populatedSubscription = await Subscription.findById(newSubscription._id)
      .populate("subscriber", "_id userName")
      .populate("channel", "_id userName");
  } else {
    // Unsubscribe the user from the channel and Populate details for response
    removeSubscription = await Subscription.findOneAndDelete({
      subscriber: req.user,
      channel: channelId,
    });
  }

  //* Return appropriate response based on subscription status
  return res.status(200).json(
    isSubscribed
      ? new ApiResponse(
          201,
          {
            subscription: {
              subscriptionStatus: true,
              subscriber: populatedSubscription.subscriber,
              channel: populatedSubscription.channel,
            },
          },
          "Subscribed to the channel successfully"
        )
      : new ApiResponse(
          200,
          {
            subscriptionStatus: false,
            subscriber: removeSubscription?.subscriber,
            channel: removeSubscription?.channel,
          },
          "Channel unsubscribed successfully"
        )
  );
});

/// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId?.trim()) {
    throw new ApiError(400, "channelId is required");
  }

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel Id ");
  }

  //* Aggregate to get the list of subscribers for the channel

  const subscriberList = await Subscription.aggregate([
    {
      $match: {
        channel: channelId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberDetails",
      },
    },
    {
      $unwind: "$subscriberDetails",
    },
    {
      $project: {
        channel: channelId,
        subscriber: {
          userName: "$subscriberDetails.userName",
          fullName: "$subscriberDetails.fullName",
          avatar: "$subscriberDetails.avatar",
        },
      },
    },
  ]);

  //* Return the subscriber list in the response

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        subscriberList: subscriberList,
      },
      "Subscribers list fetched successfully"
    )
  );
});

/// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!subscriberId?.trim()) {
    throw new ApiError(400, "subscriberId is required");
  }

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid channel Id ");
  }

  //* Aggregate to get the list of channels subscribed by the user

  const channelList = await Subscription.aggregate([
    {
      $match: {
        subscriber: subscriberId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelDetails",
      },
    },
    {
      $unwind: "$channelDetails",
    },
    {
      $project: {
        subscriber: subscriberId,
        channel: {
          userName: "$channelDetails.userName",
          fullName: "$channelDetails.fullName",
          avatar: "$channelDetails.avatar",
        },
      },
    },
  ]);

  //* Return the subscribed channel list in the response
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        channelList: channelList,
      },
      "Subscribing list fetched successfully"
    )
  );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
