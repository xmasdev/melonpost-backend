import { RequestHandler } from 'express';
import Video from '../models/video.model';
import User from '../models/user.model';
import fs from 'fs';
import path from 'path';
import { authService } from '../services/auth.service';
import ffmpeg from 'fluent-ffmpeg';

export const uploadVideo: RequestHandler = async (req, res) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (!files || !files['video']) {
      res.status(400).json({ message: 'No video file provided' });
      return;
    }
    const { title, description } = req.body;
    const userId = (req as any).user.id; // From auth middleware

    const videoFile = files['video'][0];
    const thumbnailFile = files && files['thumbnail'] ? files['thumbnail'][0] : null;

    // Calculate video duration
    ffmpeg.ffprobe(videoFile.path, async (err: Error, metadata) => {
      if (err) {
        res.status(500).json({ message: 'Error processing video file', error: err });
        return;
      }

      const duration = metadata.format.duration;

      const video = new Video({
        title,
        description,
        fileUrl: videoFile.path, // You might want to modify this based on your storage solution
        thumbnailUrl: thumbnailFile ? thumbnailFile.path : null,
        uploader: (await authService.getUserProfile(userId)).username,
        duration
      });

      await video.save();

      res.status(201).json({
        message: 'Video uploaded successfully',
        video: {
          id: video._id,
          title: video.title,
          description: video.description,
          fileUrl: video.fileUrl,
          thumbnailUrl: video.thumbnailUrl,
          uploader: video.uploader,
          duration: video.duration
        }
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading video', error });
  }
};

export const getVideos: RequestHandler = async (req, res) => {
  try {
    const videos = await Video.find()
      .populate('uploader', 'username email')
      .sort({ createdAt: -1 });

    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching videos', error });
  }
};

export const likeVideo: RequestHandler = async (req, res) => {
  try {
    const videoId = req.params.videoId;
    const userId = (req as any).user.userId;

    const video = await Video.findById(videoId);
    
    if (!video) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }

    // Increment likes count
    video.likes += 1;
    await video.save();

    res.json({
      message: 'Video liked successfully',
      likes: video.likes
    });
  } catch (error) {
    res.status(500).json({ message: 'Error liking video', error });
  }
};

export const getVideoDetails: RequestHandler = async (req, res) => {
  try {
    const videoId = req.params.videoId;
    const video = await Video.findById(videoId);

    if (!video) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }

    res.json(video);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching video details', error });
  }
}

export const streamVideo: RequestHandler = async (req, res) => {
  try {
    const videoId = req.params.videoId;
    const video = await Video.findById(videoId);

    if (!video) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }

    const videoPath = path.resolve(video.fileUrl);
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };

      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }

    // Increment views
    video.views += 1;
    await video.save();
  } catch (error) {
    res.status(500).json({ message: 'Error streaming video', error });
  }
};

// Add video to user's watch history
export const addToWatchHistory: RequestHandler = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { watchDuration } = req.body; // How much of the video was watched (in seconds)
    const userId = (req as any).user.id;

    // Validate video exists
    const video = await Video.findById(videoId);
    if (!video) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if video is already in watch history
    const existingEntryIndex = user.watchHistory.findIndex(
      item => item.video.toString() === videoId
    );

    if (existingEntryIndex !== -1) {
      // Update existing entry
      user.watchHistory[existingEntryIndex].watchedAt = new Date();
      user.watchHistory[existingEntryIndex].watchDuration = Math.max(
        user.watchHistory[existingEntryIndex].watchDuration,
        watchDuration || 0
      );
    } else {
      // Add new entry to watch history
      user.watchHistory.unshift({
        video: videoId as any,
        watchedAt: new Date(),
        watchDuration: watchDuration || 0
      });

      // Keep only the last 100 videos in watch history
      if (user.watchHistory.length > 100) {
        user.watchHistory = user.watchHistory.slice(0, 100);
      }
    }

    await user.save();

    res.json({ message: 'Added to watch history' });
  } catch (error) {
    console.error('Error adding to watch history:', error);
    res.status(500).json({ message: 'Error adding to watch history', error });
  }
};

// Get user's watch history
export const getWatchHistory: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const user = await User.findById(userId)
      .populate({
        path: 'watchHistory.video',
        select: 'title description thumbnailUrl duration views uploader createdAt'
      });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Filter out any null videos (in case a video was deleted)
    const validWatchHistory = user.watchHistory.filter(item => item.video);

    // Paginate the results
    const paginatedHistory = validWatchHistory.slice(skip, skip + limitNum);

    // Enhance each video with uploader avatar information
    const enhancedHistory = await Promise.all(
      paginatedHistory.map(async (item) => {
        const video = item.video as any; // Cast to any to access populated fields
        const uploaderUser = await User.findOne({ username: video.uploader }).select('avatar');
        return {
          video: {
            _id: video._id,
            title: video.title,
            description: video.description,
            thumbnailUrl: video.thumbnailUrl,
            duration: video.duration,
            views: video.views,
            uploader: video.uploader,
            uploaderAvatar: uploaderUser ? uploaderUser.avatar : null,
            createdAt: video.createdAt
          },
          watchedAt: item.watchedAt,
          watchDuration: item.watchDuration
        };
      })
    );

    res.json({
      watchHistory: enhancedHistory,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: validWatchHistory.length,
        pages: Math.ceil(validWatchHistory.length / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching watch history:', error);
    res.status(500).json({ message: 'Error fetching watch history', error });
  }
};

// Clear watch history
export const clearWatchHistory: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.watchHistory = [];
    await user.save();

    res.json({ message: 'Watch history cleared successfully' });
  } catch (error) {
    console.error('Error clearing watch history:', error);
    res.status(500).json({ message: 'Error clearing watch history', error });
  }
};

// Remove specific video from watch history
export const removeFromWatchHistory: RequestHandler = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = (req as any).user.id;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.watchHistory = user.watchHistory.filter(
      item => item.video.toString() !== videoId
    );

    await user.save();

    res.json({ message: 'Video removed from watch history' });
  } catch (error) {
    console.error('Error removing from watch history:', error);
    res.status(500).json({ message: 'Error removing from watch history', error });
  }
};