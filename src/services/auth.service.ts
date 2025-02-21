import User from '../models/user.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const authService = {
  async register(userData: { 
    username: string; 
    email: string; 
    password: string;
    avatar: string;
  }) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [
          { email: userData.email },
          { username: userData.username }
        ]
      });

      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create new user
      const user = new User({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        avatar: userData.avatar,
      });

      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '30d' }
      );

      return {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
        },
      };
    } catch (error) {
      throw error;
    }
  },

  async login(credentials: { email: string; password: string }) {
    try {
      // Find user
      const user = await User.findOne({ email: credentials.email });
      if (!user) {
        throw new Error('Invalid credentials');
      }
      // Check password
      const isValidPassword = await bcrypt.compare(credentials.password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '30d' }
      );

      return {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
        },
      };
    } catch (error) {
      throw error;
    }
  },

  async getUserProfile(userId: string) {
    try {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw error;
    }
  },

  async getUserIdByUsername(username: string) : Promise<string> {
    try {
      const user = await User.findOne({
        username: username
      })
      if (!user) {
        throw new Error('User not found');
      }
      return user._id as string
    } catch (error) {
      throw error;
    }
  },

  async updateAvatar(userId: string, newAvatarUrl: string) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { avatar: newAvatarUrl },
        { new: true }
      ).select('-password');

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }
};