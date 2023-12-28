import multer from "multer";
import uuid from "uuid";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const fileName = `${file.originalname}-${uuid.v4()}`;
    cb(cb, fileName);
  },
});

export const upload = multer({
  storage,
});
