import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller.js";
import { isAuthorized } from "../middlewares/auth.middleware.js";

const subscriptionRouter = Router();
subscriptionRouter.use(isAuthorized);

subscriptionRouter
  .route("/c/:channelId")
  .get(getSubscribedChannels)
  .post(toggleSubscription);

subscriptionRouter.route("/u/:subscriberId").get(getUserChannelSubscribers);

export default subscriptionRouter;
