import { Router } from "express";
import { uploadFileOnLocal } from "../middlewares/multer.middleware.js";
import {
  registerUser,
  loggedInUser,
  logoutUser,
  changePassword,
  getCurrentUser,
  newTokens,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
} from "../controllers/user.controller.js";
import { isAuthorized } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.route("/register").post(
  uploadFileOnLocal.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
userRouter.route("/login").post(loggedInUser);

userRouter.route("/logout").post(isAuthorized, logoutUser);

userRouter.route("/tokens").patch(newTokens);

userRouter.route("/change-password").patch(isAuthorized, changePassword);

userRouter.route("/current-user").get(isAuthorized, getCurrentUser);

userRouter
  .route("/update-accountDetails")
  .patch(isAuthorized, updateAccountDetails);

userRouter
  .route("/change-avatar")
  .patch(isAuthorized, uploadFileOnLocal.single("avatar"), updateAvatar);

userRouter
  .route("/change-coverImage")
  .patch(isAuthorized, uploadFileOnLocal.single("coverImage"), updateCoverImage);

export default userRouter;
