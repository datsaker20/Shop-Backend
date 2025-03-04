import { Request } from "express";
import fs from "fs";
import multer, { FileFilterCallback, StorageEngine } from "multer";
import path from "path";

const uploadDir = "uploads/avatars/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage: StorageEngine = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ): void => {
    if (!req.user) {
      return cb(new Error("Unauthorized: No user found"), "");
    }
    if (req.user.id !== req.query.id && !req.user.isAdmin) {
      return cb(new Error("Permission denied: Cannot update another user's avatar"), "");
    }
    cb(null, "uploads/avatars/");
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void): void => {
    const ext: string = path.extname(file.originalname);
    const filename: string = `${Date.now()}-${file.fieldname}${ext}`;

    cb(null, filename);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    const error = new Error("Only image files are allowed!");
    cb(error as unknown as null, false);
  }
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
});

export default upload;
