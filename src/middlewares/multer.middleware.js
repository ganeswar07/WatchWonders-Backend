import multer from "multer";
import {v4 as uuidv4} from "uuid";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const fileName = `${file.originalname}-${uuidv4()}`;
    cb(cb, fileName);
  },
});

export const uploadFileOnLocal = multer({
  storage,
});
