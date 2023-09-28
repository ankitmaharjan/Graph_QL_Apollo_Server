// src/GraphQL/resolver.ts
import { AuthenticationError, UserInputError } from 'apollo-server-express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

import User from '../models/user';
import Post from '../models/post';
import Comment from '../models/comment';
import Reply from '../models/reply';
import { Op } from 'sequelize'; // import the Op object from Sequelize

const secret: any = process.env.SECRET_KEY;

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

const resolvers = {
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
    post: async (parent: any, args: { id: string }): Promise<Post | null> => {
      try {
        const { id } = args;
        return await Post.findByPk(id);
      } catch (error) {
        throw new UserInputError('Error fetching post by ID');
      }
    },
    posts: async (): Promise<Post[]> => {
      try {
        return await Post.findAll();
      } catch (error) {
        throw new UserInputError('Error fetching posts');
      }
    },
    comment: async (parent: any, args: { id: string }): Promise<Comment | null> => {
      try {
        return await Comment.findByPk(args.id);
      } catch (error) {
        throw new UserInputError('Error fetching comment by ID');
      }
    },
    comments: async (): Promise<Comment[]> => {
      try {
        return await Comment.findAll();
      } catch (error) {
        throw new UserInputError('Error fetching comments');
      }
    },
    reply: async (parent: any, args: { id: string }): Promise<Reply | null> => {
      try {
        return await Reply.findByPk(args.id);
      } catch (error) {
        throw new UserInputError('Error fetching reply by ID');
      }
    },
    replies: async (): Promise<Reply[]> => {
      try {
        return await Reply.findAll();
      } catch (error) {
        throw new UserInputError('Error fetching replies');
      }
    },
  },
  User: {
    posts: async (user: any): Promise<Post[]> => {
      try {
        return await Post.findAll({ where: { userId: user.id } });
      } catch (error) {
        throw new UserInputError('Error fetching user posts');
      }
    },
  },
  Post: {
    author: async (post: any): Promise<User | null> => {
      try {
        return await User.findByPk(post.userId);
      } catch (error) {
        throw new UserInputError('Error fetching post author');
      }
    },
    comments: async (post: any): Promise<Comment[]> => {
      try {
        return await Comment.findAll({ where: { postId: post.id } });
      } catch (error) {
        throw new UserInputError('Error fetching post comments');
      }
    },
  },
  Comment: {
    author: async (comment: any): Promise<User | null> => {
      try {
        return await User.findByPk(comment.userId);
      } catch (error) {
        throw new UserInputError('Error fetching comment author');
      }
    },
    post: async (comment: any): Promise<Post | null> => {
      try {
        return await Post.findByPk(comment.postId);
      } catch (error) {
        throw new UserInputError('Error fetching comment post');
      }
    },
    replies: async (comment: any): Promise<Reply[]> => {
      try {
        return await Reply.findAll({ where: { commentId: comment.id } });
      } catch (error) {
        throw new UserInputError('Error fetching comment replies');
      }
    },
  },
  Reply: {
    author: async (reply: any): Promise<User | null> => {
      try {
        return await User.findByPk(reply.userId);
      } catch (error) {
        throw new UserInputError('Error fetching reply author');
      }
    },
    comment: async (reply: any): Promise<Comment | null> => {
      try {
        return await Comment.findByPk(reply.commentId);
      } catch (error) {
        throw new UserInputError('Error fetching reply comment');
      }
    },
  },
  Mutation: {
    login: async (parent: any, args: { username: string; password: string }): Promise<any> => {
      try {
        const { username, password } = args;
        const user = await User.findOne({
          where: { username, password },
        });

        if (!user) {
          throw new AuthenticationError('Invalid login credentials');
        }

        const accessToken: string = generateAccessToken(user);
        const refreshToken: string = generateRefreshToken(user);

        return {
          message: 'Login successful',
          accessToken,
          refreshToken,
          user,
        };
      } catch (error) {
        throw new UserInputError('Error during login');
      }
    },
    signup: async (parent: any, args: { username: string; email: string; password: string }): Promise<any> => {
      try {
        const { username, email, password } = args;

        // Check if a user with the same username or email already exists
        const existingUser = await User.findOne({
          where: {
            [Op.or]: [{ username }, { email }],
          },
        });

        if (existingUser) {
          throw new UserInputError('User already exists', {
            invalidArgs: ['username', 'email'],
          });
        }

        const newUser = await User.create({
          username,
          email,
          password,
        });

        return {
          message: 'Signup successful',
          user: newUser,
        };
      } catch (error) {
        throw new UserInputError('Error during signup');
      }
    },
    deleteUser: async (parent: any, args: { id: string }): Promise<string> => {
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
    updateUser: async (parent: any, args: { id: string; username?: string; email?: string }): Promise<any> => {
      try {
        const { id, username, email } = args;
        const user = await User.findByPk(id);

        if (!user) {
          throw new UserInputError('User not found');
        }

        if (username) {
          (user as any).username = username;
        }

        if (email) {
          (user as any).email = email;
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
    updatePassword: async (parent: any, args: { id: string; newPassword: string }): Promise<string> => {
      try {
        const { id, newPassword } = args;
        const user = await User.findByPk(id);

        if (!user) {
          throw new UserInputError('User not found');
        }

        (user as any).password = newPassword;

        await user.save();

        return 'Password updated successfully';
      } catch (error) {
        throw new UserInputError('Error during password update');
      }
    },
    createPost: async (parent: any, args: { title: string; content: string }, context: any): Promise<any> => {
      try {
        const user = context.user;
        if (!user) {
          throw new AuthenticationError('Authentication required');
        }
        const { title, content } = args;
        // Check if title and content are provided
    if (!title || !content) {
      throw new UserInputError('Title and content are required fields');
    }

        const post = await Post.create({
          title,
          content,
          userId: user.id, // Set the userId to the authenticated user's id
        });

        return {
          post,
          message: "Post created Successfully",
        };
      } catch (error:any) {
         // Check for specific database-related errors
    if (error.name === 'SequelizeDatabaseError') {
      throw new UserInputError('Database error: Unable to create the post');
    }
        throw new UserInputError('Error during post creation',{error});
      }
    },
    createComment: async (parent: any, args: { text: string; postId: string }, context: any): Promise<{ comment: Comment; message: string }> => {
      try {
        if (!context.user) {
          throw new AuthenticationError('Authentication required');
        }

        const { text, postId } = args;

        const comment = await Comment.create({
          text,
          postId,
          userId: context.user.id, // Set the userId to the authenticated user's id
        });

        return {
          comment,
          message: 'Comment created successfully',
        };
      } catch (error) {
        throw new UserInputError('Error during comment creation');
      }
    },
    createReply: async (parent: any, args: { text: string; commentId: string }, context: any): Promise<{ reply: Reply; message: string }> => {
      try {
        if (!context.user) {
          throw new AuthenticationError('Authentication required');
        }

        const { text, commentId } = args;

        const reply = await Reply.create({
          text,
          commentId,
          userId: context.user.id, // Set the userId to the authenticated user's id
        });

        return {
          reply,
          message: 'Reply created successfully',
        };
      } catch (error) {
        throw new UserInputError('Error during reply creation');
      }
    },
  },
};

export default resolvers;
