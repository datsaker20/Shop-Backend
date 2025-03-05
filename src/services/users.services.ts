import bcrypt from "bcryptjs";
import fs from "fs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { IPassword, IToken, IUserLogin } from "~/constants/interface";
import { generateToken, registerValidator } from "~/middlewares/auth.middlewares";
import { IUser, User } from "~/models/db/User";
import { sendResetPasswordEmail, sendVerificationEmail } from "~/utils/email";
import redisClient from "~/utils/redis";
const salt = bcrypt.genSaltSync(10);

const registerUser = async (user: IUser): Promise<IUser> => {
  const existingUser = await User.findOne({ email: user.email }).select("_id");
  const existingUserName = await User.findOne({ userName: user.userName }).select("_id");
  const isValid = registerValidator(user);
  if (isValid.error) {
    throw new Error(isValid.error.message);
  }
  if (existingUserName) {
    throw new Error("Username already exists");
  }
  if (existingUser) {
    throw new Error("Email already exists");
  }
  const hashedPassword = bcrypt.hashSync(user.password, salt);
  const newUser = new User({ ...user, password: hashedPassword });
  await newUser.save();
  const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET_KEY as string, { expiresIn: "1h" });
  await sendVerificationEmail(user.email, token);
  return newUser;
};

const signIn = async (user: IUserLogin): Promise<IToken> => {
  try {
    const userLogin = await User.findOne<IUser & { _id: ObjectId }>({ email: user.email });
    if (!userLogin) {
      throw new Error("Email not found");
    }

    const isMatch = bcrypt.compareSync(user.password, userLogin.password); // true
    if (!isMatch) {
      throw new Error("Password is incorrect");
    }

    const token = generateToken(userLogin);
    const oldSessionId = await redisClient.get(`session:${userLogin.id}`);
    if (oldSessionId) {
      await redisClient.setEx(`blacklist:${oldSessionId}`, 7 * 24 * 60 * 60, "blacklisted");
    }

    await redisClient.setEx(`session:${userLogin.id}`, 7 * 24 * 60 * 60, token.token);
    return token;
  } catch (error) {
    throw new Error(`Authentication failed: ${(error as Error).message}`);
  }
};
const logoutUser = async (token: string): Promise<boolean> => {
  // Remove token from blacklist
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as jwt.JwtPayload;

  await redisClient.del(`session:${decoded.id}`);
  const exp = decoded.exp ?? Math.floor(Date.now() / 1000) + 3600; //
  // Set token to blacklist
  const result = await redisClient.set(`blacklist:${token}`, "logout", {
    EX: exp - Math.floor(Date.now() / 1000)
  });
  return result === "OK";
};
const verifyEmail = async (token: string) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as { email: string };
  const user = await User.findOne({ email: decoded.email });
  if (!user) {
    throw new Error("User not found");
  }
  user.isVerify = true;
  return await user.save();
};

const forgetPassword = async (email: string): Promise<void> => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }
  const resetToken = uuidv4();
  await redisClient.setEx(`resetPassword:${resetToken}`, 900, user.id.toString());
  await sendResetPasswordEmail(email, resetToken);
};

const resetPassword = async (token: string, password: string): Promise<void> => {
  const userId = await redisClient.get(`resetPassword:${token}`);
  if (!userId) {
    throw new Error("Token is invalid or expired");
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  await User.findByIdAndUpdate(userId, { password: hashedPassword });
  await redisClient.del(`resetPassword:${token}`);
};
const getAllUsers = async (): Promise<IUser[]> => {
  try {
    const users = await User.find({});

    return users;
  } catch (error) {
    throw new Error(`Get all users failed: ${(error as Error).message}`);
  }
};

const updateUser = async (
  id: string,
  user: Partial<IUser>,
  file?: Express.Multer.File,
  password?: IPassword
): Promise<IUser> => {
  try {
    if (password) {
      const user = await User.findById(id);
      if (!user) throw new Error("User not found");
      const isMatch = bcrypt.compareSync(password.password, user.password);
      if (!isMatch) throw new Error("Old password is incorrect");
      if (password.newPassword !== password.confirmPassword)
        throw new Error("New password and confirm password do not match");
      const hashedPassword = bcrypt.hashSync(password.newPassword, salt);
      user.password = hashedPassword;
      user.save();
    }
    const updatedUser = await User.findByIdAndUpdate(id, user, { new: true }).select(
      "-password -role -isVerify -isDelete"
    );
    if (!updatedUser) {
      throw new Error("User not found");
    }
    if (file) {
      if (updatedUser.avatar) {
        const oldPath = `uploads/avatars/${updatedUser.avatar}`;
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updatedUser.avatar = file.filename;
      updatedUser.save();
    }
    return updatedUser;
  } catch (error) {
    throw new Error(`Update user failed: ${(error as Error).message}`);
  }
};

const getUserByEmail = async (email: string): Promise<IUser | null> => {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "-password -role -isVerify -isDelete -__v -_id"
  );

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

const deleteUser = async (id: string): Promise<void> => {
  try {
    await User.findByIdAndUpdate(id, { isDelete: true }, { new: true });
  } catch (error) {
    throw new Error(`Delete user failed: ${(error as Error).message}`);
  }
};
export default {
  registerUser,
  signIn,
  verifyEmail,
  getAllUsers,
  forgetPassword,
  resetPassword,
  logoutUser,
  updateUser,
  getUserByEmail,
  deleteUser
};
