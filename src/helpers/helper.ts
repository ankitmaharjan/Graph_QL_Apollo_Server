import jwt  from "jsonwebtoken";
import  {AuthenticationError} from 'apollo-server-express';
import dotenv from 'dotenv';
dotenv.config();
export const context =  ({ req }: { req: any }) => {
    const token: any = req.headers.Authorization || '';
    const secret: any = process.env.SECRET_KEY;

    try {
      if (token) {
        const user:any = jwt.verify(token, secret); // Verify and decode the token
        return { user };
      }
    } catch (error) {
      throw new AuthenticationError('Invalid token');
    }

    return {}; // return empty context if there is not a valid token
  };