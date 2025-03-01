import bcrypt from "bcryptjs";
import { ObjectId } from "mongoose";
import { IToken, IUserLogin } from "~/constants/interface";
import { generateToken, registerValidator } from "~/middlewares/auth.middlewares";
import { IUser, User } from "~/models/db/User";
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
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(user.password, salt);
  const newUser = new User({ ...user, password: hashedPassword });
  await newUser.save();
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
    return token;
  } catch (error) {
    throw new Error(`Authentication failed: ${(error as Error).message}`);
  }
};

const getAllUsers = async (): Promise<IUser[]> => {
  try {
    const users = await User.find({});
    return users;
  } catch (error) {
    throw new Error(`Get all users failed: ${(error as Error).message}`);
  }
};
export default {
  registerUser,
  signIn,
  getAllUsers
};
