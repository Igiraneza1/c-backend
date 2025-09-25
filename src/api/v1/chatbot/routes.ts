import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import {
  uploadDocument,
  queryDocument,
  getDocuments,
  updateDocumentById,
  deleteDocumentById,
  getQueryHistory,
} from './controller';
import { infoLogger } from '../../../utils/logger'; 

const router = Router();

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  infoLogger(`Uploads directory created: ${uploadsDir}`, 'routes');
}

const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file
    files: 10, // Maximum 10 files per request
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

router.post('/upload', upload.array('files', 10), uploadDocument);

router.post('/query', queryDocument);

router.get('/query-history', getQueryHistory);

router.get('/', getDocuments);

router.put('/:id', updateDocumentById);

router.delete('/:id', deleteDocumentById);

export default router;
