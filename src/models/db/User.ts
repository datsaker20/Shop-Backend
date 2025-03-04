import { Document, model, Schema } from "mongoose";
import { Role } from "~/constants/enum";
export interface IUser extends Document {
  userName: string;
  fullName: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
  address?: string;
  avatar?: string;
  isDelete: boolean;
  isVerify: boolean;
  isAdmin: boolean;
}

const userSchema = new Schema<IUser>(
  {
    userName: { type: String, required: true, unique: true, rim: true, minlength: 6, maxLength: 30 },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, email: true, trim: true, lowercase: true },
    password: { type: String, required: true, minLength: 6 },
    role: { type: String, required: true, default: Role.USER },
    phone: { type: String, maxLength: 10 },
    address: { type: String, maxLength: 255 },
    avatar: { type: String },
    isDelete: { type: Boolean, default: false },
    isVerify: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
