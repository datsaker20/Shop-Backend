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
  status: boolean;
  token: string;
}
const userSchema = new Schema<IUser>(
  {
    userName: { type: String, required: true, unique: true, length: 6 },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, email: true, trim: true, lowercase: true },
    password: { type: String, required: true, length: 6 },
    role: { type: String, required: true, default: Role.USER },
    phone: { type: String, length: 10 },
    address: { type: String },
    avatar: { type: String },
    status: { type: Boolean, default: true },
    token: { type: String }
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
