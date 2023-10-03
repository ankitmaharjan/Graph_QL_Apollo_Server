//src/server.ts
import express from 'express';
import { ApolloServer, AuthenticationError } from 'apollo-server-express';
// import  {startStandaloneServer} from "apollo-server";
import jwt  from "jsonwebtoken";
import typeDefs from './GraphQL/typeDef';
import resolvers from './GraphQL/resolver';
//import  {context}  from "./helpers/helper";
import dotenv from 'dotenv';
dotenv.config();

declare global {
  namespace Express {
    interface Request {
      user?: any; // You can replace 'any' with the actual type of your user object
    }
  }
}

const app = express();
// Middleware to verify JWT token
app.use((req:any, _, next) => {
  const token = req.headers.authorization;
  const secret: string | undefined = process.env.SECRET_KEY;
  if (token) {
    try {
      const user = jwt.verify(token, secret as string); // Verify and decode the token
      req.user = user; // Attach the decoded user to the request object
    } catch (error) {
      throw new AuthenticationError('Invalid token');
    }
  }

  next();
});

async function startApolloServer() {
  const server:any = new ApolloServer({
    typeDefs,
    resolvers,
    //context:context
    context: ({ req }) => {
      return { user: req.user }; // Make the user object available in the context
    },
  });

  await server.start();
  server.applyMiddleware({ app });

  const PORT = process.env.PORT || 5000;
  // const { url } = await startStandaloneServer(server, {
  //   context: context
  // });

  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}${server.graphqlPath}`);
    //console.log(`Server is running at ${PORT} and url:${url}`);
    
  });
}

startApolloServer();
