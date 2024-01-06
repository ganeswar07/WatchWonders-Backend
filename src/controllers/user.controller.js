import {
  asyncHandler,
  ApiError,
  ApiResponse,
  removeLocalFiles,
  uploadFileOnCloud,
  deleteFileOnCloud,
} from "../utils/index.js";
import { User } from "../models/user.model.js";
import { httpOptions } from "../constants.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, error.message || "Error generating tokens");
  }
};

const validateRegistrationInput = (fullName, email, userName, password) => {
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
      "Username can only contain letters and numbers and underscores"
    );
  }

  // const regexPassword =
  //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{6,20})/;
  // if (!regexPassword.test(password)) {
  //   throw new ApiError(400, "Password must meet complexity requirements");
  // }
};

/// router handlers for user actions

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, userName, password } = req.body;
  try {
    validateRegistrationInput(fullName, email, userName, password);

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

    const avatar = await uploadFileOnCloud(avatarLocalPath, "image", "avatar");
    const coverImage = coverImageLocalPath
      ? await uploadFileOnCloud(coverImageLocalPath, "image", "coverImage")
      : null;

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

const loggedInUser = asyncHandler(async (req, res) => {
  const { email, userName, password } = req.body;

  if (!(email || userName)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const passwordValidation = await user.isPasswordCorrect(password);

  if (!passwordValidation) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    " -password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, httpOptions)
    .cookie("refreshToken", refreshToken, httpOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", httpOptions)
    .clearCookie("refreshToken", httpOptions)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findOne(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));
});

const newTokens = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req?.cookies?.refreshToken || req?.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "invalid token");
    }

    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user?._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, httpOptions)
      .cookie("refreshToken", refreshToken, httpOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access Token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || " invalid refresh token");
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current User fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!(fullName || email)) {
    throw new ApiError(404, "All fields are required");
  }

  if (email.toLowerCase() === req.user.email) {
    throw new ApiError(
      400,
      "New email should be different from the current email"
    );
  }

  const existingEmail = await User.findOne({ email: email.toLowerCase() });

  if (existingEmail) {
    throw new ApiError(400, "Email is already in use");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(
      new ApiResponse(200, { user }, "Account details updated successfully")
    );
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatarPath = req.user.avatar;
  let newAvatar;

  try {
    newAvatar = await uploadFileOnCloud(avatarLocalPath, "image", "avatar");

    const response = await deleteFileOnCloud(avatarPath, "image", "avatar");

    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          avatar: newAvatar.secure_url,
        },
      },
      { new: true }
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          avatar: newAvatar.secure_url,
          deleteStatus: {
            response: response,
          },
        },
        "avatar updated successfully"
      )
    );
  } catch (error) {
    removeLocalFiles(req);

    if (error.statusCode === 500) {
      await deleteFileOnCloud(newAvatar.secure_url, "image", "avatar");
    }

    throw new ApiError(error?.statusCode || 400, error?.message);
  }
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image file is missing");
  }
  const coverImagePath = req.user.coverImage;
  let newCoverImage;
  try {
    newCoverImage = await uploadFileOnCloud(
      coverImageLocalPath,
      "image",
      "coverImage"
    );

    const response = coverImagePath
      ? await deleteFileOnCloud(coverImagePath, "image", "coverImage")
      : null;

    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          coverImage: newCoverImage.secure_url,
        },
      },
      { new: true }
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          coverImage: newCoverImage.secure_url,
          deleteStatus: {
            response: response,
          },
        },
        "cover Image updated successfully"
      )
    );
  } catch (error) {
    removeLocalFiles(req);
    if (error.statusCode === 500) {
      await deleteFileOnCloud(coverImagePath);
    }
    throw new ApiError(error?.statusCode || 400, error?.message);
  }
});

export {
  registerUser,
  loggedInUser,
  logoutUser,
  changePassword,
  getCurrentUser,
  newTokens,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
};
