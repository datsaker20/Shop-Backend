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

export default {
  registerUser
};
