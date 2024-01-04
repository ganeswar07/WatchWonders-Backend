import { Router } from "express";
import { isAuthorized } from "../middlewares/auth.middleware.js";
import {
  getChannelProfile,
  subscribeToChannel,
  unsubscribeToChannel
} from "../controllers/channel.controller.js";

const channelRouter = Router();

channelRouter.route("/profile/:channelName").get(isAuthorized, getChannelProfile);
channelRouter.route("/subscription/:channelName").post(isAuthorized, subscribeToChannel);
channelRouter.route("/subscription/:channelName").delete(isAuthorized, unsubscribeToChannel);

export default channelRouter;
