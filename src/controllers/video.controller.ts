import { RequestHandler } from 'express';
import Video from '../models/video.model';
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