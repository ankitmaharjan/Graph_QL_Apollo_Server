// src/GraphQL/resolver.ts
import { AuthenticationError, UserInputError } from 'apollo-server-express';
import { google, Auth } from 'googleapis';
import nodemailer, { Transporter } from 'nodemailer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

import User from '../models/user';
import Post from '../models/post';
import Comment from '../models/comment';
import Reply from '../models/reply';
import ResetToken from '../models/resettoken';
import { Op } from 'sequelize'; // import the Op object from Sequelize
import { LoginInterface, SignupInterface, createCommentInterface, createPostInterface, createReplyInterface, 
  deleteInterface, updatePasswordInterface, updateUserInterface, ResetPasswordInterface } from '../interfaces';


const saltRounds: number = 10; // Explicitly declare the type
const secret: string | undefined = process.env.SECRET_KEY;
// const reset_token_secret: string | undefined = process.env.RESET_TOKEN_SECRET;

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

// const transporter = nodemailer.createTransport({
//   // Configure your email transport options here
//   service: 'Gmail', // Use your email service provider
//   auth: {
//     user: process.env.EMAIL, 
//     pass: process.env.GMAIL_PASSWORD, 
//   },
// });

// const sendPasswordResetEmail = async (toEmail:string, resetLink:string) => {
//   try {
//     // Send email
//     const info = await transporter.sendMail({
//       from: process.env.EMAIL, // Sender's email address
//       to: process.env.EMAIL, // Recipient's email address
//       subject: 'Password Reset', // Email subject
//       text: `Click the following link to reset your password: ${resetLink}`, // Email body
//     });

//     console.log('Password reset email sent:', info.messageId);
//   } catch (error) {
//     console.error('Error sending password reset email:', error);
//     throw error;
//   }
// };

// Create an OAuth2 client with your credentials
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Set the desired Gmail API scope (read and send emails)
const SCOPES: string[] = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'];

// Generate an OAuth2 URL for user consent
const authUrl: string = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

// Handle the OAuth2 callback and get an access token
const getAccessToken = async (code: string): Promise<any> => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
};

// Send an Email
const sendPasswordResetEmail = async (toEmail: string, resetLink: string): Promise<void> => {
  try {
    // Get an access token using OAuth2 (you need to implement this)
    const accessToken = await getAccessToken(process.env.RESET_TOKEN_SECRET as string); //Pass authorization code

    // Create a Nodemailer transporter using Gmail's SMTP server
    const transporter: Transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL, // Your Gmail email address
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        //refreshToken: process.env.GOOGLE_REFRESH_TOKEN, // Optional if you want to refresh tokens
        accessToken,
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL, // Sender's email address
      to: process.env.EMAIL, // Recipient's email address
      subject: 'Password Reset', // Email subject
      text: `Click the following link to reset your password: ${resetLink}`, // Email body
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    console.log('Password reset email sent successfully');
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

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
          // error: error.message,
        }
        // throw new UserInputError(error.message);
      }
    },
    signup: async (parent: any, args: SignupInterface): Promise<any> => {
      try {
        const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,12}$/; // Allows letters, numbers, and underscores, 3 to 12 characters
        const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email validation
        const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,15}$/; // Requires at least one lowercase letter, one uppercase letter, one digit, and allows special characters, 8 to 15 characters
        const { username, email, password } = args;
        // Validate if username, email, and password are provided
        if (!username.trim() || !email.trim() || !password.trim()) {
          const missingFields = [];
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
        if (!EMAIL_REGEX.test(email)) {
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
    createPost: async (parent: any, args: createPostInterface, context: any): Promise<any> => {
      try {
        const user = context.user;
        if (!user) {
          throw new AuthenticationError('Authentication required');
        }
        const { title, content } = args;
        // Check if title and content are provided and not empty
        const isTitleEmpty = !title || title.trim() === '';
        const isContentEmpty = !content || content.trim() === '';
        const errorMessage =
          isTitleEmpty && isContentEmpty
            ? 'Title and content are required fields'
            : isTitleEmpty
              ? 'Title field is required'
              : isContentEmpty
                ? 'Content field is required'
                : '';
        if (errorMessage) {
          throw new UserInputError(errorMessage);
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
      } catch (error: any) {
        // Check for specific database-related errors
        if (error.name === 'SequelizeDatabaseError') {
          throw new UserInputError('Database error: Unable to create the post');
        }
        throw new UserInputError(error);
      }
    },
    createComment: async (parent: any, args: createCommentInterface, context: any): Promise<{ comment: Comment; message: string }> => {
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
    createReply: async (parent: any, args: createReplyInterface, context: any): Promise<{ reply: Reply; message: string }> => {
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
    deletePost: async (parent: any, args: deleteInterface, context: any): Promise<string> => {
      try {
        // Validate if the user is authenticated
        if (!context.user) {
          throw new AuthenticationError('Authentication required');
        }
        const { id } = args;
        // Validate if the post exists
        const post = await Post.findByPk(id);
        if (!post) {
          throw new UserInputError('Post not found');
        }
        // Delete the post
        await post.destroy();
        return 'Post deleted successfully';
      } catch (error: any) {
        throw new UserInputError(error);
      }
    },
    deleteComment: async (parent: any, args: deleteInterface, context: any): Promise<string> => {
      try {
        // Validate if the user is authenticated
        if (!context.user) {
          throw new AuthenticationError('Authentication required');
        }
        const { id } = args;
        // Validate if the comment exists
        const comment = await Comment.findByPk(id);
        if (!comment) {
          throw new UserInputError('Comment not found');
        }
        // Delete the comment
        await comment.destroy();
        return 'Comment deleted successfully';
      } catch (error) {
        throw new UserInputError('Error during comment deletion', { error });
      }
    },
    deleteReply: async (parent: any, args: deleteInterface, context: any): Promise<string> => {
      try {
        // Validate if the user is authenticated
        if (!context.user) {
          throw new AuthenticationError('Authentication required');
        }
        const { id } = args;
        // Validate if the reply exists
        const reply = await Reply.findByPk(id);
        if (!reply) {
          throw new UserInputError('Reply not found');
        }
        // Delete the reply
        await reply.destroy();
        return 'Reply deleted successfully';
      } catch (error) {
        throw new UserInputError('Error during reply deletion', { error });
      }
    },
    resetPassword: async (parent: any, args: ResetPasswordInterface): Promise<any> => {
      try {
        const { email } = args;

        // Check if the user with the provided email exists
        const user = await User.findOne({ where: { email } });
        if (!user) {
          return {
            success: false,
            message: 'User with this email does not exist.',
          };
        }

        // Generate a unique token using JWT
        const token = jwt.sign({ userId: user.id }, secret as string, { expiresIn: '1h' });

        // Store the token in the database with a reference to the user
        await ResetToken.create({
          userId: user.id,
          token,
          expirationDate: new Date(new Date().getTime() + 3600000), // 1 hour from now
        });

        // Send an email to the user with a link to reset their password
        const resetLink = `https://your-website.com/reset-password?token=${token}`;
        await sendPasswordResetEmail(email, resetLink);

        return {
          success: true,
          message: 'Password reset email sent successfully.',
        };
      } catch (error) {
        return {
          success: false,
          message: 'Error resetting password.',
        };
      }
    },

    // updatePassword: async (parent: any, args: ResetPasswordInterface): Promise<any> => {
    //   try {
    //     const { token, newPassword } = args;

    //     // Verify the token and extract the user ID using JWT
    //     const decodedToken:any = jwt.verify(token, secret as string);
    //     if (!decodedToken || !decodedToken.userId) {
    //       return {
    //         success: false,
    //         message: 'Invalid or expired reset token.',
    //       };
    //     }

    //     const userId = decodedToken.userId;

    //     // Find the user associated with the token
    //     const user = await User.findByPk(userId);

    //     if (!user) {
    //       return {
    //         success: false,
    //         message: 'User not found.',
    //       };
    //     }

    //     // Hash the new password
    //     const hashedPassword = await bcrypt.hash(newPassword, 10);

    //     // Update the user's password
    //     user.password = hashedPassword;
    //     await user.save();

    //     // Delete the reset token
    //     await ResetToken.destroy({ where: { userId } });

    //     return {
    //       success: true,
    //       message: 'Password updated successfully.',
    //     };
    //   } catch (error) {
    //     return {
    //       success: false,
    //       message: 'Error updating password.',
    //     };
    //   }
    // },
  },
};

export default resolvers;
