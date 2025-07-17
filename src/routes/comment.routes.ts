import { Router } from 'express';
import { 
  addComment, 
  getVideoComments, 
  updateComment, 
  deleteComment, 
  likeComment 
} from '../controllers/comment.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Get comments for a video (public)
router.get('/video/:videoId', getVideoComments);

// Add a comment (requires authentication)
router.post('/video/:videoId', authenticateToken, addComment);

// Update a comment (requires authentication)
router.put('/:commentId', authenticateToken, updateComment);

// Delete a comment (requires authentication)
router.delete('/:commentId', authenticateToken, deleteComment);

// Like/unlike a comment (requires authentication)
router.post('/:commentId/like', authenticateToken, likeComment);

export default router;
