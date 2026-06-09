import multer from 'multer';
import { Request } from 'express';

// Store uploaded files in memory as buffers
const storage = multer.memoryStorage();

// File filter to allow only CSV files
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed!') as any, false);
  }
};

export const uploadCSV = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit to 5MB
  },
});
