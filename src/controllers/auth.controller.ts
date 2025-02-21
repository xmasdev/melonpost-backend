import { Request, Response } from 'express';
import { authService } from '../services/auth.service';

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;
      const avatarFile = req.file;

      if (!avatarFile) {
        res.status(400).json({ error: 'Avatar file is required' });
        return;
      }

      const result = await authService.register({ 
        username, 
        email, 
        password, 
        avatar: avatarFile.path 
      });
      
      res.status(201).json({
        message: 'User registered successfully',
        token: result.token,
        user: result.user
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });

      res.status(200).json({
        message: 'Login successful',
        token: result.token,
        user: result.user
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getProfile(req: Request, res: Response) {
    const username = req.params.username;
    if (username){
    try {
      const user = await authService.getUserProfile(await authService.getUserIdByUsername(username));
      res.status(200).json({ username: user.username, avatar: user.avatar });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    } } else if (req.user){
      try {
        const user = await authService.getUserProfile(req.user.id);
        res.status(200).json({ user });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    } else {
      res.status(400).json({ error: 'User not found' });
    }
  },

  async updateAvatar(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      const { avatarUrl } = req.body;
      const user = await authService.updateAvatar(userId, avatarUrl);
      res.status(200).json({ user });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};