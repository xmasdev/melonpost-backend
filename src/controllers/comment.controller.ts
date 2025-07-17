import { RequestHandler } from 'express';
import Comment from '../models/comment.model';
import Video from '../models/video.model';
import mongoose from 'mongoose';

// Add a comment to a video
export const addComment: RequestHandler = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = (req as any).user.id;

    // Validate video exists
    const video = await Video.findById(videoId);
    if (!video) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }

    // If parentCommentId is provided, validate it exists
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        res.status(404).json({ message: 'Parent comment not found' });
        return;
      }
    }

    const comment = new Comment({
      content,
      author: userId,
      video: videoId,
      parentComment: parentCommentId || null
    });

    await comment.save();

    // Increment comments count in video
    await Video.findByIdAndUpdate(videoId, { $inc: { commentsCount: 1 } });

    // Populate author info for response
    await comment.populate('author', 'username avatar');

    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get comments for a video
export const getVideoComments: RequestHandler = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { page = 1, limit = 20, sortBy = 'createdAt' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get top-level comments (no parent)
    const comments = await Comment.find({ 
      video: videoId, 
      parentComment: null 
    })
      .populate('author', 'username avatar')
      .sort({ [sortBy as string]: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentComment: comment._id })
          .populate('author', 'username avatar')
          .sort({ createdAt: 1 });
        
        return {
          ...comment.toObject(),
          replies
        };
      })
    );

    const totalComments = await Comment.countDocuments({ 
      video: videoId, 
      parentComment: null 
    });

    res.json({
      comments: commentsWithReplies,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalComments,
        pages: Math.ceil(totalComments / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update a comment
export const updateComment: RequestHandler = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = (req as any).user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    // Check if user is the author of the comment
    if (comment.author.toString() !== userId) {
      res.status(403).json({ message: 'Not authorized to update this comment' });
      return;
    }

    comment.content = content;
    await comment.save();

    await comment.populate('author', 'username avatar');

    res.json({
      message: 'Comment updated successfully',
      comment
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a comment
export const deleteComment: RequestHandler = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = (req as any).user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    // Check if user is the author of the comment
    if (comment.author.toString() !== userId) {
      res.status(403).json({ message: 'Not authorized to delete this comment' });
      return;
    }

    // Delete the comment and all its replies
    const deletedComments = await Comment.deleteMany({
      $or: [
        { _id: commentId },
        { parentComment: commentId }
      ]
    });

    // Decrement comments count in video
    await Video.findByIdAndUpdate(comment.video, { 
      $inc: { commentsCount: -deletedComments.deletedCount } 
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Like/unlike a comment
export const likeComment: RequestHandler = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { action } = req.body; // 'like' or 'unlike'

    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    if (action === 'like') {
      comment.likes += 1;
    } else if (action === 'unlike') {
      comment.likes = Math.max(0, comment.likes - 1);
    } else {
      res.status(400).json({ message: 'Invalid action. Use "like" or "unlike"' });
      return;
    }

    await comment.save();

    res.json({
      message: `Comment ${action}d successfully`,
      likes: comment.likes
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
