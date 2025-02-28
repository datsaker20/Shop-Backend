import { ObjectId } from "mongoose";
import { IToken, IUserLogin } from "~/constants/interface";
import { generateToken } from "~/middlewares/auth.middlewares";
import { IUser, User } from "~/models/db/User";
const registerUser = async (user: IUser): Promise<IUser> => {
  const existingUser = await User.findOne({ email: user.email }).select("_id");
  const existingUserName = await User.findOne({ userName: user.userName }).select("_id");
  if (existingUserName) {
    // kiểm tra xem userName đã tồn tại chưa
    throw new Error("Username already exists");
  }
  if (existingUser) {
    // kiểm tra xem email đã tồn tại chưa
    throw new Error("Email already exists");
  }
  const newUser = new User(user);
  await newUser.save();
  return newUser; // trả về user vừa tạo
};

const signIn = async (user: IUserLogin): Promise<IToken> => {
  try {
    const userLogin = await User.findOne<IUser & { _id: ObjectId }>({ email: user.email });
    if (!userLogin) {
      throw new Error("Email not found");
    }

    const isMatch = user.password === userLogin.password;
    if (!isMatch) {
      throw new Error("Password is incorrect");
    }

    const token = generateToken(userLogin);
    return token;
  } catch (error) {
    throw new Error(`Authentication failed: ${(error as Error).message}`);
  }
};

export default {
  registerUser,
  signIn
};
