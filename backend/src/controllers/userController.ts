import { Request, Response } from 'express';
import { User } from '../models/User';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, password } = req.body;
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    const user = new User({
      name,
      user_id: uuidv4(),
      password: hashedPassword
    });

    await user.save();

    const userResponse = {
      name: user.name,
      user_id: user.user_id,
      _id: user._id
    };

    res.status(201).json({
      success: true,
      data: userResponse
    });

  } catch (error: any) {
    if (error.code === 11000) { // MongoDB duplicate key error code
      return res.status(400).json({
        success: false,
        error: 'A user with this name already exists'
      });
    }
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user'
    });
  }
};

export const deleteAllUsers = async (req: Request, res: Response) => {
  try {
    await User.deleteMany({});
    res.status(200).json({
      success: true,
      message: 'All users deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete users'
    });
  }
}; 