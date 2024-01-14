import { Router } from "express";
import { uploadFileOnLocal } from "../middlewares/multer.middleware.js";
import { isAuthorized } from "../middlewares/auth.middleware.js";
// import app from "../app.js";
import {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
} from "../controllers/video.controller.js";

const videoRouter = Router();

videoRouter.use(isAuthorized);

videoRouter
  .route("/")
  .get(getAllVideos)
  .post(
    uploadFileOnLocal.fields([
      {
        name: "videoFile",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    publishAVideo
  );

videoRouter
  .route("/:videoId")
  .get(getVideoById)
  .delete(deleteVideo)
  .patch(uploadFileOnLocal.single("thumbnail"), updateVideo);

videoRouter.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default videoRouter;
