import { Router } from 'express';
import multer from 'multer';
import { 
  uploadVideo, 
  getVideos, 
  likeVideo, 
  streamVideo, 
  getVideoDetails,
  addToWatchHistory,
  getWatchHistory,
  clearWatchHistory,
  removeFromWatchHistory
} from '../controllers/video.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Configure multer for video upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, 'uploads/videos');
    } else if (file.mimetype.startsWith('image/')) {
      cb(null, 'uploads/thumbnails');
    } else {
      cb(new Error('Invalid file type'), '');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

router.post('/upload', authenticateToken, upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), uploadVideo);
router.get('/', getVideos);
router.post('/:videoId/like', authenticateToken, likeVideo);
router.get('/:videoId', streamVideo);
router.get('/details/:videoId', getVideoDetails);

// Watch history routes
router.post('/:videoId/watch', authenticateToken, addToWatchHistory);
router.get('/watch-history/user', authenticateToken, getWatchHistory);
router.delete('/watch-history/clear', authenticateToken, clearWatchHistory);
router.delete('/watch-history/:videoId', authenticateToken, removeFromWatchHistory);

export default router;