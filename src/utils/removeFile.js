import fs from "fs";

const removeLocalFiles = (req, res, next) => {
  const files = req.files || req.file;

  if (!files || files.length === 0) return next();

  Object.values(files)
    .filter((file) => file[0]?.path)
    .forEach((file) => {
      const path = file[0]?.path;
      if (path && fs.existsSync(path)) {
        fs.unlinkSync(path);
      }
    });

  return;
};

export { removeLocalFiles };
