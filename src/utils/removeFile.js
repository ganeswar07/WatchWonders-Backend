import fs from "fs";

const removeLocalFiles = ({ files }) => {
  console.log("internal remove local files")
  if (!files || files.length === 0) return;

  Object.values(files)
    .filter((file) => file[0].path)
    .forEach((file) => {
      const path = file[0].path;
      fs.unlinkSync(path);
    });
};

export { removeLocalFiles };
