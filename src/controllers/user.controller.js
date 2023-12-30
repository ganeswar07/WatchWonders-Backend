import {
  asyncHandler,
  ApiError,
  ApiResponse,
  removeLocalFiles,
  uploadFileOnCloud,
} from "../utils/index.js";
import { User } from "../models/user.model.js";


const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, userName, password } = req.body;
  try {
    if (
      [fullName, email, userName, password].some(
        (field) => field?.trim() === "" || field?.trim === undefined
      )
    ) {
      throw new ApiError(400, "Please fill in all required fields");
    }

    const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regexEmail.test(String(email).toLowerCase())) {
      throw new ApiError(400, "Please enter a valid email");
    }

    const regexUserName = /^[a-z0-9_]+$/;
    if (!regexUserName.test(userName)) {
      throw new ApiError(
        400,
        "Username can only contain letters and numbers and  underscores"
      );
    }

    const regexPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{6,20})/;
    if (!regexPassword.test(password)) {
      throw new ApiError(
        400,
        "Password must contain at least one lowercase letter, one uppercase letter, one number and one special character"
      );
    }

    const avatarLocalPath = req?.files?.avatar[0].path;

    if (!avatarLocalPath) {
      throw new ApiError(400, "Please upload an avatar");
    }

    let coverImageLocalPath;
    if (
      req.files &&
      Array.isArray(req.files.coverImage) &&
      req.files.coverImage.length > 0
    ) {
      coverImageLocalPath = req.files.coverImage[0].path;
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { userName }],
    });

    if (existingUser) {
      throw new ApiError(409, "User already exists");
    }

    const avatar = await uploadFileOnCloud(avatarLocalPath, "image");
    if (!avatar) {
      throw new ApiError(
        400,
        "some error in avatar image uploading, please try again"
      );
    }
    let coverImage;
    if (coverImageLocalPath) {
      coverImage = await uploadFileOnCloud(coverImageLocalPath, "image");
      if (!coverImage) {
        throw new ApiError(
          400,
          "some error in cover image uploading, please try again"
        );
      }
    }

    const user = await User.create({
      fullName,
      email,
      userName: userName.toLowerCase(),
      password,
      avatar: avatar.secure_url,
      coverImage: coverImage?.secure_url || "",
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken -watchHistory"
    );

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering user");
    }

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User successfully registered"));
  } catch (error) {
    removeLocalFiles(req);
    throw new ApiError(error?.statusCode || 400, error?.message);
  }
});

export { registerUser };
