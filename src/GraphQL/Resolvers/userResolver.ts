import { AuthenticationError, UserInputError } from 'apollo-server-express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

import User from '../../models/user';
import Post from '../../models/post';
import Comment from '../../models/comment';
import Reply from '../../models/reply';
//import {User,Post,Comment,Reply} from "../../models/index"

import { LoginInterface, SignupInterface, updateUserInterface, updatePasswordInterface, deleteInterface } from '../../interfaces/index';

const saltRounds: number = 10; // Explicitly declare the type
const secret: string | undefined = process.env.SECRET_KEY;

interface UserPayload {
  id: string;
  username: string;
  email: string;
}

function generateAccessToken(user: any): string {
  const payload: UserPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
  };
  const token: string = jwt.sign(payload, secret as string, {
    expiresIn: '1h',
  });
  return token;
}

function generateRefreshToken(user: any): string {
  const payload: UserPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
  };
  const refreshToken: string = jwt.sign(payload, secret as string, {
    expiresIn: '7d',
  });
  return refreshToken;
}

const userResolver = {
  Query: {
    user: async (parent: any, args: { id: string }): Promise<User | null> => {
      try {
        const { id } = args;
        return await User.findByPk(id);
      } catch (error) {
        throw new UserInputError('Error fetching user by ID');
      }
    },
    users: async (): Promise<User[]> => {
      try {
        return await User.findAll();
      } catch (error) {
        throw new UserInputError('Error fetching users');
      }
    },
  },
  User: {
    posts: async (user: User): Promise<Post[]> => {
      try {
        return await Post.findAll({ where: { userId: user.id } });
      } catch (error) {
        throw new UserInputError('Error fetching user posts');
      }
    },
  },
  Post: {
    author: async (post: Post): Promise<User | null> => {
      try {
        return await User.findByPk(post.userId);
      } catch (error) {
        throw new UserInputError('Error fetching post author');
      }
    },
    comments: async (post: Post): Promise<Comment[]> => {
      try {
        return await Comment.findAll({ where: { postId: post.id } });
      } catch (error) {
        throw new UserInputError('Error fetching post comments');
      }
    },
  },
  Comment: {
    author: async (comment: Comment): Promise<User | null> => {
      try {
        return await User.findByPk(comment.userId);
      } catch (error) {
        throw new UserInputError('Error fetching comment author');
      }
    },
    post: async (comment: Comment): Promise<Post | null> => {
      try {
        return await Post.findByPk(comment.postId);
      } catch (error) {
        throw new UserInputError('Error fetching comment post');
      }
    },
    replies: async (comment: Comment): Promise<Reply[]> => {
      try {
        return await Reply.findAll({ where: { commentId: comment.id } });
      } catch (error) {
        throw new UserInputError('Error fetching comment replies');
      }
    },
  },
  Reply: {
    author: async (reply: Reply): Promise<User | null> => {
      try {
        return await User.findByPk(reply.userId);
      } catch (error) {
        throw new UserInputError('Error fetching reply author');
      }
    },
    comment: async (reply: Reply): Promise<Comment | null> => {
      try {
        return await Comment.findByPk(reply.commentId);
      } catch (error) {
        throw new UserInputError('Error fetching reply comment');
      }
    },
  },
  Mutation: {
    login: async (parent: any, args: LoginInterface): Promise<any> => {
      try {
        const { username, password } = args;
        // Validate if both username and password are provided and not just blank spaces
        if (!username.trim() || !password.trim()) {
          const missingFields: string[] = [];
          if (!username.trim()) missingFields.push('Username');
          if (!password.trim()) missingFields.push('Password');
          if (missingFields.length > 0) {
            const errorMessage = missingFields.length === 1
              ? `${missingFields[0]} is required`
              : `${missingFields.join(' and ')} are required`;
            throw new UserInputError(errorMessage);
          }
        }
        const user = await User.findOne({
          where: { username },
        });
        if (!user || !(await bcrypt.compare(password, user.password))) {
          throw new AuthenticationError('Invalid login credentials');
        }
        const accessToken: string = generateAccessToken(user);
        const refreshToken: string = generateRefreshToken(user);
        
        return {
          status: 200,
          message: 'Login successful',
          accessToken,
          refreshToken,
          user,
        };
      } catch (error: any) {
        return {
          status: 401,
          message: error.message,
        }
      }
    },
    signup: async (parent: any, args: SignupInterface): Promise<any> => {
      try {
        const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,12}$/; // Allows letters, numbers, and underscores, 3 to 12 characters
        const EMAIL_REGEX1 = /@gmail\.com/;
        const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+/;  // Basic email validation
        const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,15}$/; // Requires at least one lowercase letter, one uppercase letter, one digit, and allows special characters, 8 to 15 characters
        const { username, email, password } = args;
        // Validate if username, email, and password are provided
        if (!username.trim() || !email.trim() || !password.trim()) {
          const missingFields: (string | never)[]= [];
          if (!username.trim()) missingFields.push('Username');
          if (!email.trim()) missingFields.push('Email');
          if (!password.trim()) missingFields.push('Password');
          const errorMessage =
            missingFields.length === 1
              ? `${missingFields[0]} is required`
              : `${missingFields.join(', ')} are required`;
          throw new UserInputError(errorMessage);
        }
        // Validate username
        if (!USERNAME_REGEX.test(username)) {
          throw new UserInputError('Invalid username');
        }
        // Validate email
        if (!EMAIL_REGEX1.test(email) && !EMAIL_REGEX.test(email)) {
          throw new UserInputError('Invalid email address');
        }
        // Validate password
        if (!PASSWORD_REGEX.test(password)) {
          throw new UserInputError('Invalid password');
        }
        // Hash/Encrypting the password the password before storing it in the database
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        // Check if a user with the same username or email already exists
        const existingUser = await User.findOne({
          where: {
            [Op.or]: [{ username }, { email }],
          },
        });
        if (existingUser) {
          const error = new UserInputError('User already exists', {
            invalidArgs: ['username', 'email'],
          });
          throw error;
        }
        const newUser = await User.create({
          username,
          email,
          password: hashedPassword, // Store the hashed password
        });
        return {
          message: 'Signup successful',
          user: newUser,
        };
      } catch (error: any) {
        return {
          status: 409,
          message: error.message,
        }
      }
    },
    deleteUser: async (parent: any, args: deleteInterface): Promise<string> => {
      try {
        const { id } = args;
        const user = await User.findByPk(id);

        if (!user) {
          throw new UserInputError('User not found');
        }

        await user.destroy();

        return 'User deleted successfully';
      } catch (error) {
        throw new UserInputError('Error during user deletion');
      }
    },
    updateUser: async (parent: any, args: updateUserInterface): Promise<any> => {
      try {
        const { id, username, email } = args;
        const user = await User.findByPk(id);

        if (!user) {
          throw new UserInputError('User not found');
        }

        if (username) {
          user.username = username;
        }

        if (email) {
          user.email = email;
        }

        await user.save();

        return {
          user,
          message: 'User updated successfully',
        };
      } catch (error) {
        throw new UserInputError('Error during user update');
      }
    },
    updatePassword: async (parent: any, args: updatePasswordInterface): Promise<string> => {
      try {
        const { id, newPassword } = args;
        const user = await User.findByPk(id);
        if (!user) {
          throw new UserInputError('User not found');
        }
        // Ensure that the new password is not empty
        if (!newPassword) {
          throw new UserInputError('New password cannot be empty');
        }
        // Hash the new password before updating it in the database
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        user.password = hashedPassword;
        await user.save();
        return 'Password updated successfully';
      } catch (error: any) {
        throw new UserInputError(error);
      }
    },
  },
};

export default userResolver;
