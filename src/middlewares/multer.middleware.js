import multer from "multer";
import { v4 as uuidv4 } from "uuid";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const fileName = `${uuidv4()}-${file.originalname}`;
    cb(null, fileName);
  },
});

export const uploadFileOnLocal = multer({
  storage,
});
